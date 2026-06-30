#!/usr/bin/env node
// Generate 12 Stream Deck icons as SVG -> PNG (288x288) for Claude CLI control profile.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'icons');
fs.mkdirSync(OUT, { recursive: true });

const BG = '#1a1a1a';
const ACCENT = '#D97757';
const WHITE = '#F2EFE9';
const SIZE = 288;

// helper to wrap glyph in a full button svg with label
function svg(glyph, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 288 288">
  <rect width="288" height="288" rx="36" fill="${BG}"/>
  <g transform="translate(144,116)" fill="none" stroke="${ACCENT}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    ${glyph}
  </g>
  <text x="144" y="248" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="${WHITE}" text-anchor="middle">${label}</text>
</svg>`;
}

// glyphs centered at (0,0), drawn roughly within -56..56
const icons = {
  '01-new': { label: 'New', glyph: `
    <rect x="-44" y="-52" width="70" height="92" rx="8"/>
    <path d="M26 -52 v34 h34"/>
    <path d="M44 30 v44 M22 52 h44" transform="translate(0,-30)"/>
  ` },
  '02-reset': { label: 'Reset', glyph: `
    <path d="M44 -8 A52 52 0 1 0 50 28"/>
    <path d="M44 -44 v36 h-36"/>
  ` },
  '03-status': { label: 'Status', glyph: `
    <line x1="-44" y1="44" x2="44" y2="44"/>
    <rect x="-40" y="6" width="20" height="38"/>
    <rect x="-10" y="-22" width="20" height="66"/>
    <rect x="20" y="-44" width="20" height="88"/>
  ` },
  '04-reasoning': { label: 'Reason', glyph: `
    <path d="M0 -50 C-34 -50 -50 -28 -50 -6 C-50 14 -36 24 -30 30 C-28 40 -28 48 -28 48 M0 -50 C34 -50 50 -28 50 -6 C50 14 36 24 30 30 C28 40 28 48 28 48"/>
    <path d="M-28 48 h56"/>
    <path d="M0 -50 v98" stroke-dasharray="6 10"/>
  ` },
  '05-plan': { label: 'Plan', glyph: `
    <rect x="-40" y="-46" width="80" height="98" rx="8"/>
    <rect x="-16" y="-58" width="32" height="20" rx="5"/>
    <path d="M-24 -16 h10 M-24 8 h10 M-24 32 h10"/>
    <path d="M2 -16 h22 M2 8 h22 M2 32 h22"/>
  ` },
  '06-stop': { label: 'Stop', glyph: `
    <rect x="-40" y="-40" width="80" height="80" rx="12" fill="${ACCENT}" stroke="none"/>
  ` },
  '07-cancel': { label: 'Cancel', glyph: `
    <circle cx="0" cy="0" r="50"/>
    <path d="M-22 -22 L22 22 M22 -22 L-22 22"/>
  ` },
  '08-enter': { label: 'Enter', glyph: `
    <path d="M48 -44 v52 a8 8 0 0 1 -8 8 H-34"/>
    <path d="M-14 -16 L-44 16 L-14 48"/>
  ` },
  '09-continue': { label: 'Go', glyph: `
    <path d="M-46 -38 L6 0 L-46 38 Z" fill="${ACCENT}" stroke="none"/>
    <path d="M14 -38 L52 0 L14 38 Z" fill="${ACCENT}" stroke="none"/>
  ` },
  '10-commit': { label: 'Push', glyph: `
    <circle cx="-30" cy="36" r="12"/>
    <circle cx="-30" cy="-36" r="12"/>
    <circle cx="34" cy="-10" r="12"/>
    <path d="M-30 24 v-48 M-30 -28 C-30 -10 0 -10 22 -10"/>
    <path d="M34 2 v34 M22 24 l12 14 l12 -14" transform="translate(0,0)"/>
  ` },
  '11-summary': { label: 'Sum', glyph: `
    <rect x="-40" y="-50" width="80" height="100" rx="8"/>
    <path d="M-22 -26 h44 M-22 -4 h44 M-22 18 h28"/>
  ` },
  '12-explain': { label: 'Debug', glyph: `
    <ellipse cx="-6" cy="-6" rx="30" ry="34"/>
    <path d="M-6 -44 v-12 M-36 -30 l-16 -8 M24 -30 l16 -8 M-36 -6 h-20 M24 -6 h20 M-36 18 l-16 10 M24 18 l16 10"/>
    <circle cx="30" cy="34" r="18"/>
    <path d="M43 47 l16 16"/>
  ` },
};

let made = [];
for (const [name, { glyph, label }] of Object.entries(icons)) {
  const s = svg(glyph, label);
  const svgPath = path.join(OUT, name + '.svg');
  const pngPath = path.join(OUT, name + '.png');
  fs.writeFileSync(svgPath, s);
  execSync(`rsvg-convert -w 288 -h 288 "${svgPath}" -o "${pngPath}"`);
  fs.unlinkSync(svgPath);
  made.push(name + '.png');
}
console.log('Generated', made.length, 'icons:', made.join(', '));
