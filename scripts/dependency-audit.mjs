// Scheduled dependency audit gate (#262). Runs over `npm audit --json` output and
// fails on any moderate-or-higher advisory that is not in the reviewed allowlist.
//
//   node scripts/dependency-audit.mjs [YYYY-MM-DD] [--audit audit.json] [--accepted file.json]
//
// Without --audit it runs `npm audit --json` itself. Each accepted entry is
// { "id": "GHSA-...", "reason": "...", "reviewBy": "YYYY-MM-DD" }. An entry past
// its reviewBy date fails the run, so an accepted risk is revisited, not forgotten.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GATED = new Set(['moderate', 'high', 'critical']);
const GHSA = /GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i;

// Root advisories only: `via` entries that are objects. A string in `via` names
// a parent package that merely inherits another package's advisory.
export function collectAdvisories(audit) {
  const found = new Map();
  for (const [name, vuln] of Object.entries(audit.vulnerabilities ?? {})) {
    for (const via of vuln.via ?? []) {
      if (typeof via === 'string') continue;
      const id = GHSA.exec(via.url ?? '')?.[0].toUpperCase() ?? `source-${via.source}`;
      if (!found.has(id)) {
        found.set(id, { id, severity: via.severity, title: via.title, packages: new Set() });
      }
      found.get(id).packages.add(via.name ?? name);
    }
  }
  return [...found.values()];
}

export function evaluate(audit, accepted, today) {
  const problems = [];
  const acceptedById = new Map(accepted.map((entry) => [entry.id.toUpperCase(), entry]));
  const advisories = collectAdvisories(audit);
  const present = new Set(advisories.map((advisory) => advisory.id));
  for (const advisory of advisories) {
    if (!GATED.has(advisory.severity)) continue;
    const entry = acceptedById.get(advisory.id);
    const label = `${advisory.id} (${advisory.severity}, ${[...advisory.packages].join(', ')}): ${advisory.title}`;
    if (!entry) problems.push(`New advisory not accepted: ${label}`);
    else if (entry.reviewBy < today) problems.push(`Acceptance expired ${entry.reviewBy}, review it: ${label}`);
  }
  const stale = accepted.filter((entry) => !present.has(entry.id.toUpperCase())).map((entry) => entry.id);
  return { problems, stale };
}

function main(argv) {
  const args = argv.slice(2);
  const option = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const today = args.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) ?? new Date().toISOString().slice(0, 10);
  const acceptedPath = option('--accepted') ?? fileURLToPath(new URL('../.github/audit-accepted.json', import.meta.url));
  const accepted = JSON.parse(readFileSync(acceptedPath, 'utf8'));
  let raw;
  if (option('--audit')) raw = readFileSync(option('--audit'), 'utf8');
  else {
    // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
    try {
      raw = execSync('npm audit --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      raw = error.stdout;
    }
  }
  const audit = JSON.parse(raw);
  if (audit.error) {
    console.error(`npm audit failed: ${audit.error.summary ?? JSON.stringify(audit.error)}`);
    return 1;
  }
  const { problems, stale } = evaluate(audit, accepted, today);
  for (const id of stale) console.log(`Note: ${id} is accepted but no longer reported; remove it from the allowlist.`);
  if (problems.length === 0) {
    console.log(`Dependency audit passed: every moderate-or-higher advisory is accepted (checked ${today}).`);
    return 0;
  }
  for (const problem of problems) console.error(problem);
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv);
