import { NextRequest, NextResponse } from "next/server";

// Store in-memory (in produzione userebbe Supabase)
const firmaStore: Record<string, any> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, data } = body;

    if (action === "genera") {
      // Genera token univoco per la commessa
      const tok = Buffer.from(`${data.cmId}-${Date.now()}`).toString("base64url").substring(0, 16);
      firmaStore[tok] = {
        token: tok,
        cmId: data.cmId,
        cmCode: data.cmCode,
        cliente: data.cliente,
        importo: data.importo,
        descrizione: data.descrizione,
        creato: new Date().toISOString(),
        scadenza: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 giorni
        firmato: false,
      };
      return NextResponse.json({ token: tok, url: `/firma/${tok}` });
    }

    if (action === "leggi") {
      const entry = firmaStore[token];
      if (!entry) return NextResponse.json({ error: "Link non trovato o scaduto" }, { status: 404 });
      if (new Date(entry.scadenza) < new Date()) return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
      return NextResponse.json(entry);
    }

    if (action === "firma") {
      const entry = firmaStore[token];
      if (!entry) return NextResponse.json({ error: "Token non valido" }, { status: 404 });
      firmaStore[token] = {
        ...entry,
        firmato: true,
        firmaData: data.firmaData, // base64 canvas firma
        firmaDataOra: new Date().toISOString(),
        firmaIp: req.headers.get("x-forwarded-for") || "unknown",
      };
      return NextResponse.json({ ok: true, firmaDataOra: firmaStore[token].firmaDataOra });
    }

    if (action === "check") {
      const entry = firmaStore[token];
      return NextResponse.json({ firmato: entry?.firmato || false, firmaDataOra: entry?.firmaDataOra });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  const entry = firmaStore[token];
  if (!entry) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(entry);
}
