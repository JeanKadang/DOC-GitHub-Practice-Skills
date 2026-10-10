// Mock `git` front: runs the real git and, in its output, shows the GitHub URL
// the scenario pretends to have instead of the local bare repository that
// actually receives pushes. Nothing is sent to GitHub.
import { spawnSync } from 'node:child_process';

const real = process.env.GH_MOCK_GIT;
const url = process.env.GH_MOCK_REMOTE_URL;
const paths = (process.env.GH_MOCK_REMOTE_PATH ?? '').split('|').filter(Boolean);

const result = spawnSync(real, process.argv.slice(2), {
  stdio: ['inherit', 'pipe', 'pipe'],
  maxBuffer: 1 << 28,
});

const show = (buffer) => {
  let text = buffer.toString('utf8');
  if (url) for (const path of paths) text = text.split(path).join(url);
  return text;
};

process.stdout.write(show(result.stdout));
process.stderr.write(show(result.stderr));
process.exit(result.status ?? 1);
