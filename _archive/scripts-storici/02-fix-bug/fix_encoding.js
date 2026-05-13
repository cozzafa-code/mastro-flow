const fs = require("fs");
const path = require("path");

// FIX: usa codepoint per i caratteri "buoni" cosi PowerShell non li corrompe nel passaggio
const FIXES = [
  // accentate italiane
  ["\u00C3\u00A8", "\u00E8"],   // Ã¨ -> è
  ["\u00C3\u00A9", "\u00E9"],   // Ã© -> é
  ["\u00C3\u00A0", "\u00E0"],   // Ã  -> à
  ["\u00C3\u00B2", "\u00F2"],   // Ã² -> ò
  ["\u00C3\u00B9", "\u00F9"],   // Ã¹ -> ù
  ["\u00C3\u00AC", "\u00EC"],   // Ã¬ -> ì
  // simboli
  ["\u00C2\u00B7", "\u00B7"],   // Â· -> ·
  ["\u00C2\u00B0", "\u00B0"],   // Â° -> °
  ["\u00C2\u00A7", "\u00A7"],   // Â§ -> §
  ["\u00C2\u00A9", "\u00A9"],   // Â© -> ©
  ["\u00C2\u00AE", "\u00AE"],   // Â® -> ®
  ["\u00C2\u00AB", "\u00AB"],   // Â« -> «
  ["\u00C2\u00BB", "\u00BB"],   // Â» -> »
  ["\u00C2\u00A0", " "],        // NBSP corrotto -> spazio
  // virgolette tipografiche
  ["\u00E2\u0080\u0099", "'"],  // ' tipografica -> '
  ["\u00E2\u0080\u0098", "'"],  // ' tipografica -> '
  ["\u00E2\u0080\u009C", "\""], // " -> "
  ["\u00E2\u0080\u009D", "\""], // " -> "
  ["\u00E2\u0080\u00A6", "..."],// ...
  ["\u00E2\u0080\u0094", "\u2014"], // em dash
  ["\u00E2\u0080\u0093", "\u2013"], // en dash
  ["\u00E2\u0080\u00A2", "\u2022"], // bullet
  // box drawing
  ["\u00E2\u0094\u0080", "\u2500"], // ─
  ["\u00E2\u0095\u0090", "\u2550"], // ═
  ["\u00E2\u0095\u0091", "\u2551"], // ║
  // arrows
  ["\u00E2\u0086\u0090", "\u2190"], // ←
  ["\u00E2\u0086\u0092", "\u2192"], // →
  ["\u00E2\u0086\u0091", "\u2191"], // ↑
  ["\u00E2\u0086\u0093", "\u2193"], // ↓
  // BOM e zero-width
  ["\uFEFF", ""],
  ["\u200B", ""],
];

const targets = [
  "components/MastroERP.tsx",
  "components/MisurePanel.tsx",
  "components/PreventivoModal.tsx",
  "components/FotoVanoUploader.tsx",
  "components/MessaggiPanel.tsx",
  "components/day/DaySheet.tsx",
  "components/VanoDetailPanel.tsx",
  "components/MastroDesktop.tsx",
  "hooks/useDay.ts",
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
  "lib/db.ts",
];

const root = "C:/Users/Fabio/Desktop/mastro-erp-new";
let totalFixed = 0;
let filesFixed = 0;

for (const rel of targets) {
  const abs = path.join(root, rel).replace(/\\/g, "/");
  if (!fs.existsSync(abs)) { console.log("[SKIP] " + rel); continue; }

  let s = fs.readFileSync(abs, "utf8");
  let fixedHere = 0;

  for (const [bad, good] of FIXES) {
    if (s.includes(bad)) {
      const before = s.split(bad).length - 1;
      s = s.split(bad).join(good);
      fixedHere += before;
    }
  }

  if (fixedHere > 0) {
    fs.writeFileSync(abs, s, "utf8");
    console.log("[FIX] " + rel.padEnd(42) + " " + fixedHere + " sostituzioni");
    totalFixed += fixedHere;
    filesFixed++;
  } else {
    console.log("[OK ] " + rel.padEnd(42) + " pulito");
  }
}

console.log("\nTOTALE: " + filesFixed + " file corretti, " + totalFixed + " caratteri sostituiti");
