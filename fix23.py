import sys
sys.stdout.reconfigure(encoding='utf-8')

src = open('components/MastroERP.tsx', encoding='utf-8').read()

# 1. Alla creazione commessa: aggiungi clienteId se c'è un contatto corrispondente
# Cerco la riga esatta di addCommessa dove viene costruito nc
old_nc = '    const nc = { id: Date.now(), code, cliente: newCM.cliente, cognome: newCM.cognome||"",'
new_nc = '    const _ctMatch = contatti?.find((ct:any) => ct.id === newCM.clienteId || ((ct.nome||"").toLowerCase()+(ct.cognome?" "+ct.cognome:"").toLowerCase()).trim() === ([newCM.cliente,newCM.cognome].filter(Boolean).join(" ").toLowerCase()));\n    const nc = { id: Date.now(), code, clienteId: _ctMatch?.id || newCM.clienteId || null, cliente: newCM.cliente, cognome: newCM.cognome||"",'

if old_nc in src:
    src = src.replace(old_nc, new_nc, 1)
    print("OK 1: clienteId alla creazione commessa")
else:
    print("ERR 1: pattern non trovato")

# 2. Nel form nuovo cliente (ClientiPanel R221) — già scrive cliente/cognome/telefono
# Cerca dove setNewCM viene chiamato da ClientiPanel per aprire nuova commessa
# e aggiunge clienteId
old_modal = 'setNewCM(prev => ({ ...prev, cliente: c.nome, cognome: c.cognome || "", telefono: c.telefono || "", in'
if old_modal in src:
    # trova la chiusura del setNewCM e aggiungi clienteId
    idx = src.index(old_modal)
    # trova la fine del blocco (prossima }))
    end = src.index(')))', idx) + 3
    chunk = src[idx:end]
    if 'clienteId' not in chunk:
        new_chunk = chunk.replace('setNewCM(prev => ({ ...prev,', 'setNewCM(prev => ({ ...prev, clienteId: c.id,')
        src = src[:idx] + new_chunk + src[end:]
        print("OK 2: clienteId pre-popolato da scheda cliente")
    else:
        print("OK 2: clienteId già presente")
else:
    print("SKIP 2: pattern setNewCM da cliente non trovato — ok se è in ClientiPanel")

# 3. Funzione retroattiva: aggiungi dopo addCommessa
retroactive = '''
  // #23 FIX: popola clienteId retroattivo sulle commesse che non ce l'hanno
  const fixClienteIdRetroattivo = () => {
    if (!contatti?.length) return;
    setCantieri(cs => cs.map(c => {
      if (c.clienteId) return c;
      const ct = contatti.find((ct:any) => {
        const nomeCompleto = ([ct.nome, ct.cognome].filter(Boolean).join(" ")).toLowerCase();
        const cmNome = ([c.cliente, c.cognome].filter(Boolean).join(" ")).toLowerCase();
        if (nomeCompleto && cmNome && nomeCompleto === cmNome) return true;
        if (ct.telefono && c.telefono && ct.telefono.replace(/\\D/g,"") === c.telefono.replace(/\\D/g,"")) return true;
        return false;
      });
      return ct ? { ...c, clienteId: ct.id } : c;
    }));
  };
'''

if 'fixClienteIdRetroattivo' not in src:
    src = src.replace('  const addVano = () => {', retroactive + '  const addVano = () => {', 1)
    print("OK 3: funzione retroattiva aggiunta")
else:
    print("OK 3: funzione retroattiva già presente")

open('components/MastroERP.tsx', 'w', encoding='utf-8').write(src)
print("\nDone. Ora esegui fixClienteIdRetroattivo() da console o chiamala all'avvio.")
