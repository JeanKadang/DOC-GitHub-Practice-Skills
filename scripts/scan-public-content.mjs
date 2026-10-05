// Mechanical public-content scan (#209). CONTRIBUTING.md and AGENTS.md keep
// private material out of this public repository; this script catches the
// obvious shapes of it in tracked text files. It cannot judge wording: a
// company name, an internal policy, or a screenshot passes it, and so does a
// secret that does not match a known prefix. Human review still owns those, and
// #122 owns workplace-derived wording.
//
//   node scripts/scan-public-content.mjs
//
// Allowlist (keep this list and docs/MAINTAINING.md in step):
// - Email addresses at example.test, example.com, example.org, example.net
//   (and their subdomains), *.invalid, or noreply.github.com. These are the neutral values the
//   repository uses in examples.
// - Any line containing the marker `public-scan: allow`, for a deliberate fake
//   value that has to look real, such as a token shown in a "do not paste this"
//   example. Say on the line why it is fake.
// - package-lock.json, which holds integrity hashes and registry URLs.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALLOW_MARKER = 'public-scan: allow';
export const SCANNED_EXTENSIONS = new Set([
  '.md', '.yml', '.yaml', '.json', '.jsonc', '.mjs', '.ps1', '.txt',
]);
export const SKIPPED_FILES = new Set(['package-lock.json']);
export const ALLOWED_EMAIL_DOMAINS = [
  /(^|\.)example\.(test|com|org|net)$/i,
  /\.invalid$/i,
  /^noreply\.github\.com$/i,
];

const TOKEN_RULES = [
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{22,}\b/],
  ['AWS access key id', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['API secret key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['Private key block', /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/],
];
const PRIVATE_IP =
  /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2})\b/;
// A trailing `.json`, `.md` and the like is a file name, not a host.
const INTERNAL_HOST =
  /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:internal|corp|intranet|lan|home|private|local)(?![\w-])(?!\.\w)/i;
const EMAIL = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g;

export function scanText(text, file = '(text)') {
  const findings = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    const report = (rule) => findings.push({ file, line: index + 1, rule });
    for (const [rule, pattern] of TOKEN_RULES) if (pattern.test(line)) report(rule);
    if (PRIVATE_IP.test(line)) report('Private IP address');
    if (INTERNAL_HOST.test(line)) report('Internal-looking hostname');
    for (const match of line.matchAll(EMAIL)) {
      if (!ALLOWED_EMAIL_DOMAINS.some((domain) => domain.test(match[1]))) {
        report('Email address outside the allowlist');
      }
    }
  });
  return findings;
}

export function scannableFiles(root) {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => SCANNED_EXTENSIONS.has(extname(file)))
    .filter((file) => !SKIPPED_FILES.has(file.split('/').pop()));
}

export function scanRepository(root) {
  return scannableFiles(root).flatMap((file) =>
    scanText(readFileSync(join(root, file), 'utf8'), file),
  );
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const findings = scanRepository(root);
  for (const { file, line, rule } of findings) console.error(`${file}:${line}: ${rule}`);
  if (findings.length > 0) {
    console.error(
      `\n${findings.length} public-content finding(s). Remove the value, or see the allowlist in scripts/scan-public-content.mjs.`,
    );
    process.exit(1);
  }
  console.log('Public-content scan: no findings.');
}
