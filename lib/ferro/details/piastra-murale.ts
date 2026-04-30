// lib/ferro/details/piastra-murale.ts
import type { TasselloSpec } from "../types";

export function detailPiastraMurale(tassMuro: TasselloSpec) {
  const cx = 160, cy = 100;
  let muroPattern = "";
  for (let i = 0; i < 7; i++) {
    muroPattern += `<line x1="60" y1="${30 + i * 25}" x2="100" y2="${30 + i * 25}" stroke="#B4B2A9" stroke-width="0.4"/>`;
  }
  let tasselli = "";
  [70, 100, 130].forEach((y) => {
    tasselli += `<circle cx="105" cy="${y - 5}" r="2" fill="white" stroke="#0D1F1F" stroke-width="0.7"/>`;
    tasselli += `<line x1="100" y1="${y - 5}" x2="80" y2="${y - 5}" stroke="#D04A2A" stroke-width="2"/>`;
  });

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="60" y="20" width="40" height="160" fill="#E5E3D8" stroke="#888780"/>
    ${muroPattern}
    <rect x="100" y="60" width="14" height="80" fill="#4A4A47" stroke="#0D1F1F"/>
    ${tasselli}
    <rect x="114" y="86" width="160" height="10" fill="#2A6B4A" stroke="#1F4F36"/>
    <polygon points="114,86 114,110 130,86" fill="#3B5C8A" stroke="#243F60"/>
    <text x="200" y="80" font-size="9" fill="#28A0A0" font-family="JetBrains Mono, monospace" font-weight="600">M01</text>
    <text x="80" y="20" font-size="9" fill="#0D1F1F" font-family="Inter">parete</text>
  </svg>`;

  const note = `PB01 ? 200x300x10 mm ? 4x barre filettate ${tassMuro.tipo} ? Resina HIT-HY 200 ? 24h indurimento ? Squadretta irrigidimento 6mm saldata`;

  return { letter: "A", titolo: "Piastra murale", svgMarkup, note };
}
