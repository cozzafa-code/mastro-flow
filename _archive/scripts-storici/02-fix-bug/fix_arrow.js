const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
let s = fs.readFileSync(path, "utf8");

const bad = "\u00e2\u2020\u2019";  // â†'
const good = "\u2192";              // →

if (s.includes(bad)) {
  const n = s.split(bad).length - 1;
  s = s.split(bad).join(good);
  fs.writeFileSync(path, s, "utf8");
  console.log("[FIX]", n, "x freccia → corretta");
} else {
  console.log("[skip] pattern non trovato");
}

// verifica finale: nessun â residuo
const counts = {
  "U+00E2 (â)": (s.match(/\u00e2/g) || []).length,
  "U+20AC (€)": (s.match(/\u20ac/g) || []).length,
  "U+2020 (†)": (s.match(/\u2020/g) || []).length,
  "U+203A (›)": (s.match(/\u203a/g) || []).length,
  "U+2192 (→)": (s.match(/\u2192/g) || []).length,
};
console.log("\nResidui codepoint:");
for (const [k,v] of Object.entries(counts)) console.log("  " + k + ": " + v);
