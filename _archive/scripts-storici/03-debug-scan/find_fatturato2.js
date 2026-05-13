const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
const s = fs.readFileSync(path, "utf8");

// Cerca "FATTURATO" (la parola in maiuscolo) e dump 200 char dopo
let pos = 0;
while ((pos = s.indexOf("FATTURATO", pos)) !== -1) {
  const tail = s.substring(pos, pos + 250);
  console.log("\n=== POS " + pos + " ===");
  console.log("text:", JSON.stringify(tail));
  // codepoints non-ASCII
  for (let i = 0; i < tail.length; i++) {
    const c = tail.charCodeAt(i);
    if (c > 127) {
      console.log("  [" + i + "] U+" + c.toString(16).padStart(4,"0") + " = " + JSON.stringify(tail[i]));
    }
  }
  pos += 9;
}
