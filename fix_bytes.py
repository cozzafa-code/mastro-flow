import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','rb')
lines=f.readlines()
f.close()

l = lines[599]
# Trova 'Piano' nella riga
idx = l.find(b'Piano')
if idx >= 0:
    chunk = l[idx:idx+20]
    print("Bytes:", chunk.hex())
    print("Repr:", repr(chunk))
