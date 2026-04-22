// app/api/preventivo-link/route.ts
// POST: crea token pubblico per preventivo (restituisce URL condivisibile)
// GET:  legge preventivo pubblico (no auth, solo via token)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function sbAdmin() {
  return createClient(SB_URL, SB_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function genToken() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cm_id, cm_code, snapshot, azienda_id } = body;
    if (!cm_id || !snapshot) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    // Cerca token esistente ATTIVO (non ancora risposto) per questa commessa
    const sb = sbAdmin();
    const { data: existing } = await sb
      .from("preventivo_tokens")
      .select("token")
      .eq("cm_id", cm_id)
      .is("risposta", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    let token = existing?.token;

    if (!token) {
      token = genToken();
      // unique constraint: retry max 3
      for (let i = 0; i < 3; i++) {
        const { error } = await sb.from("preventivo_tokens").insert({
          token,
          cm_id,
          cm_code: cm_code || "",
          azienda_id: azienda_id || null,
          snapshot,
        });
        if (!error) break;
        token = genToken();
      }
    } else {
      // aggiorna snapshot se token già esiste
      await sb.from("preventivo_tokens")
        .update({ snapshot })
        .eq("token", token);
    }

    return NextResponse.json({ token, url: `/p/${token}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const cm_id = url.searchParams.get("cm_id");
    const sb2 = sbAdmin();
    if (cm_id && !token) {
      // Lookup per titolare: trova ultimo token per commessa
      const { data: rows } = await sb2.from("preventivo_tokens").select("*").eq("cm_id", cm_id).order("created_at", { ascending: false }).limit(1);
      if (!rows || !rows[0]) return NextResponse.json({ found: false });
      const t = rows[0];
      return NextResponse.json({
        found: true,
        token: t.token,
        risposta: t.risposta,
        risposta_nota: t.risposta_nota,
        risposta_at: t.risposta_at,
        visualizzato: t.visualizzato,
        visualizzato_at: t.visualizzato_at,
      });
    }
    if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

    const { data, error } = await sb2
      .from("preventivo_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    // Marca come visualizzato (solo prima volta)
    if (!data.visualizzato) {
      await sb2.from("preventivo_tokens")
        .update({ visualizzato: true, visualizzato_at: new Date().toISOString() })
        .eq("token", token);
    }

    return NextResponse.json({
      cm_code: data.cm_code,
      snapshot: data.snapshot,
      risposta: data.risposta,
      risposta_nota: data.risposta_nota,
      risposta_at: data.risposta_at,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}

// PATCH: cliente risponde (OK / modifiche / chiamare)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, risposta, nota } = body;
    if (!token || !risposta) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }
    if (!["accettato", "modifiche", "chiamare"].includes(risposta)) {
      return NextResponse.json({ error: "invalid risposta" }, { status: 400 });
    }

    const sb = sbAdmin();
    const { error } = await sb.from("preventivo_tokens")
      .update({
        risposta,
        risposta_nota: nota || null,
        risposta_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
