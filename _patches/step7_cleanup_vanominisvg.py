# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
SRC  = ROOT / "components" / "VanoDetailPanel.tsx"
DEAD = ROOT / "components" / "vano-detail" / "parts" / "VanoMiniSVG.tsx"

with open(SRC, "rb") as f:
    content = f.read().decode("utf-8")

dead_import = 'import VanoMiniSVG from "./vano-detail/parts/VanoMiniSVG";\n'
assert dead_import in content, "Import VanoMiniSVG non trovato"

new_content = content.replace(dead_import, "", 1)
new_content = new_content.replace("\r\n", "\n")

with open(SRC, "wb") as f:
    f.write(new_content.encode("utf-8"))

# Cancella file dead
if DEAD.exists():
    DEAD.unlink()
    print("[OK] Rimosso file dead:", DEAD)
else:
    print("[WARN] File dead non esistente (gia' rimosso?):", DEAD)

old_lines = content.count("\n")
new_lines = new_content.count("\n")
print("[OK] Patchato:", SRC)
print("     Righe:", old_lines, "->", new_lines, " (delta", new_lines - old_lines, ")")
