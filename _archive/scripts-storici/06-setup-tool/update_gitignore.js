const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/.gitignore";
let s = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";

if (!s.includes("# Patch scripts (one-shot, locali)")) {
  s += "\n\n# Patch scripts (one-shot, locali)\nfix_encoding.js\nfix_encoding2.js\nscan_mojibake.js\npatch_*.js\n";
  fs.writeFileSync(path, s, "utf8");
  console.log("OK .gitignore aggiornato");
} else {
  console.log("SKIP .gitignore gia ok");
}
