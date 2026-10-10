import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// One canonical agent-guidance file (#116): AGENTS.md holds the text, and
// CLAUDE.md only imports it, so Codex, Copilot, and Claude Code read the same
// words and the two files cannot drift apart.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(
  await readFile(join(repoRoot, 'contracts', 'skill-inventory.json'), 'utf8'),
);

async function read(name) {
  return readFile(join(repoRoot, name), 'utf8');
}

test('CLAUDE.md imports AGENTS.md instead of duplicating it', async () => {
  assert.ok(existsSync(join(repoRoot, 'AGENTS.md')), 'AGENTS.md must exist');
  const claude = await read('CLAUDE.md');
  const firstLine = claude
    .split(/\r?\n/)
    .find((line) => line.trim() !== '' && !line.trim().startsWith('<!--'));
  assert.equal(firstLine.trim(), '@AGENTS.md');
  assert.ok(claude.split(/\r?\n/).length < 30, 'CLAUDE.md should stay a thin wrapper around the import');
});

test('AGENTS.md names every canonical skill and all three platforms', async () => {
  const agents = await read('AGENTS.md');
  for (const { name } of inventory.skills) {
    assert.ok(agents.includes(`\`${name}\``), `AGENTS.md must describe ${name}`);
  }
  for (const platform of ['OpenAI Codex', 'Claude Code', 'GitHub Copilot CLI']) {
    assert.ok(agents.includes(platform), `AGENTS.md must mention ${platform}`);
  }
  assert.match(agents, /three/i);
});

test('AGENTS.md never names a platform twice in a row (find-and-replace damage)', async () => {
  const agents = await read('AGENTS.md');
  assert.doesNotMatch(agents, /\b(OpenAI Codex|Codex|Claude|Copilot)(?:,| \+| and)\s+(?:OpenAI )?\1\b/);
});

test('every repository path AGENTS.md cites exists', async () => {
  const agents = await read('AGENTS.md');
  const prefixes = /^(?:docs|scripts|skills|tests|contracts|platforms|education|\.github)\//;
  const rootFiles = /^(?:README|CONTRIBUTING|SECURITY|CHANGELOG|CLAUDE|AGENTS|LICENSE)(?:\.md)?$/;
  const missing = [];
  for (const match of agents.matchAll(/`([^`\s]+)`/g)) {
    const token = match[1].replace(/[.,;:]+$/, '');
    if (/[*<>{}~]/.test(token)) continue;
    if (prefixes.test(token) || rootFiles.test(token)) {
      if (!existsSync(join(repoRoot, token))) missing.push(token);
    }
  }
  assert.deepEqual(missing, [], `AGENTS.md cites paths that do not exist: ${missing.join(', ')}`);
});
