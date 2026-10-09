// Exports every explainer graphic in education/graphics/index.json to PNG, for
// chat, email and slides, where SVG is awkward (#285).
//
//   npm run export:graphics -- --out .export/education-graphics
//   npm run export:graphics -- --theme light --scale 2 --chrome /path/to/chrome
//
// Needs a Chrome or Chromium on this machine: pass --chrome or set CHROME_PATH.
// It uses playwright-core (a dev dependency that downloads no browser) only to
// drive that browser, because the graphics follow the light or dark theme through
// prefers-color-scheme, which a headless browser can emulate and a plain
// converter cannot. Output is one PNG per graphic per theme, named
// <graphic>-light.png and <graphic>-dark.png.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { readIndex } from './education-glance.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const THEMES = ['light', 'dark'];

export function parseArgs(argv) {
  const options = { out: join(ROOT, '.export', 'education-graphics'), themes: THEMES, scale: 2, chrome: process.env.CHROME_PATH };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      if (i + 1 >= argv.length) throw new Error(`${arg} needs a value`);
      i += 1;
      return argv[i];
    };
    if (arg === '--out') options.out = resolve(value());
    else if (arg === '--chrome') options.chrome = value();
    else if (arg === '--theme') {
      const theme = value();
      if (theme !== 'both' && !THEMES.includes(theme)) throw new Error('--theme must be light, dark or both');
      options.themes = theme === 'both' ? THEMES : [theme];
    } else if (arg === '--scale') {
      options.scale = Number(value());
      if (!(options.scale >= 1 && options.scale <= 4)) throw new Error('--scale must be a number from 1 to 4');
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

// Size in CSS pixels, from the width and height attributes, else from the viewBox.
export function svgSize(svgText) {
  const root = /<svg\b[^>]*>/.exec(svgText)?.[0] ?? '';
  const attr = (name) => new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`).exec(root)?.[1];
  if (attr('width') && attr('height')) return { width: Math.ceil(Number(attr('width'))), height: Math.ceil(Number(attr('height'))) };
  const box = /viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)"/.exec(root);
  if (!box) throw new Error('SVG has no width and height or viewBox');
  return { width: Math.ceil(Number(box[1])), height: Math.ceil(Number(box[2])) };
}

export function exportJobs(index, themes = THEMES) {
  return index.flatMap((entry) =>
    themes.map((theme) => ({ file: entry.file, theme, name: `${entry.file.replace(/\.svg$/, '')}-${theme}.png` })),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const index = readIndex();
  mkdirSync(options.out, { recursive: true });
  const { chromium } = await import('playwright-core');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: options.chrome || undefined });
  } catch (error) {
    console.error(`Could not start a browser (${error.message.split('\n')[0]}).`);
    console.error('Install Chrome or Chromium, then pass --chrome <path> or set CHROME_PATH.');
    process.exit(1);
  }
  let count = 0;
  try {
    for (const theme of options.themes) {
      for (const entry of index) {
        const path = join(ROOT, 'education', 'graphics', entry.file);
        const size = svgSize(readFileSync(path, 'utf8'));
        const context = await browser.newContext({ colorScheme: theme, deviceScaleFactor: options.scale, viewport: size });
        const page = await context.newPage();
        await page.goto(pathToFileURL(path).href);
        await page.screenshot({ path: join(options.out, `${entry.file.replace(/\.svg$/, '')}-${theme}.png`), omitBackground: true });
        await context.close();
        count += 1;
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`Wrote ${count} PNG files to ${options.out}`);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
