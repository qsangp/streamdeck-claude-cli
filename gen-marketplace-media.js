#!/usr/bin/env node
// Generate Elgato Marketplace media: 1920x960 thumbnail + 3 gallery images.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'marketplace');
fs.mkdirSync(OUT, { recursive: true });
const ICONS = path.join(__dirname, 'icons');
const ACCENT = '#D97757', WHITE = '#F2EFE9', SUB = '#b8b0a6';
const W = 1920, H = 960;

function sparkle(cx, cy, r) {
  let p = ''; const n = 12;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
    const x1 = cx + Math.cos(a) * r * 0.28, y1 = cy + Math.sin(a) * r * 0.28;
    const perp = a + Math.PI / 2, wm = r * 0.1;
    const mx = cx + Math.cos(a) * r * 0.62, my = cy + Math.sin(a) * r * 0.62;
    const ox = Math.cos(perp) * wm, oy = Math.sin(perp) * wm;
    p += `<path d="M${x1} ${y1} Q${mx + ox} ${my + oy} ${x2} ${y2} Q${mx - ox} ${my - oy} ${x1} ${y1} Z" fill="${ACCENT}"/>`;
  }
  return p;
}

const bgDefs = `
  <radialGradient id="bg" cx="50%" cy="45%" r="80%">
    <stop offset="0%" stop-color="#2a2420"/><stop offset="60%" stop-color="#1d1a18"/><stop offset="100%" stop-color="#121010"/>
  </radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.4"/><stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
  </radialGradient>`;

function render(name, inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${bgDefs}</defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${inner}
  </svg>`;
  const sp = path.join(OUT, name + '.svg'), pp = path.join(OUT, name + '.png');
  fs.writeFileSync(sp, svg);
  execSync(`rsvg-convert -w ${W} -h ${H} "${sp}" -o "${pp}"`);
  fs.unlinkSync(sp);
  console.log('rendered', name);
}

// ---- Thumbnail: sparkle left, title right ----
render('01-thumbnail', `
  <circle cx="560" cy="${H/2}" r="320" fill="url(#glow)"/>
  ${sparkle(560, H/2, 180)}
  <text x="980" y="${H/2 - 60}" font-family="Helvetica, Arial, sans-serif" font-size="120" font-weight="800" fill="${WHITE}">Claude CLI</text>
  <text x="985" y="${H/2 + 30}" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="600" fill="${ACCENT}">Control Deck</text>
  <text x="985" y="${H/2 + 110}" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="400" fill="${SUB}">Galleon 100 SD &#183; macOS</text>
`);

// ---- Gallery 1: the 12 icons grid (embed preview) ----
(() => {
  const b = fs.readFileSync(path.join(ICONS, '_preview.png')).toString('base64');
  // preview is 1200x900 (4:3). center it on 1920x960 canvas.
  const iw = 1100, ih = 825, ix = (W - iw) / 2, iy = (H - ih) / 2;
  render('02-gallery-icons', `
    <text x="${W/2}" y="80" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="${WHITE}" text-anchor="middle">12 ready-made keys</text>
    <image x="${ix}" y="${iy + 20}" width="${iw}" height="${ih}" href="data:image/png;base64,${b}"/>
  `);
})();

// ---- Gallery 2: feature list ----
render('03-gallery-features', `
  ${sparkle(300, H/2, 120)}
  <g font-family="Helvetica, Arial, sans-serif" fill="${WHITE}">
    <text x="620" y="240" font-size="64" font-weight="800">Run Claude from your deck</text>
    <text x="620" y="360" font-size="42" fill="${SUB}">Launch Terminal &amp; start the CLI in one tap</text>
    <text x="620" y="450" font-size="42" fill="${SUB}">Slash commands: /reset /status /reasoning /plan</text>
    <text x="620" y="540" font-size="42" fill="${SUB}">Hotkeys: Esc, Ctrl+C, Enter</text>
    <text x="620" y="630" font-size="42" fill="${SUB}">Claude sparkle LCD wallpaper included</text>
  </g>
`);

// ---- Gallery 3: wallpaper showcase ----
(() => {
  const b = fs.readFileSync(path.join(ICONS, 'wallpaper-720x384.png')).toString('base64');
  const iw = 960, ih = 512, ix = (W - iw) / 2, iy = (H - ih) / 2 + 30;
  render('04-gallery-wallpaper', `
    <text x="${W/2}" y="120" font-family="Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="${WHITE}" text-anchor="middle">LCD wallpaper included</text>
    <rect x="${ix-8}" y="${iy-8}" width="${iw+16}" height="${ih+16}" rx="20" fill="none" stroke="${ACCENT}" stroke-width="3"/>
    <image x="${ix}" y="${iy}" width="${iw}" height="${ih}" href="data:image/png;base64,${b}"/>
  `);
})();

console.log('\nDone. Files in', OUT);
