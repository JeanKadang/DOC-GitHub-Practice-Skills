import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { entryLabels, readIndex } from '../scripts/education-glance.mjs';
import { exportJobs, parseArgs, svgSize } from '../scripts/export-graphics.mjs';
import { deckData, slidesFromIndex } from '../scripts/education-slides.mjs';
import { repoRoot } from './helpers/markdown.mjs';

// The PNG export and the slide data both read the graphics index (#285). The
// browser step needs Chrome, so only the pure parts are tested here.

test('parseArgs reads its options and rejects bad ones (#285)', () => {
  assert.deepEqual(parseArgs(['--theme', 'light', '--scale', '1']).themes, ['light']);
  assert.deepEqual(parseArgs(['--theme', 'both']).themes, ['light', 'dark']);
  assert.equal(parseArgs(['--chrome', '/x/chrome']).chrome, '/x/chrome');
  assert.equal(parseArgs([]).scale, 2);
  assert.throws(() => parseArgs(['--theme', 'blue']), /light, dark or both/);
  assert.throws(() => parseArgs(['--scale', '9']), /from 1 to 4/);
  assert.throws(() => parseArgs(['--out']), /needs a value/);
  assert.throws(() => parseArgs(['--nope']), /Unknown argument/);
});

test('svgSize prefers width and height, then the viewBox (#285)', () => {
  assert.deepEqual(svgSize('<svg viewBox="0 0 10 20" width="560" height="414.2">'), { width: 560, height: 415 });
  assert.deepEqual(svgSize('<svg viewBox="0 0 560 300">'), { width: 560, height: 300 });
  assert.throws(() => svgSize('<svg>'), /no width and height or viewBox/);
});

test('exportJobs gives one uniquely named PNG per graphic per theme (#285)', () => {
  const index = [{ file: 'a.svg' }, { file: 'b.svg' }];
  assert.deepEqual(exportJobs(index).map((job) => job.name), ['a-light.png', 'a-dark.png', 'b-light.png', 'b-dark.png']);
  assert.deepEqual(exportJobs(index, ['light']).map((job) => job.name), ['a-light.png', 'b-light.png']);
});

test('every graphic in the real index can be sized for export (#285)', async () => {
  for (const entry of readIndex()) {
    const size = svgSize(await readFile(join(repoRoot, 'education', 'graphics', entry.file), 'utf8'));
    assert.ok(size.width > 0 && size.height > 0, entry.file);
  }
});

test('entryLabels marks a page with several graphics and leaves the others alone (#285)', () => {
  const index = [
    { page: '1_beginners/module-1-2-x.md' },
    { page: '1_beginners/module-1-2-x.md' },
    { page: '2_intermediate/module-2-1-y.md' },
  ];
  assert.deepEqual(entryLabels(index), ['Module 1.2 (part 1 of 2)', 'Module 1.2 (part 2 of 2)', 'Module 2.1']);
});

test('slidesFromIndex gives one numbered slide per graphic, in index order (#285)', () => {
  const index = [
    { file: 'a.svg', page: '0_prerequisites/module-0-1-x.md', title: 'T1', takeaway: 'K1.', alt: 'A1' },
    { file: 'b.svg', page: '2_intermediate/module-2-1-y.md', title: 'T2', takeaway: 'K2.', alt: 'A2', rule: 'Rule.' },
  ];
  const slides = slidesFromIndex(index, (page) => `Heading of ${page}`);
  assert.deepEqual(slides.map((slide) => slide.number), [1, 2]);
  assert.equal(slides[0].tierName, 'Before you start');
  assert.equal(slides[0].rule, null);
  assert.equal(slides[1].rule, 'Rule.');
  assert.equal(slides[1].image, 'b-light.png');
  assert.equal(slides[1].moduleHeading, 'Heading of 2_intermediate/module-2-1-y.md');
  assert.equal(deckData(index, () => 'h').slides.length, 2);
});
