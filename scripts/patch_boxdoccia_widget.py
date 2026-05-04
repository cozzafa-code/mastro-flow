"""
MASTRO Box Doccia - Patch index.html (versione modulare)
Integra wizard-catalogo.css + 5 moduli JS nel widget esistente
SENZA toccare 3D, Pianta auto, Disegna, Foto, snap CAD, tracking AutoCAD.

Uso (PowerShell):
  cd C:\\Users\\Fabio\\Desktop\\mastro-erp-new
  python scripts\\patch_boxdoccia_widget.py
"""
import os
import sys
from pathlib import Path

REPO_ROOT = Path(r"C:\Users\Fabio\Desktop\mastro-erp-new")
WIDGET_DIR = REPO_ROOT / "public" / "widgets" / "boxdoccia"
INDEX = WIDGET_DIR / "index.html"
WIZARD_DIR = WIDGET_DIR / "wizard"
WIZARD_CSS = WIDGET_DIR / "wizard-catalogo.css"

# I 5 moduli vanno caricati IN ORDINE (state -> loaders -> steps)
WIZARD_MODULES = [
    "01-state.js",
    "02-loaders.js",
    "03-steps-1-5.js",
    "04-step-6.js",
    "05-steps-7-9.js",
]

INJECTION_MARKER_START = "<!-- MASTRO_BOXDOCCIA_WIZARD_CATALOGO_START -->"
INJECTION_MARKER_END = "<!-- MASTRO_BOXDOCCIA_WIZARD_CATALOGO_END -->"


def main():
    if not INDEX.exists():
        sys.exit(f"ERRORE: index.html non trovato in {INDEX}")
    if not WIZARD_CSS.exists():
        sys.exit(f"ERRORE: wizard-catalogo.css mancante in {WIZARD_CSS}")
    for mod in WIZARD_MODULES:
        if not (WIZARD_DIR / mod).exists():
            sys.exit(f"ERRORE: modulo wizard mancante: {WIZARD_DIR / mod}")

    # Leggi index normalizzando line endings
    with open(INDEX, 'rb') as f:
        raw = f.read().replace(b"\r\n", b"\n")
    src = raw.decode('utf-8')

    # Rimuovi vecchia injection se presente (idempotente)
    if INJECTION_MARKER_START in src:
        before = src.split(INJECTION_MARKER_START)[0]
        after = src.split(INJECTION_MARKER_END)[-1]
        src = before + after
        print("[INFO] Vecchia injection rimossa")

    # Costruisci script tags per i 5 moduli (defer mantiene l'ordine)
    module_tags = "\n".join(
        f'<script src="wizard/{m}" defer></script>' for m in WIZARD_MODULES
    )

    injection = f"""
{INJECTION_MARKER_START}
<link rel="stylesheet" href="wizard-catalogo.css">
<script>
  // Configurazione runtime - popolata dall'app MASTRO via window globals
  window.MASTRO_SUPABASE_URL = window.MASTRO_SUPABASE_URL || 'https://fgefcigxlbrmbeqqzjmo.supabase.co';
  window.MASTRO_SUPABASE_ANON_KEY = window.MASTRO_SUPABASE_ANON_KEY || '';
  window.MASTRO_AZIENDA_ID = window.MASTRO_AZIENDA_ID || 'ccca51c1-656b-4e7c-a501-55753e20da29';

  // Bridge: callback opzionali implementati dall'host MASTRO
  window.MastroBoxDocciaCanvasInit = window.MastroBoxDocciaCanvasInit || function() {{}};
  window.MastroBoxDocciaOnSave = window.MastroBoxDocciaOnSave || async function(payload) {{
    console.log('[BD] Salvataggio:', payload);
    alert('Configurazione salvata (modalita demo). Implementare MastroBoxDocciaOnSave per persistenza Supabase.');
  }};
</script>
{module_tags}
{INJECTION_MARKER_END}
"""

    if "</head>" not in src:
        sys.exit("ERRORE: tag </head> non trovato in index.html")

    new_src = src.replace("</head>", injection + "\n</head>", 1)

    # Bilancia tag base
    open_html = new_src.count("<html")
    close_html = new_src.count("</html>")
    if open_html != close_html:
        sys.exit(f"ERRORE: tag <html> sbilanciati ({open_html} vs {close_html}). Patch annullata.")

    with open(INDEX, 'w', encoding='utf-8', newline='\n') as f:
        f.write(new_src)

    print(f"[OK] Patch applicata a {INDEX}")
    print(f"[INFO] Dimensione finale: {INDEX.stat().st_size} bytes")
    print(f"[INFO] Moduli caricati: {len(WIZARD_MODULES)}")
    print()
    print("PROSSIMI PASSI:")
    print("1) Verifica file nel repo:")
    print("   - public/widgets/boxdoccia/wizard-catalogo.css")
    print("   - public/widgets/boxdoccia/wizard/01-state.js")
    print("   - public/widgets/boxdoccia/wizard/02-loaders.js")
    print("   - public/widgets/boxdoccia/wizard/03-steps-1-5.js")
    print("   - public/widgets/boxdoccia/wizard/04-step-6.js")
    print("   - public/widgets/boxdoccia/wizard/05-steps-7-9.js")
    print()
    print("2) Lato app MASTRO (Next.js), prima di aprire l'iframe:")
    print("   iframe.contentWindow.MASTRO_SUPABASE_ANON_KEY = '<chiave>'")
    print("   iframe.contentWindow.MASTRO_AZIENDA_ID = aziendaId")
    print("   iframe.contentWindow.MastroBoxDocciaOnSave = async ({config, misure}) => {")
    print("     await supabase.from('vani').update({")
    print("       boxdoccia_config: config, boxdoccia_misure: misure")
    print("     }).eq('id', vanoId)")
    print("   }")
    print()
    print("3) Per aprire wizard:  iframe.contentWindow.MastroBoxDoccia.open()")
    print()
    print("4) Git:")
    print("   git add -f public/widgets/boxdoccia/")
    print("   git commit -m 'feat(boxdoccia): wizard catalogo-driven 9 step (modulare)'")
    print("   git push origin main")


if __name__ == '__main__':
    main()
