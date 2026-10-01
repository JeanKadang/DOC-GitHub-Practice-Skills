import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

import { extractFences, findMarkdownFiles, repoRoot } from './helpers/markdown.mjs';

// docs/MAINTAINING.md requires every shell example to be checked, not just to
// look plausible (#129). This parses each bash and PowerShell fence without
// running it. Docs write `<placeholder>` for values the reader supplies, which
// is not valid shell, so those are replaced before parsing.
const BASH_LANGUAGES = new Set(['bash', 'sh']);
const POWERSHELL_LANGUAGES = new Set(['powershell', 'pwsh']);

// Point-in-time audit reports are not maintained against a shell, so they are
// not checked (see links.test.mjs).
const POINT_IN_TIME_DIRECTORY = join(repoRoot, 'docs', 'review');

export function withoutPlaceholders(source) {
  return source.replace(/<[^<>\n]+>/g, 'PLACEHOLDER');
}

export function bashSyntaxError(source) {
  const result = spawnSync('bash', ['-n'], { input: withoutPlaceholders(source), encoding: 'utf8' });
  if (result.error) throw result.error;
  return result.status === 0 ? null : (result.stderr || 'bash -n failed').split('\n')[0];
}

/** Parses each snippet with PowerShell's own parser, in one pwsh process. */
export async function powershellSyntaxErrors(sources) {
  const dir = await mkdtemp(join(tmpdir(), 'ps-syntax-'));
  try {
    const input = join(dir, 'snippets.json');
    await writeFile(input, JSON.stringify(sources.map(withoutPlaceholders)));
    const script = [
      `$snippets = Get-Content -Raw -LiteralPath '${input.replace(/'/g, "''")}' | ConvertFrom-Json`,
      '$out = @()',
      'foreach ($s in $snippets) {',
      '  $tokens = $null; $errs = $null',
      '  [void][System.Management.Automation.Language.Parser]::ParseInput([string]$s, [ref]$tokens, [ref]$errs)',
      '  if ($errs.Count -gt 0) { $out += [string]$errs[0].Message } else { $out += $null }',
      '}',
      'ConvertTo-Json -InputObject @($out) -Compress',
    ].join('\n');
    const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', script], {
      encoding: 'utf8',
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('bashSyntaxError accepts a valid snippet with placeholders and rejects a seeded syntax error', () => {
  assert.equal(bashSyntaxError('gh issue view <N> --json body --jq .body > <file>'), null);
  assert.ok(bashSyntaxError('if [ -f x ]; then\n  echo hi\n'), 'an unclosed if must be reported');
});

test('powershellSyntaxErrors accepts a valid snippet and rejects a seeded syntax error', async () => {
  const [good, bad] = await powershellSyntaxErrors([
    'gh issue edit <N> --body-file <file>',
    'if ($x -eq 1 {\n  Write-Output "unclosed"\n',
  ]);
  assert.equal(good, null);
  assert.ok(bad, 'an unclosed parenthesis must be reported');
});

test('every bash and PowerShell snippet in published Markdown parses', async () => {
  const bash = [];
  const powershell = [];
  for (const file of await findMarkdownFiles()) {
    if (file.startsWith(POINT_IN_TIME_DIRECTORY)) continue;
    const where = relative(repoRoot, file);
    for (const fence of extractFences(await readFile(file, 'utf8'))) {
      if (BASH_LANGUAGES.has(fence.language)) bash.push({ where, ...fence });
      else if (POWERSHELL_LANGUAGES.has(fence.language)) powershell.push({ where, ...fence });
    }
  }
  assert.ok(bash.length > 0 && powershell.length > 0, 'expected to find shell snippets to check');

  const failures = [];
  for (const snippet of bash) {
    const error = bashSyntaxError(snippet.source);
    if (error) failures.push(`${snippet.where}:${snippet.line}: bash: ${error}`);
  }
  const errors = await powershellSyntaxErrors(powershell.map((snippet) => snippet.source));
  errors.forEach((error, index) => {
    if (error) {
      const snippet = powershell[index];
      failures.push(`${snippet.where}:${snippet.line}: powershell: ${error}`);
    }
  });
  assert.deepEqual(failures, [], `snippets with a syntax error:\n${failures.join('\n')}`);
});
