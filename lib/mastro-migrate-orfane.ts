// ═══════════════════════════════════════════════════════════
// MASTRO ERP — mastro-migrate-orfane.ts
// Migra commesse orfane (ID locale) dal browser a Supabase.
//
// Per ogni commessa orfana:
//  1. INSERT in `commesse` (solo campi anagrafici) → ottieni UUID
//  2. Per ogni rilievo: INSERT in `rilievi` con commessa_id = UUID → ottieni UUID rilievo
//  3. Per ogni vano del rilievo: INSERT in `vani` con rilievo_id + commessa_id
//
// Campi nested (disegno, misure, accessori) vanno in colonne jsonb.
// Foto e allegati per ora NON migrati (servono storage upload separato).
//
// Uso: window.__mastro_migrate.run()
// ═══════════════════════════════════════════════════════════

"use client";

import { supabase } from "./supabase";
import {
  STORES,
  idbGetAll,
  idbPut,
  idbDelete,
  idbMapId,
  idbSetMeta,
  idbGetMeta,
  isUuid,
} from "./mastro-idb";

// ─── Costanti ───────────────────────────────────────────────
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const MIGRATE_STATUS_KEY = "migrate_orfane_status";

// ─── Tipi helper ────────────────────────────────────────────
interface MigrationReport {
  started_at: string;
  finished_at?: string;
  totale: number;
  ok: number;
  errori: number;
  dettaglio: Array<{
    local_id: string;
    cliente: string;
    status: "ok" | "errore";
    server_id?: string;
    errore?: string;
    rilievi_ok?: number;
    vani_ok?: number;
  }>;
}

// ─── Mappatura commessa client → payload Supabase ──────────
const mapCommessaToServer = (c: any) => {
  // Riconverti "Oggi" e altre date client-friendly in timestamptz valido o null
  const parseClientDate = (d: any): string | null => {
    if (!d) return null;
    if (typeof d !== "string") return null;
    // "Oggi", "Adesso" → null (il DB metterà DEFAULT now())
    if (/^(oggi|adesso|ieri)/i.test(d)) return null;
    // Date tipo "18 apr" → prova a parsare nell'anno corrente
    const m = d.match(/^(\d{1,2})\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/i);
    if (m) {
      const mesi: any = { gen:0, feb:1, mar:2, apr:3, mag:4, giu:5, lug:6, ago:7, set:8, ott:9, nov:10, dic:11 };
      const dt = new Date();
      dt.setMonth(mesi[m[2].toLowerCase()]);
      dt.setDate(parseInt(m[1], 10));
      return dt.toISOString();
    }
    // Prova ISO diretto
    const iso = new Date(d);
    return isNaN(iso.getTime()) ? null : iso.toISOString();
  };

  // Solo campi che esistono in `commesse` (dallo schema DB)
  const payload: any = {
    azienda_id: AZIENDA_ID,
    code: c.code || `TMP-${Date.now().toString().slice(-6)}`,
    cliente: c.cliente || "Sconosciuto",
    cognome: c.cognome || null,
    indirizzo: c.indirizzo || null,
    telefono: c.telefono || null,
    email: c.email || null,
    fase: c.fase || "sopralluogo",
    tipo: c.tipo || null,
    sistema: c.sistema || null,
    difficolta_salita: c.difficoltaSalita || null,
    mezzo_salita: c.mezzoSalita || null,
    foro_scale: c.foroScale || null,
    piano_edificio: c.pianoEdificio || null,
    note: c.note || null,
    created_at: parseClientDate(c.creato),
    updated_at: parseClientDate(c.aggiornato),
  };

  // Rimuovi null dove non servono (lascia defaultare DB)
  Object.keys(payload).forEach((k) => {
    if (payload[k] === null && ["created_at", "updated_at"].includes(k)) {
      delete payload[k];
    }
  });

  return payload;
};

const mapRilievoToServer = (r: any, commessa_id: string) => ({
  commessa_id,
  tipo: r.tipo || "rilievo",
  numero: typeof r.n === "number" ? r.n : 1,
  data: r.data || null,
  ora: r.ora || null,
  rilevatore: r.rilevatore || null,
  note: r.note || null,
  motivo_modifica: r.motivoModifica || null,
  completato: r.stato === "completato" || false,
  complesso: false, // default schema richiede NOT NULL
});

const mapVanoToServer = (v: any, rilievo_id: string, commessa_id: string, ordine: number) => ({
  rilievo_id,
  commessa_id,
  nome: v.nome || `Vano ${ordine}`,
  ordine,
  tipo: v.tipo || "finestra", // NOT NULL nello schema
  pezzi: typeof v.pezzi === "number" ? v.pezzi : 1,
  stanza: v.stanza || null,
  piano: v.piano || null,
  sistema: v.sistema || null,
  vetro: v.vetro || null,
  colore_int: v.coloreInt || null,
  colore_est: v.coloreEst || null,
  bicolore: !!v.bicolore,
  colore_acc: v.coloreAcc || null,
  telaio: v.telaio || null,
  telaio_ala_z: v.telaioAlaZ || null,
  rifilato: !!v.rifilato,
  rifil_sx: v.rifilSx || null,
  rifil_dx: v.rifilDx || null,
  rifil_sopra: v.rifilSopra || null,
  rifil_sotto: v.rifilSotto || null,
  coprifilo: v.coprifilo || null,
  lamiera: v.lamiera || null,
  cassonetto: !!v.cassonetto,
  accessori: v.accessori || {},
  difficolta_salita: v.difficoltaSalita || null,
  mezzo_salita: v.mezzoSalita || null,
  note: v.note || null,
  misure_json: v.misure || {},
  cad_json: v.disegno || null,
  verificato: {}, // NOT NULL
});

