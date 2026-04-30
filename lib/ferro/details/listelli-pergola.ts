// lib/ferro/details/listelli-pergola.ts
import type { BulloneSpec } from "../types";

export function detailListelliPergola(bull: BulloneSpec, interasse: number) {
  let listelli = "";
  for (let i = 0; i < 6; i++) {
    const x = 30 + i * 48;
    listelli += `<rect x="${x}" y="80" width="8" height="20" fill="#A8542C" stroke="#5C2F1A"/>`;
    listelli += `<line x1="${x + 4}" y1="100" x2="${x + 4}" y2="120" stroke="#0D1F1F" stroke-width="0.4" stroke-dasharray="1,1"/>`;
    listelli += `<circle cx="${x + 4}" cy="110" r="1.5" fill="#0D1F1F"/>`;
  }
  const dM = parseInt(bull.tipo.replace("M", "")) + 1;

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="100" width="280" height="20" fill="#2A6B4A" stroke="#1F4F36"/>
    ${listelli}
    <text x="60" y="140" font-size="9" fill="#A8542C" font-family="JetBrains Mono, monospace" font-weight="600">A01 listelli</text>
    <text x="160" y="140" font-size="9" fill="#2A6B4A" font-family="JetBrains Mono, monospace" font-weight="600">T01 perimetrale</text>
  </svg>`;

  const note = `Listelli passanti su trave perimetrale ? Bullone ${bull.tipo} 1x per nodo ? interasse ${interasse} mm ? Foro ?${dM} mm`;

  return { letter: "C", titolo: "Listello-trave", svgMarkup, note };
}
