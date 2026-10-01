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
