import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Helper da aggiungere: già presente in molti file come fmtDate o simile?
# Strategia: sostituire {x.data} con {x.data ? new Date(x.data+'T12:00:00').toLocaleDateString('it-IT') : '—'}
# nei contesti display (fontSize), NON negli input type="date"

FILES = [
    ('components/ClientiPanel.tsx', [
        ('{d.data}', "{d.data ? new Date(d.data+'T12:00:00').toLocaleDateString('it-IT') : d.data}"),
    ]),
    ('components/CMDetailPanel.tsx', [
        # R3816: allegati data
        ('{a.data}{a.durata', "{a.data ? new Date(a.data+'T12:00:00').toLocaleDateString('it-IT') : a.data}{a.durata"),
    ]),
    ('components/InterventoFlowPanel.tsx', [
        ('{m.data}</div>', "{m.data ? new Date(m.data+'T12:00:00').toLocaleDateString('it-IT') : m.data}</div>"),
    ]),
    ('components/InterventoTab.tsx', [
        ('{m.data} \u00b7 {m.orario', "{(m.data ? new Date(m.data+'T12:00:00').toLocaleDateString('it-IT') : m.data)} \u00b7 {m.orario"),
    ]),
    ('components/RilieviListPanel.tsx', [
        ('{f.data} \u00b7 {f.cliente}', "{f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data} \u00b7 {f.cliente}"),
    ]),
    ('components/SettingsPanel.tsx', [
        ('{f.cliente} \u00b7 {f.cmCode} \u00b7 {f.data}', "{f.cliente} \u00b7 {f.cmCode} \u00b7 {f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data}"),
    ]),
    ('components/PreventivoModal.tsx', [
        ('{f.data} \u00b7 Scad: {f.scadenza}', "{f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data} \u00b7 Scad: {f.scadenza ? new Date(f.scadenza+'T12:00:00').toLocaleDateString('it-IT') : f.scadenza}"),
    ]),
    ('components/mastro/ui/CMDetail.tsx', [
        ('{a.data}{a.durata', "{a.data ? new Date(a.data+'T12:00:00').toLocaleDateString('it-IT') : a.data}{a.durata"),
    ]),
    ('components/mastro/ui/PreventivoModal.tsx', [
        ('{f.data} \u00b7 Scad: {f.scadenza}', "{f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data} \u00b7 Scad: {f.scadenza ? new Date(f.scadenza+'T12:00:00').toLocaleDateString('it-IT') : f.scadenza}"),
    ]),
]

total = 0
for fp, patches in FILES:
    try:
        src = open(fp, 'r', encoding='utf-8').read()
        changed = 0
        for old, new in patches:
            if old in src:
                src = src.replace(old, new, 1)
                changed += 1
                print(f"  OK: {fp} — '{old[:50]}'")
            else:
                print(f"  SKIP: {fp} — '{old[:50]}'")
        if changed:
            open(fp, 'w', encoding='utf-8').write(src)
            total += changed
    except Exception as e:
        print(f"  ERR {fp}: {e}")

print(f"\nTotale fix: {total}")
