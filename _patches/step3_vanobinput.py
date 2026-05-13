# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST_DIR = ROOT / "components" / "vano-detail" / "parts"
DST  = DST_DIR / "VanoBInput.tsx"

DST_DIR.mkdir(parents=True, exist_ok=True)

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

sig = "function VanoBInput("
idx_start = content.find(sig)
assert idx_start != -1, "MARKER 'function VanoBInput(' non trovato"

# Stessa logica dello Step 2: chiudi parentesi firma, poi salta annotazione tipo,
# poi conta graffe corpo.
i = idx_start + len(sig)
depth_paren = 1
in_str = None

def advance_string(content, i, quote):
    i += 1
    while i < len(content):
        if content[i] == "\\":
            i += 2
            continue
        if content[i] == quote:
            return i + 1
        i += 1
    return i

# Chiudi parentesi firma
while i < len(content):
    ch = content[i]
    if ch in ('"', "'", "`"):
        i = advance_string(content, i, ch)
        continue
    if ch == "(":
        depth_paren += 1
    elif ch == ")":
        depth_paren -= 1
        if depth_paren == 0:
            i += 1
            break
    elif ch == "{":
        sub = 1
        i += 1
        while i < len(content) and sub > 0:
            c2 = content[i]
            if c2 in ('"', "'", "`"):
                i = advance_string(content, i, c2)
                continue
            if c2 == "{":
                sub += 1
            elif c2 == "}":
                sub -= 1
            i += 1
        continue
    i += 1

assert depth_paren == 0, "Parentesi firma non bilanciate"

# Salta whitespace
while i < len(content) and content[i] in (" ", "\t", "\n", "\r"):
    i += 1

# Salta eventuale annotazione tipo ritorno ": ..." fino a '{'
if i < len(content) and content[i] == ":":
    sub_brace = 0
    sub_paren = 0
    i += 1
    while i < len(content):
        c = content[i]
        if c in ('"', "'", "`"):
            i = advance_string(content, i, c)
            continue
        if c == "(":
            sub_paren += 1
        elif c == ")":
            sub_paren -= 1
        elif c == "{":
            if sub_paren == 0 and sub_brace == 0:
                break
            sub_brace += 1
        elif c == "}":
            sub_brace -= 1
        i += 1

assert i < len(content) and content[i] == "{", "Apertura corpo VanoBInput non trovata"

# Conta graffe corpo
depth_brace = 1
i += 1
while i < len(content) and depth_brace > 0:
    ch = content[i]
    if ch in ('"', "'", "`"):
        i = advance_string(content, i, ch)
        continue
    if ch == "{":
        depth_brace += 1
    elif ch == "}":
        depth_brace -= 1
    i += 1

assert depth_brace == 0, "Corpo VanoBInput non bilanciato"
idx_end = i

# Includi newline finale
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

original = content[idx_start:idx_end].rstrip() + "\n"

assert "return (" in original, "Estratto non contiene 'return ('"
assert "onUpdate" in original, "Estratto non contiene 'onUpdate'"
assert original.count("\n") >= 20, "Estratto troppo corto"

HEADER = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / VanoBInput\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S2)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "import React from \"react\";\n"
    "import { FF } from \"@/components/mastro-constants\";\n"
    "\n"
)

component_code = re.sub(
    r"^function VanoBInput\(",
    "export default function VanoBInput(",
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

# Aggiungi import dopo l'import VanoMiniSVG (gia' presente da Step 2)
anchor = 'import VanoMiniSVG from "./vano-detail/parts/VanoMiniSVG";\n'
assert anchor in new_content, "Anchor VanoMiniSVG non trovato"
new_import = 'import VanoBInput from "./vano-detail/parts/VanoBInput";\n'
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
