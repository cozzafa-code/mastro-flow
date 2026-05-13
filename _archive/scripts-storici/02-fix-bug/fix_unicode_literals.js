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

// Sostituzioni: \u20ac -> €, \u00b7 -> ·, \u2192 -> →, \u2014 -> —
const FIXES = [
  ["\\u20ac", "\u20ac"],   // \u20ac -> €
  ["\\u20AC", "\u20ac"],   // \u20AC -> €  
  ["\\u00b7", "\u00b7"],   // \u00b7 -> ·
  ["\\u00B7", "\u00b7"],   // \u00B7 -> ·
  ["\\u2192", "\u2192"],   // \u2192 -> →
  ["\\u2014", "\u2014"],   // \u2014 -> —
  ["\\u00e8", "\u00e8"],   // \u00e8 -> è
  ["\\u00E8", "\u00e8"],
];

let totalFixed = 0;
let filesFixed = 0;

for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_") || rel.includes("dump_") || rel.includes("find_") || rel.includes("patch_") || rel.includes("update_")) continue;

  let s = fs.readFileSync(f, "utf8");
  let fixedHere = 0;

  for (const [bad, good] of FIXES) {
    if (s.includes(bad)) {
      const n = s.split(bad).length - 1;
      s = s.split(bad).join(good);
      fixedHere += n;
    }
  }

  if (fixedHere > 0) {
    fs.writeFileSync(f, s, "utf8");
    console.log("[FIX] " + rel.padEnd(55) + " " + fixedHere);
    totalFixed += fixedHere;
    filesFixed++;
  }
}

console.log("\nTOTALE: " + filesFixed + " file, " + totalFixed + " sostituzioni");
