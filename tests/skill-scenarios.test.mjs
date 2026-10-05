import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { CANONICAL_SKILLS } from '../scripts/validate-skills.mjs';
import { repoRoot } from './helpers/markdown.mjs';

// docs/skill-scenarios.md (#150) is a manual rubric. Each scenario must give an
// observable Expected list, a Prohibited list, and a Source that names a file
// that exists, or the rubric stops being checkable. Every skill it names must
// be a real one.
export function parseScenarios(markdown) {
  return markdown
    .split(/^## /m)
    .filter((section) => /^S\d+:/.test(section))
    .map((section) => ({
      title: section.split(/\r?\n/)[0],
      expected: /\*\*Expected/.test(section),
      prohibited: /\*\*Prohibited/.test(section),
      sources: [...section.matchAll(/`((?:skills|docs)\/[\w./-]+?)(?:[,`])/g)].map((match) => match[1]),
      hasSource: /\*\*Source\.\*\*/.test(section),
    }));
}

test('parseScenarios reads sections that start with an S number', () => {
  const text = '# T\n\n## Intro\n\ntext\n\n## S1: One\n\n**Expected.**\n\n**Prohibited.**\n\n**Source.** `docs/a.md`, x\n';
  const scenarios = parseScenarios(text);
  assert.equal(scenarios.length, 1);
  assert.deepEqual(scenarios[0], { title: 'S1: One', expected: true, prohibited: true, sources: ['docs/a.md'], hasSource: true });
});

test('every scenario has Expected, Prohibited, and a Source that exists (#150)', async () => {
  const text = await readFile(join(repoRoot, 'docs', 'skill-scenarios.md'), 'utf8');
  const scenarios = parseScenarios(text);
  assert.ok(scenarios.length >= 7, `expected at least 7 scenarios, found ${scenarios.length}`);
  const problems = [];
  for (const scenario of scenarios) {
    if (!scenario.expected) problems.push(`${scenario.title}: no Expected`);
    if (!scenario.prohibited) problems.push(`${scenario.title}: no Prohibited`);
    if (!scenario.hasSource || scenario.sources.length === 0) problems.push(`${scenario.title}: no Source`);
    for (const source of scenario.sources) {
      try {
        await access(join(repoRoot, source));
      } catch {
        problems.push(`${scenario.title}: Source ${source} does not exist`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('every skill the scenarios name is a canonical skill (#150)', async () => {
  const text = await readFile(join(repoRoot, 'docs', 'skill-scenarios.md'), 'utf8');
  const known = new Set(CANONICAL_SKILLS.map((skill) => skill.name ?? skill));
  const named = new Set([...text.matchAll(/`(github-[a-z-]+)`/g)].map((match) => match[1]));
  const unknown = [...named].filter((name) => !known.has(name));
  assert.deepEqual(unknown, [], `scenarios name skills that do not exist: ${unknown.join(', ')}`);
  assert.ok(named.size >= 8, 'the skill-selection list should exercise at least eight skills');
});
