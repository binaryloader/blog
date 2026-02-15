'use strict';

const { createRng } = require('../lib/hash');

function circuit(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  for (let i = 0; i < 20; i++) {
    const x = rng() * 1080;
    const y = rng() * 1080;
    const len = 60 + rng() * 160;
    const dir = rng() > 0.5 ? 'h' : 'v';
    if (dir === 'h') {
      paths.push(`<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="rgba(0,255,255,0.22)" stroke-width="2"/>`);
    } else {
      paths.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + len}" stroke="rgba(0,255,255,0.22)" stroke-width="2"/>`);
    }
    if (rng() > 0.4) {
      paths.push(`<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="rgba(0,255,255,0.18)" rx="1"/>`);
    }
  }
  for (let i = 0; i < 10; i++) {
    const cx = rng() * 1080;
    const cy = rng() * 1080;
    paths.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="rgba(0,255,255,0.26)"/>`);
  }
  return paths.join('\n');
}

function hexagon(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const size = 40;
  for (let row = -1; row < 8; row++) {
    for (let col = -1; col < 10; col++) {
      if (rng() > 0.4) continue;
      const cx = col * size * 1.75 + (row % 2 ? size * 0.875 : 0);
      const cy = row * size * 1.5;
      const points = [];
      for (let a = 0; a < 6; a++) {
        const angle = Math.PI / 3 * a - Math.PI / 6;
        points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
      }
      const opacity = 0.12 + rng() * 0.14;
      paths.push(`<polygon points="${points.join(' ')}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
    }
  }
  return paths.join('\n');
}

function pipeline(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  for (let i = 0; i < 8; i++) {
    const y = 80 + rng() * 920;
    const x1 = rng() * 150;
    const x2 = 930 + rng() * 150;
    paths.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="rgba(0,255,255,0.15)" stroke-width="1.5" stroke-dasharray="8 12"/>`);
    const nodes = 3 + Math.floor(rng() * 4);
    for (let n = 0; n < nodes; n++) {
      const nx = x1 + rng() * (x2 - x1);
      const r = 5 + rng() * 6;
      paths.push(`<circle cx="${nx}" cy="${y}" r="${r}" fill="rgba(0,255,255,0.15)" stroke="rgba(0,255,255,0.22)" stroke-width="1.5"/>`);
    }
  }
  // Vertical connectors
  for (let i = 0; i < 5; i++) {
    const x = 150 + rng() * 780;
    const y1 = 100 + rng() * 400;
    const y2 = y1 + 80 + rng() * 200;
    paths.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="rgba(0,255,255,0.12)" stroke-width="1.5"/>`);
    paths.push(`<polygon points="${x - 4},${y2 - 8} ${x + 4},${y2 - 8} ${x},${y2}" fill="rgba(0,255,255,0.18)"/>`);
  }
  return paths.join('\n');
}

function codeFlow(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const symbols = ['{', '}', '&lt;', '&gt;', ';', '//', '()', '[]', '&amp;&amp;', '||', '=&gt;', '!='];
  for (let i = 0; i < 28; i++) {
    const x = rng() * 1080;
    const y = rng() * 1080;
    const sym = symbols[Math.floor(rng() * symbols.length)];
    const size = 16 + rng() * 22;
    const opacity = 0.12 + rng() * 0.14;
    paths.push(`<text x="${x}" y="${y}" fill="rgba(0,255,255,${opacity})" font-family="monospace" font-size="${size}">${sym}</text>`);
  }
  return paths.join('\n');
}

