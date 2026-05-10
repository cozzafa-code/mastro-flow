import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { aziendaId, commessaId, ordini, consegna, canaleInvio, bozza } = body

    if (!aziendaId || !commessaId || !Array.isArray(ordini) || ordini.length === 0) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const sb = svc()
    const gruppoId = crypto.randomUUID()
    const created: any[] = []

    for (const ord of ordini) {
      // Genera numero ordine progressivo
      const { count } = await sb.from("ordini_fornitore").select("*", { count: "exact", head: true }).eq("azienda_id", aziendaId)
      const numero = `OF-${String((count || 0) + created.length + 1).padStart(4, "0")}`

      const totale = Number(ord.totale_stimato || 0)
      const ordineRow: any = {
        azienda_id: aziendaId,
        commessa_id: commessaId,
        numero,
        fornitore: ord.fornitore_nome,
        tipo_ordine: ord.categoria_materiale,
        categoria_materiale: ord.categoria_materiale,
        tipo_acquisto: ord.tipo_acquisto || "componenti",
        righe: ord.righe || [],
        totale_stimato: totale,
        totale_euro: totale,
        stato: bozza ? "bozza" : "inviato",
        bozza: !!bozza,
        gruppo_invio_id: gruppoId,
        consegna_tipo: consegna?.tipo || "magazzino",
        consegna_indirizzo: consegna?.indirizzo || null,
        consegna_riferimento: consegna?.riferimento || null,
        canale_invio: canaleInvio || "email",
        vani_inclusi: ord.vani_inclusi || [],
      }
      if (!bozza) ordineRow.data_invio = new Date().toISOString()

      const { data: ordCreated, error: oErr } = await sb.from("ordini_fornitore").insert(ordineRow).select().single()
      if (oErr) {
        console.error("[crea-bulk] err insert ordine:", oErr.message)
        continue
      }

      // Crea righe ordine
      for (let i = 0; i < (ord.righe || []).length; i++) {
        const r = ord.righe[i]
        await sb.from("righe_ordine").insert({
          azienda_id: aziendaId,
          ordine_id: ordCreated.id,
          commessa_id: commessaId,
          riga_numero: i + 1,
          descrizione: r.descrizione,
          categoria: ord.categoria_materiale,
          qta_richiesta: r.qta_richiesta || 1,
          prezzo_unitario: r.prezzo_unitario || 0,
          totale_riga: r.totale_riga || (r.qta_richiesta * r.prezzo_unitario) || 0,
          stato: "in_attesa",
        })
      }

      created.push(ordCreated)
    }

    // Avanza fase commessa solo se non bozza
    if (!bozza && created.length > 0) {
      await sb.from("commesse").update({ 
        materiale_ordinato_at: new Date().toISOString(),
        fase: "ordine",
      }).eq("id", commessaId)
    }

    return NextResponse.json({ ok: true, count: created.length, gruppo_invio_id: gruppoId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore server" }, { status: 500 })
  }
}
