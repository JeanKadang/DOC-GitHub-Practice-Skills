// Mock `gh`: logs every call, answers from mock/<scenario>.json, never contacts GitHub.
// Scenario file: { "rules": [ { "match": "regex over the joined args", "out": "text", "code": 0 } ], "default": "..." }
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const line = args.join(' ');
const log = process.env.GH_MOCK_LOG;
if (log) appendFileSync(log, `gh ${line}\n`);

const dir = process.env.GH_MOCK_DIR;
const scenario = process.env.GH_MOCK_SCENARIO;
let spec = { rules: [], default: '' };
const file = scenario && dir ? join(dir, `${scenario}.json`) : null;
if (file && existsSync(file)) spec = JSON.parse(readFileSync(file, 'utf8'));

for (const rule of spec.rules ?? []) {
  if (new RegExp(rule.match, 'i').test(line)) {
    if (rule.out) process.stdout.write(rule.out.endsWith('\n') ? rule.out : rule.out + '\n');
    process.exit(rule.code ?? 0);
  }
}
if (spec.default) process.stdout.write(spec.default + '\n');
else process.stderr.write(`mock gh: no canned answer for "gh ${line}"\n`);
process.exit(spec.default ? 0 : 1);
