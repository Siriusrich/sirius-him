#!/usr/bin/env node
/**
 * build-content.mjs
 * Reads the editable JSON files in /content and generates the static HTML
 * pages in /src, plus robots.txt and sitemap.xml.
 *
 *   node scripts/build-content.mjs        -> production pages
 *   node scripts/build-content.mjs --dev  -> adds a small editor notice bar
 *
 * Content layout (all editable in the /admin dashboard or by hand):
 *   content/site.json         artist name, tagline, bio, contact, socials
 *   content/about.json        About page story, quote, facts, portrait
 *   content/releases/*.json   one file per release (sorted by "order")
 *   content/videos.json       YouTube videos and shorts
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPages, renderRobots, renderSitemap } from './templates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isDev = process.argv.includes('--dev');

const readJson = async (relativePath) => {
  const raw = await readFile(join(ROOT, relativePath), 'utf8');
  return JSON.parse(raw);
};

const [siteDoc, about, videosDoc] = await Promise.all([
  readJson('content/site.json'),
  readJson('content/about.json'),
  readJson('content/videos.json'),
]);

// One file per release in content/releases/, sorted by "order" then filename.
const releaseFiles = (await readdir(join(ROOT, 'content/releases')))
  .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
  .sort();
const releaseDocs = await Promise.all(releaseFiles.map((file) => readJson(join('content/releases', file))));
const releases = releaseDocs
  .map((release, i) => ({ order: i + 1, ...release }))
  .sort((a, b) => a.order - b.order);

const site = { ...siteDoc };
const videos = (videosDoc.videos ?? []).filter((v) => v && !String(v.title ?? '').startsWith('_'));
const shorts = (videosDoc.shorts ?? []).filter((v) => v && !String(v.title ?? '').startsWith('_'));

const pages = renderPages({ site, about, releases, videos, shorts, isDev });

await mkdir(join(ROOT, 'src'), { recursive: true });
await mkdir(join(ROOT, 'src/public'), { recursive: true });

await Promise.all([
  ...Object.entries(pages).map(([file, html]) => writeFile(join(ROOT, 'src', file), html, 'utf8')),
  writeFile(join(ROOT, 'src/public/robots.txt'), renderRobots(site), 'utf8'),
  writeFile(join(ROOT, 'src/public/sitemap.xml'), renderSitemap(site), 'utf8'),
]);

const drafts = releases.filter((r) => r.placeholder).length;
console.log(
  `Content built: ${Object.keys(pages).length} pages, ${releases.length} release(s) (${drafts} draft), ` +
    `${videos.length} video(s), ${shorts.length} short(s)${isDev ? ' [dev notices on]' : ''}`,
);
