// app/api/preventivo-link/route.ts
// POST: crea token pubblico per preventivo (restituisce URL condivisibile)
// GET:  legge preventivo pubblico (no auth, solo via token)
//       ?cm_id=xxx → lookup ultimo token per commessa (per titolare)
//       ?unread=1&azienda_id=xxx → lista risposte cliente non ancora notificate al titolare
// PATCH: cliente risponde (OK / modifiche / chiamare) — salva IP + UA per tracciabilità legale

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

function getClientMeta(req: NextRequest): { ip: string; ua: string } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || req.headers.get("cf-connecting-ip")
    || "";
  const ua = (req.headers.get("user-agent") || "").slice(0, 500); // limit
  return { ip, ua };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cm_id, cm_code, snapshot, azienda_id } = body;
    if (!cm_id || !snapshot) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

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
    const unread = url.searchParams.get("unread");
    const azienda_id = url.searchParams.get("azienda_id");

    const sb2 = sbAdmin();

    // ── Endpoint nuovo: lista risposte cliente non ancora notificate
    if (unread === "1" && azienda_id) {
      const { data: rows, error } = await sb2
        .from("preventivo_tokens")
        .select("token, cm_id, cm_code, snapshot, risposta, risposta_nota, risposta_at, visualizzato_at, letture_count, notify_titolare_inviata")
        .eq("azienda_id", azienda_id)
        .not("risposta", "is", null)
        .eq("notify_titolare_inviata", false)
        .order("risposta_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ items: rows || [] });
    }

    // ── Lookup per titolare: ultimo token per commessa
    if (cm_id && !token) {
      const { data: rows } = await sb2.from("preventivo_tokens")
        .select("*")
        .eq("cm_id", cm_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!rows || !rows[0]) return NextResponse.json({ found: false });
      const t = rows[0];
      return NextResponse.json({
        found: true,
        token: t.token,
        risposta: t.risposta,
        risposta_nota: t.risposta_nota,
        risposta_at: t.risposta_at,
        risposta_ip: t.risposta_ip,
        risposta_ua: t.risposta_ua,
        visualizzato: t.visualizzato,
        visualizzato_at: t.visualizzato_at,
        visualizzato_ip: t.visualizzato_ip,
        visualizzato_ua: t.visualizzato_ua,
        letture_count: t.letture_count,
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

    // Marca come visualizzato (con IP+UA solo prima volta) + incrementa letture
    const { ip, ua } = getClientMeta(req);
    const updateData: any = {
      letture_count: (data.letture_count || 0) + 1,
    };
    if (!data.visualizzato) {
      updateData.visualizzato = true;
      updateData.visualizzato_at = new Date().toISOString();
      updateData.visualizzato_ip = ip || null;
      updateData.visualizzato_ua = ua || null;
    }
    await sb2.from("preventivo_tokens").update(updateData).eq("token", token);

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

// PATCH: cliente risponde (OK / modifiche / chiamare) — con tracciabilità legale
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, risposta, nota, ack_titolare } = body;

    // Caso speciale: il titolare segna come "letta/notificata" la risposta
    if (token && ack_titolare === true) {
      const sb = sbAdmin();
      const { error } = await sb.from("preventivo_tokens")
        .update({ notify_titolare_inviata: true })
        .eq("token", token);
      if (error) throw error;
      return NextResponse.json({ ok: true, ack: true });
    }

    if (!token || !risposta) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }
    if (!["accettato", "modifiche", "chiamare"].includes(risposta)) {
      return NextResponse.json({ error: "invalid risposta" }, { status: 400 });
    }

    const { ip, ua } = getClientMeta(req);
    const sb = sbAdmin();
    const { data: tokenRow, error: errToken } = await sb.from("preventivo_tokens")
      .update({
        risposta,
        risposta_nota: nota || null,
        risposta_at: new Date().toISOString(),
        risposta_ip: ip || null,
        risposta_ua: ua || null,
        // Reset notify flag così il titolare riceve la notifica
        notify_titolare_inviata: false,
      })
      .eq("token", token)
      .select("cm_id, azienda_id")
      .maybeSingle();

    if (errToken) throw errToken;

    // v36 + fix enum DB: avanza fase commessa solo se cliente ha accettato
    // Le risposte 'modifiche' / 'chiamare' non avanzano fase (rimangono a 'preventivo')
    if (tokenRow?.cm_id && risposta === "accettato") {
      // accettato: avanza preventivo -> conferma_ordine (richiede preventivo_inviato_at + totale_finale > 0)
      // Se mancano i gates, l'update fallisce silenziosamente: il bottone "CREA CONFERMA D'ORDINE" servira' per forzare
      const { error: errFase } = await sb.from("commesse").update({ 
        fase: "conferma_ordine",
        conferma_ordine_inviata_at: new Date().toISOString(),
      }).eq("id", tokenRow.cm_id);
      if (errFase) {
        console.warn("[preventivo-link] avanza preventivo->conferma_ordine bloccato:", errFase.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