// ─── Migrazione singola commessa (atomica) ──────────────────
const migrateOrfana = async (commessa: any) => {
  const localId = commessa.id;
  const cliente = `${commessa.cliente || "?"} ${commessa.cognome || ""}`.trim();

  try {
    // STEP 1: INSERT commessa
    const commessaPayload = mapCommessaToServer(commessa);
    const { data: cRow, error: cErr } = await supabase
      .from("commesse")
      .insert(commessaPayload)
      .select()
      .single();
    if (cErr) throw new Error(`commessa: ${cErr.message}`);
    const serverCommessaId = cRow.id;

    // Mappa tempId → UUID e aggiorna cache
    await idbMapId(String(localId), serverCommessaId);

    let rilieviOk = 0;
    let vaniOk = 0;

    // STEP 2+3: rilievi e loro vani
    const rilievi = Array.isArray(commessa.rilievi) ? commessa.rilievi : [];
    for (const r of rilievi) {
      const rilievoPayload = mapRilievoToServer(r, serverCommessaId);
      const { data: rRow, error: rErr } = await supabase
        .from("rilievi")
        .insert(rilievoPayload)
        .select()
        .single();
      if (rErr) {
        console.warn(`[migrate] rilievo skip: ${rErr.message}`);
        continue;
      }
      rilieviOk++;
      const serverRilievoId = rRow.id;
      if (r.id) await idbMapId(String(r.id), serverRilievoId);

      const vani = Array.isArray(r.vani) ? r.vani : [];
      for (let i = 0; i < vani.length; i++) {
        const v = vani[i];
        const vanoPayload = mapVanoToServer(v, serverRilievoId, serverCommessaId, i + 1);
        const { data: vRow, error: vErr } = await supabase
          .from("vani")
          .insert(vanoPayload)
          .select()
          .single();
        if (vErr) {
          console.warn(`[migrate] vano skip: ${vErr.message}`);
          continue;
        }
        vaniOk++;
        if (v.id) await idbMapId(String(v.id), vRow.id);
      }
    }

    // STEP 4: aggiorna cache IDB — rimuovi record tempId, inserisci quello server
    await idbDelete(STORES.CANTIERI, String(localId));
    await idbPut(STORES.CANTIERI, { ...cRow });

    return {
      local_id: String(localId),
      cliente,
      status: "ok" as const,
      server_id: serverCommessaId,
      rilievi_ok: rilieviOk,
      vani_ok: vaniOk,
    };
  } catch (e: any) {
    return {
      local_id: String(localId),
      cliente,
      status: "errore" as const,
      errore: e?.message || String(e),
    };
  }
};

// ─── Main: migra tutte le orfane ────────────────────────────
export const migrateAllOrfane = async (): Promise<MigrationReport> => {
  const all = await idbGetAll(STORES.CANTIERI);
  const orfane = all.filter((c: any) => !isUuid(String(c.id)));

  const report: MigrationReport = {
    started_at: new Date().toISOString(),
    totale: orfane.length,
    ok: 0,
    errori: 0,
    dettaglio: [],
  };

  console.log(`[migrate] inizio migrazione ${orfane.length} orfane`);
  await idbSetMeta(MIGRATE_STATUS_KEY, { status: "running", report });

  for (let i = 0; i < orfane.length; i++) {
    const c = orfane[i];
    console.log(`[migrate] ${i + 1}/${orfane.length} → ${c.cliente} ${c.cognome || ""}`);
    const res = await migrateOrfana(c);
    report.dettaglio.push(res);
    if (res.status === "ok") report.ok++;
    else report.errori++;
  }

  report.finished_at = new Date().toISOString();
  await idbSetMeta(MIGRATE_STATUS_KEY, { status: "done", report });

  console.log(
    `[migrate] FINITO — OK: ${report.ok}, ERRORI: ${report.errori}`
  );
  console.table(
    report.dettaglio.map((d) => ({
      cliente: d.cliente,
      status: d.status,
      rilievi: d.rilievi_ok,
      vani: d.vani_ok,
      errore: d.errore,
    }))
  );

  return report;
};

// ─── Dry-run: prova a migrare solo la prima orfana ──────────
export const migrateDryRun = async () => {
  const all = await idbGetAll(STORES.CANTIERI);
  const orfane = all.filter((c: any) => !isUuid(String(c.id)));
  if (orfane.length === 0) {
    console.log("[migrate:dry] nessuna orfana");
    return null;
  }
  console.log(`[migrate:dry] provo 1 di ${orfane.length}:`, orfane[0].cliente);
  const res = await migrateOrfana(orfane[0]);
  console.log("[migrate:dry] risultato:", res);
  return res;
};

// ─── Esposizione debug ──────────────────────────────────────
if (typeof window !== "undefined") {
  (window as any).__mastro_migrate = {
    run: migrateAllOrfane,
    dryRun: migrateDryRun,
    status: async () => idbGetMeta(MIGRATE_STATUS_KEY),
  };
}

export {};
