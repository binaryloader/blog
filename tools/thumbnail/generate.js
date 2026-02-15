'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('./lib/parser');
const { buildHtml, buildHeaderHtml, buildTeaserHtml } = require('./lib/template');
const { buildCaption } = require('./lib/caption');
const { capture, close } = require('./lib/renderer');

const ROOT = path.resolve(__dirname, '../..');
const OUT_BASE = path.join(ROOT, 'assets/image/thumbnail');
const DIRS = {
  instagram: path.join(OUT_BASE, 'instagram'),
  header: path.join(OUT_BASE, 'header'),
  teaser: path.join(OUT_BASE, 'teaser'),
  caption: path.join(OUT_BASE, 'caption'),
};

function findPosts(lang) {
  const dir = path.join(ROOT, '_posts', lang);
  if (!fs.existsSync(dir)) return [];
  return fs.globSync('**/*.md', { cwd: dir }).map(f => path.join(dir, f));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { files: [], all: false, lang: 'ko', force: false };

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
  const instaPath = path.join(DIRS.instagram, `${data.ref}.png`);
  const headerPath = path.join(DIRS.header, `${data.ref}.png`);
  const teaserPath = path.join(DIRS.teaser, `${data.ref}.png`);

  if (!force && fs.existsSync(instaPath) && fs.existsSync(headerPath) && fs.existsSync(teaserPath)) {
    return { ref: data.ref, skipped: true };
  }

  const instaHtml = buildHtml(data);
  await capture(instaHtml, instaPath);

  const headerHtml = buildHeaderHtml(data);
  await capture(headerHtml, headerPath, { width: 1920, height: 640 });

  const teaserHtml = buildTeaserHtml(data);
  await capture(teaserHtml, teaserPath, { width: 600, height: 600 });

  const captionPath = path.join(DIRS.caption, `${data.ref}.txt`);
  fs.writeFileSync(captionPath, buildCaption(data), 'utf-8');

  return { ref: data.ref, skipped: false };
}

async function main() {
  const opts = parseArgs();
  Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

  let files = opts.files;
  if (opts.all) {
    files = findPosts(opts.lang);
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
    const rel = path.relative(ROOT, file);
    try {
      const result = await generateOne(file, opts.force);
      if (result.skipped) {
        skipped++;
        process.stdout.write(`  [${i + 1}/${files.length}] skip  ${result.ref}\n`);
      } else {
        generated++;
        process.stdout.write(`  [${i + 1}/${files.length}] done  ${result.ref}\n`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${files.length}] FAIL  ${rel}: ${err.message}`);
    }
  }

  await close();
  console.log(`\nDone — ${generated} generated, ${skipped} skipped.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
