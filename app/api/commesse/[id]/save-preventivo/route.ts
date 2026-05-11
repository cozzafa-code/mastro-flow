// app/api/commesse/[id]/save-preventivo/route.ts
// ================================================================
// POST /api/commesse/[id]/save-preventivo
// Body: { totale: number, vani?: any[], aziendaId: string }
// Effetto: aggiorna commesse.totale_finale + commesse.totale_preventivo
// Idempotente, safe da chiamare ripetutamente (autosave).
// ================================================================
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const commessaId = params.id
    if (!commessaId) return NextResponse.json({ error: "commessa id mancante" }, { status: 400 })

    const body = await req.json()
    const { totale, aziendaId } = body
    const totaleNum = Number(totale)

    if (!Number.isFinite(totaleNum) || totaleNum < 0) {
      return NextResponse.json({ error: "totale non valido" }, { status: 400 })
    }

    // Usa service role se disponibile (bypassa RLS), altrimenti anon
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from("commesse")
      .update({
        totale_finale: totaleNum,
        totale_preventivo: totaleNum,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commessaId)
      .select("id, code, totale_finale, fase")
      .maybeSingle()

    if (error) {
      console.error("[save-preventivo] errore update:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, commessa: data })
  } catch (e: any) {
    console.error("[save-preventivo] crash:", e)
    return NextResponse.json({ error: e?.message || "errore sconosciuto" }, { status: 500 })
  }
}
