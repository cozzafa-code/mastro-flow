"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP - useVaniSync (v3 - FIX aziendaId da cantieri)
// Sincronizza in background lo state cantieri verso Supabase:
//   - tabella `vani` (record canonici - usata per workspace preventivo)
//   - tabella `vani_disegno` (misure + disegno CAD)
//   - tabella `ops_foto` (foto cantiere)
// v3 FIX: aziendaId estratto da cantieri[].azienda_id come priorita',
//         storage come fallback. Risolve "Sync DISATTIVATO" quando
//         storage non ha la chiave.
// File < 300 righe.
// ================================================================
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function sb() {
  return createClient(supabaseUrl, supabaseKey);
}

const DEBOUNCE_MS = 3000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// [v3-fix] Estrae aziendaId con gerarchia: cantieri → storage
function resolveAziendaId(cantieri: any[]): string | null {
  // 1. Prima cerca nei cantieri (FONTE PIU' AFFIDABILE - viene dal DB)
  if (Array.isArray(cantieri)) {
    for (const c of cantieri) {
      const candidate = c?.azienda_id || c?.aziendaId;
      if (candidate && UUID_RE.test(String(candidate))) return String(candidate);
    }
  }
  // 2. Fallback storage
  if (typeof window === "undefined") return null;
  const candidates = [
    sessionStorage.getItem("mastro:aziendaId"),
    localStorage.getItem("mastro:aziendaId"),
    sessionStorage.getItem("aziendaId"),
    localStorage.getItem("aziendaId"),
  ];
  for (const c of candidates) {
    if (c && UUID_RE.test(c)) {
      // [v3-fix] auto-popola storage per altri componenti (OrdiniSheet, ecc.)
      try { sessionStorage.setItem("mastro:aziendaId", c); } catch {}
      return c;
    }
  }
  return null;
}

export function useVaniSync(
  cantieri: any[],
  userId: string | null,
  isUuid: boolean
) {
  const timerRef = useRef<any>(null);
  const lastHashRef = useRef<string>("");

  useEffect(() => {
    if (!isUuid || !cantieri || cantieri.length === 0) return;
    if (!supabaseUrl || !supabaseKey) return;

    const aziendaId = resolveAziendaId(cantieri);
    if (!aziendaId) {
      console.warn("[useVaniSync v3] aziendaId non trovato (ne' in cantieri ne' in storage). Sync DISATTIVATO.");
      return;
    }

    // [v3-fix] auto-popola storage cosi' OrdiniSheet & altri lo trovano
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("mastro:aziendaId", aziendaId);
        localStorage.setItem("mastro:aziendaId", aziendaId);
      }
    } catch {}

    // Hash veloce per evitare sync inutili (rilieva solo cambi rilevanti)
    const hash = JSON.stringify(
      cantieri.map(c => ({
        id: c.id,
        f: c.fase,
        vani: (c.rilievi || []).flatMap((r: any) =>
          (r.vani || []).map((v: any) => ({
            id: v.id,
            tipo: v.tipo,
            misure: v.misure,
            note: v.note,
            sistema: v.sistema,
            stanza: v.stanza,
            piano: v.piano,
            pezzi: v.pezzi,
            coloreInt: v.coloreInt,
            coloreEst: v.coloreEst,
            _dKeys: v.disegno ? Object.keys(v.disegno).length : 0,
          }))
        ),
      }))
    );
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      console.log("[useVaniSync v3] sync trigger, aziendaId:", aziendaId, "cantieri:", cantieri.length);
      syncVaniToSupabase(cantieri, aziendaId);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cantieri, userId, isUuid]);
}

