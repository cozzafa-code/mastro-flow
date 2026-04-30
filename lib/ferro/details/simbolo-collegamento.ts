// lib/ferro/details/simbolo-collegamento.ts
import type { BulloneSpec, SaldaturaSpec } from "../types";

export function detailSimboloCollegamento(bull: BulloneSpec, sald: SaldaturaSpec, collegamento: string) {
  let svgMarkup = "";
  let note = "";

  if (collegamento === "bullonato") {
    const dM = parseInt(bull.tipo.replace("M", ""));
    svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="100" height="20" fill="#3B5C8A"/>
      <rect x="160" y="35" width="100" height="30" fill="#2A6B4A"/>
      <polygon points="155,35 155,65 165,55 165,45" fill="#0D1F1F"/>
      <rect x="148" y="44" width="14" height="12" fill="#444" stroke="#0D1F1F"/>
      <rect x="262" y="44" width="14" height="12" fill="#444" stroke="#0D1F1F"/>
      <line x1="148" y1="50" x2="276" y2="50" stroke="#0D1F1F" stroke-width="1"/>
      <text x="160" y="100" font-size="11" fill="#28A0A0" font-family="JetBrains Mono, monospace" font-weight="700">${bull.tipo} cl.${bull.classe}</text>
      <text x="160" y="120" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">L = ${dM * 4} mm ? dado + rond.</text>
      <text x="160" y="140" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">coppia di serraggio ${dM * 12} Nm</text>
    </svg>`;
    note = `Connessione bullonata ? ${bull.tipo} cl.${bull.classe} ? L=${dM * 4}mm con dado + rondella ? coppia di serraggio ${dM * 12} Nm`;
  } else if (collegamento === "saldato") {
    svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="60" y1="50" x2="260" y2="50" stroke="#0D1F1F" stroke-width="2"/>
      <line x1="160" y1="50" x2="200" y2="80" stroke="#0D1F1F" stroke-width="1"/>
      <text x="200" y="78" font-size="14" fill="#D04A2A" font-family="JetBrains Mono, monospace" font-weight="700">a${sald.spessore}</text>
      <text x="60" y="120" font-size="11" fill="#D04A2A" font-family="JetBrains Mono, monospace" font-weight="700">Cordone ${sald.simbolo}</text>
      <text x="60" y="138" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">spessore ${sald.spessore}mm ? ${sald.metodo} ? S275</text>
      <text x="60" y="156" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">cordone d'angolo continuo</text>
    </svg>`;
    note = `Connessione saldata ? cordone ${sald.simbolo} ? spessore ${sald.spessore}mm ? ${sald.metodo} ? S275 ? cordone d'angolo continuo`;
  } else {
    svgMarkup = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="40" width="80" height="20" fill="#3B5C8A"/>
      <rect x="40" y="44" width="14" height="12" fill="#0D1F1F"/>
      <line x1="40" y1="50" x2="130" y2="50" stroke="#0D1F1F" stroke-width="1"/>
      <line x1="170" y1="50" x2="270" y2="50" stroke="#0D1F1F" stroke-width="2"/>
      <line x1="220" y1="50" x2="240" y2="70" stroke="#0D1F1F" stroke-width="1"/>
      <text x="240" y="68" font-size="12" fill="#D04A2A" font-family="JetBrains Mono, monospace" font-weight="700">a${sald.spessore}</text>
      <text x="40" y="110" font-size="11" fill="#28A0A0" font-family="JetBrains Mono, monospace" font-weight="700">${bull.tipo}</text>
      <text x="180" y="110" font-size="11" fill="#D04A2A" font-family="JetBrains Mono, monospace" font-weight="700">a${sald.spessore}</text>
      <text x="40" y="135" font-size="9" fill="#0D1F1F" font-family="JetBrains Mono, monospace">bullonato sui pilastri ? saldato in officina</text>
    </svg>`;
    note = `Connessione mista ? bullonato in cantiere ${bull.tipo} ? saldato in officina cordone a${sald.spessore}`;
  }

  return { letter: "D", titolo: "Simbolo collegamento", svgMarkup, note };
}
