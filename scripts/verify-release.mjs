// Guards run before a release is published (#128): the tag must be a plain
// version, match package.json and the skill inventory, have a CHANGELOG section,
// and point at a commit that is on the main branch. The release workflow runs
//
//   node scripts/verify-release.mjs <tag> [main-ref]
//
// in a read-only job, and only a job that needs it can publish.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG_PATTERN = /^v(\d+\.\d+\.\d+)$/;

export function changelogHasSection(changelog, version) {
  // Plain string comparison, not a pattern built from the version.
  const heading = `## [${version}]`;
  return changelog.split(/\r?\n/).some((line) => line.startsWith(heading));
}

/** Returns a list of problems; an empty list means the release may go ahead. */
export function releaseProblems({ tag, packageVersion, inventoryVersion, changelog, onMain }) {
  const match = TAG_PATTERN.exec(tag ?? '');
  if (!match) {
    return [`tag "${tag}" is not a plain version like v1.2.3`];
  }
  const version = match[1];
  const problems = [];
  if (!onMain) {
    problems.push(`the tagged commit is not reachable from the main branch`);
  }
  if (packageVersion !== version) {
    problems.push(`package.json version "${packageVersion}" does not match tag "${tag}"`);
  }
  if (inventoryVersion !== version) {
    problems.push(`inventory packageVersion "${inventoryVersion}" does not match tag "${tag}"`);
  }
  if (!changelogHasSection(changelog ?? '', version)) {
    problems.push(`CHANGELOG.md has no "## [${version}]" section`);
  }
  return problems;
}

/** True when `commit` is `ref` or an ancestor of it, using git itself. */
export function isReachableFrom(commit, ref, cwd = process.cwd()) {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', commit, ref], { cwd });
  return result.status === 0;
}

function main() {
  const [tag, mainRef = 'origin/main'] = process.argv.slice(2);
  const read = (path) => readFileSync(resolve(path), 'utf8');
  const problems = releaseProblems({
    tag,
    packageVersion: JSON.parse(read('package.json')).version,
    inventoryVersion: JSON.parse(read('contracts/skill-inventory.json')).packageVersion,
    changelog: read('CHANGELOG.md'),
    onMain: isReachableFrom('HEAD', mainRef),
  });
  if (problems.length > 0) {
    for (const problem of problems) console.error(`ERROR: ${problem}`);
    process.exit(1);
  }
  console.log(`Release guards passed for ${tag}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
