import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// Folders that hold no published Markdown, or that hold planning artifacts
// tracked separately (docs/superpowers, issue #137).
const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.github',
  '.superpowers',
  'node_modules',
  'superpowers',
]);

// Diagram types that need a renderer integration which the pinned Mermaid
// parser does not include. The showcase file documents this for ZenUML.
const UNSUPPORTED_TYPES = new Set(['zenuml']);

async function findMarkdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      files.push(...(await findMarkdownFiles(join(directory, entry.name))));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

/**
 * Returns every ```mermaid fence in a Markdown source, with the 1-based line
 * of its opening fence. A fence nested inside a longer fence (a Markdown
 * sample that shows a mermaid block) is example text, not a diagram, so it is
 * skipped.
 */
export function extractMermaidFences(source) {
  const lines = source.split(/\r?\n/);
  const fences = [];
  let open = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^\s*(`{3,}|~{3,})\s*([^`\s]*)/.exec(line);
    if (!open) {
      if (match) {
        open = { marker: match[1], language: match[2], line: index + 1, body: [] };
      }
      continue;
    }
    const closes =
      match &&
      match[1][0] === open.marker[0] &&
      match[1].length >= open.marker.length &&
      line.trim() === match[1];
    if (closes) {
      if (open.language === 'mermaid') {
        fences.push({ line: open.line, source: open.body.join('\n') });
      }
      open = null;
    } else {
      open.body.push(line);
    }
  }
  return fences;
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
