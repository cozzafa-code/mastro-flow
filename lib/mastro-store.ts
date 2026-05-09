// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-store.ts (v2)
// API unificata per il data layer. Sostituisce chiamate dirette a supabase.
// Parte del Sync Engine v1
//
// v2: aggiunte funzioni bulk UNISCI / ARCHIVIA / detect_duplicates
// ═══════════════════════════════════════════════════════════

import { supabase } from "./supabase";
import {
  STORES,
  idbPut,
  idbPutMany,
  idbGet,
  idbGetAll,
  idbDelete,
  idbSetMeta,
  idbGetMeta,
  outboxEnqueue,
  makeTempId,
  isUuid,
  isTempId,
  idbResolveId,
} from "./mastro-idb";
import { syncWorker } from "./mastro-sync-worker";

type TableName = "commesse" | "vani" | "rilievi";

const storeFor = (t: TableName) => {
  if (t === "commesse") return STORES.CANTIERI;
  if (t === "vani") return STORES.VANI;
  if (t === "rilievi") return STORES.RILIEVI;
  throw new Error(`Tabella sconosciuta: ${t}`);
};

// ─── CRUD generico con outbox ───────────────────────────────
const createRecord = async <T extends Record<string, any>>(
  table: TableName,
  data: T
): Promise<string> => {
  const tempId = makeTempId();
  const now = new Date().toISOString();
  const record = {
    ...data,
    id: tempId,
    created_at: data.created_at || now,
    updated_at: now,
  };
  await idbPut(storeFor(table), record);
  await outboxEnqueue({
    table,
    operation: "insert",
    payload: record,
    temp_id: tempId,
  });
  syncWorker.trigger();
  return tempId;
};

const updateRecord = async <T extends Record<string, any>>(
  table: TableName,
  id: string,
  patch: T
): Promise<void> => {
  const resolved = await idbResolveId(id);
  const now = new Date().toISOString();
  const existing = await idbGet(storeFor(table), resolved);
  const updated = { ...(existing || {}), ...patch, id: resolved, updated_at: now };
  await idbPut(storeFor(table), updated);
  await outboxEnqueue({
    table,
    operation: "update",
    payload: patch,
    target_id: resolved,
  });
  syncWorker.trigger();
};

const deleteRecord = async (table: TableName, id: string): Promise<void> => {
  const resolved = await idbResolveId(id);
  await idbDelete(storeFor(table), resolved);
  await outboxEnqueue({
    table,
    operation: "delete",
    payload: {},
    target_id: resolved,
  });
  syncWorker.trigger();
};

const softDeleteRecord = async (table: TableName, id: string): Promise<void> => {
  const now = new Date().toISOString();
  const { data: { user } } = await supabase.auth.getUser();
  await updateRecord(table, id, {
    deleted_at: now,
    deleted_by: user?.id || null,
  } as any);
};

// ─── FETCH server → cache ───────────────────────────────────
const fetchAllFromServer = async (
  table: TableName,
  aziendaId: string
): Promise<any[]> => {
  let query = supabase.from(table).select("*").eq("azienda_id", aziendaId);
  if (table === "commesse") {
    query = query.is("deleted_at", null);
  }
  const { data, error } = await query;
  if (error) {
    console.warn(`[mastro:store] fetch ${table} failed:`, error.message);
    return [];
  }
  return data || [];
};

const hydrate = async (
  table: TableName,
  aziendaId: string
): Promise<any[]> => {
  const server = await fetchAllFromServer(table, aziendaId);
  if (server.length > 0) {
    await idbPutMany(storeFor(table), server);
    await idbSetMeta(`last_hydrate_${table}`, new Date().toISOString());
  }
  return server;
};

const listMerged = async (table: TableName): Promise<any[]> => {
  const all = await idbGetAll(storeFor(table));
  return all.filter((r: any) => !r.deleted_at && !r.merged_into);
};

// ─── API per tabella ────────────────────────────────────────
const makeTableApi = (table: TableName) => ({
  create: (data: any) => createRecord(table, data),
  update: (id: string, patch: any) => updateRecord(table, id, patch),
  delete: (id: string) => deleteRecord(table, id),
  softDelete: (id: string) => softDeleteRecord(table, id),
  get: (id: string) => idbGet(storeFor(table), id),
  list: () => listMerged(table),
  hydrate: (aziendaId: string) => hydrate(table, aziendaId),
});

