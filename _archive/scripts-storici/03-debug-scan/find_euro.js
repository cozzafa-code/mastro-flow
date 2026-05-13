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

// Cerca pattern "â,¬" letteralmente
const target = "\u00e2\u002c\u00ac";  // â , ¬

console.log("Cerco 'â,¬' nel repo...");
for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_")) continue;
  const s = fs.readFileSync(f, "utf8");
  const idx = s.indexOf(target);
  if (idx >= 0) {
    // mostro contesto: 30 char prima e 30 dopo
    const ctx = s.substring(Math.max(0,idx-30), idx + 30);
    console.log("FOUND in " + rel);
    console.log("  contesto: " + JSON.stringify(ctx));
    console.log("  codepoints intorno:");
    for (let i = Math.max(0,idx-3); i < idx + 5; i++) {
      console.log("    [" + i + "] U+" + s.charCodeAt(i).toString(16).padStart(4,"0") + " = " + JSON.stringify(s[i]));
    }
  }
}
