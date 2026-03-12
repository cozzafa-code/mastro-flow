import sys, glob
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            # Date ISO raw mostrate (es. 2024-01-15 senza toLocaleDateString)
            if ('v.data' in l or 'r.data' in l or 'rilievo.data' in l or 'vano.data' in l) and 'fontSize' in l and 'toLocaleDateString' not in l:
                print(f"{fp} R{i+1}: {repr(l[:120])}")
            # Cerca anche .dataRilievo o .createdAt mostrati raw
            if ('.createdAt' in l or '.dataCreazione' in l or '.data}' in l) and 'fontSize' in l:
                print(f"{fp} R{i+1}: {repr(l[:120])}")
    except: pass
