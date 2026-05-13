const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
let s = fs.readFileSync(path, "utf8");

// Sostituzioni dirette per i 3 punti rotti specifici
const fixes = [
  // freccia destra → (riga 190 "APRI AGENDA COMPLETA â†'")
  ["APRI AGENDA COMPLETA \u00E2\u0086\u0092", "APRI AGENDA COMPLETA \u2192"],
  // guillemet › (riga 291 "VEDI TUTTI â€º")
  ["VEDI TUTTI \u00E2\u0080\u00BA", "VEDI TUTTI \u203A"],
  // guillemet › (riga 600 "Apri agenda â€º")
  ["Apri agenda \u00E2\u0080\u00BA", "Apri agenda \u203A"],
];

let total = 0;
for (const [bad, good] of fixes) {
  if (s.includes(bad)) {
    const n = s.split(bad).length - 1;
    s = s.split(bad).join(good);
    total += n;
    console.log("[FIX]", n, "x", bad.length, "char pattern");
  } else {
    console.log("[skip] pattern non trovato in HomePanelMobile (gia ok?)");
  }
}

// Pulizia generale residui di guillemet/frecce in tutto il file (per sicurezza)
const cleanup = [
  ["\u00E2\u0080\u00BA", "\u203A"],  // ›
  ["\u00E2\u0080\u00B9", "\u2039"],  // ‹
  ["\u00E2\u0086\u0092", "\u2192"],  // →
  ["\u00E2\u0086\u0090", "\u2190"],  // ←
  ["\u00E2\u0082\u00AC", "\u20AC"],  // €
];
for (const [bad, good] of cleanup) {
  while (s.includes(bad)) {
    s = s.replace(bad, good);
    total++;
  }
}

fs.writeFileSync(path, s, "utf8");
console.log("\nOK HomePanelMobile patchato. Sostituzioni totali:", total);

// Verifica residui
const residui = ["\u00E2\u0080", "\u00E2\u0086", "\u00E2\u0082"];
let r = 0;
for (const p of residui) r += s.split(p).length - 1;
console.log("Residui mojibake rimasti:", r);
