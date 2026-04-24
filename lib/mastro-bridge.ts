// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-bridge.ts
// Ponte tra il vecchio IDB (mastro_offline) e il nuovo (mastro_sync_v1).
// All'avvio:
//  1. Travasa le commesse dal vecchio al nuovo store
//  2. Per ogni commessa con ID non-UUID → enqueue INSERT in outbox
//     → il sync worker la sincronizzerà automaticamente con Supabase
//
// IMPORTANTE: non cancella nulla dal vecchio IDB. Il vecchio sistema
// continua a funzionare in parallelo finche' non lo disattiviamo.
// ═══════════════════════════════════════════════════════════

"use client";

import {
  STORES,
  idbGetAll,
  idbPutMany,
  idbGetMeta,
  idbSetMeta,
  outboxEnqueue,
  outboxList,
  isUuid,
  isTempId,
} from "./mastro-idb";
import { syncWorker } from "./mastro-sync-worker";

const OLD_DB_NAME = "mastro_offline";
const OLD_STORE = "cantieri";
const MIGRATION_KEY = "bridge_migration_v1";

// ─── Legge dal vecchio IDB ──────────────────────────────────
const readOldCantieri = async (): Promise<any[]> => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(OLD_DB_NAME, 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(OLD_STORE)) {
          resolve([]);
          return;
        }
        const tx = db.transaction(OLD_STORE, "readonly");
        const getAll = tx.objectStore(OLD_STORE).getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      };
      req.onerror = () => resolve([]);
      req.onblocked = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

// ─── Main: esegui UNA VOLTA all'avvio ───────────────────────
export const runBridgeMigration = async (): Promise<{
  copied: number;
  enqueuedForSync: number;
  skipped: number;
}> => {
  // Controllo: già migrato?
  const done = await idbGetMeta(MIGRATION_KEY);

  // Read data da vecchio IDB
  const oldCantieri = await readOldCantieri();

  if (oldCantieri.length === 0) {
    console.log("[mastro:bridge] nessuna commessa nel vecchio IDB, skip");
    return { copied: 0, enqueuedForSync: 0, skipped: 0 };
  }

  // Se già migrato ma il vecchio ha più record → travasa i nuovi
  const existing = await idbGetAll(STORES.CANTIERI);
  const existingIds = new Set(existing.map((c: any) => c.id));
  const toCopy = oldCantieri.filter((c: any) => !existingIds.has(c.id));

  if (toCopy.length === 0) {
    console.log(
      `[mastro:bridge] cache gia' sincronizzata (${existing.length} commesse)`
    );
    return { copied: 0, enqueuedForSync: 0, skipped: oldCantieri.length };
  }

  // 1. Travasa nel nuovo store
  await idbPutMany(STORES.CANTIERI, toCopy);

  // 2. Per ogni record con ID non-UUID: crea entry outbox INSERT
  // Così il sync worker le porta su Supabase e rimappa l'ID
  let enqueued = 0;
  const existingOutbox = await outboxList();
  const alreadyQueuedTempIds = new Set(
    existingOutbox
      .filter((e) => e.operation === "insert" && e.temp_id)
      .map((e) => e.temp_id)
  );

  for (const c of toCopy) {
    if (isUuid(c.id)) continue; // già sul server, skip
    if (alreadyQueuedTempIds.has(c.id)) continue; // già in coda
    // ID locale → marcalo come tempId e accodalo
    await outboxEnqueue({
      table: "commesse",
      operation: "insert",
      payload: c,
      temp_id: c.id,
    });
    enqueued++;
  }

  // 3. Segna migrazione fatta
  await idbSetMeta(MIGRATION_KEY, new Date().toISOString());

  console.log(
    `[mastro:bridge] copiate ${toCopy.length}, ` +
      `accodate per sync ${enqueued} orfane, ` +
      `totale cache ora ${existing.length + toCopy.length}`
  );

  // 4. Fai partire il sync
  if (enqueued > 0) {
    console.log(`[mastro:bridge] trigger sync di ${enqueued} orfane...`);
    syncWorker.trigger();
  }

  return {
    copied: toCopy.length,
    enqueuedForSync: enqueued,
    skipped: oldCantieri.length - toCopy.length,
  };
};

// ─── Auto-run all'avvio (lazy, dopo 2 secondi) ──────────────
if (typeof window !== "undefined") {
  if (!(window as any).__mastro_bridge_done) {
    (window as any).__mastro_bridge_done = true;
    // Attende 2s: da' tempo al vecchio sistema di caricare le sue 142
    // commesse in IDB, così ci sono quando noi le travasiamo.
    setTimeout(() => {
      runBridgeMigration()
        .then((r) => {
          (window as any).__mastro_bridge_result = r;
        })
        .catch((e) => {
          console.warn("[mastro:bridge] error:", e);
        });
    }, 2000);
  }
  // Esponi per debug
  (window as any).__mastro_bridge = { run: runBridgeMigration };
}

export {};
