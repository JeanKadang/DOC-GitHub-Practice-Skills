import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { repoRoot } from './helpers/markdown.mjs';
import {
  checkBundle,
  collectDependencies,
  packageEducation,
  relativeLinks,
  skillMentions,
} from '../scripts/package-education.mjs';

// The education bundle (ADR 0008, #146) must carry what the pages need, derived
// rather than listed by hand, and every link in it must still resolve once it is
// moved. These tests run the real code on a small invented repository so a
// seeded fault can fail them.
async function write(root, path, content) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'edu-bundle-'));
  await write(root, 'package.json', JSON.stringify({ name: 'x', version: '1.2.3' }));
  await write(root, 'LICENSE', 'MIT License\n\nCopyright\n');
  await write(root, 'contracts/skill-inventory.json', JSON.stringify({
    schemaVersion: 1,
    packageVersion: '1.2.3',
    skills: [
      { name: 'github-used', requiredFiles: ['SKILL.md', 'agents/openai.yaml'] },
      { name: 'github-unused', requiredFiles: ['SKILL.md'] },
    ],
  }));
  await write(root, 'skills/github-used/SKILL.md', '# used\n');
  await write(root, 'skills/github-used/agents/openai.yaml', 'name: used\n');
  await write(root, 'skills/github-unused/SKILL.md', '# unused\n');
  await write(root, 'docs/a.md', 'See [b](./b.md).\n');
  await write(root, 'docs/b.md', 'The end.\n');
  await write(root, 'docs/unlinked.md', 'Nobody links here.\n');
  await write(root, 'education/CHANGELOG.md', '# C\n\n## [Unreleased]\n\n- a change\n\n## [1.0.0] - 2026-01-01\n\n- first\n');
  await write(
    root,
    'education/README.md',
    [
      '# Education',
      'Read [the guide](../docs/a.md#top) and [the next page](page.md).',
      'The rule lives in `skills/github-used/SKILL.md`.',
      '```text',
      '[not a link](../docs/unlinked.md)',
      '```',
      '',
    ].join('\n'),
  );
  await write(root, 'education/page.md', 'A page.\n');
  return root;
}

test('relativeLinks skips external links, anchors, and fenced code; skillMentions finds skill paths', () => {
  const source = '[a](x.md) [b](https://example.test) [c](#top) [d](y.md#part)\n```\n[e](z.md)\n```\n`skills/github-one/SKILL.md` and skills/github-two/references/a.md';
  assert.deepEqual(relativeLinks(source), ['x.md', 'y.md']);
  assert.deepEqual(skillMentions(source).sort(), ['github-one', 'github-two']);
});

