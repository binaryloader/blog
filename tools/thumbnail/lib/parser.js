'use strict';

const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

// Headings to exclude from key points
const SKIP_HEADINGS = new Set([
  '개요', '정리', '참고', '후기', '마치며',
  'Overview', 'Steps', 'Summary', 'References', 'Conclusion',
  '概要', '手順', 'まとめ', '参考', 'おわりに',
]);

const MAX_POINTS = 5;
const SHORT_HEADING = 5;
const MAX_POINT_LEN = 45;

function isContentLine(line) {
  if (!line) return false;
  const prefixes = ['```', '![', '<', '#', '- ', '{%', '|', '> '];
  return !prefixes.some(p => line.startsWith(p));
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

function truncate(text, max) {
  const clean = stripMarkdown(text);
  if (clean.length <= max) return clean;
  // Cut at last space before limit
  const cut = clean.lastIndexOf(' ', max);
  return clean.slice(0, cut > 0 ? cut : max) + '…';
}

function extractSections(lines, pattern) {
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (pattern.test(line)) {
      const heading = line.replace(pattern, '').replace(/^\d+\.\s*/, '').trim();
      current = { heading, firstLine: null };
      sections.push(current);
      continue;
    }

    if (current && !current.firstLine) {
      const t = line.trim();
      if (isContentLine(t)) {
        current.firstLine = t;
      }
    }
  }

  return sections;
}

function extractKeyPoints(content) {
  const lines = content.split('\n');

  // Try H2 sections first (structured guides)
  let sections = extractSections(lines, /^## /);

  // Fall back to H1 sections (essay-style posts)
  if (sections.length < 2) {
    sections = extractSections(lines, /^# /);
  }

  return sections
    .filter(s => !SKIP_HEADINGS.has(s.heading))
    .slice(0, MAX_POINTS)
    .map(s => {
      // Short/generic headings → replace with first sentence
      if (s.heading.length < SHORT_HEADING && s.firstLine) {
        return truncate(s.firstLine, MAX_POINT_LEN);
      }
      return s.heading;
    });
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