// -------- Sync effettivo --------
async function syncVaniToSupabase(cantieri: any[], aziendaId: string) {
  const s = sb();
  let totaleVaniSync = 0;
  let totaleErrori = 0;

  for (const commessa of cantieri) {
    const commessaId = commessa.id;
    if (!commessaId || !UUID_RE.test(String(commessaId))) continue;

    const rilievi = commessa.rilievi || [];
    for (const rilievo of rilievi) {
      const vani = rilievo.vani || [];
      for (const vano of vani) {
        if (!vano.id) continue;

        try {
          const misure = vano.misure || {};
          const vanoIdStr = String(vano.id);

          // ===== 1. UPSERT su tabella `vani` (record canonico per workspace) =====
          const isVanoUuid = UUID_RE.test(vanoIdStr);
          const vanoRow: any = {
            commessa_id: String(commessaId),
            rilievo_id: rilievo.id && UUID_RE.test(String(rilievo.id)) ? String(rilievo.id) : null,
            nome: vano.nome || vano.tipo || "Vano",
            tipo: vano.tipo || null,
            stanza: vano.stanza || null,
            piano: vano.piano || null,
            sistema: vano.sistema || null,
            pezzi: vano.pezzi || 1,
            ordine: vano.ordine || 0,
            misure_json: misure,
            misure_complete: !!(misure.lCentro && misure.hCentro),
            colore_int: vano.coloreInt || null,
            colore_est: vano.coloreEst || null,
            bicolore: !!vano.bicolore,
            vetro: vano.vetro || null,
            telaio: vano.telaio || null,
            rifilato: vano.rifilato || null,
            coprifilo: vano.coprifilo || null,
            lamiera: vano.lamiera || null,
            difficolta_salita: vano.difficoltaSalita || null,
            mezzo_salita: vano.mezzoSalita || null,
            note: vano.note || null,
            accessori: vano.accessori || null,
            cassonetto: vano.cassonetto || null,
            cassonetto_config: vano.cassonettoConfig || null,
            controtelaio_config: vano.controtelaio || null,
            persiana_config: vano.persianaConfig || null,
            tapparella_config: vano.tapparellaConfig || null,
            zanzariera_config: vano.zanzarieraConfig || null,
            updated_at: new Date().toISOString(),
          };
          if (isVanoUuid) vanoRow.id = vanoIdStr;

          // Cerca esistente per id (se UUID) o per commessa+nome
          let existingVano: any = null;
          if (isVanoUuid) {
            const { data } = await s.from("vani").select("id").eq("id", vanoIdStr).maybeSingle();
            existingVano = data;
          }
          if (!existingVano) {
            const { data } = await s.from("vani")
              .select("id")
              .eq("commessa_id", String(commessaId))
              .eq("nome", vanoRow.nome)
              .limit(1);
            if (data && data.length > 0) existingVano = data[0];
          }

          if (existingVano?.id) {
            const { error } = await s.from("vani").update(vanoRow).eq("id", existingVano.id);
            if (error) { console.warn(`[useVaniSync v3] update vani err ${vano.id}:`, error.message); totaleErrori++; }
            else totaleVaniSync++;
          } else {
            const { error } = await s.from("vani").insert(vanoRow);
            if (error) { console.warn(`[useVaniSync v3] insert vani err ${vano.id}:`, error.message); totaleErrori++; }
            else totaleVaniSync++;
          }

          // ===== 2. UPSERT su tabella `vani_disegno` (misure + disegno per CAD) =====
          const disegnoRow = {
            azienda_id: aziendaId,
            vano_id: vanoIdStr,
            commessa_id: String(commessaId),
            tipologia: vano.tipo || null,
            sistema: vano.sistema || null,
            mis_l: misure.lCentro || misure.lAlto || null,
            mis_h: misure.hCentro || misure.hSx || null,
            mis_diag1: misure.diag1 || null,
            mis_diag2: misure.diag2 || null,
            mis_spessore_muro: misure.spessoreMuro || null,
            mis_note: vano.note || null,
            mis_foto_urls: vano.fotoUrls || [],
            stato: "bozza",
            extra: {
              stanza: vano.stanza,
              piano: vano.piano,
              coloreInt: vano.coloreInt,
              coloreEst: vano.coloreEst,
              misure_complete: misure,
              rilievo_id: rilievo.id,
              disegno: vano.disegno || null,
            },
            updated_at: new Date().toISOString(),
          };

          const { data: existDis } = await s
            .from("vani_disegno")
            .select("id")
            .eq("vano_id", vanoIdStr)
            .eq("commessa_id", String(commessaId))
            .limit(1);

          if (existDis && existDis.length > 0) {
            await s.from("vani_disegno").update(disegnoRow).eq("id", existDis[0].id);
          } else {
            await s.from("vani_disegno").insert(disegnoRow);
          }

          // ===== 3. Sync foto vano =====
          const fotoVano = vano.foto || {};
          const fotoEntries = Object.entries(fotoVano).filter(
            ([, v]) => v && typeof v === "string" && (v as string).startsWith("http")
          );
          for (const [fotoKey, fotoUrl] of fotoEntries) {
            const { data: existFoto } = await s
              .from("ops_foto")
              .select("id")
              .eq("commessa_id", String(commessaId))
              .eq("url", fotoUrl as string)
              .limit(1);

            if (!existFoto || existFoto.length === 0) {
              await s.from("ops_foto").insert({
                azienda_id: aziendaId,
                commessa_id: String(commessaId),
                url: fotoUrl as string,
                tipo: "misura",
                fase_codice: fotoKey,
                note: `Foto ${fotoKey} - ${vano.tipo || "vano"} ${vano.stanza || ""}`.trim(),
              });
            }
          }
        } catch (e: any) {
          console.warn(`[useVaniSync v3] errore sync vano ${vano.id}:`, e?.message || e);
          totaleErrori++;
        }
      }
    }
  }

  if (totaleVaniSync > 0 || totaleErrori > 0) {
    console.log(`[useVaniSync v3] Sync completato: ${totaleVaniSync} vani OK, ${totaleErrori} errori`);
  }
}

// -------- Sync dettatura vocale (mantenuto da v1) --------
export async function syncDettatura(
  aziendaId: string,
  commessaId: string,
  vanoId: string,
  testo: string
) {
  if (!aziendaId || !commessaId || !vanoId) return;
  try {
    const s = sb();
    const { data: existing } = await s
      .from("vani_disegno")
      .select("id, mis_note")
      .eq("vano_id", String(vanoId))
      .eq("commessa_id", String(commessaId))
      .limit(1);

    if (existing && existing.length > 0) {
      const noteAttuali = existing[0].mis_note || "";
      const nuoveNote = noteAttuali
        ? `${noteAttuali}\n[dettatura] ${testo}`
        : `[dettatura] ${testo}`;
      await s
        .from("vani_disegno")
        .update({ mis_note: nuoveNote, updated_at: new Date().toISOString() })
        .eq("id", existing[0].id);
    }

    await s.from("log_eventi").insert({
      azienda_id: aziendaId,
      tipo_evento: "dettatura_vocale",
      descrizione: testo.slice(0, 200),
      commessa_id: String(commessaId),
      origine: "mobile",
    });
  } catch (e: any) {
    console.warn("[syncDettatura] errore:", e?.message || e);
  }
}
