import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open('components/MastroERP.tsx', encoding='utf-8').read()

# Verifica che il fix1 sia presente
if 'fixClienteIdRetroattivo' in src:
    print("OK: funzione retroattiva presente")
if '_ctMatch' in src:
    print("OK: clienteId alla creazione presente")

# Aggiungi useEffect che chiama fixClienteIdRetroattivo una volta
# Cercalo dopo i primi useEffect esistenti, prima di "const addCommessa"
trigger = '  const addCommessa = () => {'
effect = '''  // #23: retroattivo clienteId una tantum
  useEffect(() => { if (contatti?.length) fixClienteIdRetroattivo(); }, [contatti.length]);

'''

if 'fixClienteIdRetroattivo(); }, [contatti' not in src:
    src = src.replace(trigger, effect + trigger, 1)
    open('components/MastroERP.tsx', 'w', encoding='utf-8').write(src)
    print("OK: useEffect retroattivo aggiunto")
else:
    print("OK: useEffect già presente")
