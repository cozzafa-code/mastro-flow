import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const sistemaNome = searchParams.get("sistema");

    let q = supabase
      .from("catalogo_nodi_costruttivi")
      .select("id, sistema_id, nome, descrizione, profili_coinvolti, tipo, immagine_url, dxf_url, pdf_url, note, sistema:catalogo_sistemi(nome)")
      .eq("attivo", true)
      .order("nome", { ascending: true });

    if (tipo) q = q.eq("tipo", tipo);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    let result = data || [];
    if (sistemaNome) {
      const sn = sistemaNome.toLowerCase();
      result = result.filter((n: any) => {
        const sis = n.sistema?.nome?.toLowerCase() || "";
        return !sis || sis.includes(sn) || sn.includes(sis);
      });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
