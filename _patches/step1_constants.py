# -*- coding: utf-8 -*-
import os
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST_DIR = ROOT / "lib" / "vano-detail"
DST  = DST_DIR / "constants.ts"

DST_DIR.mkdir(parents=True, exist_ok=True)

CONSTANTS = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / Constants\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S2)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "export const STATO_MISURE = [\n"
    "  { id: \"provvisorie\", label: \"Provvisorie\", color: \"#D08008\", bg: \"#D0800818\", icon: \"\", desc: \"Misure non ancora verificate\" },\n"
    "  { id: \"verificate\",  label: \"Verificate\",  color: \"#D08008\", bg: \"#D0800815\", icon: \"\", desc: \"Verificate sul posto, non ancora confermate\" },\n"
    "  { id: \"confermate\",  label: \"Confermate\",  color: \"#1A9E73\", bg: \"#1A9E7315\", icon: \"\", desc: \"Misure definitive - preventivo sbloccato\" },\n"
    "  { id: \"da_rivedere\", label: \"Da rivedere\", color: \"#DC4444\", bg: \"#DC444415\", icon: \"\", desc: \"Rilevate discrepanze - ricontrollare\" },\n"
    "] as const;\n"
    "\n"
    "export const getStatoMisure = (v: any) =>\n"
    "  STATO_MISURE.find(s => s.id === (v?.statoMisure || \"provvisorie\")) || STATO_MISURE[0];\n"
)

with open(DST, "wb") as f:
    f.write(CONSTANTS.replace("\r\n", "\n").encode("utf-8"))
print("[OK] Creato:", DST)

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

marker_block = "const STATO_MISURE = ["
marker_func  = "const getStatoMisure = (v) => STATO_MISURE.find"
marker_import_anchor = 'import { supabase } from "@/lib/supabase";'

assert marker_block in content, "MARKER STATO_MISURE non trovato"
assert marker_func in content, "MARKER getStatoMisure non trovato"
assert marker_import_anchor in content, "MARKER import supabase non trovato"

# Cerco la riga commento prima di STATO_MISURE (qualunque sia il carattere dei trattini)
# Tagliamo dalla riga di commento "// ... STATI MISURE" fino a dopo getStatoMisure[0];
import re
m_start = re.search(r"//[^\n]*STATI MISURE[^\n]*\n", content)
assert m_start, "MARKER commento '// ... STATI MISURE' non trovato"
idx_start = m_start.start()

end_pattern = 'const getStatoMisure = (v) => STATO_MISURE.find(s => s.id === (v?.statoMisure || "provvisorie")) || STATO_MISURE[0];'
idx_end_marker = content.find(end_pattern, idx_start)
assert idx_end_marker != -1, "MARKER fine getStatoMisure non trovato"
idx_end = idx_end_marker + len(end_pattern)
# Includi newline finale + eventuale riga vuota dopo
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

new_content = content[:idx_start] + content[idx_end:]

new_import = 'import { STATO_MISURE, getStatoMisure } from "@/lib/vano-detail/constants";\n'
anchor = marker_import_anchor + "\n"
assert anchor in new_content, "Anchor import supabase + newline non trovato"
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