// ─── Bulk: soft delete ──────────────────────────────────────
const bulkSoftDelete = async (
  table: TableName,
  ids: string[]
): Promise<{ ok: number; skipped: number }> => {
  console.log("[mastro:bulkSoftDelete] called with", { table, ids });

  if (table !== "commesse") {
    let ok = 0;
    for (const id of ids) {
      try {
        await softDeleteRecord(table, id);
        ok++;
      } catch (e) {
        console.warn("[mastro:bulkSoftDelete] skip", id, e);
      }
    }
    return { ok, skipped: ids.length - ok };
  }

  if (ids.length === 0) return { ok: 0, skipped: 0 };

  try {
    console.log("[mastro:bulkSoftDelete] calling RPC bulk_soft_delete_commesse");
    const { data, error } = await supabase.rpc("bulk_soft_delete_commesse", {
      commessa_ids: ids,
      restore: false,
    });

    if (error) {
      console.error("[mastro:bulkSoftDelete] RPC ERROR:", error);
      alert("Errore cestino: " + (error.message || JSON.stringify(error)));
      return { ok: 0, skipped: ids.length };
    }

    console.log("[mastro:bulkSoftDelete] RPC SUCCESS:", data);

    // RIMUOVI da IDB invece di marcare deleted_at
    // (cosi spariscono subito anche se il filtro client non funziona)
    for (const id of ids) {
      try {
        await idbDelete(STORES.CANTIERI, id);
        console.log("[mastro:bulkSoftDelete] IDB removed", id);
      } catch (e) {
        console.warn("[mastro:bulkSoftDelete] IDB skip", id, e);
      }
    }

    // Emetti evento custom per ricarica UI
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mastro:commesse-deleted", {
          detail: { ids }
        }));
        console.log("[mastro:bulkSoftDelete] event emitted");
      }
    } catch {}

    return { ok: ids.length, skipped: 0 };
  } catch (e: any) {
    console.error("[mastro:bulkSoftDelete] FATAL:", e);
    alert("Errore cestino fatale: " + (e?.message || JSON.stringify(e)));
    return { ok: 0, skipped: ids.length };
  }
};

// ─── Bulk: ARCHIVIA ─────────────────────────────────────────
/**
 * Archivia N commesse (archiviazione reversibile, non cestino).
 * Usa la funzione SQL atomica archivia_commesse.
 */
const bulkArchivia = async (
  ids: string[]
): Promise<{ ok: number; skipped: number; invalidIds: string[] }> => {
  // Solo UUID validi (no tempId, no locali pre-migration)
  const validIds = ids.filter((id) => isUuid(id));
  const invalidIds = ids.filter((id) => !isUuid(id));

  if (validIds.length === 0) {
    return { ok: 0, skipped: ids.length, invalidIds };
  }

  try {
    const { data, error } = await supabase.rpc("archivia_commesse", {
      commessa_ids: validIds,
      unarchive: false,
    });
    if (error) throw error;
    const ok = typeof data === "number" ? data : validIds.length;

    // Aggiorna cache locale: segna archived_at
    const now = new Date().toISOString();
    const { data: { user } } = await supabase.auth.getUser();
    for (const id of validIds) {
      const existing = await idbGet(STORES.CANTIERI, id);
      if (existing) {
        await idbPut(STORES.CANTIERI, {
          ...existing,
          archived_at: now,
          archived_by: user?.id || null,
          updated_at: now,
        });
      }
    }

    return { ok, skipped: invalidIds.length, invalidIds };
  } catch (e: any) {
    console.error("[mastro:store] bulkArchivia error:", e);
    throw e;
  }
};

