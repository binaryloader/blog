const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.resolve(__dirname, '../../_posts');
const LANGS = ['ko', 'en', 'ja'];

function findMarkdownFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function detectLang(filePath) {
  const rel = path.relative(POSTS_DIR, filePath);
  const first = rel.split(path.sep)[0];
  return LANGS.includes(first) ? first : 'ko';
}

function extractRef(content, filePath) {
  const parsed = matter(content);
  if (parsed.data.ref) {
    return parsed.data.ref;
  }
  const basename = path.basename(filePath, '.md');
  return basename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function updateHeaderBlock(content, ref, lang) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return null;
  }

  const frontMatter = fmMatch[1];
  const headerRegex = /^header:\n([ \t]+\S.*\n)*/m;
  const headerMatch = frontMatter.match(headerRegex);

  if (!headerMatch) {
    return null;
  }

  const newHeader =
    `header:\n` +
    `  overlay_image: "/assets/image/thumbnail/header/${ref}.png"\n` +
    `  overlay_filter: "0"\n` +
    `  teaser: "/assets/image/thumbnail/teaser/${lang}/${ref}.png"\n`;

  const updatedFrontMatter = frontMatter.replace(headerRegex, newHeader);
  const updatedContent = content.replace(
    /^---\n[\s\S]*?\n---/,
    `---\n${updatedFrontMatter}\n---`
  );

  return updatedContent;
}

function main() {
  const files = findMarkdownFiles(POSTS_DIR);
  let modified = 0;
  let skipped = 0;
  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ref = extractRef(content, filePath);
    const lang = detectLang(filePath);

    const updated = updateHeaderBlock(content, ref, lang);

    if (updated === null) {
      skipped++;
      errors.push(`SKIP (no header block): ${path.relative(POSTS_DIR, filePath)}`);
      continue;
    }

    if (updated === content) {
      skipped++;
      continue;
    }

    fs.writeFileSync(filePath, updated, 'utf-8');
    modified++;
  }

  console.log(`\nTotal files scanned: ${files.length}`);
  console.log(`Modified: ${modified}`);
  console.log(`Skipped: ${skipped}`);

  if (errors.length > 0) {
    console.log(`\nErrors/Warnings:`);
    errors.forEach((e) => console.log(`  ${e}`));
  }
}

main();
