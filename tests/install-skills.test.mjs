import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const installerPath = join(repoRoot, 'scripts', 'install-skills.ps1');
const inventory = JSON.parse(
  await readFile(join(repoRoot, 'contracts', 'skill-inventory.json'), 'utf8'),
);
const temporaryRoots = [];
// A cold pwsh start on a shared CI runner can take well over 20 s, so the
// per-invocation limit is generous and can be raised without editing the
// test file (#117).
const installerTimeoutMs = Number(process.env.INSTALLER_TEST_TIMEOUT_MS) || 60_000;

function describeSpawnFailure(error, timeoutMs) {
  // execFile kills the child on timeout and reports only a generic
  // "Command failed" with empty stderr. Spell out what actually happened.
  const timedOut = error.killed === true;
  const headline = timedOut
    ? `installer timed out after ${timeoutMs} ms (killed=${error.killed}, signal=${error.signal})`
    : `installer failed (exit code ${error.code}, signal=${error.signal})`;
  return new Error(
    [
      headline,
      `command: ${error.cmd}`,
      `stdout:`,
      String(error.stdout ?? ''),
      `stderr:`,
      String(error.stderr ?? ''),
    ].join(String.fromCharCode(10)),
    { cause: error },
  );
}

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), 'install-skills-'));
  temporaryRoots.push(root);
  return root;
}

async function runInstaller({
  sourceRoot = repoRoot,
  codexHome,
  claudeHome,
  copilotHome,
  chatGPTExportPath,
  target = 'Both',
  dryRun = false,
  force = false,
  keepBackups,
  timeoutMs = installerTimeoutMs,
  expectFailure = false,
  env,
}) {
  const args = [
    '-NoProfile',
    '-File',
    installerPath,
    '-Target',
    target,
  ];
  if (sourceRoot !== null) args.push('-SourceRoot', sourceRoot);
  if (codexHome) args.push('-CodexHome', codexHome);
  if (claudeHome) args.push('-ClaudeHome', claudeHome);
  if (copilotHome) args.push('-CopilotHome', copilotHome);
  if (chatGPTExportPath) args.push('-ChatGPTExportPath', chatGPTExportPath);
  if (dryRun) args.push('-DryRun');
  if (force) args.push('-Force');
  if (keepBackups !== undefined) args.push('-KeepBackups', String(keepBackups));

  // Strip these from the inherited environment by default so a developer's
  // own shell (or a prior test) can't leak a real CLAUDE_HOME/CODEX_HOME/
  // COPILOT_HOME into a test that isn't exercising env-var discovery.
  const processEnv = { ...process.env };
  delete processEnv.CODEX_HOME;
  delete processEnv.CLAUDE_HOME;
  delete processEnv.COPILOT_HOME;

  try {
    const result = await execFileAsync('pwsh', args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      timeout: timeoutMs,
      env: { ...processEnv, ...env },
    });
    assert.equal(expectFailure, false, `installer unexpectedly succeeded:\n${result.stdout}`);
    return { ...result, exitCode: 0 };
  } catch (error) {
    if (error.code === 'ERR_ASSERTION') throw error;
    if (!expectFailure) throw describeSpawnFailure(error, timeoutMs);
    assert.notEqual(error.code, 0, 'installer failure must return a non-zero exit code');
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.code,
    };
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function treeSnapshot(root) {
  if (!(await exists(root))) return null;
  const entries = [];
  const pending = [];

  async function visit(path, relative = '') {
    const children = await readdir(path, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const childRelative = relative ? `${relative}/${child.name}` : child.name;
      const childPath = join(path, child.name);
      if (child.isDirectory()) {
        entries.push(`d:${childRelative}`);
        await visit(childPath, childRelative);
      } else {
        const index = entries.push(null) - 1;
        pending.push(sha256(childPath).then((hash) => {
          entries[index] = `f:${childRelative}:${hash}`;
        }));
      }
    }
  }

  await visit(root);
  await Promise.all(pending);
  return entries;
}

async function installOnce(root, target = 'Both') {
  const codexHome = join(root, 'codex-home');
  const claudeHome = join(root, 'claude-home');
  await runInstaller({ codexHome, claudeHome, target });
  return { codexHome, claudeHome };
}

async function sourceFixture(root) {
  const sourceRoot = join(root, 'source');
  await mkdir(join(sourceRoot, 'contracts'), { recursive: true });
  await cp(join(repoRoot, 'contracts', 'skill-inventory.json'), join(sourceRoot, 'contracts', 'skill-inventory.json'));
  await cp(join(repoRoot, 'skills'), join(sourceRoot, 'skills'), { recursive: true });
  return sourceRoot;
}

