const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const it of fs.readdirSync(dir)) {
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

// Pattern vero: U+00E2 U+201A U+00AC = â‚¬ (corruzione di €)
const bad = "\u00e2\u201a\u00ac";
const good = "\u20ac";  // €

let totalFixed = 0;
let filesFixed = 0;

for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_") || rel.includes("dump_") || rel.includes("find_") || rel.includes("patch_")) continue;

  let s = fs.readFileSync(f, "utf8");
  if (!s.includes(bad)) continue;
  
  const n = s.split(bad).length - 1;
  s = s.split(bad).join(good);
  fs.writeFileSync(f, s, "utf8");
  console.log("[FIX] " + rel.padEnd(55) + " " + n);
  totalFixed += n;
  filesFixed++;
}

console.log("\nTOTALE: " + filesFixed + " file, " + totalFixed + " sostituzioni");

// Verifica residui finali nel repo
console.log("\nVerifica residui â‚¬:");
let still = 0;
for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_") || rel.includes("dump_") || rel.includes("find_") || rel.includes("patch_")) continue;
  const s = fs.readFileSync(f, "utf8");
  if (s.includes(bad)) {
    console.log("  STILL DIRTY: " + rel);
    still++;
  }
}
if (still === 0) console.log("  Pulito.");
