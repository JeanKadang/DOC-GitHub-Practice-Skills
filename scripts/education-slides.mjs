// Writes deck.json for a slide deck, one slide per explainer graphic, from
// education/graphics/index.json (#285). The deck itself is built from this file
// and the light PNGs that `npm run export:graphics` writes, so an edited takeaway
// or a replaced graphic flows through without editing slides by hand.
//
//   npm run slides:data -- --out .export/education-deck
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TIERS, entryLabels, readIndex, readPageHeading, tierOf } from './education-glance.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function slidesFromIndex(index, readHeading) {
  const labels = entryLabels(index);
  return index.map((entry, position) => ({
    number: position + 1,
    tier: tierOf(entry.page),
    tierName: TIERS[tierOf(entry.page)],
    label: labels[position],
    title: entry.title,
    takeaway: entry.takeaway,
    rule: entry.rule ?? null,
    image: `${entry.file.replace(/\.svg$/, '')}-light.png`,
    alt: entry.alt,
    module: entry.page,
    moduleHeading: readHeading(entry.page),
  }));
}

export function deckData(index, readHeading) {
  return {
    title: 'Colleague GitHub and AI tooling curriculum, at a glance',
    note: 'One slide per explainer graphic. The module text is the source of truth.',
    slides: slidesFromIndex(index, readHeading),
  };
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? join(ROOT, '.export', 'education-deck') : resolve(process.argv[outIndex + 1]);
  mkdirSync(out, { recursive: true });
  const data = deckData(readIndex(), readPageHeading);
  writeFileSync(join(out, 'deck.json'), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${data.slides.length} slides to ${join(out, 'deck.json')}`);
}
