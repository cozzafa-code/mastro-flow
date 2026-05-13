const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/HomePanelMobile.tsx";
const buf = fs.readFileSync(path);
const s = buf.toString("utf8");

// trovo la riga 600 "Apri agenda"
const idx = s.indexOf("Apri agenda ");
if (idx < 0) { console.log("not found"); process.exit(1); }

// dump 30 byte dopo "Apri agenda "
const start = idx + "Apri agenda ".length;
const slice = buf.slice(start, start + 30);
const hex = Array.from(slice).map(b => b.toString(16).padStart(2,"0")).join(" ");
console.log("HEX dopo 'Apri agenda ':", hex);
console.log("ASCII:", JSON.stringify(s.substring(start, start + 30)));

// stesso per "VEDI TUTTI "
const idx2 = s.indexOf("VEDI TUTTI ");
if (idx2 >= 0) {
  const start2 = idx2 + "VEDI TUTTI ".length;
  const slice2 = buf.slice(start2, start2 + 20);
  const hex2 = Array.from(slice2).map(b => b.toString(16).padStart(2,"0")).join(" ");
  console.log("\nHEX dopo 'VEDI TUTTI ':", hex2);
  console.log("ASCII:", JSON.stringify(s.substring(start2, start2 + 20)));
}

// stesso per "APRI AGENDA COMPLETA "
const idx3 = s.indexOf("APRI AGENDA COMPLETA ");
if (idx3 >= 0) {
  const start3 = idx3 + "APRI AGENDA COMPLETA ".length;
  const slice3 = buf.slice(start3, start3 + 20);
  const hex3 = Array.from(slice3).map(b => b.toString(16).padStart(2,"0")).join(" ");
  console.log("\nHEX dopo 'APRI AGENDA COMPLETA ':", hex3);
  console.log("ASCII:", JSON.stringify(s.substring(start3, start3 + 20)));
}
