const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/PreventivoModal.tsx";
let s = fs.readFileSync(path, "utf8");

const oldBlock = "  const handleGeneraPDF = () => {\n    if (!bloccato) { generaPreventivoPDF(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [] }); toast && toast(\"PDF generato\", \"success\"); }\n  };";

const i = s.indexOf(oldBlock);
if (i < 0) { console.error("ERRORE marker non trovato"); process.exit(1); }

const newBlock =
"  const handleGeneraPDF = async () => {\n" +
"    if (bloccato) return;\n" +
"    generaPreventivoPDF(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [] });\n" +
"    toast && toast(\"PDF generato\", \"success\");\n" +
"    try {\n" +
"      const { Day } = await import(\"@/lib/day-logger\");\n" +
"      const importo = c?.totale || c?.importo_totale || c?.preventivo_importo || null;\n" +
"      await Day.prevGenerato({ cm_id: c?.id, importo: importo || undefined });\n" +
"    } catch (e) { console.warn(\"[PreventivoModal] logEvento Day fallito\", e); }\n" +
"  };";

const sNew = s.replace(oldBlock, newBlock);
if (sNew === s) { console.error("ERRORE: replace non ha cambiato nulla"); process.exit(1); }
fs.writeFileSync(path, sNew, "utf8");

console.log("OK Preventivo patchato");
console.log("handleGeneraPDF count:", (sNew.match(/handleGeneraPDF/g) || []).length);
console.log("Day.prevGenerato count:", (sNew.match(/Day\.prevGenerato/g) || []).length);
console.log("day-logger import count:", (sNew.match(/day-logger/g) || []).length);
