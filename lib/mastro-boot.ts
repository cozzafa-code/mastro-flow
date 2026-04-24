// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-boot.ts (v1.2)
// Accende il sync engine e carica il migratore orfane on-demand.
// ═══════════════════════════════════════════════════════════

"use client";

import "./mastro-idb";
import "./mastro-sync-worker";
import "./mastro-store";
import "./mastro-bridge";
import "./mastro-migrate-orfane";

if (typeof window !== "undefined") {
  if (!(window as any).__mastro_boot_done) {
    (window as any).__mastro_boot_done = true;
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(
        "%c[mastro:boot] sync engine caricato",
        "color:#28A0A0;font-weight:bold",
        {
          idb: !!(window as any).__mastro_idb,
          sync: !!(window as any).__mastro_sync,
          store: !!(window as any).__mastro_store,
          bridge: !!(window as any).__mastro_bridge,
          migrate: !!(window as any).__mastro_migrate,
        }
      );
    }, 0);
  }
}

export {};
