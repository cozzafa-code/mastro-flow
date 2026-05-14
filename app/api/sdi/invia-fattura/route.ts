import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generaXmlFatturaPA, REGIMI_FISCALI, MODALITA_PAGAMENTO } from "../../../../lib/xmlFatturaPA";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { fattura_id, azienda_id } = await req.json();
    if (!fattura_id || !azienda_id) {
      return NextResponse.json({ ok: false, error: "Parametri mancanti" }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // 1. Carica fattura
    const { data: fatt, error: fattErr } = await sb
      .from("fin_fatture_emesse").select("*")
      .eq("id", fattura_id).eq("azienda_id", azienda_id).single();
    if (fattErr || !fatt) {
      return NextResponse.json({ ok: false, error: "Fattura non trovata" }, { status: 404 });
    }

    // 2. Carica azienda
    const { data: az } = await sb.from("aziende").select("*").eq("id", azienda_id).single();
    if (!az) {
      return NextResponse.json({ ok: false, error: "Azienda non trovata" }, { status: 404 });
    }

    // 3. Config SDI
    const { data: cfg } = await sb.from("fin_sdi_config").select("*").eq("azienda_id", azienda_id).maybeSingle();
    const provider = cfg?.provider || "none";

    // 4. Parse righe
    let righe: any[] = [];
    try {
      righe = fatt.righe ? (typeof fatt.righe === "string" ? JSON.parse(fatt.righe) : fatt.righe) : [];
    } catch { righe = []; }

    // 5. Costruisci payload XML
    const righeXml = righe.length > 0 ? righe.map((r: any, i: number) => {
      const imp = (r.quantita || 1) * (r.prezzo_unitario || 0) * (1 - (r.sconto_pct || 0) / 100);
      return {
        numero: i + 1,
        descrizione: r.descrizione || "Voce",
        quantita: r.quantita || 1,
        prezzo_unitario: r.prezzo_unitario || 0,
        prezzo_totale: imp,
        aliquota_iva: r.iva_pct ?? 22,
        unita_misura: r.meta?.unita || undefined,
      };
    }) : [{
      numero: 1,
      descrizione: "Servizi serramentistici",
      quantita: 1,
      prezzo_unitario: Number(fatt.imponibile || 0),
      prezzo_totale: Number(fatt.imponibile || 0),
      aliquota_iva: Number(fatt.iva_percent || 22),
    }];

    // Riepilogo IVA
    let riepilogo: any[] = [];
    try {
      riepilogo = fatt.riepilogo_iva ? (typeof fatt.riepilogo_iva === "string" ? JSON.parse(fatt.riepilogo_iva) : fatt.riepilogo_iva) : [];
    } catch { riepilogo = []; }
    if (riepilogo.length === 0) {
      riepilogo = [{
        aliquota: Number(fatt.iva_percent || 22),
        imponibile: Number(fatt.imponibile || 0),
        imposta: Number(fatt.iva || 0),
      }];
    }

    const xml = generaXmlFatturaPA(
      `${Date.now()}`.slice(-5),
      {
        ragione_sociale: az.ragione_sociale || az.nome,
        piva: az.piva || "00000000000",
        cf: az.cf || undefined,
        regime_fiscale: az.regime === "forfettario" ? REGIMI_FISCALI.FORFETTARIO : REGIMI_FISCALI.ORDINARIO,
        indirizzo: az.indirizzo || "",
        cap: az.cap || "",
        comune: az.comune || "",
        provincia: az.provincia || "",
        nazione: "IT",
        email: az.email,
        telefono: az.telefono,
      },
      {
        ragione_sociale: fatt.cliente_ragione_sociale || fatt.cliente_nome || fatt.cliente,
        piva: fatt.cliente_piva || undefined,
        cf: fatt.cliente_cf || undefined,
        indirizzo: fatt.cliente_indirizzo || "",
        cap: undefined,
        comune: fatt.cliente_citta || undefined,
        provincia: fatt.cliente_provincia || undefined,
        nazione: "IT",
        codice_destinatario: fatt.cliente_sdi || "0000000",
      },
      {
        tipo_documento: fatt.tipo_documento_sdi || "TD01",
        numero: fatt.numero,
        data: fatt.data_emissione,
        divisa: "EUR",
        causale: fatt.causale_forfettario || undefined,
        imponibile_totale: Number(fatt.totale_imponibile || fatt.imponibile || 0),
        imposta_totale: Number(fatt.totale_iva || fatt.iva || 0),
        importo_totale: Number(fatt.totale_documento || fatt.totale || 0),
        bollo: Number(fatt.bollo || 0),
        riepilogo_iva: riepilogo,
      },
      righeXml,
      fatt.data_scadenza ? {
        modalita: MODALITA_PAGAMENTO.BONIFICO,
        data_scadenza: fatt.data_scadenza,
        importo: Number(fatt.totale_documento || fatt.totale || 0),
      } : undefined,
    );

    // 6. Salva XML su storage
    const piva = az.piva || "00000000000";
    const progressivo = `${Date.now()}`.slice(-5);
    const xmlFilename = `IT${piva}_${progressivo}.xml`;
    const xmlPath = `${azienda_id}/${new Date().getFullYear()}/${xmlFilename}`;

    // Calcola hash
    const enc = new TextEncoder();
    const data = enc.encode(xml);
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

    // Upload XML (assumendo bucket sdi-xml esista; sennò skip salvataggio file)
    let xmlPathSaved: string | null = null;
    try {
      const { error: upErr } = await sb.storage.from("sdi-xml").upload(xmlPath, new Blob([xml], { type: "application/xml" }));
      if (!upErr) xmlPathSaved = xmlPath;
    } catch {}

    // 7. Log invio
    const statoInvio = provider === "none" ? "in_invio" : "in_invio";
    const { data: invio, error: invErr } = await sb.from("fin_sdi_invii").insert({
      azienda_id,
      fattura_id,
      provider,
      direzione: "out",
      stato: statoInvio,
      xml_path: xmlPathSaved,
      hash_xml: hash,
      payload_provider: provider === "none" ? { modalita: "XML_GENERATO_ATTESA_PROVIDER" } : null,
    }).select("id").single();
    if (invErr) {
      return NextResponse.json({ ok: false, error: invErr.message }, { status: 500 });
    }

    // 8. Aggiorna fattura
    await sb.from("fin_fatture_emesse").update({
      sdi_inviata: true,
      sdi_inviata_il: new Date().toISOString(),
      sdi_provider: provider,
      sdi_status: statoInvio,
      xml_sdi_path: xmlPathSaved,
    }).eq("id", fattura_id);

    return NextResponse.json({
      ok: true,
      invio_id: invio.id,
      xml_filename: xmlFilename,
      xml_path: xmlPathSaved,
      hash,
      stato: statoInvio,
      provider,
      message: provider === "none"
        ? "XML generato. Configura un provider SDI (Aruba/InfoCert) per invio automatico."
        : `Invio in corso via ${provider}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Errore sconosciuto" }, { status: 500 });
  }
}
