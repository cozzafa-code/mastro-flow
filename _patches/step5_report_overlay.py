# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST_DIR = ROOT / "components" / "vano-detail" / "overlays"
DST  = DST_DIR / "ReportOverlay.tsx"

DST_DIR.mkdir(parents=True, exist_ok=True)

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

# Trova il blocco overlay: dal commento "{/* OVERLAY REPORT RILIEVO */}"
# (sopra alla condizione) fino alla chiusura "      )}" che termina il
# blocco showReportOverlay
start_marker = "{/* OVERLAY REPORT RILIEVO */}"
idx_start_marker = content.find(start_marker)
assert idx_start_marker != -1, "MARKER inizio overlay non trovato"

# Vai a inizio riga del commento
i = idx_start_marker
while i > 0 and content[i-1] != "\n":
    i -= 1
idx_start = i

# Trova fine: cerca "{showReportOverlay && selectedRilievo && (" dopo idx_start,
# poi conta graffe del JSX fino a ")}" alla stessa indentazione.
cond_start = content.find("{showReportOverlay && selectedRilievo && (", idx_start)
assert cond_start != -1, "Condizione showReportOverlay non trovata"

# Conta graffe a partire dalla '{' iniziale del condizionale
k = cond_start
assert content[k] == "{", "Atteso '{' all'inizio del condizionale"
depth_brace = 1
depth_paren = 0
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
    elif ch == "(":
        depth_paren += 1
    elif ch == ")":
        depth_paren -= 1
    k += 1

assert depth_brace == 0, "Condizionale showReportOverlay non bilanciato"
idx_end = k  # subito dopo '}' chiusura

# Includi newline finale (e righe vuote dopo)
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

original_block = content[idx_start:idx_end]
assert "selectedRilievo" in original_block
assert "showReportOverlay" in original_block
assert original_block.count("\n") >= 100, "Blocco troppo corto"

# Estraggo il corpo JSX: tutto cio' che sta dentro "showReportOverlay && selectedRilievo && (" ... ")}"
# Cerco apertura parentesi "(" dopo "&& "
body_open = content.find("(", cond_start)
# Conta parentesi
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
body_close = b - 1  # ')' di chiusura
jsx_body = content[body_open+1:body_close]

# === Costruisco componente esterno ===
# Sostituisco i riferimenti al setter del padre con prop onClose, e i setter
# di stato con prop callback. Visto che la firma sopra:
#   setShowReportOverlay(false) -> onClose()
#   setCantieri(...) -> setCantieri(...) (passato come prop)
#   setSelectedRilievo(...) -> setSelectedRilievo(...) (passato come prop)
# Selezione conservativa: passo selectedRilievo, selectedCM, setCantieri,
# setSelectedRilievo, onClose come prop. Lascio supabase dinamico, FF importato.

new_body = jsx_body
new_body = new_body.replace("setShowReportOverlay(false)", "onClose()")

HEADER = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / Report Overlay\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S5)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "import React from \"react\";\n"
    "import { FF } from \"@/components/mastro-constants\";\n"
    "\n"
    "interface ReportOverlayProps {\n"
    "  selectedRilievo: any;\n"
    "  selectedCM: any;\n"
    "  setCantieri: (updater: (cs: any[]) => any[]) => void;\n"
    "  setSelectedRilievo: (r: any) => void;\n"
    "  onClose: () => void;\n"
    "}\n"
    "\n"
    "export default function ReportOverlay({\n"
    "  selectedRilievo,\n"
    "  selectedCM,\n"
    "  setCantieri,\n"
    "  setSelectedRilievo,\n"
    "  onClose,\n"
    "}: ReportOverlayProps) {\n"
    "  if (!selectedRilievo) return null;\n"
    "  return (\n"
)
FOOTER = (
    "\n  );\n"
    "}\n"
)

with open(DST, "wb") as f:
    f.write((HEADER + new_body + FOOTER).replace("\r\n", "\n").encode("utf-8"))
print("[OK] Creato:", DST)
print("     Lunghezza body estratto:", body_close - body_open, "char")
print("     Righe componente:", (HEADER + new_body + FOOTER).count("\n"))

# === Sostituisco nel sorgente con tag JSX ===
replacement = (
    "      {/* OVERLAY REPORT RILIEVO */}\n"
    "      {showReportOverlay && selectedRilievo && (\n"
    "        <ReportOverlay\n"
    "          selectedRilievo={selectedRilievo}\n"
    "          selectedCM={selectedCM}\n"
    "          setCantieri={setCantieri}\n"
    "          setSelectedRilievo={setSelectedRilievo}\n"
    "          onClose={() => setShowReportOverlay(false)}\n"
    "        />\n"
    "      )}\n"
    "\n"
)

new_content = content[:idx_start] + replacement + content[idx_end:]

# Aggiungi import dopo l'ultimo import dello Step 4
anchor = 'import { uploadFotoVano, deleteFotoVano } from "@/lib/vano-detail/foto-storage";\n'
assert anchor in new_content, "Anchor foto-storage non trovato"
new_import = 'import ReportOverlay from "./vano-detail/overlays/ReportOverlay";\n'
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
