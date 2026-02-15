'use strict';

const { createRng } = require('./hash');
const { resolveTheme } = require('../themes/index');
const { generatePattern } = require('../themes/patterns');

function getTitleSize(title) {
  const len = title.length;
  if (len <= 20) return 52;
  if (len <= 40) return 44;
  if (len <= 60) return 38;
  return 32;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildDecorations(theme, ref) {
  const rng = createRng(ref + ':deco');
  const elems = [];
  const count = 4 + Math.floor(rng() * 4);

  for (let i = 0; i < count; i++) {
    const x = rng() * 1080;
    const y = rng() * 1080;
    const size = 100 + rng() * 220;
    const opacity = 0.04 + rng() * 0.06;
    const rotation = Math.floor(rng() * 360);

    switch (theme) {
      case 'circuit':
        elems.push(`<rect x="${x}" y="${y}" width="${size}" height="${size * 0.6}" rx="8" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="2" transform="rotate(${rotation},${x},${y})"/>`);
        break;
      case 'hexagon': {
        const pts = [];
        for (let a = 0; a < 6; a++) {
          const angle = Math.PI / 3 * a - Math.PI / 6;
          pts.push(`${x + size * 0.5 * Math.cos(angle)},${y + size * 0.5 * Math.sin(angle)}`);
        }
        elems.push(`<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="2"/>`);
        break;
      }
      case 'geometry':
        elems.push(`<circle cx="${x}" cy="${y}" r="${size * 0.4}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
        break;
      default:
        if (rng() > 0.5) {
          elems.push(`<circle cx="${x}" cy="${y}" r="${size * 0.3}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
        } else {
          elems.push(`<rect x="${x}" y="${y}" width="${size * 0.6}" height="${size * 0.6}" rx="8" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5" transform="rotate(${rotation},${x},${y})"/>`);
        }
    }
  }
  return elems.join('\n');
}

function buildBreadcrumb(categories) {
  return categories.map(c => c.toUpperCase()).join(' > ');
}

function buildHtml({ title, ref, categories, tags }) {
  const theme = resolveTheme(categories);
  const patternSvg = generatePattern(theme, ref);
  const decoSvg = buildDecorations(theme, ref);
  const breadcrumb = escapeHtml(buildBreadcrumb(categories));
  const safeTitle = escapeHtml(title);
  const titleSize = getTitleSize(title);
  const titleLineHeight = Math.round(titleSize * 1.35);
  const displayTags = tags.filter(t => !categories.includes(t)).slice(0, 8);
  const tagsHtml = displayTags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    font-family: -apple-system, 'Apple SD Gothic Neo', 'Hiragino Kaku Gothic ProN', sans-serif;
    background: #0d0d0d;
  }

  .canvas {
    position: relative;
    width: 1080px;
    height: 1080px;
  }

  .bg-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba(0,255,255,0.04) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 80%, rgba(0,180,255,0.03) 0%, transparent 50%),
                linear-gradient(160deg, #0d0d0d 0%, #111 50%, #0d0d0d 100%);
  }

  .pattern-layer {
    position: absolute;
    inset: 0;
  }

  .deco-layer {
    position: absolute;
    inset: 0;
  }

  .content {
    position: absolute;
    left: 72px;
    right: 72px;
    top: 200px;
    bottom: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
  }

  .breadcrumb {
    font-size: 16px;
    font-weight: 700;
    color: #00e5ff;
    letter-spacing: 3px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .title {
    font-size: ${titleSize}px;
    line-height: ${titleLineHeight}px;
    font-weight: 800;
    color: #ffffff;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }

  .tag {
    font-size: 14px;
    font-weight: 400;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.5px;
  }

  .footer {
    position: absolute;
    left: 72px;
    right: 72px;
    bottom: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .domain {
    font-size: 15px;
    font-weight: 400;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.5px;
  }

  .logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(0,229,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    color: #00e5ff;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="bg-gradient"></div>
    <svg class="pattern-layer" width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${patternSvg}
    </svg>
    <svg class="deco-layer" width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${decoSvg}
    </svg>
    <div class="content">
      <div class="breadcrumb">${breadcrumb}</div>
      <div class="title">${safeTitle}</div>
      <div class="tags">${tagsHtml}</div>
    </div>
    <div class="footer">
      <span class="domain">blog.binaryloader.io</span>
      <div class="logo">B</div>
    </div>
  </div>
</body>
</html>`;
}

function buildHeaderHtml({ ref, categories }) {
  const W = 1920;
  const H = 640;
  const theme = resolveTheme(categories);
  const patternSvg = generatePattern(theme, ref);
  const decoSvg = buildDecorations(theme, ref);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
    background: #0d0d0d;
  }
  .canvas {
    position: relative;
    width: ${W}px;
    height: ${H}px;
  }
  .bg-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba(0,255,255,0.04) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 80%, rgba(0,180,255,0.03) 0%, transparent 50%),
                linear-gradient(160deg, #0d0d0d 0%, #111 50%, #0d0d0d 100%);
  }
  .pattern-layer { position: absolute; inset: 0; }
  .deco-layer { position: absolute; inset: 0; }
</style>
</head>
<body>
  <div class="canvas">
    <div class="bg-gradient"></div>
    <svg class="pattern-layer" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${patternSvg}
    </svg>
    <svg class="deco-layer" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${decoSvg}
    </svg>
  </div>
</body>
</html>`;
}

function buildTeaserHtml({ title, ref, categories }) {
  const W = 600;
  const H = 600;
  const theme = resolveTheme(categories);
  const patternSvg = generatePattern(theme, ref);
  const rng = createRng(ref + ':teaser-deco');
  const decoElems = [];
  const count = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const size = 60 + rng() * 120;
    const opacity = 0.04 + rng() * 0.06;
    const rotation = Math.floor(rng() * 360);
    if (rng() > 0.5) {
      decoElems.push(`<circle cx="${x}" cy="${y}" r="${size * 0.3}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
    } else {
      decoElems.push(`<rect x="${x}" y="${y}" width="${size * 0.6}" height="${size * 0.6}" rx="6" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5" transform="rotate(${rotation},${x},${y})"/>`);
    }
  }
  const decoSvg = decoElems.join('\n');
  const breadcrumb = escapeHtml(categories.map(c => c.toUpperCase()).join(' > '));
  const safeTitle = escapeHtml(title);
  const len = title.length;
  const titleSize = len <= 15 ? 36 : len <= 30 ? 30 : len <= 50 ? 26 : 22;
  const titleLineHeight = Math.round(titleSize * 1.35);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
    font-family: -apple-system, 'Apple SD Gothic Neo', 'Hiragino Kaku Gothic ProN', sans-serif;
    background: #0d0d0d;
  }
  .canvas {
    position: relative;
    width: ${W}px;
    height: ${H}px;
  }
  .bg-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba(0,255,255,0.04) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 80%, rgba(0,180,255,0.03) 0%, transparent 50%),
                linear-gradient(160deg, #0d0d0d 0%, #111 50%, #0d0d0d 100%);
  }
  .pattern-layer { position: absolute; inset: 0; }
  .deco-layer { position: absolute; inset: 0; }
  .content {
    position: absolute;
    left: 40px;
    right: 40px;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
  }
  .breadcrumb {
    font-size: 11px;
    font-weight: 700;
    color: #00e5ff;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
  }
  .title {
    font-size: ${titleSize}px;
    line-height: ${titleLineHeight}px;
    font-weight: 800;
    color: #ffffff;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: keep-all;
    overflow-wrap: break-word;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="bg-gradient"></div>
    <svg class="pattern-layer" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${patternSvg}
    </svg>
    <svg class="deco-layer" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${decoSvg}
    </svg>
    <div class="content">
      <div class="breadcrumb">${breadcrumb}</div>
      <div class="title">${safeTitle}</div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { buildHtml, buildHeaderHtml, buildTeaserHtml };