test.after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
});

test('a spawned installer that hits the timeout reports the timeout, signal, command, and output (#117)', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');

  await assert.rejects(
    runInstaller({ codexHome, target: 'Codex', dryRun: true, timeoutMs: 1 }),
    (error) => {
      assert.match(error.message, /timed out after 1 ms/i);
      assert.match(error.message, /killed=true/);
      assert.match(error.message, /signal=SIGTERM/);
      assert.match(error.message, /command: .*install-skills\.ps1/);
      assert.match(error.message, /stdout:/);
      assert.match(error.message, /stderr:/);
      return true;
    },
  );
});

test('dry-run reports the complete plan without changing the filesystem', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'homes', 'codex');
  const claudeHome = join(root, 'homes', 'claude');
  const before = await treeSnapshot(root);

  const result = await runInstaller({ codexHome, claudeHome, dryRun: true, force: true });

  assert.deepEqual(await treeSnapshot(root), before);
  assert.match(result.stdout, new RegExp(repoRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(result.stdout, /Target:\s+Codex/i);
  assert.match(result.stdout, /Target:\s+Claude/i);
  assert.match(result.stdout, /Skills \(12\)/i);
  assert.match(result.stdout, /backup/i);
});

test('SourceRoot defaults to the repository containing the installer', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');

  await runInstaller({ sourceRoot: null, codexHome, target: 'Codex' });

  assert.equal(await exists(join(codexHome, 'skills', inventory.skills[0].name, 'SKILL.md')), true);
});

test('Copilot target installs all twelve skills under CopilotHome/skills', async () => {
  const root = await temporaryRoot();
  const copilotHome = join(root, 'copilot-home');
  const expectedNames = inventory.skills.map(({ name }) => name).sort();

  await runInstaller({ copilotHome, target: 'Copilot' });

  const names = (await readdir(join(copilotHome, 'skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(names, expectedNames);
  assert.equal(await exists(join(copilotHome, 'skills', expectedNames[0], 'SKILL.md')), true);
});

function expectedChatGPTExportNames() {
  const names = [];
  for (const skill of inventory.skills) {
    for (const relativeFile of skill.requiredFiles) {
      if (relativeFile === 'agents/openai.yaml') continue;
      names.push(`${skill.name}-${relativeFile.replace(/[\\/]/g, '-')}`);
    }
  }
  return names.sort();
}

test('ChatGPT target dry-run reports the flattened export plan without writing anything', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  const expectedNames = expectedChatGPTExportNames();

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT', dryRun: true });

  assert.equal(await exists(chatGPTExportPath), false);
  assert.match(result.stdout, new RegExp(`Files \\(${expectedNames.length}\\)`, 'i'));
  for (const name of expectedNames) {
    assert.match(result.stdout, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(result.stdout, /openai\.yaml/i);
});

test('ChatGPT target exports flattened per-skill files, excluding agents/openai.yaml', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  const expectedNames = expectedChatGPTExportNames();

  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });

  const names = (await readdir(chatGPTExportPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(names, [...expectedNames, 'LICENSE', 'manifest.json'].sort());

  const issueFirstSkill = inventory.skills.find(({ name }) => name === 'github-issue-first');
  const sourceContent = await readFile(join(repoRoot, 'skills', 'github-issue-first', 'SKILL.md'), 'utf8');
  const exportedContent = await readFile(join(chatGPTExportPath, 'github-issue-first-SKILL.md'), 'utf8');
  assert.equal(exportedContent, sourceContent);
  assert.ok(issueFirstSkill, 'fixture assumption: github-issue-first must exist in the inventory');
});

test('ChatGPT export refuses to overwrite a non-empty destination without Force', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await mkdir(chatGPTExportPath, { recursive: true });
  await writeFile(join(chatGPTExportPath, 'unrelated-file.txt'), 'do not touch\n');

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /not empty|Force/i);
  const names = (await readdir(chatGPTExportPath)).sort();
  assert.deepEqual(names, ['unrelated-file.txt']);
});

test('ChatGPT export with Force writes into a non-empty destination without deleting unrelated files', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await mkdir(chatGPTExportPath, { recursive: true });
  await writeFile(join(chatGPTExportPath, 'unrelated-file.txt'), 'not part of this export\n');
  const expectedNames = expectedChatGPTExportNames();

  await runInstaller({ chatGPTExportPath, target: 'ChatGPT', force: true });

  const names = (await readdir(chatGPTExportPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  // Force permits writing into a non-empty directory - it does not wipe
  // content this export doesn't own, the same "never destroy what you
  // don't own" posture the rest of this script already follows.
  assert.deepEqual(names, [...expectedNames, 'LICENSE', 'manifest.json', 'unrelated-file.txt'].sort());
  assert.equal(await readFile(join(chatGPTExportPath, 'unrelated-file.txt'), 'utf8'), 'not part of this export\n');
});

async function readExportManifest(exportPath) {
  return JSON.parse(await readFile(join(exportPath, 'manifest.json'), 'utf8'));
}

test('ChatGPT export writes a manifest with version, source map, hashes, and the licence (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');

  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });

  const manifest = await readExportManifest(chatGPTExportPath);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packageVersion, inventory.packageVersion);
  assert.ok('sourceCommit' in manifest, 'manifest records the source commit (null when unavailable)');
  const expected = [...expectedChatGPTExportNames(), 'LICENSE'].sort();
  assert.deepEqual(Object.keys(manifest.files).sort(), expected);
  const entry = manifest.files['github-repo-review-review-prompt.md'];
  assert.equal(entry.source, 'skills/github-repo-review/review-prompt.md');
  assert.equal(entry.sha256, await sha256(join(chatGPTExportPath, 'github-repo-review-review-prompt.md')));
  assert.equal(manifest.files.LICENSE.source, 'LICENSE');
  assert.equal(await readFile(join(chatGPTExportPath, 'LICENSE'), 'utf8'), await readFile(join(repoRoot, 'LICENSE'), 'utf8'));
});

