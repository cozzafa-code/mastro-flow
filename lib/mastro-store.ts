// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-store.ts
// API unificata per il data layer. Sostituisce chiamate dirette a supabase.
// Parte del Sync Engine v1
//
// Uso:
//   import { mastroStore } from "@/lib/mastro-store";
//   const id = await mastroStore.commesse.create({ cliente: "...", ... });
//   await mastroStore.commesse.update(id, { nota: "..." });
//   await mastroStore.commesse.softDelete(id);
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

  // 1. Scrivi subito in cache locale → la UI vede il record immediatamente
  await idbPut(storeFor(table), record);

  // 2. Metti in coda per sync
  await outboxEnqueue({
    table,
    operation: "insert",
    payload: record,
    temp_id: tempId,
  });

  // 3. Tenta sync subito (se online)
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

  // Merge su cache
  const existing = await idbGet(storeFor(table), resolved);
  const updated = { ...(existing || {}), ...patch, id: resolved, updated_at: now };
  await idbPut(storeFor(table), updated);

  // Outbox
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
  // Soft delete = UPDATE deleted_at
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
  // Per commesse: escludi soft-deleted
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

/**
 * Restituisce l'unione: record server (da cache IDB aggiornata) + record pending locali (tempId).
 * Filtra eventuali soft-deleted.
 */
const listMerged = async (table: TableName): Promise<any[]> => {
  const all = await idbGetAll(storeFor(table));
  // Filtra soft-deleted
  return all.filter((r: any) => !r.deleted_at);
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

// ─── Bulk operations (per selezione multipla) ───────────────
const bulkSoftDelete = async (
  table: TableName,
  ids: string[]
): Promise<{ ok: number; skipped: number }> => {
  let ok = 0;
  for (const id of ids) {
    try {
      await softDeleteRecord(table, id);
      ok++;
    } catch (e) {
      console.warn(`[mastro:store] bulkSoftDelete skip ${id}:`, e);
    }
  }
  return { ok, skipped: ids.length - ok };
};

// ─── Init ───────────────────────────────────────────────────
let _initialized = false;
const init = async (aziendaId?: string): Promise<void> => {
  if (_initialized) return;
  _initialized = true;

  // Start sync worker
  syncWorker.start();

  // Hydrate da server se aziendaId fornito
  if (aziendaId) {
    await hydrate("commesse", aziendaId);
  }

  console.log("[mastro:store] initialized");
};

// ─── Export API ─────────────────────────────────────────────
export const mastroStore = {
  commesse: makeTableApi("commesse"),
  vani: makeTableApi("vani"),
  rilievi: makeTableApi("rilievi"),

  // Bulk
  bulkSoftDelete,

  // Lifecycle
  init,

  // Escape hatches
  syncWorker,
  rawIdb: { idbGet, idbGetAll, idbPut },
};

// Debug su window
if (typeof window !== "undefined") {
  (window as any).__mastro_store = mastroStore;
}
