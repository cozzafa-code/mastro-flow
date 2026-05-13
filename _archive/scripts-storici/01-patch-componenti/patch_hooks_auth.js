const fs = require("fs");
const path = require("path");
const root = "C:/Users/Fabio/Desktop/mastro-erp-new";

// Lista completa: hook + lib che hanno createClient locale
const targets = [
  "hooks/useAgenda.ts",
  "hooks/useBacklog.ts",
  "hooks/useSettimana.ts",
  "hooks/useStats.ts",
  "hooks/useTu.ts",
  "hooks/useCommesse.ts",
  "hooks/useCockpit.ts",
  "hooks/useCalendarioOPS.ts",
  "hooks/useFinance.ts",
  "hooks/useProduzione.ts",
  "hooks/useValidatoreVano.ts",
  "lib/day-logger.ts",
];

let okCount = 0, skipCount = 0, errCount = 0;
for (const rel of targets) {
  const abs = path.join(root, rel).replace(/\\/g, "/");
  if (!fs.existsSync(abs)) { console.log(`[SKIP] ${rel} non esiste`); skipCount++; continue; }
  let s = fs.readFileSync(abs, "utf8");
  if (s.includes(`from "@/lib/supabase"`) && !s.includes("createClient")) {
    console.log(`[SKIP] ${rel} gia patchato`); skipCount++; continue;
  }
  
  let modified = false;
  
  // Pattern 1: import { createClient } from "@supabase/supabase-js" (con virgolette doppie o singole)
  const importPatterns = [
    `import { createClient } from "@supabase/supabase-js";`,
    `import { createClient } from '@supabase/supabase-js';`,
    `import {createClient} from "@supabase/supabase-js";`,
    `import {createClient} from '@supabase/supabase-js';`,
  ];
  let importReplaced = false;
  for (const pat of importPatterns) {
    if (s.includes(pat)) {
      s = s.replace(pat, `import { supabase } from "@/lib/supabase";`);
      importReplaced = true;
      modified = true;
      break;
    }
  }
  if (!importReplaced) {
    console.log(`[ERR] ${rel} import createClient non trovato (pattern non riconosciuto)`);
    errCount++; continue;
  }
  
  // Pattern 2: rimuovi tutte le righe che dichiarano SUPABASE_URL, SUPABASE_ANON, supabaseUrl, supabaseKey, e l'invocazione createClient
  // li tolgo riga per riga
  const lines = s.split(/\r?\n/);
  const out = [];
  let inCreateBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // riga di dichiarazione SUPABASE_URL/ANON
    if (/^(const|let|var)\s+(SUPABASE_URL|SUPABASE_ANON|SUPABASE_ANON_KEY|supabaseUrl|supabaseKey)\s*=/.test(line.trim())) continue;
    
    // riga di assegnazione const supabase = createClient(...)  (one-liner)
    if (/^(const|let|var)\s+(supabase|sb)\s*=\s*createClient\(/.test(line.trim()) && line.includes(");")) continue;
    
    // multi-line createClient: const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { ... });
    if (/^(const|let|var)\s+(supabase|sb)\s*=\s*createClient\(/.test(line.trim())) {
      inCreateBlock = true;
      continue;
    }
    if (inCreateBlock) {
      if (line.includes("});") || line.includes(")")) { inCreateBlock = false; continue; }
      continue;
    }
    
    // function sb() { return createClient(...) } - lascio stare per ora se è una function
    
    out.push(line);
  }
  s = out.join("\n");
  
  // verifica finale
  if (s.includes("createClient")) {
    console.log(`[WARN] ${rel} ha ancora createClient residuo - probabilmente function sb() o altro pattern`);
  }
  
  fs.writeFileSync(abs, s, "utf8");
  console.log(`[OK]   ${rel}`);
  okCount++;
}
console.log(`\nTOTALE: ${okCount} patchati, ${skipCount} skip, ${errCount} errori`);
