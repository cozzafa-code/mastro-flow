import sys, os, glob
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        txt = open(fp, encoding='utf-8').read()
        if 'cantieri.map' in txt or 'commesse.map' in txt or 'filteredCM' in txt:
            print(f"FILE: {fp}")
            lines = txt.splitlines()
            for i,l in enumerate(lines):
                if 'cantieri.map' in l or 'commesse.map' in l or 'filteredCM' in l:
                    print(f"  R{i+1}: {repr(l[:100])}")
    except:
        pass
