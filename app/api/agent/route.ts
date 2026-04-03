// ═══════════════════════════════════════════════════════════
// MASTRO ERP — /api/agent
// Route AI agent: analizza commesse e genera agent_actions
// Chiamata da: cron job, webhook Supabase, o trigger manuale
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Regole agente (fase 1 — passive suggestions) ─────────────
const REGOLE = [
  {
    id: "preventivo_fermo",
    check: (c: any) => {
      if (c.fase !== "preventivo") return null;
      const aggiornato = new Date(c.aggiornato || c.creato || Date.now());
      const giorni = Math.floor((Date.now() - aggiornato.getTime()) / 86400000);
      if (giorni < 5) return null;
      return {
        tipo: "remind_preventivo",
        payload: { commessa_id: c.id, giorni_fermo: giorni, cliente: c.cliente },
      };
    },
  },
  {
    id: "fattura_scaduta",
    check: (c: any, fatture: any[]) => {
      const oggi = new Date().toISOString().split("T")[0];
      const scadute = fatture.filter(
        (f) => f.cmId === c.id && !f.pagata && f.scadenza && f.scadenza < oggi
      );
      if (scadute.length === 0) return null;
      return {
        tipo: "remind_pagamento",
        payload: {
          commessa_id: c.id,
          cliente: c.cliente,
          fatture_scadute: scadute.length,
          importo: scadute.reduce((s: number, f: any) => s + (f.importo || 0), 0),
        },
      };
    },
  },
  {
    id: "commessa_ferma",
    check: (c: any) => {
      if (c.fase === "chiusura") return null;
      const aggiornato = new Date(c.aggiornato || c.creato || Date.now());
      const giorni = Math.floor((Date.now() - aggiornato.getTime()) / 86400000);
      if (giorni < 14) return null;
      return {
        tipo: "alert_commessa_ferma",
        payload: { commessa_id: c.id, giorni_fermo: giorni, fase: c.fase, cliente: c.cliente },
      };
    },
  },
  {
    id: "posa_senza_collaudo",
    check: (c: any) => {
      if (c.fase !== "posa") return null;
      const aggiornato = new Date(c.aggiornato || c.creato || Date.now());
      const giorni = Math.floor((Date.now() - aggiornato.getTime()) / 86400000);
      if (giorni < 7) return null;
      return {
        tipo: "suggest_collaudo",
        payload: { commessa_id: c.id, giorni_in_posa: giorni, cliente: c.cliente },
      };
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    // Autenticazione via secret header
    const secret = req.headers.get("x-agent-secret");
    if (secret !== process.env.AGENT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const azienda_id = body.azienda_id;

    // Carica dati necessari
    const [cantieriRes, fattureRes, existingRes] = await Promise.all([
      supabase.from("cantieri").select("*").eq("azienda_id", azienda_id),
      supabase.from("fatture").select("*").eq("azienda_id", azienda_id),
      supabase
        .from("agent_actions")
        .select("tipo, payload")
        .eq("azienda_id", azienda_id)
        .eq("stato", "pending"),
    ]);

    const cantieri = cantieriRes.data || [];
    const fatture = fattureRes.data || [];
    const existing = existingRes.data || [];

    // De-duplicazione: non creare se già pending dello stesso tipo+commessa
    const existingKeys = new Set(
      existing.map((a) => `${a.tipo}:${a.payload?.commessa_id}`)
    );

    const nuoveAzioni: any[] = [];

    for (const c of cantieri) {
      for (const regola of REGOLE) {
        const azione = regola.check(c, fatture);
        if (!azione) continue;
        const key = `${azione.tipo}:${c.id}`;
        if (existingKeys.has(key)) continue;
        nuoveAzioni.push({
          azienda_id,
          commessa_id: c.id,
          tipo: azione.tipo,
          payload: azione.payload,
          stato: "pending",
        });
        existingKeys.add(key);
      }
    }

    if (nuoveAzioni.length > 0) {
      const { error } = await supabase.from("agent_actions").insert(nuoveAzioni);
      if (error) throw error;
    }

    // Log esecuzione
    await supabase.from("agent_actions").insert({
      azienda_id,
      tipo: "agent_run",
      payload: {
        cantieri_analizzati: cantieri.length,
        azioni_create: nuoveAzioni.length,
        run_at: new Date().toISOString(),
      },
      stato: "executed",
      eseguito_il: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      cantieri_analizzati: cantieri.length,
      azioni_create: nuoveAzioni.length,
      azioni: nuoveAzioni.map((a) => ({ tipo: a.tipo, commessa_id: a.commessa_id })),
    });
  } catch (err: any) {
    console.error("[/api/agent] error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

// GET: stato agente per un'azienda
export async function GET(req: NextRequest) {
  const azienda_id = req.nextUrl.searchParams.get("azienda_id");
  if (!azienda_id) return NextResponse.json({ error: "Missing azienda_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("azienda_id", azienda_id)
    .eq("stato", "pending")
    .order("creato_il", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pending: data });
}
