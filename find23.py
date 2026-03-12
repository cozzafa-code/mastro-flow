import sys, glob
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            if ('clienteId' in l or 'cliente_id' in l or 'c.cliente ===') and ('filter' in l or 'find' in l) and i < 500:
                print(f"{fp} R{i+1}: {repr(l[:120])}")
    except: pass
