import sys, glob
sys.stdout.reconfigure(encoding='utf-8')

# Cerca in ClientiPanel.tsx le righe chiave
for fp in ['components/ClientiPanel.tsx']:
    try:
        lines = open(fp, encoding='utf-8').readlines()
        print(f"=== {fp} ({len(lines)} righe) ===")
        # Mostra righe con commesse, filter, clienteId, nome, telefono
        keywords = ['commess', 'filter', 'clienteId', 'cliente_id', 'c.nome', 'c.telefono', 'c.id', '.id ===', 'cmId', 'match']
        for i, l in enumerate(lines):
            if any(k in l for k in keywords):
                print(f"  R{i+1}: {repr(l[:140])}")
    except Exception as e:
        print(f"ERR: {e}")
