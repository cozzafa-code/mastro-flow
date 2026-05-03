import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const sistemaNome = searchParams.get("sistema"); // nome sistema (es. "IDEAL 7000")
    const ruolo = searchParams.get("ruolo");

    let q = supabase
      .from("catalogo_profili")
      .select("id, sistema_id, codice, descrizione, ruolo, larghezza_mm, altezza_mm, prezzo_ml, peso_kg_m, n_camere, attivo, tavola, sistema:catalogo_sistemi(nome,produttore)")
      .eq("attivo", true)
      .order("ruolo", { ascending: true })
      .order("codice", { ascending: true });
    if (ruolo) q = q.eq("ruolo", ruolo);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    let result = data || [];
    if (sistemaNome) {
      const sn = sistemaNome.toLowerCase();
      result = result.filter((p: any) => {
        const sis = p.sistema?.nome?.toLowerCase() || "";
        return sis.includes(sn) || sn.includes(sis);
      });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
