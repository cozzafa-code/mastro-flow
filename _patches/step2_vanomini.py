# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST_DIR = ROOT / "components" / "vano-detail" / "parts"
DST  = DST_DIR / "VanoMiniSVG.tsx"

DST_DIR.mkdir(parents=True, exist_ok=True)

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

# Trova inizio funzione
sig = "function VanoMiniSVG("
idx_start = content.find(sig)
assert idx_start != -1, "MARKER 'function VanoMiniSVG(' non trovato"

# Scorri la firma: chiudi le parentesi della firma fino a depth_paren==0
# poi cerca '{' (apertura corpo) saltando spazi e annotazioni di tipo.
i = idx_start + len(sig)
depth_paren = 1
in_str = None
while i < len(content):
    ch = content[i]
    if in_str:
        if ch == in_str and content[i-1] != "\\":
            in_str = None
        i += 1
        continue
    if ch in ('"', "'", "`"):
        in_str = ch
        i += 1
        continue
    if ch == "(":
        depth_paren += 1
    elif ch == ")":
        depth_paren -= 1
        if depth_paren == 0:
            i += 1
            break
    elif ch == "{":
        # Eventuale type annotation inline tipo {a:string}
        # gestita come blocco bilanciato
        sub = 1
        i += 1
        while i < len(content) and sub > 0:
            c2 = content[i]
            if c2 == "{":
                sub += 1
            elif c2 == "}":
                sub -= 1
            i += 1
        continue
    i += 1

assert depth_paren == 0, "Parentesi firma non bilanciate"

# Da qui, salta spazi/tab/newline e annotazioni di tipo (": ...") fino a '{' apertura corpo
# Strategia: scorri caratteri saltando whitespace; se incontri ':' avanzi finche'
# non trovi '{' al depth 0 (apertura corpo).
while i < len(content) and content[i] in (" ", "\t", "\n", "\r"):
    i += 1

# Se c'e' annotazione tipo ritorno (": Tipo"), saltala fino a '{'
if i < len(content) and content[i] == ":":
    # consuma tutto fino al primo '{' a depth 0
    sub_brace = 0
    sub_paren = 0
    in_str = None
    i += 1
    while i < len(content):
        c = content[i]
        if in_str:
            if c == in_str and content[i-1] != "\\":
                in_str = None
            i += 1
            continue
        if c in ('"', "'", "`"):
            in_str = c
            i += 1
            continue
        if c == "(":
            sub_paren += 1
        elif c == ")":
            sub_paren -= 1
        elif c == "{":
            if sub_paren == 0 and sub_brace == 0:
                # questo e' il '{' apertura corpo
                break
            sub_brace += 1
        elif c == "}":
            sub_brace -= 1
        i += 1

assert i < len(content) and content[i] == "{", "Apertura corpo VanoMiniSVG non trovata"

# Conta graffe del corpo
depth_brace = 1
i += 1
in_str = None
while i < len(content) and depth_brace > 0:
    ch = content[i]
    if in_str:
        if ch == in_str and content[i-1] != "\\":
            in_str = None
        i += 1
        continue
    if ch in ('"', "'", "`"):
        in_str = ch
        i += 1
        continue
    if ch == "{":
        depth_brace += 1
    elif ch == "}":
        depth_brace -= 1
    i += 1

assert depth_brace == 0, "Corpo VanoMiniSVG non bilanciato"
idx_end = i

# Includi newline finale
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

original = content[idx_start:idx_end].rstrip() + "\n"

assert "return (" in original, "Estratto non contiene 'return ('"
assert "</svg>" in original, "Estratto non contiene '</svg>'"
assert original.count("\n") >= 20, "Estratto troppo corto (atteso ~30 righe)"

HEADER = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / VanoMiniSVG\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S2)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "import React from \"react\";\n"
    "\n"
)

component_code = re.sub(
    r"^function VanoMiniSVG\(",
    "export default function VanoMiniSVG(",
    original,
    count=1,
    flags=re.MULTILINE
)

with open(DST, "wb") as f:
    f.write((HEADER + component_code).replace("\r\n", "\n").encode("utf-8"))
print("[OK] Creato:", DST)
print("     Lunghezza estratto:", idx_end - idx_start, "char,", original.count("\n"), "righe")

# Rimuovi dal sorgente
new_content = content[:idx_start] + content[idx_end:]

anchor = 'import AccessoriCatalogoVano from "./AccessoriCatalogoVano";\n'
assert anchor in new_content, "Anchor AccessoriCatalogoVano non trovato"
new_import = 'import VanoMiniSVG from "./vano-detail/parts/VanoMiniSVG";\n'
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
