import sys, glob
sys.stdout.reconfigure(encoding='utf-8')

# Cerca in tutti i file tsx dove viene mostrata la card con onClick che apre commessa
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            if ('setPrevWorkspace(true)' in l or 'setActiveCommessa' in l or 'openDetail' in l) and i > 100:
                print(f"\n{fp} R{i+1}:")
                for j in range(max(0,i-5), min(i+30,len(lines))):
                    print(j+1, repr(lines[j][:120]))
                break
    except: pass
