import sys, glob
sys.stdout.reconfigure(encoding='utf-8')
# Cerca dove viene mostrata la data nel badge vano
files = glob.glob('components/**/*.tsx', recursive=True) + glob.glob('components/*.tsx')
for fp in files:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        for i,l in enumerate(lines):
            if ('dataRilievo' in l or 'data_rilievo' in l or 'dataConsegna' in l) and ('badge' in l.lower() or 'fontSize' in l):
                print(f"{fp} R{i+1}: {repr(l[:120])}")
    except: pass
