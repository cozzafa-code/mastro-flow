import sys
sys.stdout.reconfigure(encoding='utf-8')
# Cerca fattureDB nell'hook useMastro o nel context
import glob
for fp in glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx') + glob.glob('hooks/**/*.ts', recursive=True) + glob.glob('hooks/*.ts'):
    try:
        txt = open(fp, encoding='utf-8').read()
        if 'fattureDB' in txt and ('context' in txt.lower() or 'useMastro' in txt or 'createContext' in txt):
            lines = txt.splitlines()
            for i,l in enumerate(lines):
                if 'fattureDB' in l and ('export' in l or 'provide' in l.lower() or 'value' in l):
                    print(f"{fp} R{i+1}: {repr(l[:100])}")
    except: pass

# Cerca anche dove CommessePanel importa cose
f=open('components/CommessePanel.tsx','r',encoding='utf-8')
head=f.read(800)
f.close()
print("\nCommessePanel header:\n", head[:600])
