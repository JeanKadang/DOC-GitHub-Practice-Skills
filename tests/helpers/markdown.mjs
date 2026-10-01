import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Folders that hold no published Markdown, or planning artifacts that are
// tracked separately (docs/superpowers, issue #137).
const SKIPPED_DIRECTORIES = new Set(['.git', '.github', '.superpowers', 'node_modules', 'superpowers']);

export async function findMarkdownFiles(directory = repoRoot) {
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
 * Returns every fenced code block in a Markdown source as
 * `{ language, line, source }`, where `line` is the 1-based line of the opening
 * fence. A fence nested inside a longer fence (a Markdown sample that shows a
 * fence) is part of the outer block's text, not a block of its own.
 */
export function extractFences(source) {
  const lines = source.split(/\r?\n/);
  const fences = [];
  let open = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^\s*(`{3,}|~{3,})\s*([^`\s]*)/.exec(line);
    if (!open) {
      if (match) {
        open = { marker: match[1], language: match[2].toLowerCase(), line: index + 1, body: [] };
      }
      continue;
    }
    const closes =
      match &&
      match[1][0] === open.marker[0] &&
      match[1].length >= open.marker.length &&
      line.trim() === match[1];
    if (closes) {
      fences.push({ language: open.language, line: open.line, source: open.body.join('\n') });
      open = null;
    } else {
      open.body.push(line);
    }
  }
  return fences;
}

/** Markdown with fenced code blocks removed, keeping line numbers stable. */
export function stripFences(source) {
  const lines = source.split(/\r?\n/);
  let open = null;
  return lines
    .map((line) => {
      const match = /^\s*(`{3,}|~{3,})/.exec(line);
      if (!open) {
        if (match) {
          open = match[1];
          return '';
        }
        return line;
      }
      if (match && match[1][0] === open[0] && match[1].length >= open.length && line.trim() === match[1]) {
        open = null;
      }
      return '';
    })
    .join('\n');
}
