'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('./lib/parser');
const { buildHtml, buildHeaderHtml, buildTeaserHtml } = require('./lib/template');
const { buildCaption } = require('./lib/caption');
const { capture, close } = require('./lib/renderer');

const ROOT = path.resolve(__dirname, '../..');
const OUT_BASE = path.join(ROOT, 'assets/image/thumbnail');
const LANGS = ['ko', 'en', 'ja'];

function ensureDirs() {
  fs.mkdirSync(path.join(OUT_BASE, 'header'), { recursive: true });
  for (const lang of LANGS) {
    fs.mkdirSync(path.join(OUT_BASE, 'instagram', lang), { recursive: true });
    fs.mkdirSync(path.join(OUT_BASE, 'teaser', lang), { recursive: true });
    fs.mkdirSync(path.join(OUT_BASE, 'caption', lang), { recursive: true });
  }
}

function findPosts(lang) {
  const dir = path.join(ROOT, '_posts', lang);
  if (!fs.existsSync(dir)) return [];
  return fs.globSync('**/*.md', { cwd: dir }).map(f => path.join(dir, f));
}

function detectLang(filePath) {
  const rel = path.relative(path.join(ROOT, '_posts'), filePath);
  const first = rel.split(path.sep)[0];
  return LANGS.includes(first) ? first : 'ko';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { files: [], all: false, lang: null, force: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      opts.all = true;
    } else if (args[i] === '--lang' && args[i + 1]) {
      opts.lang = args[++i];
    } else if (args[i] === '--force') {
      opts.force = true;
    } else if (!args[i].startsWith('-')) {
      opts.files.push(path.resolve(args[i]));
    }
  }
  return opts;
}

async function generateOne(filePath, force) {
  const data = parse(filePath);
  const lang = detectLang(filePath);

  const instaPath = path.join(OUT_BASE, 'instagram', lang, `${data.ref}.png`);
  const teaserPath = path.join(OUT_BASE, 'teaser', lang, `${data.ref}.png`);
  const headerPath = path.join(OUT_BASE, 'header', `${data.ref}.png`);

  const needInsta = force || !fs.existsSync(instaPath);
  const needTeaser = force || !fs.existsSync(teaserPath);
  const needHeader = force || !fs.existsSync(headerPath);

  if (!needInsta && !needTeaser && !needHeader) {
    return { ref: data.ref, lang, skipped: true };
  }

  if (needInsta) {
    const instaHtml = buildHtml(data);
    await capture(instaHtml, instaPath);
  }

  if (needTeaser) {
    const teaserHtml = buildTeaserHtml(data);
    await capture(teaserHtml, teaserPath, { width: 600, height: 600 });
  }

  // Header is language-independent (pattern only), generate once
  if (needHeader) {
    const headerHtml = buildHeaderHtml(data);
    await capture(headerHtml, headerPath, { width: 1920, height: 640 });
  }

  const captionPath = path.join(OUT_BASE, 'caption', lang, `${data.ref}.txt`);
  fs.writeFileSync(captionPath, buildCaption(data), 'utf-8');

  return { ref: data.ref, lang, skipped: false };
}

async function main() {
  const opts = parseArgs();
  ensureDirs();

  let files = opts.files;
  if (opts.all) {
    const langs = opts.lang ? [opts.lang] : LANGS;
    files = langs.flatMap(l => findPosts(l));
  }

  if (files.length === 0) {
    console.log('No files to process. Use --all or pass file paths.');
    process.exit(1);
  }

  console.log(`Processing ${files.length} file(s)...\n`);
  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await generateOne(file, opts.force);
      if (result.skipped) {
        skipped++;
        process.stdout.write(`  [${i + 1}/${files.length}] skip  ${result.lang}/${result.ref}\n`);
      } else {
        generated++;
        process.stdout.write(`  [${i + 1}/${files.length}] done  ${result.lang}/${result.ref}\n`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${files.length}] FAIL  ${path.relative(ROOT, file)}: ${err.message}`);
    }
  }

  await close();
  console.log(`\nDone — ${generated} generated, ${skipped} skipped.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
