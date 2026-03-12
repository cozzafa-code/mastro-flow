import sys, glob
sys.stdout.reconfigure(encoding='utf-8')
files = glob.glob('components/**/*.ts', recursive=True) + glob.glob('components/**/*.tsx', recursive=True) + glob.glob('lib/**/*.ts', recursive=True)
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            if 'pdf' in fp.lower() or 'preventivo' in fp.lower():
                if 'accessori' in l.lower() or 'voci' in l.lower() or 'toString' in l or 'String(' in l:
                    print(f"{fp} R{i+1}: {repr(l[:120])}")
    except: pass

# Cerca il file pdf-generators
import os
for root, dirs, files2 in os.walk('.'):
    for fn in files2:
        if 'pdf' in fn.lower() and fn.endswith(('.ts','.tsx')):
            print(f"\nTROVATO: {os.path.join(root,fn)}")
