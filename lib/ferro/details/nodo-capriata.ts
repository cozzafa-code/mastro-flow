// lib/ferro/details/nodo-capriata.ts
import type { BulloneSpec } from "../types";

export function detailNodoCapriata(bull: BulloneSpec) {
  let bulloni = "";
  [88, 100, 110].forEach((y) => {
    bulloni += `<circle cx="86" cy="${y}" r="2.5" fill="#0D1F1F"/>`;
    bulloni += `<line x1="78" y1="${y}" x2="95" y2="${y}" stroke="#0D1F1F" stroke-width="1.2"/>`;
  });

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="30" width="40" height="160" fill="#3B5C8A" stroke="#243F60"/>
    <polygon points="80,90 280,40 280,60 80,110" fill="#2A6B4A" stroke="#1F4F36"/>
    <rect x="80" y="105" width="200" height="6" fill="#B85C50" stroke="#7A2A2A"/>
    <polygon points="78,85 78,115 95,115 95,85" fill="#4A4A47" stroke="#0D1F1F"/>
    ${bulloni}
    <polyline points="80,85 80,115" fill="none" stroke="#D04A2A" stroke-width="3" stroke-dasharray="3,2"/>
    <text x="50" y="22" font-size="9" fill="#3B5C8A" font-family="JetBrains Mono, monospace" font-weight="600">P01</text>
    <text x="200" y="35" font-size="9" fill="#2A6B4A" font-family="JetBrains Mono, monospace" font-weight="600">T01 capriata</text>
    <text x="200" y="125" font-size="9" fill="#B85C50" font-family="JetBrains Mono, monospace" font-weight="600">T02 catena UPN</text>
  </svg>`;

  const note = `Nodo a 3 vie: pilastro + capriata + catena ? 6x bulloni ${bull.tipo} cl.${bull.classe} ? piastra 12mm ? Cordone a6 piastra-pilastro tutto giro ? Catena UPN tirante: bullonatura passante`;

  return { letter: "B", titolo: "Nodo capriata-pilastro", svgMarkup, note };
}
