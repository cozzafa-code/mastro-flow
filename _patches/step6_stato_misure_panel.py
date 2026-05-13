# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST_DIR = ROOT / "components" / "vano-detail" / "overlays"
DST  = DST_DIR / "StatoMisurePanel.tsx"

DST_DIR.mkdir(parents=True, exist_ok=True)

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

# Cerco il commento separatore prima del blocco
start_marker = "PANEL SELEZIONE STATO MISURE"
m = re.search(r"\{/\*[^\n]*" + start_marker + r"[^\n]*\*/\}\n", content)
assert m, "Marker commento '... PANEL SELEZIONE STATO MISURE ...' non trovato"

# Vai a inizio riga del commento
i = m.start()
while i > 0 and content[i-1] != "\n":
    i -= 1
idx_start = i

# Trova condizionale
cond_start = content.find("{showStatoMisurePanel && (", idx_start)
assert cond_start != -1, "Condizionale showStatoMisurePanel non trovato"

# Conta graffe condizionale (stessa logica Step 5)
k = cond_start
assert content[k] == "{"
depth_brace = 1
k += 1
in_str = None
while k < len(content) and depth_brace > 0:
    ch = content[k]
    if in_str:
        if ch == in_str and content[k-1] != "\\":
            in_str = None
        k += 1
        continue
    if ch in ('"', "'", "`"):
        in_str = ch
        k += 1
        continue
    if ch == "{":
        depth_brace += 1
    elif ch == "}":
        depth_brace -= 1
    k += 1

idx_end = k
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

original_block = content[idx_start:idx_end]
assert "STATO_MISURE.map" in original_block
assert "setShowStatoMisurePanel(false)" in original_block
assert "updateVanoField(v.id, \"statoMisure\"" in original_block

# Estraggo body JSX: tra "(" dopo "&& " e ")" matching
body_open = content.find("(", cond_start)
depth_p = 1
b = body_open + 1
in_str = None
while b < len(content) and depth_p > 0:
    ch = content[b]
    if in_str:
        if ch == in_str and content[b-1] != "\\":
            in_str = None
        b += 1
        continue
    if ch in ('"', "'", "`"):
        in_str = ch
        b += 1
        continue
    if ch == "(":
        depth_p += 1
    elif ch == ")":
        depth_p -= 1
    b += 1
body_close = b - 1
jsx_body = content[body_open+1:body_close]

# Trasformazioni nel componente estratto:
new_body = jsx_body
# 1) Click esterno: chiusura overlay
new_body = new_body.replace(
    "onClick={() => setShowStatoMisurePanel(false)}",
    "onClick={() => onClose()}"
)
# 2) Theme T -> theme
new_body = re.sub(r"\bT\.bdr\b", "theme.bdr", new_body)
new_body = re.sub(r"\bT\.card\b", "theme.card", new_body)
new_body = re.sub(r"\bT\.text\b", "theme.text", new_body)
new_body = re.sub(r"\bT\.sub\b", "theme.sub", new_body)
new_body = re.sub(r"\bT\.bg\b", "theme.bg", new_body)
# 3) v.nome -> vano.nome, v.statoMisure -> vano.statoMisure
new_body = new_body.replace("v.nome", "vano.nome")
new_body = new_body.replace("v.statoMisure", "vano.statoMisure")
# 4) Il blocco di update consolida in onSelectStato + onClose
old_update = (
    'updateVanoField(v.id, "statoMisure", sm.id);\n'
    '                  setSelectedVano(prev => ({ ...prev, statoMisure: sm.id }));\n'
    '                  setShowStatoMisurePanel(false);'
)
new_update = (
    "onSelectStato(sm.id);\n"
    "                  onClose();"
)
assert old_update in new_body, "Pattern update non trovato (verifica indentazione)"
new_body = new_body.replace(old_update, new_update)

HEADER = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / StatoMisurePanel\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S6)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "import React from \"react\";\n"
    "import { STATO_MISURE } from \"@/lib/vano-detail/constants\";\n"
    "\n"
    "interface StatoMisurePanelProps {\n"
    "  vano: any;\n"
    "  theme: { bg: string; card: string; bdr: string; text: string; sub: string };\n"
    "  onSelectStato: (statoId: string) => void;\n"
    "  onClose: () => void;\n"
    "}\n"
    "\n"
    "export default function StatoMisurePanel({\n"
    "  vano,\n"
    "  theme,\n"
    "  onSelectStato,\n"
    "  onClose,\n"
    "}: StatoMisurePanelProps) {\n"
    "  return (\n"
)
FOOTER = (
    "\n  );\n"
    "}\n"
)

with open(DST, "wb") as f:
    f.write((HEADER + new_body + FOOTER).replace("\r\n", "\n").encode("utf-8"))
print("[OK] Creato:", DST)
print("     Lunghezza body:", body_close - body_open, "char")
print("     Righe componente:", (HEADER + new_body + FOOTER).count("\n"))

# Sostituisco nel sorgente
replacement = (
    "      {/* === PANEL SELEZIONE STATO MISURE === */}\n"
    "      {showStatoMisurePanel && (\n"
    "        <StatoMisurePanel\n"
    "          vano={v}\n"
    "          theme={T}\n"
    "          onSelectStato={(statoId) => {\n"
    "            updateVanoField(v.id, \"statoMisure\", statoId);\n"
    "            setSelectedVano(prev => ({ ...prev, statoMisure: statoId }));\n"
    "          }}\n"
    "          onClose={() => setShowStatoMisurePanel(false)}\n"
    "        />\n"
    "      )}\n"
    "\n"
)

new_content = content[:idx_start] + replacement + content[idx_end:]

# Aggiungi import dopo ReportOverlay
anchor = 'import ReportOverlay from "./vano-detail/overlays/ReportOverlay";\n'
assert anchor in new_content, "Anchor ReportOverlay non trovato"
new_import = 'import StatoMisurePanel from "./vano-detail/overlays/StatoMisurePanel";\n'
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
