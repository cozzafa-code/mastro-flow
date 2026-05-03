import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria");
    let q = supabase
      .from("catalogo_accessori")
      .select("id, categoria, nome, codice, descrizione, tipo, sottotipo, prezzo, prezzo_unitario, fornitore, materiale, compatibile_serie, compatibile_tipi, immagine_url, attivo, pittogramma")
      .eq("azienda_id", AZIENDA_ID)
      .eq("attivo", true)
      .order("categoria", { ascending: true })
      .order("nome", { ascending: true });
    if (categoria) q = q.eq("categoria", categoria);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
