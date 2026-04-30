// lib/ferro/details/arcareccio-trave.ts
export function detailArcarecciTrave(interasse: number) {
  const svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <polygon points="120,40 200,40 200,50 165,50 165,150 200,150 200,160 120,160 120,150 155,150 155,50 120,50" fill="#2A6B4A" stroke="#1F4F36"/>
    <rect x="140" y="20" width="40" height="20" fill="#A8542C" stroke="#5C2F1A"/>
    <path d="M138,40 L138,20 L182,20 L182,40" fill="none" stroke="#4A4A47" stroke-width="2"/>
    <circle cx="138" cy="44" r="2" fill="#0D1F1F"/>
    <circle cx="182" cy="44" r="2" fill="#0D1F1F"/>
    <text x="220" y="100" font-size="9" fill="#2A6B4A" font-family="JetBrains Mono, monospace" font-weight="600">T01</text>
    <text x="220" y="30" font-size="9" fill="#A8542C" font-family="JetBrains Mono, monospace" font-weight="600">A01</text>
    <text x="60" y="20" font-size="8" fill="#0D1F1F" font-family="JetBrains Mono, monospace">cavallotto a U</text>
  </svg>`;

  const note = `Fissaggio arcareccio su ala IPE ? Cavallotto a U tondo ?10 ? 2 dadi M10 ? Interasse arcarecci: ${interasse} mm`;

  return { letter: "C", titolo: "Arcareccio-trave", svgMarkup, note };
}