function branchTree(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const branches = 4 + Math.floor(rng() * 3);
  for (let b = 0; b < branches; b++) {
    const x = 80 + rng() * 920;
    const y1 = rng() * 150;
    const y2 = 930 + rng() * 150;
    paths.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="rgba(0,255,255,0.18)" stroke-width="2"/>`);
    const commits = 4 + Math.floor(rng() * 5);
    for (let c = 0; c < commits; c++) {
      const cy = y1 + rng() * (y2 - y1);
      paths.push(`<circle cx="${x}" cy="${cy}" r="6" fill="rgba(0,255,255,0.2)" stroke="rgba(0,255,255,0.25)" stroke-width="1.5"/>`);
      if (rng() > 0.5) {
        const bx = x + (rng() > 0.5 ? 1 : -1) * (60 + rng() * 120);
        const by = cy + 40 + rng() * 100;
        paths.push(`<path d="M${x},${cy} C${x},${cy + 20} ${bx},${by - 20} ${bx},${by}" fill="none" stroke="rgba(0,255,255,0.15)" stroke-width="1.5"/>`);
        paths.push(`<circle cx="${bx}" cy="${by}" r="4" fill="rgba(0,255,255,0.18)"/>`);
      }
    }
  }
  return paths.join('\n');
}

function network(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const nodes = [];
  for (let i = 0; i < 16; i++) {
    nodes.push({ x: rng() * 1080, y: rng() * 1080 });
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 450 && rng() > 0.3) {
        paths.push(`<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="rgba(0,255,255,0.12)" stroke-width="1"/>`);
      }
    }
  }
  for (const n of nodes) {
    const r = 4 + rng() * 6;
    paths.push(`<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="rgba(0,255,255,0.18)" stroke="rgba(0,255,255,0.22)" stroke-width="1.5"/>`);
  }
  return paths.join('\n');
}

function geometry(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  // Coordinate axes
  paths.push(`<line x1="80" y1="540" x2="1000" y2="540" stroke="rgba(0,255,255,0.18)" stroke-width="1.5"/>`);
  paths.push(`<line x1="540" y1="80" x2="540" y2="1000" stroke="rgba(0,255,255,0.18)" stroke-width="1.5"/>`);
  // Tick marks
  for (let t = 140; t <= 940; t += 100) {
    paths.push(`<line x1="${t}" y1="535" x2="${t}" y2="545" stroke="rgba(0,255,255,0.15)" stroke-width="1"/>`);
    paths.push(`<line x1="535" y1="${t}" x2="545" y2="${t}" stroke="rgba(0,255,255,0.15)" stroke-width="1"/>`);
  }
  // Sine wave
  const wavePoints = [];
  const amp = 80 + rng() * 120;
  const freq = 0.005 + rng() * 0.01;
  const phase = rng() * Math.PI * 2;
  for (let x = 80; x <= 1000; x += 4) {
    wavePoints.push(`${x},${540 + amp * Math.sin(freq * x + phase)}`);
  }
  paths.push(`<polyline points="${wavePoints.join(' ')}" fill="none" stroke="rgba(0,255,255,0.2)" stroke-width="2"/>`);
  // Cosine wave
  const wave2Points = [];
  const amp2 = 50 + rng() * 80;
  const phase2 = rng() * Math.PI * 2;
  for (let x = 80; x <= 1000; x += 4) {
    wave2Points.push(`${x},${540 + amp2 * Math.cos(freq * x + phase2)}`);
  }
  paths.push(`<polyline points="${wave2Points.join(' ')}" fill="none" stroke="rgba(0,255,255,0.12)" stroke-width="1.5" stroke-dasharray="6 4"/>`);
  // Triangles/circles
  for (let i = 0; i < 6; i++) {
    const cx = 150 + rng() * 780;
    const cy = 150 + rng() * 780;
    if (rng() > 0.5) {
      const r = 30 + rng() * 70;
      paths.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,255,255,0.15)" stroke-width="1.5"/>`);
    } else {
      const s = 30 + rng() * 60;
      paths.push(`<polygon points="${cx},${cy - s} ${cx - s * 0.87},${cy + s * 0.5} ${cx + s * 0.87},${cy + s * 0.5}" fill="none" stroke="rgba(0,255,255,0.15)" stroke-width="1.5"/>`);
    }
  }
  return paths.join('\n');
}

