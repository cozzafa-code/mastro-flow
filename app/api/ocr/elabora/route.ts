import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const OCR_PROMPT = `Sei un OCR specializzato in scontrini e fatture italiane. Estrai i dati dal documento allegato e rispondi SOLO con JSON valido. Schema:
{
  "fornitore_nome": "string o null",
  "fornitore_piva": "string solo cifre o null",
  "fornitore_cf": "string o null",
  "numero_documento": "string o null",
  "data_documento": "YYYY-MM-DD o null",
  "imponibile": "numero o null",
  "iva_importo": "numero o null",
  "iva_pct": "numero (22, 10, 4) o null",
  "totale": "numero o null",
  "categoria_suggerita": "carburante|pedaggi|materiali|utenze|telefonia|spedizioni|ristorazione|cancelleria|attrezzature|altro",
  "confidence": "numero 0-100"
}

Regole:
- Se è scontrino senza P.IVA cliente, imponibile e iva sono calcolati dal totale
- Date: converti sempre in YYYY-MM-DD
- Numeri: usa . come separatore decimale, no migliaia
- categoria_suggerita: scegli la più adatta in base al fornitore
- confidence: 100=tutto leggibile, 50=parziale, <30=qualità scarsa

NON aggiungere testo prima o dopo il JSON. Rispondi SOLO JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { documento_id } = await req.json();
    if (!documento_id) return NextResponse.json({ ok: false, error: "documento_id mancante" }, { status: 400 });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // 1. Carica documento
    const { data: doc, error: docErr } = await sb.from("fin_ocr_documenti")
      .select("*").eq("id", documento_id).single();
    if (docErr || !doc) return NextResponse.json({ ok: false, error: "Documento non trovato" }, { status: 404 });

    if (doc.stato === "elaborazione") {
      return NextResponse.json({ ok: false, error: "Elaborazione già in corso" });
    }

    // 2. Marca elaborazione
    await sb.from("fin_ocr_documenti").update({ stato: "elaborazione" }).eq("id", documento_id);

    // 3. Scarica file e converti in base64
    const fileRes = await fetch(doc.file_url);
    if (!fileRes.ok) {
      await sb.from("fin_ocr_documenti").update({
        stato: "errore", errore: `Download fallito: HTTP ${fileRes.status}`,
      }).eq("id", documento_id);
      return NextResponse.json({ ok: false, error: "Download file fallito" }, { status: 500 });
    }
    const buf = await fileRes.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = fileRes.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.startsWith("image/") ? contentType : "image/jpeg";

    // 4. Chiamata Claude vision
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: OCR_PROMPT },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      await sb.from("fin_ocr_documenti").update({
        stato: "errore", errore: `Anthropic HTTP ${anthropicRes.status}: ${errText.slice(0, 300)}`,
      }).eq("id", documento_id);
      return NextResponse.json({ ok: false, error: "OCR API errore" }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const textOut = anthropicData.content?.[0]?.text || "";
    const cleanJson = textOut.replace(/```json|```/g, "").trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      await sb.from("fin_ocr_documenti").update({
        stato: "errore", errore: "OCR ha restituito JSON non valido", raw_ocr_text: textOut,
      }).eq("id", documento_id);
      return NextResponse.json({ ok: false, error: "Parsing JSON fallito" }, { status: 500 });
    }

    // 5. Match regola categoria
    const fornitoreLower = (parsed.fornitore_nome || "").toLowerCase();
    if (fornitoreLower) {
      const { data: regole } = await sb.from("fin_ocr_categorie_regole").select("*")
        .eq("azienda_id", doc.azienda_id).eq("attiva", true).order("priorita", { ascending: true });
      for (const r of regole || []) {
        if (r.pattern_fornitore) {
          const re = new RegExp(r.pattern_fornitore, "i");
          if (re.test(fornitoreLower)) {
            parsed.categoria_suggerita = r.categoria;
            break;
          }
        }
      }
    }

    // 6. Salva risultati
    await sb.from("fin_ocr_documenti").update({
      stato: "completato",
      fornitore_nome: parsed.fornitore_nome,
      fornitore_piva: parsed.fornitore_piva,
      fornitore_cf: parsed.fornitore_cf,
      numero_documento: parsed.numero_documento,
      data_documento: parsed.data_documento,
      imponibile: parsed.imponibile,
      iva_importo: parsed.iva_importo,
      iva_pct: parsed.iva_pct,
      totale: parsed.totale,
      categoria_suggerita: parsed.categoria_suggerita,
      ocr_confidence: parsed.confidence,
      raw_ocr_text: textOut,
      raw_ocr_json: parsed,
    }).eq("id", documento_id);

    return NextResponse.json({ ok: true, parsed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Errore sconosciuto" }, { status: 500 });
  }
}
