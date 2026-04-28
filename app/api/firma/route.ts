// app/api/firma/route.ts
// Endpoint UNIFICATO firma elettronica MASTRO
// 4 azioni: genera | leggi | firma | check
// Persistenza: tabella public.firma_tokens (Supabase)
// Livello: FES rinforzata (FEA-grade): canvas firma + IP + UA + timestamp + token monouso
// Per FEQ qualificata via Namirial usare /api/firma/crea
//
// Compatibile col chiamante esistente (CMDetailPanel "Invia link firma al cliente"):
//   POST { action:"genera", data:{cmId,cmCode,cliente,importo,descrizione} } -> { token, url }
//   POST { action:"leggi", token }                                            -> dati firma_tokens
//   POST { action:"firma", token, data:{firmaData} }                          -> { ok, firmaDataOra }
//   POST { action:"check", token }                                            -> { firmato, firmaDataOra }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role: bypass RLS, lato server only
function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, data } = body || {};
    const sb = svc();

    // ─────────────────────────────────────────
    // GENERA — crea record firma_tokens, ritorna token + URL pubblico
    // ─────────────────────────────────────────
    if (action === "genera") {
      if (!data?.cmId) {
        return NextResponse.json({ error: "cmId obbligatorio" }, { status: 400 });
      }

      const snapshot = {
        cmId: data.cmId,
        cmCode: data.cmCode || null,
        cliente: data.cliente || null,
        importo: data.importo ?? null,
        descrizione: data.descrizione || null,
        createdAt: new Date().toISOString(),
      };

      // Trovo azienda_id dalla commessa (se cmId è UUID valido)
      let aziendaId: string | null = null;
      let commessaUuid: string | null = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(data.cmId));
      if (isUuid) {
        commessaUuid = data.cmId;
        const { data: cm } = await sb
          .from("commesse")
          .select("azienda_id")
          .eq("id", data.cmId)
          .maybeSingle();
        if (cm?.azienda_id) aziendaId = cm.azienda_id;
      }

      const { data: row, error } = await sb
        .from("firma_tokens")
        .insert({
          cm_id: String(data.cmId),
          cm_code: data.cmCode || null,
          cliente: data.cliente || null,
          azienda_id: aziendaId,
          commessa_id: commessaUuid,
          tipo: "preventivo",
          stato: "pending",
          livello_firma: data.livello === "cartacea" ? "CARTACEA"
            : data.livello === "fea" ? "FEA"
            : data.livello === "feq" ? "FEQ"
            : "FES",
          provider: "mastro",
          snapshot,
          destinatario_telefono: data.telefono || null,
          destinatario_email: data.email || null,
        })
        .select("token")
        .single();

      if (error || !row) {
        return NextResponse.json(
          { error: error?.message || "errore creazione token" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        token: row.token,
        url: `/firma/${row.token}`,
      });
    }

    // ─────────────────────────────────────────
    // LEGGI — pagina pubblica /firma/[token]
    // ─────────────────────────────────────────
    if (action === "leggi") {
      if (!token) {
        return NextResponse.json({ error: "Token mancante" }, { status: 400 });
      }
      const { data: row, error } = await sb
        .from("firma_tokens")
        .select(
          "token, cm_id, cm_code, cliente, tipo, stato, snapshot, firmato_il, scade_il, livello_firma"
        )
        .eq("token", token)
        .maybeSingle();

      if (error || !row) {
        return NextResponse.json(
          { error: "Link non trovato o scaduto" },
          { status: 404 }
        );
      }
      if (row.scade_il && new Date(row.scade_il) < new Date()) {
        return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
      }
      if (row.stato === "revocato") {
        return NextResponse.json({ error: "Link revocato" }, { status: 410 });
      }

      // Shape compatibile col vecchio store
      const snap = (row.snapshot as any) || {};
      return NextResponse.json({
        token: row.token,
        cmId: row.cm_id,
        cmCode: row.cm_code,
        cliente: row.cliente,
        importo: snap.importo ?? null,
        descrizione: snap.descrizione ?? null,
        firmato: !!row.firmato_il,
        firmaDataOra: row.firmato_il,
        livelloFirma: row.livello_firma,
      });
    }

    // ─────────────────────────────────────────
    // FIRMA — registra firma a dito (canvas base64) + IP + UA
    // ─────────────────────────────────────────
    if (action === "firma") {
      if (!token || !data?.firmaData) {
        return NextResponse.json(
          { error: "Token e firmaData obbligatori" },
          { status: 400 }
        );
      }

      const { data: existing } = await sb
        .from("firma_tokens")
        .select("token, firmato_il, stato, scade_il")
        .eq("token", token)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: "Token non valido" }, { status: 404 });
      }
      if (existing.firmato_il) {
        return NextResponse.json(
          { error: "Documento già firmato" },
          { status: 409 }
        );
      }
      if (existing.scade_il && new Date(existing.scade_il) < new Date()) {
        return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
      }

      const ip = getIp(req);
      const ua = req.headers.get("user-agent") || "unknown";
      const ts = new Date().toISOString();

      const { error: uErr } = await sb
        .from("firma_tokens")
        .update({
          firma_data_url: data.firmaData,
          firma_ip: ip,
          firma_user_agent: ua,
          firmato_il: ts,
          stato: "firmato",
        })
        .eq("token", token);

      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, firmaDataOra: ts });
    }

    // ─────────────────────────────────────────
    // CHECK — polling lato titolare per stato firma
    // ─────────────────────────────────────────
    if (action === "check") {
      if (!token) {
        return NextResponse.json({ error: "Token mancante" }, { status: 400 });
      }
      const { data: row } = await sb
        .from("firma_tokens")
        .select("firmato_il")
        .eq("token", token)
        .maybeSingle();

      return NextResponse.json({
        firmato: !!row?.firmato_il,
        firmaDataOra: row?.firmato_il || null,
      });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "errore server" },
      { status: 500 }
    );
  }
}

// GET legacy: ?token=xxx — usato da qualche client
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }
  const sb = svc();
  const { data: row, error } = await sb
    .from("firma_tokens")
    .select("token, cm_id, cm_code, cliente, snapshot, firmato_il, scade_il, stato, livello_firma")
    .eq("token", token)
    .maybeSingle();
  if (error || !row) {
    return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  }
  const snap = (row.snapshot as any) || {};
  return NextResponse.json({
    token: row.token,
    cmId: row.cm_id,
    cmCode: row.cm_code,
    cliente: row.cliente,
    importo: snap.importo ?? null,
    descrizione: snap.descrizione ?? null,
    firmato: !!row.firmato_il,
    firmaDataOra: row.firmato_il,
    livelloFirma: row.livello_firma,
    scadeIl: row.scade_il,
  });
}
