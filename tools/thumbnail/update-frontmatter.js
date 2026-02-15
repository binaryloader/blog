const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.resolve(__dirname, '../../_posts');

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

function extractRef(content, filePath) {
  const parsed = matter(content);
  if (parsed.data.ref) {
    return parsed.data.ref;
  }
  // Fallback: strip date prefix from filename
  const basename = path.basename(filePath, '.md');
  return basename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function updateHeaderBlock(content, ref) {
  // Extract front matter section (between --- delimiters)
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return null;
  }

  const frontMatter = fmMatch[1];

  // Match the entire header block: "header:" line and all indented lines below it
  const headerRegex = /^header:\n([ \t]+\S.*\n)*/m;
  const headerMatch = frontMatter.match(headerRegex);

  if (!headerMatch) {
    return null;
  }

  const newHeader =
    `header:\n` +
    `  overlay_image: "/assets/image/thumbnail/header/${ref}.png"\n` +
    `  overlay_filter: "0.1"\n` +
    `  teaser: "/assets/image/thumbnail/teaser/${ref}.png"\n`;

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

    const updated = updateHeaderBlock(content, ref);

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
