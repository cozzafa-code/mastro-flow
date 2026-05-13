# -*- coding: utf-8 -*-
import re
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DST  = ROOT / "lib" / "vano-detail" / "foto-storage.ts"

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

# Marker inizio: eventuale riga commento "// ── Upload foto" sopra,
# altrimenti direttamente "async function uploadFotoVano"
fn1 = "async function uploadFotoVano("
fn2 = "async function deleteFotoVano("
idx_fn1 = content.find(fn1)
idx_fn2 = content.find(fn2)
assert idx_fn1 != -1, "MARKER uploadFotoVano non trovato"
assert idx_fn2 != -1, "MARKER deleteFotoVano non trovato"
assert idx_fn2 > idx_fn1, "Ordine funzioni inatteso"

# Trova inizio blocco: scorri all'indietro da idx_fn1 fino a trovare una riga
# che inizia con "// ─" o "// --" (separatore) oppure due newline consecutivi
i = idx_fn1
# Vai a inizio riga corrente
while i > 0 and content[i-1] != "\n":
    i -= 1
# Controlla se la riga precedente e' un commento separatore "// ..." con trattini
prev_line_end = i - 1  # punta al \n della riga precedente
if prev_line_end > 0:
    j = prev_line_end - 1
    while j > 0 and content[j] != "\n":
        j -= 1
    prev_line = content[j+1:prev_line_end]
    # se la riga precedente e' un commento che parla di foto/upload, inizia da li'
    if re.match(r"^\s*//.*[Ff]oto|^\s*//.*[Uu]pload", prev_line):
        i = j + 1

idx_start = i

# Trova fine: dalla idx_fn2 conta graffe del corpo deleteFotoVano
def find_body_end(content, idx_fn):
    # Trova prima '{' dopo "function ... ("  saltando parentesi della firma
    k = idx_fn
    depth_paren = 0
    in_str = None
    # Avanza fino ad apertura parentesi firma
    while k < len(content) and content[k] != "(":
        k += 1
    depth_paren = 1
    k += 1
    while k < len(content) and depth_paren > 0:
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
        if ch == "(":
            depth_paren += 1
        elif ch == ")":
            depth_paren -= 1
        k += 1
    # Salta spazi/tab fino a '{'
    while k < len(content) and content[k] in (" ", "\t", "\n", "\r"):
        k += 1
    # eventuale return type
    if content[k] == ":":
        sub_brace = 0
        sub_paren = 0
        k += 1
        while k < len(content):
            c = content[k]
            if c in ('"', "'", "`"):
                quote = c
                k += 1
                while k < len(content):
                    if content[k] == "\\":
                        k += 2
                        continue
                    if content[k] == quote:
                        k += 1
                        break
                    k += 1
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
            k += 1
    assert content[k] == "{", "Apertura corpo non trovata"
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
    return k  # subito dopo '}' chiusura corpo

idx_end_fn2 = find_body_end(content, idx_fn2)
idx_end = idx_end_fn2
# Includi newline finale
while idx_end < len(content) and content[idx_end] in ("\n", "\r"):
    idx_end += 1

original = content[idx_start:idx_end]

# Sanity
assert "supabase.storage" in original, "Estratto non contiene 'supabase.storage'"
assert "uploadFotoVano" in original, "Estratto non contiene 'uploadFotoVano'"
assert "deleteFotoVano" in original, "Estratto non contiene 'deleteFotoVano'"

# Costruisci file destinazione: aggiungi export alle 2 funzioni + import supabase
extracted = original
extracted = re.sub(
    r"async function uploadFotoVano\(",
    "export async function uploadFotoVano(",
    extracted,
    count=1
)
extracted = re.sub(
    r"async function deleteFotoVano\(",
    "export async function deleteFotoVano(",
    extracted,
    count=1
)

HEADER = (
    "// " + "=" * 70 + "\n"
    "// MASTRO ERP - Vano Detail / Foto Storage helpers\n"
    "// Estratto da components/VanoDetailPanel.tsx (refactor S4)\n"
    "// " + "=" * 70 + "\n"
    "\n"
    "import { supabase } from \"@/lib/supabase\";\n"
    "\n"
)

DST.parent.mkdir(parents=True, exist_ok=True)
with open(DST, "wb") as f:
    f.write((HEADER + extracted).replace("\r\n", "\n").encode("utf-8"))
print("[OK] Creato:", DST)
print("     Lunghezza estratto:", idx_end - idx_start, "char,", original.count("\n"), "righe")

# Rimuovi dal sorgente
new_content = content[:idx_start] + content[idx_end:]

# Aggiungi import dopo l'ultimo import esistente (VanoBInput da Step 3)
anchor = 'import VanoBInput from "./vano-detail/parts/VanoBInput";\n'
assert anchor in new_content, "Anchor VanoBInput non trovato"
new_import = 'import { uploadFotoVano, deleteFotoVano } from "@/lib/vano-detail/foto-storage";\n'
new_content = new_content.replace(anchor, anchor + new_import, 1)

new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
