const fs = require("fs");
const path = require("path");

const FIXES = [
  ["\u00C3\u00A8", "\u00E8"],
  ["\u00C3\u00A9", "\u00E9"],
  ["\u00C3\u00A0", "\u00E0"],
  ["\u00C3\u00B2", "\u00F2"],
  ["\u00C3\u00B9", "\u00F9"],
  ["\u00C3\u00AC", "\u00EC"],
  ["\u00C2\u00B7", "\u00B7"],
  ["\u00C2\u00B0", "\u00B0"],
  ["\u00C2\u00A7", "\u00A7"],
  ["\u00C2\u00A9", "\u00A9"],
  ["\u00C2\u00AE", "\u00AE"],
  ["\u00C2\u00AB", "\u00AB"],
  ["\u00C2\u00BB", "\u00BB"],
  ["\u00C2\u00A0", " "],
  ["\u00E2\u0080\u0099", "'"],
  ["\u00E2\u0080\u0098", "'"],
  ["\u00E2\u0080\u009C", "\""],
  ["\u00E2\u0080\u009D", "\""],
  ["\u00E2\u0080\u00A6", "..."],
  ["\u00E2\u0080\u0094", "\u2014"],
  ["\u00E2\u0080\u0093", "\u2013"],
  ["\u00E2\u0080\u00A2", "\u2022"],
  ["\u00E2\u0094\u0080", "\u2500"],
  ["\u00E2\u0095\u0090", "\u2550"],
  ["\u00E2\u0095\u0091", "\u2551"],
  ["\u00E2\u0086\u0090", "\u2190"],
  ["\u00E2\u0086\u0092", "\u2192"],
  ["\u00E2\u0086\u0091", "\u2191"],
  ["\u00E2\u0086\u0093", "\u2193"],
  ["\uFEFF", ""],
  ["\u200B", ""],
];

const targets = [
  "app/termini/page.tsx",
  "components/mastro/ui/TabSettings.tsx",
  "components/MastroERP_DESKTOP_NEW.tsx",
  "components/HomePanelMobile.tsx",
  "lib/email.ts",
  "app/impostazioni/page.tsx",
  "components/SecuritySettings.tsx",
  "components/CMDetailPanel.tsx",
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
    console.log("[FIX] " + rel.padEnd(45) + " " + fixedHere);
    totalFixed += fixedHere;
    filesFixed++;
  } else {
    console.log("[OK ] " + rel);
  }
}

console.log("\nTOTALE: " + filesFixed + " file, " + totalFixed + " caratteri");
