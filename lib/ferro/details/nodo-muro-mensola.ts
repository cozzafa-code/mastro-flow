// lib/ferro/details/nodo-muro-mensola.ts
import type { TasselloSpec } from "../types";

export function detailNodoMuroMensola(tassMuro: TasselloSpec) {
  let muroPattern = "";
  for (let i = 0; i < 7; i++) {
    muroPattern += `<line x1="20" y1="${30 + i * 25}" x2="70" y2="${30 + i * 25}" stroke="#B4B2A9" stroke-width="0.4"/>`;
  }
  let barre = "";
  [75, 100, 125].forEach((y) => {
    barre += `<line x1="70" y1="${y}" x2="40" y2="${y}" stroke="#D04A2A" stroke-width="2.5"/>`;
    barre += `<rect x="38" y="${y - 2}" width="4" height="4" fill="#0D1F1F"/>`;
  });

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="50" height="160" fill="#E5E3D8" stroke="#888780"/>
    ${muroPattern}
    <rect x="70" y="60" width="14" height="80" fill="#4A4A47" stroke="#0D1F1F"/>
    ${barre}
    <rect x="84" y="86" width="200" height="14" fill="#2A6B4A" stroke="#1F4F36"/>
    <polygon points="84,86 84,120 120,86" fill="#3B5C8A" stroke="#243F60"/>
    <text x="100" y="80" font-size="9" fill="#2A6B4A" font-family="JetBrains Mono, monospace" font-weight="600">M01</text>
    <text x="30" y="200" font-size="8" fill="#0D1F1F" font-family="JetBrains Mono, monospace">resina chimica</text>
  </svg>`;

  const note = `Fissaggio piastra murale 200x300x10 ? 3x barre ${tassMuro.tipo} ? profondit? 130mm ? Resina chimica HIT-HY 200 ? indurimento 24h ? Squadretta saldata 6mm per sbalzo`;

  return { letter: "A", titolo: "Nodo muro-mensola", svgMarkup, note };
}
