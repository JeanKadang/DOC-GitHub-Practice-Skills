// Runs the test files under tests/ with the Node test runner, split by whether
// they exercise the PowerShell installer. The installer suite takes about two
// minutes and needs a real filesystem per operating system, so CI runs it once
// per OS and runs everything else once per Node version (#130).
//
//   node scripts/run-tests.mjs --skip-installer
//   node scripts/run-tests.mjs --only-installer
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTALLER_TEST = 'install-skills.test.mjs';

export function selectTestFiles(files, mode) {
  const tests = files.filter((file) => file.endsWith('.test.mjs')).sort();
  if (mode === '--only-installer') return tests.filter((file) => file === INSTALLER_TEST);
  if (mode === '--skip-installer') return tests.filter((file) => file !== INSTALLER_TEST);
  throw new Error('Pass --only-installer or --skip-installer.');
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const testsDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests');
  const files = selectTestFiles(readdirSync(testsDirectory), process.argv[2]).map((file) =>
    join('tests', file),
  );
  if (files.length === 0) {
    console.error('No test files selected.');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
