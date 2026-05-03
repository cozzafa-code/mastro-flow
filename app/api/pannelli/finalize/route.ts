// app/api/pannelli/finalize/route.ts
// Finalizza un import: sposta pannelli da temp a catalogo, completa stato
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { import_id, ids_da_scartare } = body;

    if (!import_id) return NextResponse.json({ error: "import_id richiesto" }, { status: 400 });

    // Carica pannelli estratti, escludendo quelli scartati
    let q = supabase.from("pannelli_estratti_temp").select("*").eq("import_id", import_id);
    const { data: estratti } = await q;
    if (!estratti || estratti.length === 0) {
      return NextResponse.json({ error: "Nessun pannello estratto" }, { status: 400 });
    }

    const scartati = new Set(ids_da_scartare || []);
    const daSalvare = estratti.filter((e: any) => !scartati.has(e.id));

    // Inserisci nel catalogo definitivo
    const rows = daSalvare.map((e: any) => {
      const d = e.dati || {};
      return {
        azienda_id: AZIENDA_ID,
        codice: d.codice,
        nome: d.nome,
        tipo: d.tipo,
        produttore: d.produttore,
        serie: d.serie,
        modello: d.modello,
        colore_finitura: d.colore_finitura,
        colori_disponibili: d.colori_disponibili,
        larghezza_min: d.larghezza_min,
        larghezza_max: d.larghezza_max,
        altezza_min: d.altezza_min,
        altezza_max: d.altezza_max,
        spessore_mm: d.spessore_mm,
        prezzo: d.prezzo,
        certificazioni: d.certificazioni,
        immagine_url: e.immagine_url,
        sorgente_import: "ai_catalogo",
        import_id,
        attivo: true,
      };
    });

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("catalogo_pannelli").insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // Aggiorna import + reso budget se costo reale < stimato
    const { data: imp } = await supabase
      .from("pannelli_imports")
      .select("prezzo_cliente, costo_reale, metodo")
      .eq("id", import_id)
      .single();

    await supabase.from("pannelli_imports").update({
      stato: "completato",
      pannelli_confermati: rows.length,
      completato_at: new Date().toISOString(),
    }).eq("id", import_id);

    // Reso eventuale al cliente se ha consumato meno del previsto
    if (imp?.metodo === "ai" && imp.prezzo_cliente) {
      const costoRealeCliente = (imp.costo_reale || 0) * 4; // stesso margine 4x
      const reso = imp.prezzo_cliente - costoRealeCliente;
      if (reso > 0.01) {
        const { data: credits } = await supabase.from("ai_credits").select("budget_corrente").eq("azienda_id", AZIENDA_ID).single();
        const cur = credits?.budget_corrente || 0;
        await supabase.from("ai_credits").update({ budget_corrente: cur + reso, updated_at: new Date().toISOString() }).eq("azienda_id", AZIENDA_ID);
        await supabase.from("ai_credits_movimenti").insert({
          azienda_id: AZIENDA_ID, tipo: "reso", importo: reso, saldo_dopo: cur + reso,
          riferimento_id: import_id, riferimento_tipo: "import_pannelli",
          descrizione: "Reso budget non consumato",
        });
      }
    }

    // Cleanup pannelli scartati
    if (scartati.size > 0) {
      await supabase.from("pannelli_estratti_temp").delete().in("id", Array.from(scartati));
    }

    return NextResponse.json({ pannelli_salvati: rows.length, pannelli_scartati: scartati.size });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Lista pannelli temporanei per review
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const importId = searchParams.get("import_id");
    if (!importId) return NextResponse.json({ error: "import_id richiesto" }, { status: 400 });
    const { data } = await supabase
      .from("pannelli_estratti_temp")
      .select("*")
      .eq("import_id", importId)
      .order("pagina", { ascending: true })
      .order("posizione_in_pagina", { ascending: true });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
