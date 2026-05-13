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

// Cerca tutti i caratteri NON-ASCII vicino a "FATTURATO" o "Fatturato"
console.log("Cerco caratteri non-ASCII vicino a 'Fatturato' o '€0' o testi sospetti...");
for (const f of files) {
  const rel = f.replace(root, "").replace(/\\/g, "/");
  if (rel.includes("fix_") || rel.includes("scan_") || rel.includes("debug_") || rel.includes("dump_") || rel.includes("find_")) continue;
  
  const s = fs.readFileSync(f, "utf8");
  
  // Trova "Fatturato" e analizza 60 char dopo
  let pos = 0;
  while ((pos = s.indexOf("Fatturato", pos)) !== -1) {
    const tail = s.substring(pos, pos + 60);
    // se contiene caratteri sospetti (non-ASCII oltre i normali italiani)
    let suspicious = false;
    for (let i = 0; i < tail.length; i++) {
      const c = tail.charCodeAt(i);
      // â (U+00E2) è il più sospetto, anche U+007F-U+00FF range
      if (c === 0x00e2 || c === 0x00ac || c === 0x00c2) { suspicious = true; break; }
    }
    if (suspicious) {
      console.log("\nFile: " + rel + " (pos " + pos + ")");
      console.log("  text: " + JSON.stringify(tail));
      console.log("  HEX:");
      for (let i = 0; i < Math.min(tail.length, 30); i++) {
        const c = tail.charCodeAt(i);
        if (c > 127) console.log("    [" + i + "] U+" + c.toString(16).padStart(4,"0") + " = " + JSON.stringify(tail[i]));
      }
    }
    pos += 9;
  }
}
