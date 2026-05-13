const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const it of fs.readdirSync(dir)) {
    if (it === "node_modules" || it === ".next" || it === ".git" || it.startsWith(".")) continue;
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if (/\.(tsx?|jsx?)$/.test(it)) results.push(full);
  }
  return results;
}

const root = "C:/Users/Fabio/Desktop/mastro-erp-new";
const files = walk(root);

// 1) Fix mojibake â–¾ â–³ (frecce su/giù) e altri pattern Unicode mai pescati
const MOJIBAKE = [
  ["\u00e2\u20ac\u00bb", "\u2014"],   // â€" -> em-dash
  ["\u00e2\u20ac\u201c", "\u2013"],   // â€" -> en-dash  
  ["\u00e2\u2013\u00be", "\u25be"],   // â–¾ -> ▾ (down arrow)
  ["\u00e2\u2013\u00b3", "\u25b3"],   // â–³ -> △ (up arrow)
  ["\u00e2\u2013\u00b4", "\u25b4"],   // â–´ -> ▴
  ["\u00e2\u2013\u00bc", "\u25bc"],   // â–¼ -> ▼
  ["\u00e2\u2013\u00ba", "\u25ba"],   // â–º -> ►
  ["\u00e2\u2013\u00b6", "\u25b6"],   // â–¶ -> ▶
];

// 2) Fix stringhe letterali \uXXXX (regex globale)
function fixUnicodeLiterals(s) {
  // sostituisce \u20ac, \u2192, \u00b7, \u00e8 etc. con il vero carattere Unicode
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    const code = parseInt(hex, 16);
    // Solo Unicode "stampabili" comuni (no \n, \t, etc.)
    if (code >= 0x00a0 && code <= 0xffff) {
      return String.fromCharCode(code);
    }
    return match;
  });
}

let totalMojibake = 0;
let totalLiterals = 0;
let filesFixed = 0;

for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_") || rel.includes("dump_") || rel.includes("find_") || rel.includes("patch_") || rel.includes("update_")) continue;

  let s = fs.readFileSync(f, "utf8");
  let fixedHere = 0;

  // Fix mojibake
  for (const [bad, good] of MOJIBAKE) {
    if (s.includes(bad)) {
      const n = s.split(bad).length - 1;
      s = s.split(bad).join(good);
      fixedHere += n;
      totalMojibake += n;
    }
  }

  // Fix \uXXXX literals
  const before = s;
  s = fixUnicodeLiterals(s);
  if (s !== before) {
    const matchesBefore = (before.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
    const matchesAfter = (s.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
    const litFixed = matchesBefore - matchesAfter;
    fixedHere += litFixed;
    totalLiterals += litFixed;
  }

  if (fixedHere > 0) {
    fs.writeFileSync(f, s, "utf8");
    console.log("[FIX] " + rel.padEnd(55) + " " + fixedHere);
    filesFixed++;
  }
}

console.log("\n=== TOTALE ===");
console.log("File modificati: " + filesFixed);
console.log("Mojibake risolti: " + totalMojibake);
console.log("Literal \\uXXXX risolti: " + totalLiterals);
