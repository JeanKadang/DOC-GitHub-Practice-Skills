import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import { extractFences, findMarkdownFiles, repoRoot } from './helpers/markdown.mjs';

// Diagram types that need a renderer integration which the pinned Mermaid
// parser does not include. The showcase file documents this for ZenUML.
const UNSUPPORTED_TYPES = new Set(['zenuml']);

export function extractMermaidFences(source) {
  return extractFences(source).filter((fence) => fence.language === 'mermaid');
}

function diagramType(source) {
  const firstLine = source
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('%%') && line !== '---');
  return (firstLine ?? '').split(/[\s{]/)[0].toLowerCase();
}

async function loadMermaid() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ startOnLoad: false });
  return mermaid;
}

test('extractMermaidFences finds fences and skips examples nested in longer fences', () => {
  const source = [
    '# Title',
    '```mermaid',
    'flowchart TD',
    '  A --> B',
    '```',
    '',
    '````markdown',
    '```mermaid',
    'not a real diagram',
    '```',
    '````',
    '',
    '```text',
    'plain',
    '```',
  ].join('\n');
  const fences = extractMermaidFences(source);
  assert.equal(fences.length, 1);
  assert.equal(fences[0].line, 2);
  assert.match(fences[0].source, /A --> B/);
});

test('every published Mermaid fence parses under the pinned Mermaid version', async () => {
  const mermaid = await loadMermaid();
  const failures = [];
  let checked = 0;
  for (const file of await findMarkdownFiles(repoRoot)) {
    const source = await readFile(file, 'utf8');
    for (const fence of extractMermaidFences(source)) {
      if (UNSUPPORTED_TYPES.has(diagramType(fence.source))) continue;
      checked += 1;
      try {
        await mermaid.parse(fence.source);
      } catch (error) {
        const reason = String(error.message ?? error).split('\n')[0];
        failures.push(`${relative(repoRoot, file)}:${fence.line}: ${reason}`);
      }
    }
  }
  assert.ok(checked > 0, 'expected to find Mermaid fences to check');
  assert.deepEqual(failures, [], `Mermaid fences that do not parse:\n${failures.join('\n')}`);
});

test('the showcase states the Mermaid version its examples are checked against', async () => {
  const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8'));
  const pinned = packageJson.devDependencies.mermaid;
  assert.match(pinned, /^\d+\.\d+\.\d+$/, 'mermaid must be pinned to an exact version');
  const showcase = await readFile(
    join(repoRoot, 'education', 'examples', 'mermaid-diagram-types-showcase.md'),
    'utf8',
  );
  assert.ok(
    showcase.includes(`Mermaid ${pinned}`),
    `the showcase must name the checked version "Mermaid ${pinned}"`,
  );
});

// Diagram types GitHub's viewer cannot draw (#254). GitHub printed Mermaid
// 11.17.2 on 2026-10-06 and showed "Syntax error in text" for these three: ZenUML
// needs an integration core Mermaid lacks, and use case and agent flow need
// Mermaid 12. A reader on GitHub sees an empty frame, so each fence must be
// preceded by a note saying so. Remove a type from this list when GitHub draws it.
const GITHUB_GAPS = ['zenuml', 'usecase-beta', 'agentflow-beta'];

// The first keyword after any YAML front matter (a fence that sets its theme
// starts with a --- block, which diagramType above does not skip).
export function typeAfterFrontMatter(source) {
  const lines = source.split(/\r?\n/);
  let index = 0;
  if (lines[0]?.trim() === '---') {
    const close = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    index = close === -1 ? 0 : close + 1;
  }
  while (index < lines.length && (!lines[index].trim() || lines[index].trim().startsWith('%%'))) index += 1;
  return (lines[index] ?? '').trim().split(/[\s{]/)[0].toLowerCase();
}

test('typeAfterFrontMatter skips front matter and comments', () => {
  const withFrontMatter = ['---', 'config:', '  theme: base', '---', '%% note', 'usecase-beta', '  x'].join('\n');
  assert.equal(typeAfterFrontMatter(withFrontMatter), 'usecase-beta');
  assert.equal(typeAfterFrontMatter('zenuml\n  title x'), 'zenuml');
  assert.equal(typeAfterFrontMatter(''), '');
});

export function paragraphAbove(lines, fenceLine) {
  const paragraph = [];
  let index = fenceLine - 2;
  while (index >= 0 && lines[index].trim() === '') index -= 1;
  while (index >= 0 && lines[index].trim() !== '') {
    paragraph.unshift(lines[index].trim());
    index -= 1;
  }
  return paragraph.join(' ');
}

test('paragraphAbove returns the paragraph directly above a fence', () => {
  const lines = ['text before', '', '**On GitHub:** this', 'continues here.', '', '```mermaid', 'zenuml', '```'];
  assert.equal(paragraphAbove(lines, 6), '**On GitHub:** this continues here.');
  assert.equal(paragraphAbove(['```mermaid'], 1), '');
});

test('diagrams GitHub cannot draw carry a note directly above them (#254)', async () => {
  const file = join(repoRoot, 'education', 'examples', 'mermaid-diagram-types-showcase.md');
  const source = await readFile(file, 'utf8');
  const lines = source.split(/\r?\n/);
  const fences = extractMermaidFences(source);
  const missing = [];
  const seen = new Set();
  for (const fence of fences) {
    const type = typeAfterFrontMatter(fence.source);
    if (!GITHUB_GAPS.includes(type)) continue;
    seen.add(type);
    if (!paragraphAbove(lines, fence.line).startsWith('**On GitHub')) missing.push(type);
  }
  assert.deepEqual(missing, [], `these diagrams need an "On GitHub" note above them: ${missing.join(', ')}`);
  assert.deepEqual([...seen].sort(), [...GITHUB_GAPS].sort(), 'every known gap should still appear in the showcase');
});
