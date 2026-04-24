// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-boot.ts
// Accende il sync engine all'avvio dell'app.
// Importato UNA VOLTA in layout/pages senza side effect.
//
// Non fa ancora nulla di invasivo: carica i moduli (che si
// auto-espongono su window per debug) e NON intercetta ancora
// il flusso dati attuale. Quello arriva al pezzo 3.
// ═══════════════════════════════════════════════════════════

"use client";

// Importa i 3 moduli → attiva le side-export su window
import "./mastro-idb";
import "./mastro-sync-worker";
import "./mastro-store";

// Piccolo log diagnostico per conferma visiva in console
if (typeof window !== "undefined") {
  // Evita doppio-boot in StrictMode / fast refresh
  if (!(window as any).__mastro_boot_done) {
    (window as any).__mastro_boot_done = true;
    // defer al tick dopo per non bloccare il render
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(
        "%c[mastro:boot] sync engine caricato",
        "color:#28A0A0;font-weight:bold",
        {
          idb: !!(window as any).__mastro_idb,
          sync: !!(window as any).__mastro_sync,
          store: !!(window as any).__mastro_store,
        }
      );
    }, 0);
  }
}

export {};
