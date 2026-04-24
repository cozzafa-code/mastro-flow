// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-idb.ts
// IndexedDB wrapper: cache dati + coda outbox + id mapping
// Parte del Sync Engine v1
// ═══════════════════════════════════════════════════════════

const DB_NAME = "mastro_sync_v1";
const DB_VERSION = 1;

// Store names
export const STORES = {
  CANTIERI: "cantieri",
  VANI: "vani",
  RILIEVI: "rilievi",
  OUTBOX: "outbox",       // coda operazioni pending
  ID_MAP: "id_map",       // mapping tempId -> serverUUID
  META: "meta",           // lastSync, flags
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

// ─── Apertura DB ────────────────────────────────────────────
let _dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Cantieri, Vani, Rilievi: chiave = id
      if (!db.objectStoreNames.contains(STORES.CANTIERI)) {
        db.createObjectStore(STORES.CANTIERI, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.VANI)) {
        db.createObjectStore(STORES.VANI, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.RILIEVI)) {
        db.createObjectStore(STORES.RILIEVI, { keyPath: "id" });
      }

      // Outbox: chiave autoincrement, indice su table + status
      if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
        const os = db.createObjectStore(STORES.OUTBOX, {
          keyPath: "op_id",
          autoIncrement: true,
        });
        os.createIndex("by_status", "status", { unique: false });
        os.createIndex("by_table", "table", { unique: false });
        os.createIndex("by_created", "created_at", { unique: false });
      }

      // Id map: tempId -> serverUuid
      if (!db.objectStoreNames.contains(STORES.ID_MAP)) {
        db.createObjectStore(STORES.ID_MAP, { keyPath: "temp_id" });
      }

      // Meta: key/value
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
};

// ─── Helper generiche ───────────────────────────────────────
const runTx = <T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
): Promise<T> =>
  openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const result = fn(store);
        if (result instanceof Promise) {
          result.then(resolve, reject);
          return;
        }
        (result as IDBRequest<T>).onsuccess = () =>
          resolve((result as IDBRequest<T>).result);
        (result as IDBRequest<T>).onerror = () =>
          reject((result as IDBRequest<T>).error);
      })
  );

// ─── API CACHE ENTITÀ (cantieri, vani, rilievi) ─────────────
export const idbGetAll = async <T = any>(store: StoreName): Promise<T[]> => {
  try {
    return await runTx<T[]>(store, "readonly", (s) =>
      s.getAll() as IDBRequest<T[]>
    );
  } catch (e) {
    console.warn(`[mastro:idb] getAll ${store} failed`, e);
    return [];
  }
};

export const idbGet = async <T = any>(
  store: StoreName,
  id: string
): Promise<T | null> => {
  try {
    const res = await runTx<T>(store, "readonly", (s) =>
      s.get(id) as IDBRequest<T>
    );
    return res || null;
  } catch {
    return null;
  }
};

export const idbPut = async (store: StoreName, obj: any): Promise<void> => {
  try {
    await runTx(store, "readwrite", (s) => s.put(obj));
  } catch (e) {
    console.warn(`[mastro:idb] put ${store} failed`, e);
  }
};

export const idbPutMany = async (
  store: StoreName,
  objs: any[]
): Promise<void> => {
  if (objs.length === 0) return;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      const s = tx.objectStore(store);
      objs.forEach((o) => s.put(o));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn(`[mastro:idb] putMany ${store} failed`, e);
  }
};

export const idbDelete = async (store: StoreName, id: string): Promise<void> => {
  try {
    await runTx(store, "readwrite", (s) => s.delete(id));
  } catch (e) {
    console.warn(`[mastro:idb] delete ${store} failed`, e);
  }
};

// ─── META (lastSync, ecc.) ──────────────────────────────────
export const idbGetMeta = async (key: string): Promise<any> => {
  try {
    return await runTx(STORES.META, "readonly", (s) =>
      s.get(key) as IDBRequest<any>
    );
  } catch {
    return null;
  }
};

export const idbSetMeta = async (key: string, value: any): Promise<void> => {
  try {
    await runTx(STORES.META, "readwrite", (s) => s.put(value, key));
  } catch (e) {
    console.warn(`[mastro:idb] setMeta failed`, e);
  }
};

// ─── ID MAPPING (tempId -> serverUuid) ──────────────────────
export const idbMapId = async (
  tempId: string,
  serverId: string
): Promise<void> => {
  await idbPut(STORES.ID_MAP, {
    temp_id: tempId,
    server_id: serverId,
    mapped_at: new Date().toISOString(),
  });
};

export const idbResolveId = async (id: string): Promise<string> => {
  const map = await idbGet<{ server_id: string }>(STORES.ID_MAP, id);
  return map?.server_id || id;
};

