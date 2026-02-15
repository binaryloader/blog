'use strict';

const BASE_URL = 'https://blog.binaryloader.io';

function buildUrl({ slug, categories, lang }) {
  const langPrefix = lang || 'ko';
  const catPath = categories.map(c => c.toLowerCase()).join('/');
  return `${BASE_URL}/${langPrefix}/${catPath}/${slug}`;
}

function buildCaption({ title, excerpt, slug, categories, tags, lang }) {
  const url = buildUrl({ slug, categories, lang });
  const hashtags = tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ');

  const lines = [title, '', excerpt, '', url, '', hashtags];
  return lines.join('\n');
}

module.exports = { buildCaption };
