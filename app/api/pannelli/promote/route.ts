// app/api/pannelli/promote/route.ts
// Promuove pannelli_estratti_temp -> catalogo_pannelli con codici univoci.
// Gestisce nuovi campi: configurazione, finitura, tipo_apertura, materiale.

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

const CATEGORIA_TO_TIPO: Record<string, string> = {
  porte_interne: "porta_interna",
  blindati: "blindato",
  pannelli: "pvc",
};

function slug(s: string | null | undefined, max = 12): string {
  if (!s) return "";
  return s
    .toString()
    .toUpperCase()
    .replace(/[ÀÁÂÃÄÅ]/g, "A").replace(/[ÈÉÊË]/g, "E")
    .replace(/[ÌÍÎÏ]/g, "I").replace(/[ÒÓÔÕÖ]/g, "O").replace(/[ÙÚÛÜ]/g, "U")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, max);
}

function buildCodice(d: Record<string, unknown>, fallback: string): string {
  // Prima scelta: codice tecnico già fornito dall'AI
  const codiceAI = d.codice as string | null;
  if (codiceAI && codiceAI.length > 2 && codiceAI.length < 60 && /[A-Z0-9]/i.test(codiceAI)) {
    return codiceAI.toString().slice(0, 60);
  }

  // Costruisco da modello + configurazione + finitura
  const modello = slug(d.modello as string | null, 10);
  const config = slug(d.configurazione as string | null, 8);
  const finitura = slug(d.finitura as string | null, 14);
  const apertura = slug(d.tipo_apertura as string | null, 6);

  const parts = [modello, config, finitura, apertura].filter(Boolean);
  if (parts.length >= 2) return parts.join("-").slice(0, 60);

  return fallback;
}

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

    // Costruisci righe e gestisci duplicati codice in batch
    const codiciVisti = new Set<string>();
    const rows = temp.map((t, idx) => {
      const d = (t.dati as Record<string, unknown>) || {};
      const fallback = `AI-${import_id.slice(0, 8)}-${String(idx).padStart(3, "0")}`;
      let codice = buildCodice(d, fallback);

      // Dedup: se duplicato in batch, aggiungo suffisso
      let suffix = 1;
      const baseCodice = codice;
      while (codiciVisti.has(codice)) {
        suffix++;
        codice = `${baseCodice}-${suffix}`;
      }
      codiciVisti.add(codice);

      const nome =
        (d.nome as string | null) ||
        (d.descrizione as string | null) ||
        [d.modello, d.configurazione, d.finitura].filter(Boolean).join(" ") ||
        codice;

      return {
        azienda_id: AZIENDA_ID,
        codice,
        nome: String(nome).slice(0, 200),
        descrizione: (d.descrizione as string | null) ?? null,
        produttore: (d.produttore as string | null) ?? null,
        serie: (d.serie as string | null) ?? null,
        modello: (d.modello as string | null) ?? null,
        colore_finitura:
          (d.colore_finitura as string | null) ??
          (d.finitura as string | null) ??
          null,
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

    await supabase
      .from("pannelli_estratti_temp")
      .update({ confermato: true })
      .eq("import_id", import_id);

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
