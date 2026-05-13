const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
let s = fs.readFileSync(path, "utf8");

// trova "APRI AGENDA COMPLETA " e dump i 5 caratteri Unicode dopo
const idx = s.indexOf("APRI AGENDA COMPLETA ");
if (idx >= 0) {
  const tail = s.substring(idx + 21, idx + 27);
  console.log("Caratteri dopo 'APRI AGENDA COMPLETA ':");
  for (let i = 0; i < tail.length; i++) {
    const c = tail.charCodeAt(i);
    console.log("  [" + i + "] U+" + c.toString(16).padStart(4,"0").toUpperCase() + " = " + JSON.stringify(tail[i]));
  }
}

// trova anche "â†" + 1 char per identificare il pattern
const arrowIdx = s.indexOf("\u00e2\u2020");
if (arrowIdx >= 0) {
  console.log("\n'â†' trovato alla posizione", arrowIdx);
  console.log("Carattere successivo: U+" + s.charCodeAt(arrowIdx + 2).toString(16).padStart(4,"0").toUpperCase());
}
