import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import { embeddedGraphics } from './helpers/graphics.mjs';
import { repoRoot } from './helpers/markdown.mjs';

// Every education page opens with an explainer graphic: a standalone SVG in
// education/graphics/ that summarises one idea. The graphic never replaces the
// page text, so what these checks guard is the wiring and the safety of the
// files: a page without a graphic, an embed that points nowhere, an SVG with no
// accessible name, and an SVG that could run code or load something from
// elsewhere (#270).
const EDUCATION = join(repoRoot, 'education');
// Lesson pages only: the numbered modules. The next-step plan (module-plan.md)
// is a plan, not a lesson.
const PAGE_FILE = /^module-\d+-\d+-.+\.md$/;
const NUMBERED_FOLDER = /^\d+_/;

export function graphicProblems(svgText) {
  const problems = [];
  let document;
  try {
    document = new JSDOM(svgText, { contentType: 'image/svg+xml' }).window.document;
  } catch (error) {
    return [`is not well-formed XML: ${error.message.split('\n')[0]}`];
  }
  const root = document.documentElement;
  if (root.localName !== 'svg') problems.push('root element is not <svg>');
  if (!root.getAttribute('viewBox')) problems.push('has no viewBox');
  if (!document.querySelector('title')?.textContent.trim()) problems.push('has no <title>');
  if (!document.querySelector('desc')?.textContent.trim()) problems.push('has no <desc>');
  if (document.querySelector('script, foreignObject, image, use, a')) {
    problems.push('contains script, foreignObject, image, use, or a link element');
  }
  if (/\bon[a-z]+\s*=/i.test(svgText)) problems.push('contains an event-handler attribute');
  if (/(?:href|src)\s*=|@import|url\(\s*["']?(?!#)/i.test(svgText)) {
    problems.push('references something outside the file');
  }
  return problems;
}

async function pages() {
  const found = [];
  for (const folder of await readdir(EDUCATION, { withFileTypes: true })) {
    if (!folder.isDirectory() || !NUMBERED_FOLDER.test(folder.name)) continue;
    for (const file of await readdir(join(EDUCATION, folder.name))) {
      if (PAGE_FILE.test(file)) found.push({ folder: folder.name, file });
    }
  }
  return found;
}

test('graphicProblems accepts a good graphic and rejects seeded problems (#270)', () => {
  const good =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>T</title><desc>D</desc><rect width="1" height="1"/></svg>';
  assert.deepEqual(graphicProblems(good), []);
  assert.match(graphicProblems(good.replace('<title>T</title>', ''))[0], /no <title>/);
  assert.match(graphicProblems(good.replace('<desc>D</desc>', ''))[0], /no <desc>/);
  assert.match(graphicProblems(good.replace('viewBox="0 0 10 10"', ''))[0], /no viewBox/);
  assert.ok(graphicProblems(good.replace('<rect', '<script>x()</script><rect')).length > 0);
  assert.ok(graphicProblems(good.replace('<rect', '<rect onclick="x()"')).length > 0);
  assert.ok(graphicProblems(good.replace('<rect', '<image href="https://example.test/a.png"/><rect')).length > 0);
  assert.ok(graphicProblems(good.replace('<rect', '<style>@import "x.css";</style><rect')).length > 0);
  assert.match(graphicProblems('<svg><title>')[0], /not well-formed/);
});

test('embeddedGraphics finds embeds and their alt text (#270)', () => {
  const page = '# T\n\n![A drawing of a box.](../graphics/a.svg)\n\n## H\n![](../graphics/b.svg)\n';
  assert.deepEqual(embeddedGraphics(page), [
    { alt: 'A drawing of a box.', path: '../graphics/a.svg' },
    { alt: '', path: '../graphics/b.svg' },
  ]);
  assert.deepEqual(embeddedGraphics('# No graphic\n'), []);
});

test('every education page embeds at least one graphic with alt text (#270)', async () => {
  const problems = [];
  for (const { folder, file } of await pages()) {
    const embeds = embeddedGraphics(await readFile(join(EDUCATION, folder, file), 'utf8'));
    const stem = file.replace(/\.md$/, '');
    if (embeds.length === 0) problems.push(`${folder}/${file} embeds no graphic`);
    for (const embed of embeds) {
      if (!embed.alt) problems.push(`${folder}/${file}: ${embed.path} has no alt text`);
      if (!basename(embed.path).startsWith(stem)) {
        problems.push(`${folder}/${file}: ${embed.path} is not named for its page`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('every embedded graphic exists, and every graphic file is embedded somewhere (#270)', async () => {
  const embedded = new Set();
  const problems = [];
  for (const { folder, file } of await pages()) {
    for (const embed of embeddedGraphics(await readFile(join(EDUCATION, folder, file), 'utf8'))) {
      const name = basename(embed.path);
      embedded.add(name);
      try {
        await readFile(join(EDUCATION, 'graphics', name));
      } catch {
        problems.push(`${folder}/${file} embeds ${embed.path}, which does not exist`);
      }
    }
  }
  for (const file of await readdir(join(EDUCATION, 'graphics'))) {
    if (file.endsWith('.svg') && !embedded.has(file)) problems.push(`graphics/${file} is not embedded in any page`);
  }
  assert.deepEqual(problems, []);
});

test('every graphic file is a safe, accessible standalone SVG (#270)', async () => {
  const problems = [];
  for (const file of await readdir(join(EDUCATION, 'graphics'))) {
    if (!file.endsWith('.svg')) continue;
    const text = await readFile(join(EDUCATION, 'graphics', file), 'utf8');
    for (const problem of graphicProblems(text)) problems.push(`graphics/${file} ${problem}`);
  }
  assert.deepEqual(problems, []);
});

test('the education README lists every graphic (#270)', async () => {
  const readme = await readFile(join(EDUCATION, 'README.md'), 'utf8');
  const missing = (await readdir(join(EDUCATION, 'graphics')))
    .filter((file) => file.endsWith('.svg') && !readme.includes(`(graphics/${file})`));
  assert.deepEqual(missing, []);
});