function dots(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const spacing = 50;
  for (let x = 25; x < 1080; x += spacing) {
    for (let y = 25; y < 1080; y += spacing) {
      if (rng() > 0.4) continue;
      const r = 1.5 + rng() * 2;
      paths.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,255,255,0.2)"/>`);
    }
  }
  // Constellation lines
  const stars = [];
  for (let i = 0; i < 14; i++) {
    stars.push({ x: rng() * 1080, y: rng() * 1080 });
  }
  for (let i = 0; i < stars.length - 1; i++) {
    const dx = stars[i].x - stars[i + 1].x;
    const dy = stars[i].y - stars[i + 1].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 500 && rng() > 0.2) {
      paths.push(`<line x1="${stars[i].x}" y1="${stars[i].y}" x2="${stars[i + 1].x}" y2="${stars[i + 1].y}" stroke="rgba(0,255,255,0.12)" stroke-width="1"/>`);
    }
  }
  // Highlight nodes
  for (let i = 0; i < 6; i++) {
    const s = stars[Math.floor(rng() * stars.length)];
    paths.push(`<circle cx="${s.x}" cy="${s.y}" r="5" fill="rgba(0,255,255,0.22)"/>`);
  }
  return paths.join('\n');
}

function connected(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const nodes = [];
  for (let i = 0; i < 20; i++) {
    nodes.push({ x: rng() * 1080, y: rng() * 1080 });
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300 && rng() > 0.4) {
        paths.push(`<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="rgba(0,255,255,0.12)" stroke-width="1" stroke-dasharray="4 6"/>`);
      }
    }
  }
  for (const n of nodes) {
    const r = 5 + rng() * 7;
    paths.push(`<rect x="${n.x - r}" y="${n.y - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="rgba(0,255,255,0.15)" stroke="rgba(0,255,255,0.2)" stroke-width="1.5"/>`);
  }
  return paths.join('\n');
}

function blocks(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const cols = 7;
  const rows = 7;
  const size = 50;
  const gap = 8;
  const offsetX = (1080 - cols * (size + gap)) / 2;
  const offsetY = (1080 - rows * (size + gap)) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > 0.55) continue;
      const x = offsetX + c * (size + gap);
      const y = offsetY + r * (size + gap);
      const opacity = 0.1 + rng() * 0.12;
      paths.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="rgba(0,255,255,${opacity})" stroke="rgba(0,255,255,${opacity + 0.05})" stroke-width="1.5"/>`);
      paths.push(`<line x1="${x + 10}" y1="${y + size * 0.7}" x2="${x + size - 10}" y2="${y + size * 0.7}" stroke="rgba(0,255,255,${opacity + 0.03})" stroke-width="1"/>`);
    }
  }
  return paths.join('\n');
}

function waves(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  const count = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const yBase = 120 + i * (840 / count);
    const amp = 30 + rng() * 70;
    const freq = 0.004 + rng() * 0.008;
    const phase = rng() * Math.PI * 2;
    const points = [];
    for (let x = 0; x <= 1080; x += 4) {
      points.push(`${x},${yBase + amp * Math.sin(freq * x + phase)}`);
    }
    const opacity = 0.12 + rng() * 0.1;
    paths.push(`<polyline points="${points.join(' ')}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
  }
  return paths.join('\n');
}

function defaultPattern(ref) {
  const rng = createRng(ref + ':pattern');
  const paths = [];
  // Dot grid
  for (let x = 60; x < 1080; x += 70) {
    for (let y = 60; y < 1080; y += 70) {
      if (rng() > 0.35) continue;
      paths.push(`<circle cx="${x}" cy="${y}" r="2" fill="rgba(0,255,255,0.18)"/>`);
    }
  }
  // Floating shapes
  for (let i = 0; i < 8; i++) {
    const cx = rng() * 1080;
    const cy = rng() * 1080;
    const r = 25 + rng() * 50;
    const opacity = 0.09 + rng() * 0.12;
    if (rng() > 0.5) {
      paths.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
    } else {
      paths.push(`<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="6" fill="none" stroke="rgba(0,255,255,${opacity})" stroke-width="1.5"/>`);
    }
  }
  return paths.join('\n');
}

const PATTERN_MAP = {
  circuit,
  hexagon,
  pipeline,
  'code-flow': codeFlow,
  'branch-tree': branchTree,
  network,
  geometry,
  dots,
  connected,
  blocks,
  waves,
  default: defaultPattern,
};

function generatePattern(theme, ref) {
  const fn = PATTERN_MAP[theme] || PATTERN_MAP.default;
  return fn(ref);
}

module.exports = { generatePattern };
