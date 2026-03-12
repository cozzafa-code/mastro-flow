import sys
sys.stdout.reconfigure(encoding='utf-8')

FILES = [
    'lib/pdf-preventivo.ts',
    'components/mastro/lib/pdf-generators.ts',
    'lib/pdf-condivisibile.ts',
]

PATCHES = [
    # vl.desc → vl.desc || vl.descrizione (voci libere vano)
    (
        '`  ↳ ${vl.desc || "Voce aggiuntiva"}`',
        '`  ↳ ${vl.desc || vl.descrizione || "Voce aggiuntiva"}`'
    ),
    # vl.desc per voci libere commessa
    (
        'vl.desc || "Voce aggiuntiva"',
        'vl.desc || vl.descrizione || "Voce aggiuntiva"'
    ),
    # label come string nel Object.entries (fix TypeScript runtime)
    (
        'const aDesc = [label as string,',
        'const aDesc = [String(label),'
    ),
    # vl.unita potrebbe essere oggetto
    (
        '|| vl.unita || "pz"',
        '|| (typeof vl.unita === "string" ? vl.unita : "pz")'
    ),
    # vl.prezzo potrebbe essere stringa
    (
        '(vl.prezzo||0).toFixed(2)',
        '(parseFloat(vl.prezzo)||0).toFixed(2)'
    ),
]

total = 0
for fp in FILES:
    try:
        src = open(fp, 'r', encoding='utf-8').read()
        changed = 0
        for old, new in PATCHES:
            if old in src:
                n = src.count(old)
                src = src.replace(old, new)
                changed += n
                print(f"  OK x{n}: {fp} — '{old[:60]}'")
        if changed:
            open(fp, 'w', encoding='utf-8').write(src)
            total += changed
    except Exception as e:
        print(f"  ERR {fp}: {e}")

print(f"\nTotale fix: {total}")