test('ChatGPT re-export over a previous export succeeds without Force and reports nothing changed (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });

  assert.match(result.stdout, /unchanged: \d+/i);
  assert.doesNotMatch(result.stdout, /\b(added|changed|removed):/i);
});

test('ChatGPT re-export prints which files changed (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });
  const exportedSkill = join(chatGPTExportPath, 'github-issue-first-SKILL.md');
  await writeFile(exportedSkill, 'stale content from an older export\n');
  const manifest = await readExportManifest(chatGPTExportPath);
  manifest.files['github-issue-first-SKILL.md'].sha256 = await sha256(exportedSkill);
  await writeFile(join(chatGPTExportPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });

  assert.match(result.stdout, /changed: .*github-issue-first-SKILL\.md/i);
  assert.equal(
    await readFile(exportedSkill, 'utf8'),
    await readFile(join(repoRoot, 'skills', 'github-issue-first', 'SKILL.md'), 'utf8'),
  );
});

test('ChatGPT re-export removes files the previous manifest lists but the source no longer has, and leaves unrelated files (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });
  const goneName = 'github-retired-skill-SKILL.md';
  await writeFile(join(chatGPTExportPath, goneName), 'from a removed skill\n');
  const manifest = await readExportManifest(chatGPTExportPath);
  manifest.files[goneName] = { source: 'skills/github-retired-skill/SKILL.md', sha256: 'a'.repeat(64) };
  await writeFile(join(chatGPTExportPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(join(chatGPTExportPath, 'unrelated-file.txt'), 'mine\n');

  const refused = await runInstaller({ chatGPTExportPath, target: 'ChatGPT', expectFailure: true });
  assert.match(`${refused.stdout}
${refused.stderr}`, /not part of|unrelated|Force/i);
  assert.equal(await exists(join(chatGPTExportPath, goneName)), true, 'a refused run must change nothing');

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT', force: true });

  assert.match(result.stdout, /removed: .*github-retired-skill-SKILL\.md/i);
  assert.equal(await exists(join(chatGPTExportPath, goneName)), false);
  assert.equal(await readFile(join(chatGPTExportPath, 'unrelated-file.txt'), 'utf8'), 'mine\n');
});

test('ChatGPT export never deletes outside its folder because of a tampered manifest (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });
  const outside = join(root, 'outside.txt');
  await writeFile(outside, 'keep me\n');
  const manifest = await readExportManifest(chatGPTExportPath);
  manifest.files['../outside.txt'] = { source: 'x', sha256: 'a'.repeat(64) };
  await writeFile(join(chatGPTExportPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

  await runInstaller({ chatGPTExportPath, target: 'ChatGPT', force: true });

  assert.equal(await readFile(outside, 'utf8'), 'keep me\n');
});

test('ChatGPT dry run previews changes against the previous export without writing (#127)', async () => {
  const root = await temporaryRoot();
  const chatGPTExportPath = join(root, 'chatgpt-export');
  await runInstaller({ chatGPTExportPath, target: 'ChatGPT' });
  const before = await treeSnapshot(chatGPTExportPath);

  const result = await runInstaller({ chatGPTExportPath, target: 'ChatGPT', dryRun: true });

  assert.match(result.stdout, /unchanged: \d+/i);
  assert.deepEqual(await treeSnapshot(chatGPTExportPath), before);
});

test('CODEX_HOME/CLAUDE_HOME/COPILOT_HOME env vars are discovered when no -Home flag is passed', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'env-codex-home');
  const claudeHome = join(root, 'env-claude-home');
  const copilotHome = join(root, 'env-copilot-home');
  const expectedNames = inventory.skills.map(({ name }) => name).sort();

  await runInstaller({
    target: 'Both',
    env: { CODEX_HOME: codexHome, CLAUDE_HOME: claudeHome },
  });
  await runInstaller({
    target: 'Copilot',
    env: { COPILOT_HOME: copilotHome },
  });

  for (const home of [codexHome, claudeHome, copilotHome]) {
    const names = (await readdir(join(home, 'skills'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    assert.deepEqual(names, expectedNames);
  }
});

test('an explicit -ClaudeHome flag takes precedence over CLAUDE_HOME', async () => {
  const root = await temporaryRoot();
  const envHome = join(root, 'env-claude-home');
  const flagHome = join(root, 'flag-claude-home');

  await runInstaller({
    codexHome: join(root, 'codex-home'),
    claudeHome: flagHome,
    env: { CLAUDE_HOME: envHome },
  });

  assert.equal(await exists(join(flagHome, 'skills', inventory.skills[0].name, 'SKILL.md')), true);
  assert.equal(await exists(envHome), false);
});

for (const [label, targetHomes] of [
  ['identical', (root) => [join(root, 'shared-home'), join(root, 'shared-home')]],
  ['nested', (root) => [join(root, 'codex-home'), join(root, 'codex-home', 'claude-home')]],
]) {
  test(`rejects ${label} Codex and Claude homes without mutation`, async () => {
    const root = await temporaryRoot();
    const [codexHome, claudeHome] = targetHomes(root);
    const before = await treeSnapshot(root);

    const result = await runInstaller({ codexHome, claudeHome, expectFailure: true });

    assert.match(`${result.stdout}\n${result.stderr}`, /overlap|nested|target/i);
    assert.deepEqual(await treeSnapshot(root), before);
  });
}

test('rejects a junction alias of SourceRoot before destination creation', { skip: process.platform !== 'win32' }, async () => {
  const root = await temporaryRoot();
  const sourceAlias = join(root, 'source-alias');
  const codexHome = join(root, 'destinations', 'codex');
  await symlink(repoRoot, sourceAlias, 'junction');

  const result = await runInstaller({ sourceRoot: sourceAlias, codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /reparse|junction|link/i);
  assert.equal(await exists(join(root, 'destinations')), false);
});

test('rejects a reparse point inside a required source skill tree', { skip: process.platform !== 'win32' }, async () => {
  const root = await temporaryRoot();
  const sourceRoot = await sourceFixture(root);
  const skillName = inventory.skills[0].name;
  const fixtureSkill = join(sourceRoot, 'skills', skillName);
  await rm(fixtureSkill, { recursive: true });
  await symlink(join(repoRoot, 'skills', skillName), fixtureSkill, 'junction');
  const codexHome = join(root, 'destinations', 'codex');

  const result = await runInstaller({ sourceRoot, codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /reparse|junction|link/i);
  assert.equal(await exists(join(root, 'destinations')), false);
});

test('Force rejects a destination skills junction before changing destination, backup, or source', { skip: process.platform !== 'win32' }, async () => {
  const root = await temporaryRoot();
  const sourceRoot = await sourceFixture(root);
  const codexHome = join(root, 'codex-home');
  const redirectedSkills = join(codexHome, 'skills');
  await mkdir(codexHome, { recursive: true });
  await symlink(join(sourceRoot, 'skills'), redirectedSkills, 'junction');
  const sourceBefore = await treeSnapshot(join(sourceRoot, 'skills'));
  const destinationBefore = await readdir(codexHome);
  const junctionTargetBefore = await readlink(redirectedSkills);

  const result = await runInstaller({ sourceRoot, codexHome, target: 'Codex', force: true, expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /reparse|junction|redirect|link/i);
  assert.deepEqual(await treeSnapshot(join(sourceRoot, 'skills')), sourceBefore);
  assert.deepEqual(await readdir(codexHome), destinationBefore);
  assert.equal(await readlink(redirectedSkills), junctionTargetBefore);
  assert.equal(await exists(join(codexHome, 'skill-backups')), false);
});

test('a reparse point above the platform home does not block install (the macOS /var false positive, #45)', { skip: process.platform !== 'win32' }, async () => {
  // Simulates macOS's /var -> /private/var: an ancestor *above* both the
  // platform home and its immediate parent (the staging parent, which is
  // still independently checked as its own leaf) is itself a reparse point,
  // but nothing this script reads from or writes to lives up there. The
  // real target directory tree is pre-created so this only exercises the
  // ancestry check, not directory-creation-through-a-symlink behavior.
  const root = await temporaryRoot();
  const realOuter = join(root, 'real-outer');
  const outerAlias = join(root, 'outer-alias');
  await mkdir(join(realOuter, 'middle'), { recursive: true });
  await symlink(realOuter, outerAlias, 'junction');
  const codexHome = join(outerAlias, 'middle', 'codex-home');
  const expectedNames = inventory.skills.map(({ name }) => name).sort();

  await runInstaller({ codexHome, target: 'Codex' });

  const names = (await readdir(join(realOuter, 'middle', 'codex-home', 'skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(names, expectedNames);
});

test('a reparse point between two independently-checked levels is still rejected (#45 regression guard)', { skip: process.platform !== 'win32' }, async () => {
  // skill-backups sits between PlatformPath (checked as a leaf) and
  // backupParent (checked as a leaf) - it is never independently checked on
  // its own, so this proves the bounded ancestry walk still covers that gap
  // rather than only checking the two endpoints. Uses shallow/targeted
  // assertions rather than a recursive tree snapshot, since the live
  // junction itself is a direct child of codexHome here.
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const name = inventory.skills[0].name;
  const skillPath = join(codexHome, 'skills', name, 'SKILL.md');
  await writeFile(skillPath, 'locally modified\n');
  const decoyTarget = join(root, 'decoy-skill-backups');
  await mkdir(decoyTarget, { recursive: true });
  const backupsLink = join(codexHome, 'skill-backups');
  await symlink(decoyTarget, backupsLink, 'junction');
  const destinationBefore = (await readdir(join(codexHome, 'skills'))).sort();
  const junctionTargetBefore = await readlink(backupsLink);

  const result = await runInstaller({ codexHome, target: 'Codex', force: true, expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /reparse|junction|link/i);
  assert.equal(await readFile(skillPath, 'utf8'), 'locally modified\n');
  assert.deepEqual((await readdir(join(codexHome, 'skills'))).sort(), destinationBefore);
  assert.equal(await readlink(backupsLink), junctionTargetBefore);
  assert.deepEqual(await readdir(decoyTarget), []);
});

test('rejects substituted, duplicate, and incomplete canonical requiredFiles declarations', async () => {
  const variants = [
    ['substituted', ['SKILL.md', 'agents/openai.yaml', 'extra.md']],
    ['duplicate', ['SKILL.md', 'agents/openai.yaml', 'SKILL.md']],
    ['incomplete', ['SKILL.md', 'agents/openai.yaml']],
  ];

  // Shared across variants: only the inventory's requiredFiles differ per
  // case, and the installer must fail before any destination is created, so
  // one source copy can be reused instead of a fresh full-roster tree per variant.
  const root = await temporaryRoot();
  const sourceRoot = await sourceFixture(root);
  const fixtureInventoryPath = join(sourceRoot, 'contracts', 'skill-inventory.json');
  await writeFile(join(sourceRoot, 'skills', 'github-repo-review', 'extra.md'), 'substitute\n');

  for (const [label, requiredFiles] of variants) {
    const fixtureInventory = JSON.parse(await readFile(fixtureInventoryPath, 'utf8'));
    const repoReview = fixtureInventory.skills.find(({ name }) => name === 'github-repo-review');
    repoReview.requiredFiles = requiredFiles;
    await writeFile(fixtureInventoryPath, `${JSON.stringify(fixtureInventory, null, 2)}\n`);
    const codexHome = join(root, 'destinations', label, 'codex');

    const result = await runInstaller({ sourceRoot, codexHome, target: 'Codex', expectFailure: true });

    assert.match(`${result.stdout}\n${result.stderr}`, /canonical|inventory|required/i, label);
    assert.equal(await exists(join(root, 'destinations')), false, label);
  }
});

test('Both installs exactly twelve skills per target with matching SKILL.md hashes', async () => {
  const root = await temporaryRoot();
  const { codexHome, claudeHome } = await installOnce(root);
  const expectedNames = inventory.skills.map(({ name }) => name).sort();

  for (const home of [codexHome, claudeHome]) {
    const names = (await readdir(join(home, 'skills'), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    assert.deepEqual(names, expectedNames);
  }

  for (const name of expectedNames) {
    assert.equal(
      await sha256(join(codexHome, 'skills', name, 'SKILL.md')),
      await sha256(join(claudeHome, 'skills', name, 'SKILL.md')),
    );
  }
});

test('an untracked existing skill is refused without Force and neither target is mutated', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');
  const claudeHome = join(root, 'claude-home');
  const legacyPath = join(claudeHome, 'skills', inventory.skills[0].name, 'legacy.bin');
  await mkdir(dirname(legacyPath), { recursive: true });
  await writeFile(legacyPath, Buffer.from([0, 255, 10, 13, 42]));
  const before = await treeSnapshot(root);

  const result = await runInstaller({ codexHome, claudeHome, expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /untracked|marker/i);
  assert.deepEqual(await treeSnapshot(root), before);
});

test('a modified tracked skill is refused without Force', async () => {
  const root = await temporaryRoot();
  const { claudeHome } = await installOnce(root, 'Claude');
  const skillPath = join(claudeHome, 'skills', inventory.skills[0].name, 'SKILL.md');
  await writeFile(skillPath, 'locally modified\n');
  const before = await treeSnapshot(claudeHome);

  const result = await runInstaller({ claudeHome, target: 'Claude', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /modified|hash/i);
  assert.deepEqual(await treeSnapshot(claudeHome), before);
});

test('a modified tracked skill cannot be concealed by editing its marker hash', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const name = inventory.skills[0].name;
  const skillPath = join(codexHome, 'skills', name, 'SKILL.md');
  const markerPath = join(codexHome, 'skills', name, '.doc-github-practice-skills.json');
  await writeFile(skillPath, 'locally modified and re-marked\n');
  const marker = JSON.parse(await readFile(markerPath, 'utf8'));
  marker.requiredFiles['SKILL.md'] = await sha256(skillPath);
  await writeFile(markerPath, `${JSON.stringify(marker, null, 2)}\n`);
  const before = await treeSnapshot(codexHome);

  const result = await runInstaller({ codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /modified|hash|marker/i);
  assert.deepEqual(await treeSnapshot(codexHome), before);
});

test('a user-added extra file in a tracked skill is refused without Force and preserved (#140)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const name = inventory.skills[0].name;
  const notePath = join(codexHome, 'skills', name, 'user-note.txt');
  await writeFile(notePath, 'mine\n');
  const before = await treeSnapshot(codexHome);

  const result = await runInstaller({ codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /unregistered|extra|added/i);
  assert.equal(await readFile(notePath, 'utf8'), 'mine\n');
  assert.deepEqual(await treeSnapshot(codexHome), before);
  assert.equal(await exists(join(codexHome, 'skill-backups')), false);
});

test('a dry run refuses a tracked skill with a user-added extra file without Force (#140)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  await writeFile(join(codexHome, 'skills', inventory.skills[0].name, 'user-note.txt'), 'mine\n');
  const before = await treeSnapshot(root);

  const result = await runInstaller({ codexHome, target: 'Codex', dryRun: true, expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /unregistered|extra|added/i);
  assert.deepEqual(await treeSnapshot(root), before);
});

test('Force backs up a user-added extra file before replacing the skill (#140)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const name = inventory.skills[0].name;
  const noteBytes = Buffer.from([0, 7, 13, 10, 200]);
  await writeFile(join(codexHome, 'skills', name, 'user-note.txt'), noteBytes);

  await runInstaller({ codexHome, target: 'Codex', force: true });

  const [stamp] = await readdir(join(codexHome, 'skill-backups'));
  assert.deepEqual(await readFile(join(codexHome, 'skill-backups', stamp, name, 'user-note.txt')), noteBytes);
  assert.equal(await exists(join(codexHome, 'skills', name, 'user-note.txt')), false);
});

test('a dry run of an unmodified reinstall does not advertise a backup that will not be made (#140)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const before = await treeSnapshot(root);

  const result = await runInstaller({ codexHome, target: 'Codex', dryRun: true });

  assert.match(result.stdout, /already current/i);
  assert.match(result.stdout, /backup: none/i);
  assert.doesNotMatch(result.stdout, /skill-backups/i);
  assert.deepEqual(await treeSnapshot(root), before);
});

async function installOldRelease(root, codexHome, { tamper } = {}) {
  const sourceRoot = await sourceFixture(join(root, 'old'));
  const inventoryPath = join(sourceRoot, 'contracts', 'skill-inventory.json');
  const oldInventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  oldInventory.packageVersion = '0.0.1';
  await writeFile(inventoryPath, JSON.stringify(oldInventory, null, 2));
  const oldSkill = join(sourceRoot, 'skills', inventory.skills[0].name, 'SKILL.md');
  await writeFile(oldSkill, `${await readFile(oldSkill, 'utf8')}
old release text
`);
  await runInstaller({ sourceRoot, codexHome, target: 'Codex' });
}

test('an unmodified install from an older release upgrades without Force or a backup (#118)', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');
  await installOldRelease(root, codexHome);
  const name = inventory.skills[0].name;
  const skillPath = join(codexHome, 'skills', name, 'SKILL.md');
  assert.notEqual(await sha256(skillPath), await sha256(join(repoRoot, 'skills', name, 'SKILL.md')));

  const preview = await runInstaller({ codexHome, target: 'Codex', dryRun: true });
  const expectedLine = `${name}: upgrade from v0.0.1 to v${inventory.packageVersion}; backup: none`;
  assert.ok(preview.stdout.includes(expectedLine), `preview must contain "${expectedLine}":\n${preview.stdout}`);

  await runInstaller({ codexHome, target: 'Codex' });

  assert.equal(await sha256(skillPath), await sha256(join(repoRoot, 'skills', name, 'SKILL.md')));
  assert.equal(await exists(join(codexHome, 'skill-backups')), false);
  const marker = JSON.parse(await readFile(join(codexHome, 'skills', name, '.doc-github-practice-skills.json'), 'utf8'));
  assert.equal(marker.packageVersion, inventory.packageVersion);
});

test('a user-edited file in an older-release install is still refused without Force (#118)', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');
  await installOldRelease(root, codexHome);
  await writeFile(join(codexHome, 'skills', inventory.skills[0].name, 'SKILL.md'), 'edited locally\n');
  const before = await treeSnapshot(codexHome);

  const result = await runInstaller({ codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}\n${result.stderr}`, /modified|hash/i);
  assert.deepEqual(await treeSnapshot(codexHome), before);
});

test('an older-release marker naming a path outside the skill is refused (#118)', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');
  await installOldRelease(root, codexHome);
  const markerPath = join(codexHome, 'skills', inventory.skills[0].name, '.doc-github-practice-skills.json');
  const marker = JSON.parse(await readFile(markerPath, 'utf8'));
  marker.requiredFiles['../../escape.txt'] = 'a'.repeat(64);
  await writeFile(markerPath, JSON.stringify(marker, null, 2));
  const before = await treeSnapshot(codexHome);

  const result = await runInstaller({ codexHome, target: 'Codex', expectFailure: true });

  assert.match(`${result.stdout}
${result.stderr}`, /hash data|modified|marker/i);
  assert.deepEqual(await treeSnapshot(codexHome), before);
});

test('reinstalling the current release is a no-op that changes nothing (#118)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const before = await treeSnapshot(codexHome);

  await runInstaller({ codexHome, target: 'Codex' });

  assert.deepEqual(await treeSnapshot(codexHome), before);
  assert.equal(await exists(join(codexHome, 'skill-backups')), false);
});

test('KeepBackups bounds skill-backups to the newest N sets (#118)', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  await runInstaller({ codexHome, target: 'Codex', force: true });
  await runInstaller({ codexHome, target: 'Codex', force: true });
  const earlier = await readdir(join(codexHome, 'skill-backups'));
  assert.equal(earlier.length, 2);

  const preview = await runInstaller({ codexHome, target: 'Codex', force: true, keepBackups: 1, dryRun: true });
  assert.match(preview.stdout, /prune/i);
  assert.equal((await readdir(join(codexHome, 'skill-backups'))).length, 2);

  await runInstaller({ codexHome, target: 'Codex', force: true, keepBackups: 1 });

  const remaining = await readdir(join(codexHome, 'skill-backups'));
  assert.equal(remaining.length, 1);
  assert.equal(earlier.includes(remaining[0]), false, 'the newest backup set must survive');
});

test('Force creates a byte-preserving backup before replacing a skill', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const name = inventory.skills[0].name;
  const skillPath = join(codexHome, 'skills', name, 'SKILL.md');
  const modifiedBytes = Buffer.from([0, 1, 2, 13, 10, 255, 127]);
  await writeFile(skillPath, modifiedBytes);

  await runInstaller({ codexHome, target: 'Codex', force: true });

  const backupTimestamps = await readdir(join(codexHome, 'skill-backups'));
  assert.equal(backupTimestamps.length, 1);
  const backedUpBytes = await readFile(
    join(codexHome, 'skill-backups', backupTimestamps[0], name, 'SKILL.md'),
  );
  assert.deepEqual(backedUpBytes, modifiedBytes);
  assert.equal(await sha256(skillPath), await sha256(join(repoRoot, 'skills', name, 'SKILL.md')));
});

test('Force dry-run with a real replacement creates no backup or filesystem change', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const skillPath = join(codexHome, 'skills', inventory.skills[0].name, 'SKILL.md');
  await writeFile(skillPath, 'locally modified\n');
  const before = await treeSnapshot(root);

  const result = await runInstaller({ codexHome, target: 'Codex', force: true, dryRun: true });

  assert.match(result.stdout, /overwrite/i);
  assert.match(result.stdout, /backup/i);
  assert.deepEqual(await treeSnapshot(root), before);
  assert.equal(await exists(join(codexHome, 'skill-backups')), false);
});

test('a failure after staging removes only installer GUID stages', async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, 'codex-home');
  await mkdir(codexHome, { recursive: true });
  await writeFile(join(codexHome, 'skills'), 'blocks the skills directory\n');
  const before = await treeSnapshot(root);

  await runInstaller({ codexHome, target: 'Codex', expectFailure: true });

  assert.deepEqual(await treeSnapshot(root), before);
  const siblings = await readdir(root);
  assert.equal(siblings.some((name) => /^\.doc-github-practice-skills-[0-9a-f-]{36}$/i.test(name)), false);
});

test('a conflict in the second target leaves an installed first target unchanged', async () => {
  const root = await temporaryRoot();
  const { codexHome } = await installOnce(root, 'Codex');
  const claudeHome = join(root, 'claude-home');
  const conflict = join(claudeHome, 'skills', inventory.skills[1].name, 'untracked.txt');
  await mkdir(dirname(conflict), { recursive: true });
  await writeFile(conflict, 'untracked\n');
  const codexBefore = await treeSnapshot(codexHome);

  await runInstaller({ codexHome, claudeHome, expectFailure: true });

  assert.deepEqual(await treeSnapshot(codexHome), codexBefore);
});

test('invalid source inventory fails before destination creation', async () => {
  const root = await temporaryRoot();
  const invalidSource = join(root, 'invalid-source');
  const codexHome = join(root, 'destinations', 'codex');
  const claudeHome = join(root, 'destinations', 'claude');
  await mkdir(invalidSource);

  const result = await runInstaller({
    sourceRoot: invalidSource,
    codexHome,
    claudeHome,
    expectFailure: true,
  });

  assert.match(`${result.stdout}\n${result.stderr}`, /inventory|source/i);
  assert.equal(await exists(join(root, 'destinations')), false);
});

test('markers deterministically represent every required file and release identity', async () => {
  const root = await temporaryRoot();
  const { codexHome, claudeHome } = await installOnce(root);

  for (const skill of inventory.skills) {
    const codexMarkerPath = join(
      codexHome,
      'skills',
      skill.name,
      '.doc-github-practice-skills.json',
    );
    const claudeMarkerPath = join(
      claudeHome,
      'skills',
      skill.name,
      '.doc-github-practice-skills.json',
    );
    const codexMarkerBytes = await readFile(codexMarkerPath);
    assert.deepEqual(codexMarkerBytes, await readFile(claudeMarkerPath));

    const marker = JSON.parse(codexMarkerBytes.toString('utf8'));
    assert.equal(marker.schemaVersion, 1);
    assert.equal(marker.packageName, 'doc-github-practice-skills');
    assert.equal(marker.packageVersion, inventory.packageVersion);
    assert.equal(marker.skillName, skill.name);
    assert.deepEqual(Object.keys(marker.requiredFiles), [...skill.requiredFiles].sort());
    for (const requiredFile of skill.requiredFiles) {
      assert.equal(
        marker.requiredFiles[requiredFile],
        await sha256(join(repoRoot, 'skills', skill.name, ...requiredFile.split('/'))),
      );
    }
  }
});
