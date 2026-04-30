// lib/ferro/details/piastra-base.ts
import type { PiastraSpec, BulloneSpec, TasselloSpec } from "../types";

export function detailPiastraBase(piastra: PiastraSpec, bull: BulloneSpec, tass: TasselloSpec, fixTerra: string) {
  const cx = 160, cy = 100, sc = 0.45;
  const dimPx = piastra.dim * sc;
  const interPx = piastra.interasse * sc;
  const halfP = dimPx / 2;
  const halfI = interPx / 2;
  const pilSize = 40 * sc;

  const positions = piastra.fori === 6
    ? [[-halfI, -halfI], [0, -halfI], [halfI, -halfI], [-halfI, halfI], [0, halfI], [halfI, halfI]]
    : [[-halfI, -halfI], [halfI, -halfI], [-halfI, halfI], [halfI, halfI]];

  const fori = positions.map(([dx, dy]) =>
    `<circle cx="${cx + dx}" cy="${cy + dy}" r="${piastra.foroD * sc / 2}" fill="white" stroke="#0D1F1F" stroke-width="0.7"/>` +
    `<line x1="${cx + dx - 4}" y1="${cy + dy}" x2="${cx + dx + 4}" y2="${cy + dy}" stroke="#0D1F1F" stroke-width="0.4" stroke-dasharray="2,1"/>` +
    `<line x1="${cx + dx}" y1="${cy + dy - 4}" x2="${cx + dx}" y2="${cy + dy + 4}" stroke="#0D1F1F" stroke-width="0.4" stroke-dasharray="2,1"/>`
  ).join("");

  const sweld = 4;
  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="${cx - halfP}" y="${cy - halfP}" width="${dimPx}" height="${dimPx}" fill="#4A4A47" stroke="#0D1F1F" stroke-width="0.8"/>
    <rect x="${cx - pilSize / 2}" y="${cy - pilSize / 2}" width="${pilSize}" height="${pilSize}" fill="#3B5C8A" stroke="#243F60"/>
    <rect x="${cx - pilSize / 2 + 3}" y="${cy - pilSize / 2 + 3}" width="${pilSize - 6}" height="${pilSize - 6}" fill="#FAFAF7" stroke="#243F60" stroke-width="0.5"/>
    ${fori}
    <rect x="${cx - pilSize / 2 - sweld / 2}" y="${cy - pilSize / 2 - sweld / 2}" width="${pilSize + sweld}" height="${pilSize + sweld}" fill="none" stroke="#D04A2A" stroke-width="1.5" stroke-dasharray="2,1.5"/>
    <line x1="${cx - halfP}" y1="${cy + halfP + 10}" x2="${cx + halfP}" y2="${cy + halfP + 10}" stroke="#4A4A47" stroke-width="0.6"/>
    <text x="${cx}" y="${cy + halfP + 22}" text-anchor="middle" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace" font-weight="500">${piastra.dim} mm</text>
    <text x="${cx}" y="${cy - halfP - 14}" text-anchor="middle" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace" font-weight="500">${piastra.interasse} mm</text>
    <text x="${cx + halfP + 6}" y="${cy - halfI + 3}" font-size="8" fill="#28A0A0" font-family="JetBrains Mono, monospace" font-weight="600">?${piastra.foroD}</text>
  </svg>`;

  const fixLabel = fixTerra === "tasselli" ? `Tasselli ${tass.tipo}`
    : fixTerra === "tirafondi" ? `Tirafondi M${piastra.foroD - 2}`
    : fixTerra === "annegato" ? "Annegato cls" : "Staffa lat.";

  const note = `PB01 ? ${piastra.dim}x${piastra.dim}x${piastra.sp} mm S275 ? ${piastra.fori}x fori ?${piastra.foroD} ? interasse ${piastra.interasse}x${piastra.interasse} ? ${fixLabel} ? Bullone ${piastra.bullone} cl.${bull.classe} ? Saldatura cordone a6 tutto giro`;

  return { letter: "A", titolo: "Piastra base pilastro", svgMarkup, note };
}
