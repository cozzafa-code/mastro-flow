// app/api/tipologie-infisso/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  let q = supabase.from("tipologie_infisso").select("*").eq("attivo", true).order("nome");
  if (categoria && categoria !== "Tutte") q = q.eq("categoria", categoria);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const insertData: any = {
      azienda_id: AZIENDA_ID,
      nome: body.nome,
      categoria: body.categoria || null,
      n_ante: body.n_ante || null,
      note: body.note || null,
      disegno: body.disegno || null,
      dimensioni_default: body.dimensioni_default || null,
      attivo: body.attivo !== false,
    };
    const { data, error } = await supabase
      .from("tipologie_infisso")
      .insert(insertData)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
    const { id, ...rest } = body;
    const { data, error } = await supabase
      .from("tipologie_infisso")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
  const { error } = await supabase
    .from("tipologie_infisso")
    .update({ attivo: false })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
