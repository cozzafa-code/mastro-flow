const fs = require("fs");
const path = require("path");

// MAPPA ESTESA
const FIXES = [
  // accentate
  ["\u00C3\u00A8", "\u00E8"], ["\u00C3\u00A9", "\u00E9"], ["\u00C3\u00A0", "\u00E0"],
  ["\u00C3\u00B2", "\u00F2"], ["\u00C3\u00B9", "\u00F9"], ["\u00C3\u00AC", "\u00EC"],
  // simboli
  ["\u00C2\u00B7", "\u00B7"], ["\u00C2\u00B0", "\u00B0"], ["\u00C2\u00A7", "\u00A7"],
  ["\u00C2\u00A9", "\u00A9"], ["\u00C2\u00AE", "\u00AE"], ["\u00C2\u00AB", "\u00AB"],
  ["\u00C2\u00BB", "\u00BB"], ["\u00C2\u00A0", " "],
  // virgolette tipografiche
  ["\u00E2\u0080\u0099", "'"], ["\u00E2\u0080\u0098", "'"],
  ["\u00E2\u0080\u009C", "\""], ["\u00E2\u0080\u009D", "\""],
  ["\u00E2\u0080\u00A6", "..."],
  // dash
  ["\u00E2\u0080\u0094", "\u2014"], ["\u00E2\u0080\u0093", "\u2013"],
  // bullet
  ["\u00E2\u0080\u00A2", "\u2022"],
  // === NUOVI ===
  // Euro €
  ["\u00E2\u0082\u00AC", "\u20AC"],
  // Frecce singole guillemet ‹ ›
  ["\u00E2\u0080\u00BA", "\u203A"],
  ["\u00E2\u0080\u00B9", "\u2039"],
  // Trade mark ™ ®
  ["\u00E2\u0084\u00A2", "\u2122"],
  // Box drawing ─ ═ ║
  ["\u00E2\u0094\u0080", "\u2500"], ["\u00E2\u0095\u0090", "\u2550"], ["\u00E2\u0095\u0091", "\u2551"],
  // Frecce ← → ↑ ↓
  ["\u00E2\u0086\u0090", "\u2190"], ["\u00E2\u0086\u0092", "\u2192"],
  ["\u00E2\u0086\u0091", "\u2191"], ["\u00E2\u0086\u0093", "\u2193"],
  // Check ✓ ✗
  ["\u00E2\u009C\u0093", "\u2713"], ["\u00E2\u009C\u0097", "\u2717"],
  // Stelle ★ ☆
  ["\u00E2\u0098\u0085", "\u2605"], ["\u00E2\u0098\u0086", "\u2606"],
  // Zero-width
  ["\uFEFF", ""], ["\u200B", ""],
];

// Pattern per identificare ANCORA presenti
const RESIDUAL_PATTERNS = [
  "\u00C3\u00A8", "\u00C3\u00A0", "\u00C3\u00B2",
  "\u00C2\u00B7", "\u00C2\u00B0",
  "\u00E2\u0080\u0099", "\u00E2\u0094\u0080", "\u00E2\u0086\u0090",
  "\u00E2\u0082\u00AC", "\u00E2\u0080\u00BA", "\u00E2\u0080\u00B9",
];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir);
  for (const it of items) {
    if (it === "node_modules" || it === ".next" || it === ".git" || it.startsWith(".")) continue;
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if (/\.(tsx?|jsx?|md|css)$/.test(it)) results.push(full);
  }
  return results;
}

const root = "C:/Users/Fabio/Desktop/mastro-erp-new";
const files = walk(root);
console.log("Scansione di " + files.length + " file...\n");

let totalFixed = 0;
let filesFixed = 0;

for (const f of files) {
  // skip file di script che contengono i pattern per definizione
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_encoding") || rel.includes("scan_mojibake") || rel.includes("fix-encoding") || rel.includes("fix-mojibake")) continue;
  
  let s = fs.readFileSync(f, "utf8");
  let fixedHere = 0;

  for (const [bad, good] of FIXES) {
    if (s.includes(bad)) {
      const before = s.split(bad).length - 1;
      s = s.split(bad).join(good);
      fixedHere += before;
    }
  }

  if (fixedHere > 0) {
    fs.writeFileSync(f, s, "utf8");
    console.log("[FIX] " + rel.padEnd(55) + " " + fixedHere);
    totalFixed += fixedHere;
    filesFixed++;
  }
}

console.log("\nTOTALE FIX: " + filesFixed + " file, " + totalFixed + " caratteri\n");

// 2a passata: residui ancora presenti
console.log("Verifica residui:");
let dirty = 0;
for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_encoding") || rel.includes("scan_mojibake") || rel.includes("fix-encoding") || rel.includes("fix-mojibake")) continue;
  const s = fs.readFileSync(f, "utf8");
  let count = 0;
  for (const pat of RESIDUAL_PATTERNS) count += s.split(pat).length - 1;
  if (count > 0) {
    console.log("  " + count.toString().padStart(4) + "  " + rel);
    dirty++;
  }
}
if (dirty === 0) console.log("  Nessun residuo. REPO PULITO.");
