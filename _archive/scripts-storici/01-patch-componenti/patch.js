const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MisurePanel.tsx";
let s = fs.readFileSync(path, "utf8");

const startMarker = "if (statoGlobale === \u0027completato\u0027) {\n        try {";
const endMarker = "if (statoGlobale === \u0027completato\u0027) onComplete?.();";

const i = s.indexOf(startMarker);
const j = s.indexOf(endMarker);
if (i < 0 || j < 0) { console.error("ERRORE markers", i, j); process.exit(1); }

const BT = String.fromCharCode(96);
const DOT = "·";

const titoloLine = "          titolo_breve: isComplete ? \u0027Misure vano completate\u0027 : " + BT + "Misure salvate " + DOT + " ${percCompilazione}%" + BT + ",";
const contestoLine = "          contesto: cm ? " + BT + "${cm.code ?? \u0027\u0027} " + DOT + " ${cm.nome_cliente ?? \u0027\u0027}" + BT + ".trim() : null,";

const newBlock =
"try {\n" +
"        const { data: vanoInfo } = await supabase\n" +
"          .from(\u0027vani\u0027)\n" +
"          .select(\u0027commessa_id, commesse(code, nome_cliente)\u0027)\n" +
"          .eq(\u0027id\u0027, vanoId)\n" +
"          .maybeSingle();\n" +
"        const cm: any = vanoInfo?.commesse;\n" +
"        const isComplete = statoGlobale === \u0027completato\u0027;\n" +
"        await logEvento({\n" +
"          tipo: \u0027misure_salvate\u0027,\n" +
"          modulo_origine: \u0027misure\u0027,\n" +
"          cm_id: vanoInfo?.commessa_id ?? null,\n" +
titoloLine + "\n" +
contestoLine + "\n" +
"          payload: { vano_id: vanoId, completate: isComplete, perc: percCompilazione },\n" +
"        });\n" +
"      } catch (logErr) {\n" +
"        console.warn(\u0027[MisurePanel] logEvento Day fallito\u0027, logErr);\n" +
"      }\n" +
"      ";

const sNew = s.substring(0, i) + newBlock + s.substring(j);
fs.writeFileSync(path, sNew, "utf8");

console.log("OK patch applicata");
console.log("titolo_breve count:", (sNew.match(/titolo_breve/g) || []).length);
console.log("isComplete count:", (sNew.match(/isComplete/g) || []).length);
console.log("Misure salvate count:", (sNew.match(/Misure salvate/g) || []).length);
