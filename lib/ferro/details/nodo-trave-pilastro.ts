// lib/ferro/details/nodo-trave-pilastro.ts
import type { BulloneSpec, SaldaturaSpec } from "../types";

export function detailNodoTravePilastro(bull: BulloneSpec, sald: SaldaturaSpec, collegamento: string, ang: number) {
  let bulloni = "";
  [80, 95, 110, 125].forEach((y) => {
    bulloni += `<circle cx="89" cy="${y}" r="2.5" fill="#0D1F1F" stroke="#FFF"/>`;
    bulloni += `<line x1="83" y1="${y}" x2="95" y2="${y}" stroke="#0D1F1F" stroke-width="1.4"/>`;
  });
  const sNote = collegamento === "saldato" || collegamento === "misto"
    ? `<polyline points="90,70 90,130" fill="none" stroke="#D04A2A" stroke-width="3" stroke-dasharray="3,2"/>` : "";

  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="30" width="40" height="160" fill="#3B5C8A" stroke="#243F60"/>
    <polygon points="90,90 280,80 280,100 90,110" fill="#2A6B4A" stroke="#1F4F36"/>
    <rect x="86" y="70" width="6" height="60" fill="#4A4A47" stroke="#0D1F1F"/>
    ${bulloni}
    ${sNote}
    <text x="60" y="20" font-size="9" fill="#3B5C8A" font-family="JetBrains Mono, monospace" font-weight="600">P01</text>
    <text x="190" y="74" font-size="9" fill="#2A6B4A" font-family="JetBrains Mono, monospace" font-weight="600">T01 (incl. ${ang}?)</text>
  </svg>`;

  const isBull = collegamento !== "saldato";
  const isSald = collegamento === "saldato" || collegamento === "misto";
  const note = `Flangia bullonata sul pilastro ? saldata sulla trave${isBull ? ` ? 4x bulloni ${bull.tipo} cl.${bull.classe}` : ""}${isSald ? ` ? Cordone ${sald.simbolo} a tutto giro` : ""} ? Squadretta irrigidimento 6mm su anima trave`;

  return { letter: "B", titolo: "Nodo trave-pilastro", svgMarkup, note };
}
