import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ALLOW_MARKER,
  scanRepository,
  scanText,
  scannableFiles,
} from '../scripts/scan-public-content.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rules = (text) => scanText(text).map((finding) => finding.rule);

// Seeded values are assembled at run time so this file does not itself match.
test('flags seeded token-shaped strings (#209)', () => {
  assert.deepEqual(rules(`token: ${'ghp_'}${'a'.repeat(36)}`), ['GitHub token']);
  assert.deepEqual(rules(`key ${'AKIA'}${'ABCDEFGHIJKLMNOP'}`), ['AWS access key id']);
  assert.deepEqual(rules(`${'-----BEGIN RSA PRIVATE'} KEY-----`), ['Private key block']);
  assert.deepEqual(rules(`${'sk-'}${'x'.repeat(24)}`), ['API secret key']);
});

test('flags seeded private addresses and internal hostnames (#209)', () => {
  assert.deepEqual(rules('curl http://10.20.30.40/api'), ['Private IP address']); // public-scan: allow (seeded fixture)
  assert.deepEqual(rules('host 192.168.1.5'), ['Private IP address']); // public-scan: allow (seeded fixture)
  assert.deepEqual(rules('ssh build01.corp'), ['Internal-looking hostname']); // public-scan: allow (seeded fixture)
  assert.deepEqual(rules('https://git.team.internal/repo'), ['Internal-looking hostname']); // public-scan: allow (seeded fixture)
});

test('flags a personal email and allows the neutral example domains (#209)', () => {
  assert.deepEqual(rules('contact jane.doe@gmail.com'), ['Email address outside the allowlist']); // public-scan: allow (seeded fixture)
  assert.deepEqual(rules('contact jane@example.test and a@example.com'), []);
  assert.deepEqual(rules('1+x@users.noreply.github.com'), ['Email address outside the allowlist']); // public-scan: allow (seeded fixture)
  assert.deepEqual(rules('noreply@noreply.github.com'), []);
});

test('does not flag file names, public addresses, or marked fake values (#209)', () => {
  assert.deepEqual(rules('see .claude/settings.local.json'), []);
  assert.deepEqual(rules('markdownlint-cli2@0.23.3 and db@host.example.test'), []);
  assert.deepEqual(rules('server 8.8.8.8 and 172.32.0.1'), []);
  assert.deepEqual(rules(`${'ghp_'}${'a'.repeat(36)} <!-- ${ALLOW_MARKER}: fake -->`), []);
});

test('the scan covers published text and skips the lockfile (#209)', () => {
  const files = scannableFiles(root);
  assert.ok(files.includes('README.md'));
  assert.ok(files.includes('scripts/install-skills.ps1'));
  assert.ok(files.includes('.github/workflows/validate.yml'));
  assert.ok(!files.includes('package-lock.json'));
});

test('the current repository has no public-content findings (#209)', () => {
  const findings = scanRepository(root).map(({ file, line, rule }) => `${file}:${line}: ${rule}`);
  assert.deepEqual(findings, []);
});