test('dependencies are derived: linked files and their links, referenced skills with their listed files, and the licence', async () => {
  const root = await fixture();
  try {
    const { files, skills, problems } = collectDependencies(root);
    assert.deepEqual(problems, []);
    assert.deepEqual(skills, ['github-used']);
    for (const path of ['education/README.md', 'education/page.md', 'docs/a.md', 'docs/b.md', 'skills/github-used/SKILL.md', 'skills/github-used/agents/openai.yaml', 'LICENSE']) {
      assert.ok(files.has(path), `expected ${path}`);
    }
    for (const path of ['docs/unlinked.md', 'skills/github-unused/SKILL.md']) {
      assert.ok(!files.has(path), `did not expect ${path}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a link to a missing file, and a mention of an unknown skill, are reported', async () => {
  const root = await fixture();
  try {
    await write(root, 'education/page.md', 'See [gone](../docs/gone.md) and `skills/github-ghost/SKILL.md`.\n');
    const { problems } = collectDependencies(root);
    assert.ok(problems.some((problem) => /gone\.md.*not a file/.test(problem)), problems.join('\n'));
    assert.ok(problems.some((problem) => /github-ghost.*not in the skill inventory/.test(problem)), problems.join('\n'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the bundle has a manifest with versions, licence, source commit, and a hash per file, and its links resolve when moved', async () => {
  const root = await fixture();
  const out = join(await mkdtemp(join(tmpdir(), 'edu-out-')), 'bundle');
  try {
    const result = await packageEducation({ root, out, commit: 'abc123' });
    assert.deepEqual(result.problems, []);
    const manifest = JSON.parse(await readFile(join(out, 'BUNDLE.json'), 'utf8'));
    assert.equal(manifest.skillsetVersion, '1.2.3');
    assert.equal(manifest.educationVersion, '1.0.0');
    assert.equal(manifest.educationHasUnreleasedChanges, true);
    assert.deepEqual(manifest.license, { file: 'LICENSE', firstLine: 'MIT License' });
    assert.equal(manifest.source.commit, 'abc123');
    assert.ok(manifest.files.every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256)));
    assert.deepEqual(checkBundle(out), []);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dirname(out), { recursive: true, force: true });
  }
});

test('checkBundle fails when a bundled file a page links to is removed', async () => {
  const root = await fixture();
  const out = join(await mkdtemp(join(tmpdir(), 'edu-out-')), 'bundle');
  try {
    await packageEducation({ root, out, commit: 'abc123' });
    await rm(join(out, 'docs', 'b.md'));
    await rm(join(out, 'skills', 'github-used'), { recursive: true });
    const problems = checkBundle(out);
    assert.ok(problems.some((problem) => /docs\/a\.md links to \.\/b\.md/.test(problem)), problems.join('\n'));
    assert.ok(problems.some((problem) => /names skills\/github-used\//.test(problem)), problems.join('\n'));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(dirname(out), { recursive: true, force: true });
  }
});

test('rebuilding replaces the previous bundle, and an unrelated non-empty folder is refused and left alone', async () => {
  const root = await fixture();
  const parent = await mkdtemp(join(tmpdir(), 'edu-out-'));
  try {
    const out = join(parent, 'bundle');
    await packageEducation({ root, out, commit: 'one' });
    await write(root, 'education/page.md', 'A changed page.\n');
    const again = await packageEducation({ root, out, commit: 'two' });
    assert.deepEqual(again.problems, []);
    assert.equal(await readFile(join(out, 'education', 'page.md'), 'utf8'), 'A changed page.\n');
    assert.equal(JSON.parse(await readFile(join(out, 'BUNDLE.json'), 'utf8')).source.commit, 'two');

    const other = join(parent, 'other');
    await write(other, 'keep.txt', 'mine');
    const refused = await packageEducation({ root, out: other, commit: 'x' });
    assert.equal(refused.wrote, false);
    assert.match(refused.problems[0], /not empty and has no BUNDLE\.json/);
    assert.deepEqual(await readdir(other), ['keep.txt']);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(parent, { recursive: true, force: true });
  }
});

test('a tampered manifest cannot make a rebuild delete outside the output folder', async () => {
  const root = await fixture();
  const parent = await mkdtemp(join(tmpdir(), 'edu-out-'));
  try {
    const out = join(parent, 'bundle');
    await packageEducation({ root, out, commit: 'one' });
    await write(parent, 'precious.txt', 'keep me');
    const manifestPath = join(out, 'BUNDLE.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.files.push({ path: '../precious.txt', sha256: '0'.repeat(64) });
    await writeFile(manifestPath, JSON.stringify(manifest));
    await packageEducation({ root, out, commit: 'two' });
    assert.equal(await readFile(join(parent, 'precious.txt'), 'utf8'), 'keep me');
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(parent, { recursive: true, force: true });
  }
});

test('the real repository bundles cleanly: every link resolves, and every skill the pages name is carried (#146)', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'edu-real-'));
  try {
    const out = join(parent, 'bundle');
    const result = await packageEducation({ root: repoRoot, out, commit: 'test' });
    assert.deepEqual(result.problems, []);
    assert.ok(result.skills.length >= 1, 'expected at least one referenced skill');
    for (const name of result.skills) {
      assert.ok((await readdir(join(out, 'skills', name))).includes('SKILL.md'), `${name} SKILL.md is in the bundle`);
    }
    const manifest = JSON.parse(await readFile(join(out, 'BUNDLE.json'), 'utf8'));
    assert.match(manifest.skillsetVersion, /^\d+\.\d+\.\d+$/);
    assert.equal(manifest.license.file, 'LICENSE');
    assert.deepEqual(checkBundle(out), []);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
