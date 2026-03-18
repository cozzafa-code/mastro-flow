// app/api/desktop/notifiche/route.ts
// Notifiche real-time per Control Room — polling e push browser
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
    const SOGLIA = 7;

    // Carica dati per generare notifiche contestuali
    const [
      { data: commesse },
      { data: fatture },
      { data: montaggi },
      { data: msgs },
    ] = await Promise.all([
      supabase.from("commesse").select("id,cliente,cognome,code,fase,ultima_modifica").eq("azienda_id",azId).neq("fase","chiusura"),
      supabase.from("fatture").select("id,importo,scadenza,pagata").eq("azienda_id",azId).eq("pagata",false),
      supabase.from("montaggi").select("id,data,cliente,stato").eq("azienda_id",azId).eq("data",TODAY),
      supabase.from("messaggi").select("id,testo,from,created_at").eq("azienda_id",azId).eq("letto",false).order("created_at",{ascending:false}).limit(5),
    ]);

    const notifiche: any[] = [];

    // Commesse ferme
    const ferme = (commesse||[]).filter(c=>{
      if(!c.ultima_modifica) return false;
      return Math.floor((Date.now()-new Date(c.ultima_modifica).getTime())/86400000) >= SOGLIA;
    });
    if(ferme.length>0) notifiche.push({
      id:"ferme", tipo:"warning", priorita:1,
      titolo:`${ferme.length} commess${ferme.length===1?"a":"e"} ferm${ferme.length===1?"a":"e"}`,
      desc:ferme.slice(0,2).map(c=>`${c.cliente} ${c.cognome||""} (${c.code})`).join(", ")+(ferme.length>2?` + altre ${ferme.length-2}`:""),
      azione:"commesse", ts:new Date().toISOString(),
    });

    // Fatture scadute
    const scadute = (fatture||[]).filter(f=>f.scadenza&&f.scadenza<TODAY);
    if(scadute.length>0) notifiche.push({
      id:"fatture_scad", tipo:"error", priorita:2,
      titolo:`${scadute.length} fattur${scadute.length===1?"a":"e"} scadut${scadute.length===1?"a":"e"}`,
      desc:`€${Math.round(scadute.reduce((s,f)=>s+(f.importo||0),0)).toLocaleString("it-IT")} da incassare`,
      azione:"fatture", ts:new Date().toISOString(),
    });

    // Montaggi oggi
    if((montaggi||[]).length>0) notifiche.push({
      id:"montaggi_oggi", tipo:"info", priorita:3,
      titolo:`${montaggi!.length} montaggio${montaggi!.length===1?"":"i"} oggi`,
      desc:(montaggi||[]).slice(0,2).map(m=>m.cliente||"—").join(", "),
      azione:"montaggi", ts:new Date().toISOString(),
    });

    // Messaggi non letti
    if((msgs||[]).length>0) notifiche.push({
      id:"msgs", tipo:"info", priorita:4,
      titolo:`${msgs!.length} messaggio${msgs!.length===1?"":"i"} non lett${msgs!.length===1?"o":"i"}`,
      desc:(msgs||[]).slice(0,1).map(m=>`Da ${m.from||"cliente"}: ${(m.testo||"").substring(0,50)}`)[0]||"",
      azione:"messaggi", ts:new Date().toISOString(),
    });

    return NextResponse.json({
      notifiche: notifiche.sort((a,b)=>a.priorita-b.priorita),
      count: notifiche.length,
      ts: new Date().toISOString(),
    });
  } catch(err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — segna notifica come letta
export async function PATCH(req: NextRequest) {
  try {
    const { tipo, cmId, fatturaId } = await req.json();
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (tipo === "messaggio" && cmId) {
      await supabase.from("messaggi").update({ letto: true }).eq("cmId", cmId);
    }
    return NextResponse.json({ ok: true });
  } catch(err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
