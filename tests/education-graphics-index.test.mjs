import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import test from 'node:test';

import { JSDOM } from 'jsdom';

import { currentGlance, moduleLabel, renderGlance } from '../scripts/education-glance.mjs';
import { embeddedGraphics } from './helpers/graphics.mjs';
import { repoRoot } from './helpers/markdown.mjs';

// The graphics index (education/graphics/index.json) is where each graphic's
// takeaway sentence and optional "do not skip" rule live, and the at-a-glance page
// is generated from it. These checks keep the index, the SVG files, the pages that
// embed them and the generated page in agreement (#283).
const EDUCATION = join(repoRoot, 'education');

export function svgInfo(svgText) {
  const document = new JSDOM(svgText, { contentType: 'image/svg+xml' }).window.document;
  return {
    title: document.querySelector('title')?.textContent.trim() ?? '',
    desc: document.querySelector('desc')?.textContent.trim() ?? '',
    banner: [...document.querySelectorAll('text.bn')].map((node) => node.textContent.trim()).join(' '),
  };
}

// files: names in graphics/; svgs: file -> svgInfo; embeds: page -> embedded graphics.
export function indexProblems({ index, files, svgs, embeds }) {
  const problems = [];
  const indexed = new Set();
  for (const entry of index) {
    indexed.add(entry.file);
    const where = `index entry ${entry.file}`;
    if (!files.includes(entry.file)) {
      problems.push(`${where} has no file in graphics/`);
      continue;
    }
    if (!(entry.page in embeds)) problems.push(`${where} names page ${entry.page}, which does not exist`);
    for (const field of ['title', 'takeaway', 'alt']) {
      if (!entry[field]?.trim()) problems.push(`${where} has no ${field}`);
    }
    const svg = svgs[entry.file];
    if (svg.title !== entry.title) problems.push(`${where}: title differs from the SVG <title>`);
    if (svg.desc !== entry.alt) problems.push(`${where}: alt differs from the SVG <desc>`);
    if (svg.banner !== entry.takeaway) problems.push(`${where}: takeaway differs from the SVG banner sentence`);
    const embed = (embeds[entry.page] ?? []).find((item) => basename(item.path) === entry.file);
    if (!embed) problems.push(`${where} is not embedded in ${entry.page}`);
    else if (embed.alt !== entry.alt) problems.push(`${where}: the alt text on ${entry.page} differs from the index`);
  }
  for (const file of files) {
    if (!indexed.has(file)) problems.push(`graphics/${file} has no index entry`);
  }
  return problems;
}

const GOOD_SVG = { title: 'T', desc: 'D', banner: 'Key.' };
const GOOD_INDEX = [{ file: 'a.svg', page: 'p/a.md', title: 'T', takeaway: 'Key.', alt: 'D' }];
const GOOD = {
  index: GOOD_INDEX,
  files: ['a.svg'],
  svgs: { 'a.svg': GOOD_SVG },
  embeds: { 'p/a.md': [{ alt: 'D', path: '../graphics/a.svg' }] },
};

test('indexProblems accepts a consistent index and rejects seeded disagreements (#283)', () => {
  assert.deepEqual(indexProblems(GOOD), []);
  assert.match(indexProblems({ ...GOOD, files: ['a.svg', 'b.svg'], svgs: { ...GOOD.svgs, 'b.svg': GOOD_SVG } })[0], /b\.svg has no index entry/);
  assert.match(indexProblems({ ...GOOD, files: [] })[0], /has no file in graphics/);
  assert.match(indexProblems({ ...GOOD, svgs: { 'a.svg': { ...GOOD_SVG, title: 'X' } } })[0], /title differs/);
  assert.match(indexProblems({ ...GOOD, svgs: { 'a.svg': { ...GOOD_SVG, desc: 'X' } } })[0], /alt differs from the SVG/);
  assert.match(indexProblems({ ...GOOD, svgs: { 'a.svg': { ...GOOD_SVG, banner: 'X' } } })[0], /takeaway differs/);
  assert.match(indexProblems({ ...GOOD, embeds: { 'p/a.md': [{ alt: 'X', path: '../graphics/a.svg' }] } })[0], /alt text on p\/a\.md differs/);
  assert.match(indexProblems({ ...GOOD, embeds: { 'p/a.md': [] } })[0], /is not embedded/);
  assert.match(indexProblems({ ...GOOD, embeds: {} })[0], /does not exist/);
  assert.match(indexProblems({ ...GOOD, index: [{ ...GOOD_INDEX[0], takeaway: ' ' }] })[0], /has no takeaway/);
});

test('renderGlance groups by tier and shows the rule only where an entry has one (#283)', () => {
  const index = [
    { file: 'a.svg', page: '1_beginners/module-1-1-x.md', title: 'First', takeaway: 'One.', alt: 'Alt one.' },
    { file: 'b.svg', page: '2_intermediate/module-2-1-y.md', title: 'Second', takeaway: 'Two.', alt: 'Alt two.', rule: 'Do the thing.' },
  ];
  const page = renderGlance(index, (path) => `Heading of ${path}`);
  assert.match(page, /## Beginners[\s\S]*### Module 1\.1: First[\s\S]*## Intermediate[\s\S]*### Module 2\.1: Second/);
  assert.equal([...page.matchAll(/\*\*Do not skip:\*\*/g)].length, 1);
  assert.match(page, /\*\*Do not skip:\*\* Do the thing\./);
  assert.match(page, /module text is the source of truth/);
  assert.equal(moduleLabel('0_prerequisites/module-0-4-coming-from-gitlab.md'), 'Module 0.4');
});

test('the graphics index agrees with the SVG files and the pages that embed them (#283)', async () => {
  const index = JSON.parse(await readFile(join(EDUCATION, 'graphics', 'index.json'), 'utf8'));
  const files = (await readdir(join(EDUCATION, 'graphics'))).filter((file) => file.endsWith('.svg'));
  const svgs = {};
  for (const file of files) svgs[file] = svgInfo(await readFile(join(EDUCATION, 'graphics', file), 'utf8'));
  const embeds = {};
  for (const folder of (await readdir(EDUCATION, { withFileTypes: true })).filter((e) => e.isDirectory() && /^\d+_/.test(e.name))) {
    for (const file of await readdir(join(EDUCATION, folder.name))) {
      if (file.endsWith('.md')) embeds[`${folder.name}/${file}`] = embeddedGraphics(await readFile(join(EDUCATION, folder.name, file), 'utf8'));
    }
  }
  assert.deepEqual(indexProblems({ index, files, svgs, embeds }), []);
});

test('education/at-a-glance.md is up to date with the index (run `npm run glance`) (#283)', async () => {
  const committed = (await readFile(join(EDUCATION, 'at-a-glance.md'), 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(committed, currentGlance());
});

test('the education README links to the at-a-glance page (#283)', async () => {
  const readme = await readFile(join(EDUCATION, 'README.md'), 'utf8');
  assert.match(readme, /\(at-a-glance\.md\)/);
});
