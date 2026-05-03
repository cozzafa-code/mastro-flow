// app/api/pannelli/list/route.ts
// Lista catalogo pannelli + CRUD inserimento manuale + DXF + assegnazione tipo
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const produttore = searchParams.get("produttore");
    const search = searchParams.get("q");

    let q = supabase
      .from("catalogo_pannelli")
      .select("*")
      .eq("attivo", true)
      .order("produttore", { ascending: true, nullsFirst: false })
      .order("nome", { ascending: true });

    if (tipo) q = q.eq("tipo", tipo);
    if (produttore) q = q.eq("produttore", produttore);
    if (search) q = q.or(`nome.ilike.%${search}%,codice.ilike.%${search}%,modello.ilike.%${search}%`);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const body = await req.json();
    const { data, error } = await supabase
      .from("catalogo_pannelli")
      .insert({ ...body, azienda_id: AZIENDA_ID, sorgente_import: body.sorgente_import || "manuale", attivo: true })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    const body = await req.json();
    const { error } = await supabase.from("catalogo_pannelli").update(body).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    await supabase.from("catalogo_pannelli").update({ attivo: false }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
