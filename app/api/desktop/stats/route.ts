// app/api/desktop/stats/route.ts
// API aggregata per Control Room — un endpoint, tutti i KPI
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profilo } = await supabase
      .from("profili").select("azienda_id").eq("user_id", user.id).single();
    if (!profilo?.azienda_id) return NextResponse.json({ error: "No azienda" }, { status: 403 });

    const azId = profilo.azienda_id;
    const TODAY = new Date().toISOString().split("T")[0];
    const WEEK  = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
    const SOGLIA_FERMA = 7;

    const [
      { data: commesse },
      { data: fatture },
      { data: montaggi },
      { count: msgCount },
      { data: ordini },
      { data: azienda },
    ] = await Promise.all([
      supabase.from("commesse").select("id,fase,euro,ultima_modifica,confermato,cliente,cognome,code").eq("azienda_id", azId),
      supabase.from("fatture").select("id,importo,pagata,scadenza,data").eq("azienda_id", azId),
      supabase.from("montaggi").select("id,data,stato,squadraId").eq("azienda_id", azId),
      supabase.from("messaggi").select("id", { count: "exact", head: true }).eq("azienda_id", azId).eq("letto", false),
      supabase.from("ordini_fornitori").select("id,stato,totaleIva,cmId").eq("azienda_id", azId),
      supabase.from("aziende").select("ragione,nome,piva,settore,piano").eq("id", azId).single(),
    ]);

    const attive = (commesse||[]).filter(c => c.fase !== "chiusura");
    const ferme  = attive.filter(c => {
      if (!c.ultima_modifica) return false;
      return Math.floor((Date.now()-new Date(c.ultima_modifica).getTime())/86400000) >= SOGLIA_FERMA;
    });
    const confermati = attive.filter(c => ["conferma","misure","ordini","produzione","posa"].includes(c.fase));

    const stats = {
      commesse: {
        attive: attive.length,
        ferme: ferme.length,
        fermeIds: ferme.map(c => ({ id:c.id, cliente:`${c.cliente||""} ${c.cognome||""}`.trim(), code:c.code, fase:c.fase })),
        valoreAttive: attive.reduce((s,c)=>s+(parseFloat(c.euro)||0),0),
        valoreConfermato: confermati.reduce((s,c)=>s+(parseFloat(c.euro)||0),0),
      },
      fatture: {
        daIncassare: (fatture||[]).filter(f=>!f.pagata).reduce((s,f)=>s+(f.importo||0),0),
        scadute: (fatture||[]).filter(f=>!f.pagata&&f.scadenza&&f.scadenza<TODAY).length,
        fatturato: (fatture||[]).filter(f=>f.pagata).reduce((s,f)=>s+(f.importo||0),0),
      },
      montaggi: {
        oggi: (montaggi||[]).filter(m=>m.data===TODAY).length,
        settimana: (montaggi||[]).filter(m=>m.data>=TODAY&&m.data<=WEEK).length,
        totale: (montaggi||[]).length,
      },
      messaggi: { nonLetti: msgCount||0 },
      ordini: {
        inCorso: (ordini||[]).filter(o=>o.stato!=="consegnato").length,
        valoreTotale: (ordini||[]).reduce((s,o)=>s+(o.totaleIva||0),0),
      },
      azienda: azienda||{},
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store", "X-Azienda-Id": azId }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
