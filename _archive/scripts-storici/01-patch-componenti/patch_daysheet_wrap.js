const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/day/DaySheet.tsx";
let s = fs.readFileSync(path, "utf8");

// 1. zIndex: 90 -> 9999 nell'overlay
const oldZ = `position: "fixed", inset: 0, zIndex: 90,`;
const newZ = `position: "fixed", inset: 0, zIndex: 9999,`;
if (!s.includes(oldZ)) { console.error("ERRORE zIndex non trovato"); process.exit(1); }
s = s.replace(oldZ, newZ);

// 2. tolgo maxWidth 480 dal sheet
const oldW = `background: "#F4F6F5", width: "100%", maxWidth: 480,`;
const newW = `background: "#F4F6F5", width: "100%",`;
if (!s.includes(oldW)) { console.error("ERRORE maxWidth non trovato"); process.exit(1); }
s = s.replace(oldW, newW);

fs.writeFileSync(path, s, "utf8");
console.log("OK DaySheet wrapper sistemato");
console.log("zIndex 9999 count:", (s.match(/zIndex: 9999/g) || []).length);
console.log("maxWidth 480 residui:", (s.match(/maxWidth: 480/g) || []).length);
