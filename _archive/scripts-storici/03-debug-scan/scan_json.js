const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const it of fs.readdirSync(dir)) {
    if (it === "node_modules" || it === ".next" || it === ".git" || it.startsWith(".")) continue;
    const full = path.join(dir, it);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else if (/\.json$/.test(it)) results.push(full);
  }
  return results;
}

const root = "C:/Users/Fabio/Desktop/mastro-erp-new";
const files = walk(root);
console.log("Scansione " + files.length + " file JSON...");

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (s.includes("\u00e2") || s.includes("\u00c3")) {
    const rel = f.replace(root, "").replace(/\\/g, "/");
    const matches = (s.match(/\u00e2|\u00c3/g) || []).length;
    console.log("[ALERT] " + matches + " mojibake in " + rel);
  }
}
console.log("Done");
