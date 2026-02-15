'use strict';

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

function parse(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);

  const title = (data.title || '').replace(/^\[.*?\]\s*/, '');
  const ref = data.ref || path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const slug = path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const categories = data.categories || [];
  const tags = data.tags || [];
  const lang = data.lang || null;
  const depth = data.depth || [];
  const excerpt = data.excerpt || '';

  return { title, ref, slug, categories, tags, lang, depth, excerpt };
}

module.exports = { parse };
