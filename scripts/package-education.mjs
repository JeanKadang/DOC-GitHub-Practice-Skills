#!/usr/bin/env node
// Builds a portable copy of `education/` (ADR 0008, #146).
//
// The education pages link to files outside their folder and name skill files
// by path, so a copy of `education/` alone breaks. This script copies
// `education/` together with exactly the files it needs, keeping their relative
// positions so every link still resolves, and writes BUNDLE.json with the
// versions, licence, source commit, and a SHA-256 for every file.
//
// What it carries, and how each is derived (nothing is hardcoded):
//   - every file under `education/`;
//   - every relative link in those pages that resolves to a file outside
//     `education/`, and the files those files link to in turn;
//   - every skill named by a `skills/<name>/` path in an education page, with the
//     files that skill's entry in `contracts/skill-inventory.json` lists;
//   - the repository LICENSE.
//
// A bundle is a point-in-time export. Rebuild it rather than editing it.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MANIFEST = 'BUNDLE.json';
const SKILL_MENTION = /\bskills\/(github-[a-z0-9-]+)\//g;
const FENCE = /^\s*(```|~~~)/;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i;

const toPosix = (path) => path.split(sep).join('/');

function listFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

// Relative link targets in a Markdown source, ignoring fenced code blocks.
export function relativeLinks(source) {
  const targets = [];
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const match of line.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      const target = match[1];
      if (EXTERNAL.test(target)) continue;
      targets.push(decodeURI(target.split('#')[0]));
    }
  }
  return targets.filter(Boolean);
}

export function skillMentions(source) {
  return [...new Set([...source.matchAll(SKILL_MENTION)].map((match) => match[1]))];
}

// Returns { files: Set<repo-relative posix path>, skills: string[], problems: string[] }.
export function collectDependencies(root) {
  const problems = [];
  const files = new Set();
  const skills = new Set();
  const inventory = JSON.parse(readFileSync(join(root, 'contracts', 'skill-inventory.json'), 'utf8'));
  const required = new Map(inventory.skills.map((skill) => [skill.name, skill.requiredFiles]));

  const educationDir = join(root, 'education');
  for (const file of listFiles(educationDir)) files.add(toPosix(relative(root, file)));

  const queue = [...files].filter((path) => path.endsWith('.md'));
  const seen = new Set(queue);
  const visit = (path) => {
    const source = readFileSync(join(root, path), 'utf8');
    for (const target of relativeLinks(source)) {
      const resolved = toPosix(normalize(join(dirname(path), target)));
      if (resolved.startsWith('../')) {
        problems.push(`${path} links to ${target}, which is outside the repository`);
        continue;
      }
      const full = join(root, resolved);
      if (!existsSync(full) || !statSync(full).isFile()) {
        problems.push(`${path} links to ${target}, which is not a file in the repository`);
        continue;
      }
      if (!files.has(resolved)) files.add(resolved);
      if (resolved.endsWith('.md') && !seen.has(resolved)) {
        seen.add(resolved);
        queue.push(resolved);
      }
    }
    if (path.startsWith('education/')) {
      for (const name of skillMentions(source)) {
        if (!required.has(name)) {
          problems.push(`${path} names skills/${name}/, which is not in the skill inventory`);
        } else skills.add(name);
      }
    }
  };
  for (let i = 0; i < queue.length; i += 1) visit(queue[i]);

  for (const name of skills) {
    for (const file of required.get(name)) {
      const path = `skills/${name}/${file}`;
      if (!existsSync(join(root, path))) problems.push(`skill ${name} lists ${file}, which does not exist`);
      else files.add(path);
    }
  }
  const license = readdirSync(root).find((name) => /^licen[cs]e(\.|$)/i.test(name));
  if (license) files.add(license);
  else problems.push('the repository has no LICENSE file to carry in the bundle');

  return { files, skills: [...skills].sort(), problems };
}

// Checks that every relative link in the bundled Markdown resolves to a
// bundled file, and that every `skills/<name>/` mention names a bundled skill.
export function checkBundle(bundleRoot) {
  const problems = [];
  const present = new Set(listFiles(bundleRoot).map((file) => toPosix(relative(bundleRoot, file))));
  for (const path of present) {
    if (!path.endsWith('.md')) continue;
    const source = readFileSync(join(bundleRoot, path), 'utf8');
    for (const target of relativeLinks(source)) {
      const resolved = toPosix(normalize(join(dirname(path), target)));
      if (resolved.startsWith('../') || !present.has(resolved)) {
        problems.push(`${path} links to ${target}, which is not in the bundle`);
      }
    }
    if (path.startsWith('education/')) {
      for (const name of skillMentions(source)) {
        if (![...present].some((file) => file.startsWith(`skills/${name}/`))) {
          problems.push(`${path} names skills/${name}/, which is not in the bundle`);
        }
      }
    }
  }
  return problems;
}

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

function latestEducationVersion(root) {
  const changelog = readFileSync(join(root, 'education', 'CHANGELOG.md'), 'utf8');
  const released = /^## \[(\d+\.\d+\.\d+)\]/m.exec(changelog);
  const unreleased = /^## \[Unreleased\]\s*\n([\s\S]*?)(?=^## \[)/m.exec(changelog);
  return {
    educationVersion: released ? released[1] : null,
    educationHasUnreleasedChanges: Boolean(unreleased && unreleased[1].trim()),
  };
}

function sourceCommit(root, override) {
  if (override) return { commit: override, dirty: null };
  try {
    const run = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return { commit: run(['rev-parse', 'HEAD']), dirty: run(['status', '--porcelain']) !== '' };
  } catch {
    return { commit: null, dirty: null };
  }
}

export function buildManifest(root, files, skills, options = {}) {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const licenseFile = [...files].find((path) => /^licen[cs]e(\.|$)/i.test(path));
  const licenseText = licenseFile ? readFileSync(join(root, licenseFile), 'utf8') : '';
  return {
    schemaVersion: 1,
    skillsetVersion: pkg.version,
    ...latestEducationVersion(root),
    license: { file: licenseFile ?? null, firstLine: licenseText.split(/\r?\n/).find((line) => line.trim()) ?? null },
    source: sourceCommit(root, options.commit),
    referencedSkills: skills,
    files: [...files].sort().map((path) => ({ path, sha256: sha256(readFileSync(join(root, path))) })),
  };
}

async function removePreviousBundle(out) {
  const previous = JSON.parse(await readFile(join(out, MANIFEST), 'utf8'));
  for (const entry of previous.files ?? []) {
    const target = resolve(out, entry.path);
    // Never delete outside the output folder because of a tampered manifest.
    if (target !== out && target.startsWith(out + sep)) await rm(target, { force: true });
  }
}

export async function packageEducation({ root, out, commit, dryRun = false }) {
  const { files, skills, problems } = collectDependencies(root);
  if (problems.length > 0) return { problems, files, skills, wrote: false };
  const target = resolve(out);
  if (resolve(root) === target || target.startsWith(resolve(root) + sep + 'education')) {
    return { problems: ['the output folder must be outside the repository content being bundled'], files, skills, wrote: false };
  }
  const manifest = buildManifest(root, files, skills, { commit });
  if (dryRun) return { problems: [], files, skills, manifest, wrote: false };

  if (existsSync(target) && readdirSync(target).length > 0) {
    if (!existsSync(join(target, MANIFEST))) {
      return { problems: [`${target} is not empty and has no ${MANIFEST}, so it was not written to`], files, skills, wrote: false };
    }
    await removePreviousBundle(target);
  }
  for (const path of files) {
    await mkdir(dirname(join(target, path)), { recursive: true });
    await writeFile(join(target, path), readFileSync(join(root, path)));
  }
  await writeFile(join(target, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  const afterProblems = checkBundle(target);
  return { problems: afterProblems, files, skills, manifest, wrote: true };
}

function parseArguments(argv) {
  const options = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') options.out = argv[++i];
    else if (argv[i] === '--commit') options.commit = argv[++i];
    else if (argv[i] === '--dry-run') options.dryRun = true;
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.out) throw new Error('usage: node scripts/package-education.mjs --out <folder> [--commit <sha>] [--dry-run]');
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await packageEducation({ root, ...options });
  if (result.problems.length > 0) {
    for (const problem of result.problems) console.error(`error: ${problem}`);
    process.exit(1);
  }
  const verb = result.wrote ? 'wrote' : 'would write';
  console.log(`${verb} ${result.files.size + (result.wrote ? 1 : 0)} files (${result.skills.length} skills: ${result.skills.join(', ')})`);
  if (options.dryRun) for (const path of [...result.files].sort()) console.log(`  ${path}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
