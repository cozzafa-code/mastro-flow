// lib/ferro/details/tirante-diagonale.ts
import type { BulloneSpec } from "../types";

export function detailTiranteDiagonale(bull: BulloneSpec) {
  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="80" y="100" width="200" height="14" fill="#2A6B4A" stroke="#1F4F36"/>
    <polygon points="80,40 88,40 280,108 280,116" fill="#8A5A8A" stroke="#5C3A5C"/>
    <rect x="76" y="35" width="14" height="14" fill="#4A4A47" stroke="#0D1F1F"/>
    <rect x="270" y="105" width="20" height="14" fill="#4A4A47" stroke="#0D1F1F"/>
    <circle cx="83" cy="42" r="3" fill="#0D1F1F"/>
    <circle cx="280" cy="112" r="3" fill="#0D1F1F"/>
    <line x1="276" y1="112" x2="284" y2="112" stroke="#FFF" stroke-width="1"/>
    <text x="180" y="50" font-size="9" fill="#8A5A8A" font-family="JetBrains Mono, monospace" font-weight="600">TR01</text>
    <text x="40" y="35" font-size="8" fill="#0D1F1F" font-family="JetBrains Mono, monospace">perno fisso</text>
    <text x="220" y="135" font-size="8" fill="#0D1F1F" font-family="JetBrains Mono, monospace">asola registro</text>
  </svg>`;

  const note = `Tirante Tub. 50x50x3 saldato a forcella ? Perno superiore fisso ? perno inferiore in asola ? 2x perni ${bull.tipo} + dado autobloccante ? Permette messa in tensione precarico`;

  return { letter: "B", titolo: "Tirante diagonale", svgMarkup, note };
}
