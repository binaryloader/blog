'use strict';

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

// Headings to exclude from key points
const SKIP_HEADINGS = new Set([
  '개요', '정리', '참고', '후기',
  'Overview', 'Steps', 'Summary', 'References',
  '概要', '手順', 'まとめ', '参考',
]);

const MAX_POINTS = 5;

function extractKeyPoints(content) {
  const lines = content.split('\n');

  // Try H2 headings first (structured guides)
  let points = lines
    .filter(l => /^## /.test(l))
    .map(l => l.replace(/^## /, '').replace(/^\d+\.\s*/, '').trim())
    .filter(h => !SKIP_HEADINGS.has(h));

  // Fall back to H1 headings (essay-style posts)
  if (points.length < 2) {
    points = lines
      .filter(l => /^# /.test(l))
      .map(l => l.replace(/^# /, '').replace(/^\d+\.\s*/, '').trim())
      .filter(h => !SKIP_HEADINGS.has(h));
  }

  return points.slice(0, MAX_POINTS);
}

function parse(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const title = (data.title || '').replace(/^\[.*?\]\s*/, '');
  const ref = data.ref || path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const slug = path.basename(filePath, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const categories = data.categories || [];
  const tags = data.tags || [];
  const lang = data.lang || null;
  const depth = data.depth || [];
  const excerpt = data.excerpt || '';
  const keyPoints = extractKeyPoints(content);

  return { title, ref, slug, categories, tags, lang, depth, excerpt, keyPoints };
}

module.exports = { parse };
