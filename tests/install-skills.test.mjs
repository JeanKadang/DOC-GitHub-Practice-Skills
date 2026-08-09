import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
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

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), 'install-skills-'));
  temporaryRoots.push(root);
  return root;
}

async function runInstaller({
  sourceRoot = repoRoot,
  codexHome,
  claudeHome,
  target = 'Both',
  dryRun = false,
  force = false,
  expectFailure = false,
}) {
  const args = [
    '-NoProfile',
    '-File',
    installerPath,
    '-Target',
    target,
    '-SourceRoot',
    sourceRoot,
  ];
  if (codexHome) args.push('-CodexHome', codexHome);
  if (claudeHome) args.push('-ClaudeHome', claudeHome);
  if (dryRun) args.push('-DryRun');
  if (force) args.push('-Force');

  try {
    const result = await execFileAsync('pwsh', args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      timeout: 20_000,
    });
    assert.equal(expectFailure, false, `installer unexpectedly succeeded:\n${result.stdout}`);
    return { ...result, exitCode: 0 };
  } catch (error) {
    if (!expectFailure) throw error;
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
        entries.push(`f:${childRelative}:${await sha256(childPath)}`);
      }
    }
  }

  await visit(root);
  return entries;
}

async function installOnce(root, target = 'Both') {
  const codexHome = join(root, 'codex-home');
  const claudeHome = join(root, 'claude-home');
  await runInstaller({ codexHome, claudeHome, target });
  return { codexHome, claudeHome };
}

test.after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
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
  assert.match(result.stdout, /Skills \(8\)/i);
  assert.match(result.stdout, /backup/i);
});

test('Both installs exactly eight skills per target with matching SKILL.md hashes', async () => {
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