const bulkUnarchivia = async (
  ids: string[]
): Promise<{ ok: number }> => {
  const validIds = ids.filter((id) => isUuid(id));
  if (validIds.length === 0) return { ok: 0 };

  const { data, error } = await supabase.rpc("archivia_commesse", {
    commessa_ids: validIds,
    unarchive: true,
  });
  if (error) throw error;

  // Aggiorna cache
  for (const id of validIds) {
    const existing = await idbGet(STORES.CANTIERI, id);
    if (existing) {
      await idbPut(STORES.CANTIERI, {
        ...existing,
        archived_at: null,
        archived_by: null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return { ok: typeof data === "number" ? data : validIds.length };
};

// ─── UNISCI (merge) ─────────────────────────────────────────
export interface MergeResult {
  target_id: string;
  sources_merged: number;
  rilievi_spostati: number;
  vani_spostati: number;
  merged_at: string;
}

/**
 * Accorpa source_ids dentro target_id via funzione SQL atomica.
 * scalarOverrides: se l'utente ha risolto conflitti, passa i valori finali
 *                   (es. { telefono: "340...", indirizzo: "Via X" })
 */
const mergeCommesse = async (
  targetId: string,
  sourceIds: string[],
  scalarOverrides?: Record<string, any>
): Promise<MergeResult> => {
  if (!isUuid(targetId)) {
    throw new Error("La commessa target deve essere sincronizzata sul server (UUID)");
  }
  const validSources = sourceIds.filter((id) => isUuid(id));
  if (validSources.length === 0) {
    throw new Error("Nessuna commessa sorgente valida");
  }
  if (validSources.length !== sourceIds.length) {
    console.warn(
      `[mergeCommesse] ${sourceIds.length - validSources.length} source ID non UUID ignorate`
    );
  }

  const { data, error } = await supabase.rpc("merge_commesse", {
    target_id: targetId,
    source_ids: validSources,
    scalar_overrides: scalarOverrides || {},
  });

  if (error) {
    console.error("[mergeCommesse] DB error:", error);
    throw new Error(error.message || "Merge fallito lato server");
  }

  // Aggiorna cache locale:
  // 1. Refresh del target (prende i rilievi/vani spostati)
  const { data: freshTarget } = await supabase
    .from("commesse")
    .select("*")
    .eq("id", targetId)
    .single();
  if (freshTarget) {
    await idbPut(STORES.CANTIERI, freshTarget);
  }

  // 2. Rimuovi source dalla cache (ora hanno merged_into e deleted_at)
  for (const id of validSources) {
    await idbDelete(STORES.CANTIERI, id);
  }

  return data as MergeResult;
};

// ─── DUPLICATE DETECTION ────────────────────────────────────
export interface DuplicateCandidate {
  id: string;
  code: string;
  cliente: string;
  cognome: string | null;
  telefono: string | null;
  indirizzo: string | null;
  fase: string;
  created_at: string;
  match_score: number;
}

/**
 * Trova possibili duplicati di una commessa nuova prima di crearla.
 * Matcha su cliente + cognome + telefono + indirizzo (score-based).
 */
const detectDuplicates = async (params: {
  cliente: string;
  cognome?: string;
  telefono?: string;
  indirizzo?: string;
  daysWindow?: number;
}): Promise<DuplicateCandidate[]> => {
  const { cliente, cognome, telefono, indirizzo, daysWindow = 30 } = params;
  if (!cliente || cliente.trim() === "") return [];

  const { data, error } = await supabase.rpc("detect_duplicate_commessa", {
    p_cliente: cliente,
    p_cognome: cognome || null,
    p_telefono: telefono || null,
    p_indirizzo: indirizzo || null,
    p_days_window: daysWindow,
  });

  if (error) {
    console.warn("[detectDuplicates] error:", error.message);
    return [];
  }
  return (data || []) as DuplicateCandidate[];
};

// ─── Init ───────────────────────────────────────────────────
let _initialized = false;
const init = async (aziendaId?: string): Promise<void> => {
  if (_initialized) return;
  _initialized = true;
  syncWorker.start();
  if (aziendaId) {
    await hydrate("commesse", aziendaId);
  }
  console.log("[mastro:store] initialized v2");
};

// ─── Export API ─────────────────────────────────────────────
export const mastroStore = {
  commesse: makeTableApi("commesse"),
  vani: makeTableApi("vani"),
  rilievi: makeTableApi("rilievi"),

  // Bulk
  bulkSoftDelete,
  bulkArchivia,
  bulkUnarchivia,

  // Merge & duplicates
  mergeCommesse,
  detectDuplicates,

  // Lifecycle
  init,

  // Escape hatches
  syncWorker,
  rawIdb: { idbGet, idbGetAll, idbPut },
};

if (typeof window !== "undefined") {
  (window as any).__mastro_store = mastroStore;
}
