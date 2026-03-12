import sys, glob
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            # Cerca card con code + cliente + onClick per aprire dettaglio
            if 'c.code' in l and 'onClick' in l and ('setSelectedCM' in l or 'selCantiere' in l or 'setCurCantiere' in l):
                print(f"\n{fp} R{i+1}:")
                for j in range(max(0,i-3), min(i+25,len(lines))):
                    print(j+1, repr(lines[j][:130]))
                break
    except: pass
