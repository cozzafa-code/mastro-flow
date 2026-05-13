const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/FotoVanoUploader.tsx";
let s = fs.readFileSync(path, "utf8");

// marker univoco — cerco solo "onChange?.(aggiornate);" all'interno di upload
const marker = "        onChange?.(aggiornate);";
const i = s.indexOf(marker);
if (i < 0) { console.error("ERRORE marker non trovato"); process.exit(1); }

// inserisco dopo questa riga + newline
const insertAt = i + marker.length;

const inject =
"\n" +
"        try {\n" +
"          const { Day } = await import(\"@/lib/day-logger\");\n" +
"          const { createClient } = await import(\"@supabase/supabase-js\");\n" +
"          const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);\n" +
"          const { data: vanoInfo } = await sb.from(\"vani\").select(\"commessa_id\").eq(\"id\", vanoId).maybeSingle();\n" +
"          await Day.fotoCaricate({ vano_id: vanoId, cm_id: vanoInfo?.commessa_id ?? undefined, count: 1 });\n" +
"        } catch (e) { console.warn(\"[FotoVanoUploader] logEvento Day fallito\", e); }";

// evita doppio inject se già patchato
if (s.includes("Day.fotoCaricate")) { console.error("Gia patchato, skip"); process.exit(0); }

const sNew = s.substring(0, insertAt) + inject + s.substring(insertAt);
fs.writeFileSync(path, sNew, "utf8");

console.log("OK Foto patchato");
console.log("Day.fotoCaricate count:", (sNew.match(/Day\.fotoCaricate/g) || []).length);
console.log("day-logger import count:", (sNew.match(/day-logger/g) || []).length);
