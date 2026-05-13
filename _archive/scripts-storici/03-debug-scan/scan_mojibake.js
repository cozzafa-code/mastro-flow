const fs = require("fs");
const path = require("path");

// pattern che identificano mojibake
const MOJIBAKE_PATTERNS = [
  "\u00C3\u00A8",  // Ã¨
  "\u00C3\u00A0",  // Ã 
  "\u00C3\u00B2",  // Ã²
  "\u00C2\u00B7",  // Â·
  "\u00C2\u00B0",  // Â°
  "\u00E2\u0080\u0099",  // ' tipografica corrotta
  "\u00E2\u0094\u0080",  // box drawing ─
  "\u00E2\u0086\u0090",  // arrow ←
];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir);
  for (const it of items) {
    if (it === "node_modules" || it === ".next" || it === ".git" || it.startsWith(".")) continue;
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if (/\.(tsx?|jsx?|md)$/.test(it)) results.push(full);
  }
  return results;
}

const root = "C:/Users/Fabio/Desktop/mastro-erp-new";
const files = walk(root);
console.log("Scansione di " + files.length + " file...\n");

const dirty = [];
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  let count = 0;
  for (const pat of MOJIBAKE_PATTERNS) {
    count += (s.split(pat).length - 1);
  }
  if (count > 0) {
    dirty.push({ file: f.replace(root, "").replace(/\\/g, "/"), count });
  }
}

if (dirty.length === 0) {
  console.log("Nessun file con mojibake trovato. Repo pulito.");
} else {
  console.log("File con mojibake residuo:");
  dirty.sort((a,b) => b.count - a.count);
  for (const d of dirty.slice(0, 30)) {
    console.log("  " + d.count.toString().padStart(4) + "  " + d.file);
  }
  console.log("\nTotale: " + dirty.length + " file");
}
