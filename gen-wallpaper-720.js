#!/usr/bin/env node
// Galleon LCD wallpaper 720x384 (wide). Sparkle left, text right.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, 'icons');
const W = 720, H = 384;
const ACCENT = '#D97757';
const WHITE = '#F2EFE9';

function sparkle(cx, cy, r) {
  let petals = '';
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
    const x1 = cx + Math.cos(a) * r * 0.28, y1 = cy + Math.sin(a) * r * 0.28;
    const perp = a + Math.PI / 2, wmid = r * 0.10;
    const mx = cx + Math.cos(a) * r * 0.62, my = cy + Math.sin(a) * r * 0.62;
    const ox = Math.cos(perp) * wmid, oy = Math.sin(perp) * wmid;
    petals += `<path d="M${x1} ${y1} Q${mx + ox} ${my + oy} ${x2} ${y2} Q${mx - ox} ${my - oy} ${x1} ${y1} Z" fill="${ACCENT}"/>`;
  }
  return petals;
}

const cx = W / 2, cy = H / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="85%">
      <stop offset="0%" stop-color="#2a2420"/><stop offset="60%" stop-color="#1d1a18"/><stop offset="100%" stop-color="#141210"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.5"/><stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="210" fill="url(#glow)"/>
  ${sparkle(cx, cy, 130)}
</svg>`;

const svgPath = path.join(OUT, 'wallpaper-720.svg');
const pngPath = path.join(OUT, 'wallpaper-720x384.png');
fs.writeFileSync(svgPath, svg);
execSync(`rsvg-convert -w ${W} -h ${H} "${svgPath}" -o "${pngPath}"`);
fs.unlinkSync(svgPath);
console.log('Wallpaper:', pngPath);
