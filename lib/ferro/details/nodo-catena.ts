// lib/ferro/details/nodo-catena.ts
import type { BulloneSpec } from "../types";

export function detailNodoCatena(bull: BulloneSpec) {
  let bulloni = "";
  [[140, 90], [160, 90], [140, 110], [160, 110]].forEach(([x, y]) => {
    bulloni += `<circle cx="${x}" cy="${y}" r="2.5" fill="#0D1F1F"/>`;
  });

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="90" width="280" height="20" fill="#B85C50" stroke="#7A2A2A"/>
    <rect x="20" y="92" width="280" height="3" fill="#9A4A40"/>
    <rect x="130" y="80" width="40" height="40" fill="#4A4A47" stroke="#0D1F1F"/>
    ${bulloni}
    <text x="60" y="84" font-size="9" fill="#B85C50" font-family="JetBrains Mono, monospace" font-weight="600">UPN 100</text>
    <text x="135" y="74" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">piastra 8mm</text>
  </svg>`;

  const note = `Giunzione catena UPN 100 ? ammorsamento centrale ? 4x ${bull.tipo} cl.${bull.classe} in foro asolato ? Permette regolazione tensione catena`;

  return { letter: "C", titolo: "Giunto catena tirante", svgMarkup, note };
}
