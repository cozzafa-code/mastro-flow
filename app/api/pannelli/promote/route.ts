// app/api/pannelli/promote/route.ts
// Riceve { import_id }, legge pannelli_estratti_temp e li inserisce in catalogo_pannelli.
// Marca temp come confermato=true. Aggiorna pannelli_imports.stato='completato'.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Mappa categoria modal -> tipo catalogo_pannelli
const CATEGORIA_TO_TIPO: Record<string, string> = {
  porte_interne: "porta_interna",
  blindati: "blindato",
  pannelli: "pvc",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.import_id !== "string") {
      return NextResponse.json(
        { ok: false, codice_errore: "BAD_REQUEST", dettaglio: "import_id richiesto" },
        { status: 400 }
      );
    }
    const { import_id } = body;
    const supabase = supabaseAdmin();

    // 1. Leggi import per categoria
    const { data: importRow, error: importErr } = await supabase
      .from("pannelli_imports")
      .select("id, azienda_id, pre_analisi")
      .eq("id", import_id)
      .eq("azienda_id", AZIENDA_ID)
      .single();

    if (importErr || !importRow) {
      return NextResponse.json(
        { ok: false, codice_errore: "IMPORT_NOT_FOUND", dettaglio: importErr?.message || "Import inesistente" },
        { status: 404 }
      );
    }

    const categoria = (importRow.pre_analisi as { categoria?: string } | null)?.categoria || "porte_interne";
    const tipoCatalogo = CATEGORIA_TO_TIPO[categoria] || "porta_interna";

    // 2. Carica temp non confermati
    const { data: temp, error: tempErr } = await supabase
      .from("pannelli_estratti_temp")
      .select("id, dati")
      .eq("import_id", import_id)
      .eq("confermato", false);

    if (tempErr) {
      return NextResponse.json(
        { ok: false, codice_errore: "DB_READ_ERROR", dettaglio: tempErr.message },
        { status: 500 }
      );
    }

    if (!temp || temp.length === 0) {
      return NextResponse.json(
        { ok: true, promossi: 0, dettaglio: "Nessun pannello da promuovere" }
      );
    }

    // 3. Mappa in catalogo_pannelli
    const rows = temp.map((t) => {
      const d = (t.dati as Record<string, unknown>) || {};
      const codice = (d.codice as string | null) || `AI-${import_id.slice(0, 8)}-${t.id.slice(0, 6)}`;
      const nome = (d.nome as string | null) || (d.descrizione as string | null) || codice;
      return {
        azienda_id: AZIENDA_ID,
        codice,
        nome,
        descrizione: (d.descrizione as string | null) ?? null,
        produttore: (d.produttore as string | null) ?? null,
        serie: (d.serie as string | null) ?? null,
        modello: (d.modello as string | null) ?? null,
        colore_finitura: (d.colore_finitura as string | null) ?? null,
        larghezza_min: (d.larghezza_min as number | null) ?? null,
        larghezza_max: (d.larghezza_max as number | null) ?? null,
        altezza_min: (d.altezza_min as number | null) ?? null,
        altezza_max: (d.altezza_max as number | null) ?? null,
        spessore_mm: (d.spessore_mm as number | null) ?? null,
        prezzo: (d.prezzo as number | null) ?? null,
        tipo: tipoCatalogo,
        attivo: true,
        sorgente_import: "ai_catalogo",
        import_id,
      };
    });

    const { data: inserted, error: insErr } = await supabase
      .from("catalogo_pannelli")
      .insert(rows)
      .select("id");

    if (insErr) {
      return NextResponse.json(
        { ok: false, codice_errore: "DB_INSERT_ERROR", dettaglio: insErr.message },
        { status: 500 }
      );
    }

    // 4. Marca temp come confermati
    await supabase
      .from("pannelli_estratti_temp")
      .update({ confermato: true })
      .eq("import_id", import_id);

    // 5. Aggiorna import
    await supabase
      .from("pannelli_imports")
      .update({
        stato: "completato",
        pannelli_confermati: inserted?.length ?? 0,
        completato_at: new Date().toISOString(),
      })
      .eq("id", import_id);

    return NextResponse.json({
      ok: true,
      promossi: inserted?.length ?? 0,
      tipo: tipoCatalogo,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, codice_errore: "INTERNAL_ERROR", dettaglio: msg },
      { status: 500 }
    );
  }
}