export const idbGetAllMappings = async (): Promise<
  Array<{ temp_id: string; server_id: string; mapped_at: string }>
> => {
  return idbGetAll(STORES.ID_MAP);
};

// ─── OUTBOX ─────────────────────────────────────────────────
export type OutboxOperation = "insert" | "update" | "delete";
export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export interface OutboxEntry {
  op_id?: number;
  table: string;
  operation: OutboxOperation;
  payload: any;
  temp_id?: string;       // per INSERT, ID locale usato nella UI
  target_id?: string;     // per UPDATE/DELETE, ID del record target
  status: OutboxStatus;
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export const outboxEnqueue = async (
  entry: Omit<OutboxEntry, "op_id" | "status" | "retry_count" | "created_at" | "updated_at"> & {
    status?: OutboxStatus;
  }
): Promise<number> => {
  const now = new Date().toISOString();
  const full: OutboxEntry = {
    ...entry,
    status: entry.status || "pending",
    retry_count: 0,
    created_at: now,
    updated_at: now,
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OUTBOX, "readwrite");
    const req = tx.objectStore(STORES.OUTBOX).add(full);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
};

export const outboxList = async (
  filter?: { status?: OutboxStatus; table?: string }
): Promise<OutboxEntry[]> => {
  const all = await idbGetAll<OutboxEntry>(STORES.OUTBOX);
  return all.filter((e) => {
    if (filter?.status && e.status !== filter.status) return false;
    if (filter?.table && e.table !== filter.table) return false;
    return true;
  });
};

export const outboxUpdate = async (
  op_id: number,
  patch: Partial<OutboxEntry>
): Promise<void> => {
  const entry = await runTx<OutboxEntry>(STORES.OUTBOX, "readonly", (s) =>
    s.get(op_id) as IDBRequest<OutboxEntry>
  );
  if (!entry) return;
  const updated = { ...entry, ...patch, updated_at: new Date().toISOString() };
  await runTx(STORES.OUTBOX, "readwrite", (s) => s.put(updated));
};

export const outboxAck = async (op_id: number): Promise<void> => {
  await outboxUpdate(op_id, { status: "synced" });
};

export const outboxFail = async (
  op_id: number,
  error: string,
  permanent = false
): Promise<void> => {
  const entry = await runTx<OutboxEntry>(STORES.OUTBOX, "readonly", (s) =>
    s.get(op_id) as IDBRequest<OutboxEntry>
  );
  if (!entry) return;
  await outboxUpdate(op_id, {
    status: permanent ? "failed" : "pending",
    retry_count: entry.retry_count + 1,
    last_error: error,
  });
};

export const outboxSize = async (): Promise<number> => {
  const pending = await outboxList({ status: "pending" });
  const syncing = await outboxList({ status: "syncing" });
  return pending.length + syncing.length;
};

export const outboxClear = async (): Promise<void> => {
  await runTx(STORES.OUTBOX, "readwrite", (s) => s.clear());
};

// ─── UTIL ───────────────────────────────────────────────────
const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (id: string): boolean =>
  typeof id === "string" && UUID_RX.test(id);

export const makeTempId = (): string => {
  // tempId formato riconoscibile: "tmp_" + timestamp + random
  // NB: NON è un UUID → il sync worker sa che va trasformato
  const rand = Math.random().toString(36).slice(2, 8);
  return `tmp_${Date.now()}_${rand}`;
};

export const isTempId = (id: string): boolean =>
  typeof id === "string" && id.startsWith("tmp_");

// ─── DEBUG (esposto su window in dev) ───────────────────────
export const idbDebug = {
  openDB,
  STORES,
  dumpAll: async () => ({
    cantieri: await idbGetAll(STORES.CANTIERI),
    vani: await idbGetAll(STORES.VANI),
    rilievi: await idbGetAll(STORES.RILIEVI),
    outbox: await idbGetAll(STORES.OUTBOX),
    id_map: await idbGetAll(STORES.ID_MAP),
  }),
  wipeAll: async () => {
    await runTx(STORES.CANTIERI, "readwrite", (s) => s.clear());
    await runTx(STORES.VANI, "readwrite", (s) => s.clear());
    await runTx(STORES.RILIEVI, "readwrite", (s) => s.clear());
    await runTx(STORES.OUTBOX, "readwrite", (s) => s.clear());
    await runTx(STORES.ID_MAP, "readwrite", (s) => s.clear());
    console.log("[mastro:idb] wipe done");
  },
};

// esponi su window in runtime (utile per console debug)
if (typeof window !== "undefined") {
  (window as any).__mastro_idb = idbDebug;
}
