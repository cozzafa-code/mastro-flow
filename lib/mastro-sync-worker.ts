// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-sync-worker.ts
// Background worker: consuma outbox e sincronizza con Supabase
// Parte del Sync Engine v1
// ═══════════════════════════════════════════════════════════

import { supabase } from "./supabase";
import {
  outboxList,
  outboxUpdate,
  outboxAck,
  outboxFail,
  outboxSize,
  idbMapId,
  idbResolveId,
  idbPut,
  idbDelete,
  STORES,
  isTempId,
  isUuid,
  type OutboxEntry,
} from "./mastro-idb";

// ─── Config ─────────────────────────────────────────────────
const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 30_000;
const BACKOFF_MS = [1_000, 5_000, 30_000, 120_000, 600_000]; // 1s, 5s, 30s, 2m, 10m

// ─── Stato interno ──────────────────────────────────────────
let _running = false;
let _pollTimer: any = null;
let _syncInProgress = false;
const _listeners: Set<(status: SyncStatus) => void> = new Set();

export interface SyncStatus {
  pending: number;
  syncing: boolean;
  lastSync: string | null;
  lastError: string | null;
  online: boolean;
}

let _lastStatus: SyncStatus = {
  pending: 0,
  syncing: false,
  lastSync: null,
  lastError: null,
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const emit = async () => {
  _lastStatus = {
    ..._lastStatus,
    pending: await outboxSize(),
    syncing: _syncInProgress,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
  _listeners.forEach((l) => {
    try {
      l(_lastStatus);
    } catch (e) {
      console.warn("[mastro:sync] listener error", e);
    }
  });
};

export const subscribeSyncStatus = (
  listener: (s: SyncStatus) => void
): (() => void) => {
  _listeners.add(listener);
  listener(_lastStatus);
  return () => _listeners.delete(listener);
};

export const getSyncStatus = (): SyncStatus => _lastStatus;

// ─── Helpers per mapping ID nei payload ─────────────────────
/**
 * Scorre un payload ricorsivamente e sostituisce eventuali tempId
 * (nei campi *_id) con i serverUUID corrispondenti dal mapping.
 * Se un tempId non è ancora mappato, ritorna null = operazione non pronta.
 */
const resolvePayloadIds = async (
  payload: any
): Promise<{ resolved: any; missing: string[] }> => {
  const missing: string[] = [];

  const walk = async (obj: any): Promise<any> => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      const out = [];
      for (const v of obj) out.push(await walk(v));
      return out;
    }
    if (typeof obj === "object") {
      const out: any = {};
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        // Se il campo è *_id e valore è tempId -> prova a risolvere
        if (
          (k.endsWith("_id") || k === "id") &&
          typeof v === "string" &&
          isTempId(v)
        ) {
          const resolved = await idbResolveId(v);
          if (resolved === v) {
            // non trovato nel mapping
            missing.push(v);
            out[k] = v;
          } else {
            out[k] = resolved;
          }
        } else if (typeof v === "object") {
          out[k] = await walk(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    }
    return obj;
  };

  const resolved = await walk(payload);
  return { resolved, missing };
};

// ─── Esecuzione singola operazione ──────────────────────────
const execOperation = async (entry: OutboxEntry): Promise<void> => {
  const { op_id, table, operation, payload, temp_id, target_id } = entry;
  if (op_id === undefined) return;

  // Segna syncing
  await outboxUpdate(op_id, { status: "syncing" });

  try {
    // 1. Risolvi FK tempId -> UUID nel payload
    const { resolved, missing } = await resolvePayloadIds(payload);
    if (missing.length > 0) {
      // FK non ancora sincronizzate → rimanda, segna di nuovo pending
      await outboxUpdate(op_id, {
        status: "pending",
        last_error: `FK non sincronizzate: ${missing.join(", ")}`,
      });
      return;
    }

    // 2. Esegui su Supabase
    if (operation === "insert") {
      // Rimuovi eventuale id tempId dal payload: Supabase genererà un UUID
      const { id: _discard, ...body } = resolved;

      const { data, error } = await supabase
        .from(table)
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Insert ok ma id mancante");

      // Mappa tempId -> UUID reale
      if (temp_id) {
        await idbMapId(temp_id, data.id);
        // Aggiorna cache locale: sostituisci record tempId con UUID
        await updateCacheAfterInsert(table, temp_id, data);
      }

      await outboxAck(op_id);
    } else if (operation === "update") {
      if (!target_id) throw new Error("UPDATE senza target_id");
      const resolvedTarget = await idbResolveId(target_id);
      if (isTempId(resolvedTarget)) {
        // Il record ancora non esiste sul server → attendi
        await outboxUpdate(op_id, {
          status: "pending",
          last_error: "Target record non ancora sincronizzato",
        });
        return;
      }

      const { id: _discard, ...body } = resolved;
      const { error } = await supabase
        .from(table)
        .update(body)
        .eq("id", resolvedTarget);

      if (error) throw error;

      // Aggiorna cache locale
      await idbPut(mapTableToStore(table), { ...resolved, id: resolvedTarget });

      await outboxAck(op_id);
    } else if (operation === "delete") {
      if (!target_id) throw new Error("DELETE senza target_id");
      const resolvedTarget = await idbResolveId(target_id);

      if (isTempId(resolvedTarget)) {
        // Mai stato sul server → basta rimuovere dalla cache
        await idbDelete(mapTableToStore(table), target_id);
        await outboxAck(op_id);
        return;
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", resolvedTarget);
      if (error) throw error;

      await idbDelete(mapTableToStore(table), resolvedTarget);
      await outboxAck(op_id);
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    const isPermanent = isPermanentError(e);
    const retries = entry.retry_count + 1;

    if (isPermanent || retries >= MAX_RETRIES) {
      await outboxFail(op_id, msg, true);
      console.error(`[mastro:sync] op ${op_id} FAILED permanently:`, msg);
    } else {
      await outboxFail(op_id, msg, false);
      console.warn(
        `[mastro:sync] op ${op_id} retry ${retries}/${MAX_RETRIES}:`,
        msg
      );
    }
  }
};

// ─── Mappa tabella Supabase -> store IDB ────────────────────
const mapTableToStore = (table: string): any => {
  switch (table) {
    case "commesse":
      return STORES.CANTIERI;
    case "vani":
      return STORES.VANI;
    case "rilievi":
      return STORES.RILIEVI;
    default:
      return STORES.CANTIERI; // fallback
  }
};

// ─── Update cache dopo INSERT riuscita ──────────────────────
const updateCacheAfterInsert = async (
  table: string,
  tempId: string,
  serverRecord: any
): Promise<void> => {
  const store = mapTableToStore(table);
  // rimuovi vecchio record tempId
  await idbDelete(store, tempId);
  // metti record con UUID reale
  await idbPut(store, serverRecord);
};

// ─── Classificazione errori ─────────────────────────────────
const isPermanentError = (e: any): boolean => {
  const code = e?.code || e?.statusCode;
  const msg = (e?.message || "").toLowerCase();
  // 4xx client error (validation, foreign key, unique constraint) = permanente
  if (typeof code === "number" && code >= 400 && code < 500 && code !== 429)
    return true;
  // Postgres specifici permanenti
  if (code === "23505") return true; // unique violation
  if (code === "23503") return true; // foreign key violation
  if (code === "22P02") return true; // invalid text representation (UUID invalid)
  if (msg.includes("invalid input syntax")) return true;
  return false;
};

// ─── Ciclo principale ───────────────────────────────────────
const runSyncCycle = async (): Promise<void> => {
  if (_syncInProgress) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await emit();
    return;
  }

  _syncInProgress = true;
  await emit();

  try {
    // Prendi solo "pending" ordinate cronologicamente
    const pending = (await outboxList({ status: "pending" })).sort(
      (a, b) => a.created_at.localeCompare(b.created_at)
    );

    if (pending.length === 0) {
      _syncInProgress = false;
      _lastStatus.lastSync = new Date().toISOString();
      await emit();
      return;
    }

    console.log(`[mastro:sync] processing ${pending.length} op pendenti`);

    for (const entry of pending) {
      // Applica backoff: se retry_count > 0, salta fin quando non è passato abbastanza tempo
      if (entry.retry_count > 0 && entry.op_id !== undefined) {
        const delay = BACKOFF_MS[Math.min(entry.retry_count - 1, BACKOFF_MS.length - 1)];
        const updatedAt = new Date(entry.updated_at).getTime();
        if (Date.now() - updatedAt < delay) continue;
      }
      await execOperation(entry);
    }

    _lastStatus.lastSync = new Date().toISOString();
    _lastStatus.lastError = null;
  } catch (e: any) {
    console.error("[mastro:sync] cycle error", e);
    _lastStatus.lastError = e?.message || String(e);
  } finally {
    _syncInProgress = false;
    await emit();
  }
};

// ─── API pubblica ───────────────────────────────────────────
export const syncWorker = {
  start() {
    if (_running) return;
    _running = true;
    console.log("[mastro:sync] worker started");

    // Online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("[mastro:sync] online → trigger sync");
        runSyncCycle();
      });
      window.addEventListener("offline", () => {
        console.log("[mastro:sync] offline");
        emit();
      });
    }

    // Polling
    _pollTimer = setInterval(runSyncCycle, POLL_INTERVAL_MS);
    // Trigger immediato
    runSyncCycle();
  },

  stop() {
    if (!_running) return;
    _running = false;
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
    console.log("[mastro:sync] worker stopped");
  },

  trigger: runSyncCycle,

  status: getSyncStatus,
  subscribe: subscribeSyncStatus,
};

// Espone su window per debug console
if (typeof window !== "undefined") {
  (window as any).__mastro_sync = syncWorker;
}
