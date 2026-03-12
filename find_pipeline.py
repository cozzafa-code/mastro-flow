import sys, glob, os
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
print("FILES:", [f for f in files if 'erp' in f.lower() or 'lista' in f.lower() or 'home' in f.lower()])

# Cerca dove viene renderizzata la lista commesse con card (background + borderRadius + onClick)
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            if ('PIPELINE' in l or 'pipeline' in l) and 'find' in l and 'fase' in l and i < 3000:
                # card commessa con pipeline label
                print(f"\n{fp} R{i+1}: {repr(l[:100])}")
    except: pass
