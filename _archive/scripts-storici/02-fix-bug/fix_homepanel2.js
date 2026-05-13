const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
let s = fs.readFileSync(path, "utf8");

// I VERI mojibake nel file sono questi 3 (visibili da Get-Content):
// 1. "Apri agenda â€º" → "Apri agenda ›"
// 2. "VEDI TUTTI â€º" → "VEDI TUTTI ›"  
// 3. "APRI AGENDA COMPLETA â†→" → "APRI AGENDA COMPLETA →"
//
// Use Buffer-based replace per evitare problemi di codifica

const fixes = [
  // pattern: â€º (E2 80 BA è il VERO byte UTF-8 di › se NON corrotto, ma noi vogliamo trovare il mojibake)
  // mojibake "â€º" è in UTF-8 i bytes: c3 a2 e2 82 ac c2 ba (à+€+º triplo encode)
  // Ma più probabile è: "â€º" reso come 3 caratteri Unicode = c3 a2 (â) e2 82 ac (€) c2 ba (º)
  // Test: sostituisci la sequenza Unicode esatta come la vediamo
  ["\u00e2\u20ac\u00ba", "\u203a"],  // â€º (3-char latin) → ›
  ["\u00e2\u2020\u2192", "\u2192"],  // â†→ (3-char latin) → →
  ["\u00e2\u20ac\u00b9", "\u2039"],  // â€‹ → ‹  
];

let totale = 0;
for (const [bad, good] of fixes) {
  if (s.includes(bad)) {
    const n = s.split(bad).length - 1;
    s = s.split(bad).join(good);
    console.log("[FIX]", n, "x", JSON.stringify(bad), "→", JSON.stringify(good));
    totale += n;
  }
}

// fallback: cerca i 3 punti specifici per stringhe più lunghe
const fallback = [
  ["Apri agenda \u00e2\u20ac\u00ba", "Apri agenda \u203a"],
  ["VEDI TUTTI \u00e2\u20ac\u00ba", "VEDI TUTTI \u203a"],
  ["APRI AGENDA COMPLETA \u00e2\u2020\u2192", "APRI AGENDA COMPLETA \u2192"],
];
for (const [bad, good] of fallback) {
  if (s.includes(bad)) {
    s = s.replace(bad, good);
    console.log("[FALLBACK FIX]", JSON.stringify(bad.slice(-15)));
    totale++;
  }
}

fs.writeFileSync(path, s, "utf8");
console.log("\nTotale sostituzioni:", totale);

// Verifica residui: cerca i pattern visibili
console.log("\nVerifica:");
console.log('  contiene "â€º":', s.includes("\u00e2\u20ac\u00ba"));
console.log('  contiene "â†":', s.includes("\u00e2\u2020"));
console.log('  contiene "›":', s.includes("\u203a"));
console.log('  contiene "→":', s.includes("\u2192"));
