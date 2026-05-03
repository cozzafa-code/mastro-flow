// app/api/pannelli/start/route.ts
// Avvia un import dopo conferma del preventivo
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { filename, fileHash, fileSize, metodo, pageCount, pagineUtili, pannelliStimati, costoStimato, prezzoCliente } = body;

    // Crea record import
    const { data: imp, error } = await supabase
      .from("pannelli_imports")
      .insert({
        azienda_id: AZIENDA_ID,
        filename,
        file_hash: fileHash,
        file_size_bytes: fileSize,
        metodo,
        pagine_totali: pageCount,
        pagine_utili: pagineUtili,
        pannelli_stimati: pannelliStimati,
        costo_stimato: costoStimato,
        prezzo_cliente: prezzoCliente,
        stato: metodo === "manuale" ? "in_review" : "in_corso",
        accettato_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Per metodo AI: verifica/scala il budget PRIMA di avviare
    if (metodo === "ai" && prezzoCliente > 0) {
      const { data: credits } = await supabase
        .from("ai_credits")
        .select("budget_corrente, totale_speso_mese")
        .eq("azienda_id", AZIENDA_ID)
        .single();

      const cur = credits?.budget_corrente || 0;
      if (cur < prezzoCliente) {
        // Annulla import
        await supabase.from("pannelli_imports").update({ stato: "annullato", errore_msg: "Budget insufficiente" }).eq("id", imp.id);
        return NextResponse.json({ error: "Budget AI insufficiente. Ricarica prima di procedere." }, { status: 402 });
      }

      // Riserva il budget (verrà aggiustato al costo reale alla fine)
      await supabase.from("ai_credits").update({
        budget_corrente: cur - prezzoCliente,
        totale_speso_mese: (credits?.totale_speso_mese || 0) + prezzoCliente,
        updated_at: new Date().toISOString(),
      }).eq("azienda_id", AZIENDA_ID);

      await supabase.from("ai_credits_movimenti").insert({
        azienda_id: AZIENDA_ID,
        tipo: "spesa",
        importo: -prezzoCliente,
        saldo_dopo: cur - prezzoCliente,
        riferimento_id: imp.id,
        riferimento_tipo: "import_pannelli",
        descrizione: `Import AI catalogo: ${filename}`,
      });
    }

    return NextResponse.json({ import_id: imp.id, stato: imp.stato, metodo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
