const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/hooks/useDay.ts";
let s = fs.readFileSync(path, "utf8");

// 1. Sostituisci import createClient con import supabase
const oldImport = `import { createClient } from "@supabase/supabase-js";`;
const newImport = `import { supabase } from "@/lib/supabase";`;
if (!s.includes(oldImport)) { console.error("ERRORE: import createClient non trovato"); process.exit(1); }
s = s.replace(oldImport, newImport);

// 2. Rimuovi le 4 righe SUPABASE_URL/ANON/createClient (il blocco compatto)
// Cerco la stringa "const SUPABASE_URL" e cancello fino alla chiusura "});"
const startStr = "const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!";
const i = s.indexOf(startStr);
if (i < 0) { console.error("ERRORE: SUPABASE_URL non trovato"); process.exit(1); }
const endMarker = "autoRefreshToken: true },\n});";
const j = s.indexOf(endMarker, i);
if (j < 0) {
  // forse newline diverse, prova \r\n
  const endMarker2 = "autoRefreshToken: true },\r\n});";
  const j2 = s.indexOf(endMarker2, i);
  if (j2 < 0) { console.error("ERRORE: chiusura createClient non trovata"); process.exit(1); }
  s = s.substring(0, i) + s.substring(j2 + endMarker2.length).replace(/^\r?\n/, "");
} else {
  s = s.substring(0, i) + s.substring(j + endMarker.length).replace(/^\r?\n/, "");
}

fs.writeFileSync(path, s, "utf8");
console.log("OK useDay patchato");
console.log("import supabase count:", (s.match(/from "@\/lib\/supabase"/g) || []).length);
console.log("createClient count:", (s.match(/createClient/g) || []).length);
console.log("SUPABASE_URL count:", (s.match(/SUPABASE_URL/g) || []).length);
