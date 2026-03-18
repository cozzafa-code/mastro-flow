// app/api/portale/[token]/route.ts
// API pubblica per PortaleCliente B2C — NO auth richiesta, solo token
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role per bypassare RLS sul token lookup
);

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    if (!token) return NextResponse.json({ error: "Token mancante" }, { status: 400 });

    // Trova il token
    const { data: pt, error: ptErr } = await supabase
      .from("portale_tokens")
      .select("id, cm_id, azienda_id, attivo")
      .eq("token", token)
      .single();

    if (ptErr || !pt || !pt.attivo)
      return NextResponse.json({ error: "Link non valido o scaduto" }, { status: 404 });

    // Aggiorna ultimo accesso
    await supabase.from("portale_tokens").update({ ultimo_accesso: new Date().toISOString() }).eq("id", pt.id);

    // Carica dati commessa
    const [
      { data: cm },
      { data: vani },
      { data: fatture },
      { data: msgs },
      { data: azienda },
    ] = await Promise.all([
      supabase.from("commesse").select("id,code,cliente,cognome,indirizzo,fase,euro,confermato,data_confermato,data_posa").eq("id", pt.cm_id).single(),
      supabase.from("vani").select("id,nome,tipo,sistema,misure,colore,apertura,uw").eq("cm_id", pt.cm_id).eq("eliminato", false),
      supabase.from("fatture").select("id,numero,tipo,importo,data,scadenza,pagata").eq("cm_id", pt.cm_id),
      supabase.from("messaggi").select("id,testo,from,direzione,letto,created_at").eq("cm_id", pt.cm_id).order("created_at", { ascending: true }).limit(50),
      supabase.from("aziende").select("ragione,nome,telefono,email,logo_url").eq("id", pt.azienda_id).single(),
    ]);

    if (!cm) return NextResponse.json({ error: "Commessa non trovata" }, { status: 404 });

    // Calcola progress
    const PROGRESS: Record<string, number> = { sopralluogo:12, preventivo:25, conferma:38, misure:50, ordini:62, produzione:75, posa:88, chiusura:100 };
    const progress = PROGRESS[cm.fase] || 0;

    const pagato   = (fatture || []).filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const saldo    = (fatture || []).filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totale   = pagato + saldo;

    return NextResponse.json({
      ok: true,
      commessa: { ...cm, progress },
      vani: vani || [],
      fatture: fatture || [],
      pagamenti: { totale, pagato, saldo },
      messaggi: msgs || [],
      azienda: azienda || {},
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — cliente invia messaggio dal portale
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const { testo } = await req.json();
    if (!testo?.trim()) return NextResponse.json({ error: "Messaggio vuoto" }, { status: 400 });

    const { data: pt } = await supabase
      .from("portale_tokens").select("cm_id, azienda_id").eq("token", token).single();
    if (!pt) return NextResponse.json({ error: "Token non valido" }, { status: 404 });

    const { data: cm } = await supabase.from("commesse").select("code,cliente").eq("id", pt.cm_id).single();

    await supabase.from("messaggi").insert({
      azienda_id: pt.azienda_id,
      cm_id: pt.cm_id,
      cm: cm?.code,
      from: cm?.cliente || "Cliente",
      testo: testo.trim(),
      direzione: "in",
      letto: false,
      canale: "portale",
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
