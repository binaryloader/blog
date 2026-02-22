'use strict';

const CATEGORY_THEME_MAP = [
  { categories: ['Apple', 'iOS', 'macOS', 'Xcode', 'CocoaPods'], parent: 'Development', theme: 'circuit' },
  { categories: ['Jekyll', 'Blog'], theme: 'hexagon' },
  { categories: ['CI/CD', 'Software Engineering'], theme: 'pipeline' },
  { categories: ['Objective-C', 'Python', 'Ruby', 'Java'], theme: 'code-flow' },
  { categories: ['Git', 'SCM'], theme: 'branch-tree' },
  { categories: ['Server', 'Spring'], theme: 'network' },
  { categories: ['Mathematics'], theme: 'geometry' },
  { categories: ['macOS'], parent: 'PC', theme: 'dots' },
  { categories: ['SmartHome', 'Router'], theme: 'connected' },
  { categories: ['Synology'], theme: 'blocks' },
  { categories: ['AI', 'LLM'], parent: 'Development', theme: 'network' },
  { categories: ['Writing', 'Column'], theme: 'waves' },
];

function resolveTheme(postCategories) {
  const cats = postCategories.map(c => c.toLowerCase());

  for (const rule of CATEGORY_THEME_MAP) {
    if (rule.parent) {
      const parentMatch = cats.includes(rule.parent.toLowerCase());
      const catMatch = rule.categories.some(c => cats.includes(c.toLowerCase()));
      if (parentMatch && catMatch) return rule.theme;
    }
  }

  for (const rule of CATEGORY_THEME_MAP) {
    if (rule.parent) continue;
    if (rule.categories.some(c => cats.includes(c.toLowerCase()))) return rule.theme;
  }

  return 'default';
}

module.exports = { resolveTheme };
