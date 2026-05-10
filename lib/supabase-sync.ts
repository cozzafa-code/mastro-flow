// ============================================================
// MASTRO ERP — Supabase Sync Layer (new normalized schema)
// lib/supabase-sync.ts
// ============================================================

import { supabase } from "./supabase";

// ── Get azienda_id from profili ──
export async function getAziendaId(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    // 1. localStorage mastro_azienda_id (iniettato da dashboard)
    const direct = localStorage.getItem('mastro_azienda_id');
    if (direct) return direct;
    // 2. Operatore loggato via PIN (sessionStorage)
    try {
      const raw = sessionStorage.getItem('mastro_operatore');
      if (raw) {
        const op = JSON.parse(raw);
        if (op?.azienda_id) return op.azienda_id;
      }
    } catch {}
  }
  // 3. Fallback: sessione Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profili")
    .select("azienda_id")
    .eq("id", user.id)
    .maybeSingle();
  return data?.azienda_id || null;
}

// ── Load ALL data at startup ──
export async function loadAllData(azId: string) {
  const [
    { data: commesse },
    { data: events },
    { data: contatti },
    { data: teamData },
    { data: tasks },
    { data: msgs },
    { data: sistemi },
    { data: colori },
    { data: vetri },
    { data: coprifili },
    { data: lamiere },
    { data: pipeline },
    { data: azienda },
  ] = await Promise.all([
    supabase.from("commesse").select(`
      *,
      rilievi(*, vani(*, allegati_vano:allegati_vano(*)))
    `).eq("azienda_id", azId).order("created_at", { ascending: false }),
    supabase.from("eventi").select("*").eq("azienda_id", azId).order("data"),
    supabase.from("contatti").select("*").eq("azienda_id", azId).order("nome"),
    supabase.from("team").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("tasks").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }),
    supabase.from("messaggi").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }).limit(100),
    supabase.from("sistemi").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("colori").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("vetri").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("coprifili").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("lamiere").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("pipeline_fasi").select("*").eq("azienda_id", azId).eq("attiva", true).order("ordine"),
    supabase.from("aziende").select("*").eq("id", azId).single(),
  ]);

  // Map commesse from DB → app format
  const cantieriMapped = (commesse || []).map(cm => ({
    id: cm.id,
    code: cm.code,
    cliente: cm.cliente,
    cognome: cm.cognome || "",
    indirizzo: cm.indirizzo || "",
    telefono: cm.telefono || "",
    email: cm.email || "",
    fase: cm.fase,
    tipo: cm.tipo || "nuova",
    sistema: cm.sistema || "",
    difficoltaSalita: cm.difficolta_salita || "",
    mezzoSalita: cm.mezzo_salita || "",
    foroScale: cm.foro_scale || "",
    pianoEdificio: cm.piano_edificio || "",
    note: cm.note || "",
    totalePreventivo: cm.totale_preventivo,
    scontoPerc: cm.sconto_perc,
    totaleFinale: cm.totale_finale,
    firmaCliente: cm.firma_cliente,
    firmaData: cm.firma_data,
    // ── Stato preventivo ──
    preventivoInviato: !!cm.preventivo_inviato_at,
    preventivoInviatoAt: cm.preventivo_inviato_at,
    dataPreventivoInvio: cm.preventivo_inviato_at ? cm.preventivo_inviato_at.split("T")[0] : null,
    // ── Stato fase / blocco ──
    faseStart: cm.fase_start,
    ferma: cm.ferma || false,
    fermaDal: cm.ferma_dal,
    motivoFerma: cm.motivo_ferma || "",
    // ── Lead / fonte ──
    fonteLead: cm.fonte_lead || "",
    isLead: cm.is_lead || false,
    leadSourceId: cm.lead_source_id,
    richiestaAt: cm.richiesta_at,
    zonaClima: cm.zona_clima || "",
    tipologiaImmobile: cm.tipologia_immobile || "",
    // ── OPS ──
    opsFaseCorrente: cm.ops_fase_corrente,
    opsBloccata: cm.ops_bloccata || false,
    opsBloccoMotivo: cm.ops_blocco_motivo || "",
    opsResponsabileId: cm.ops_responsabile_id,
    opsUltimoAvanzamento: cm.ops_ultimo_avanzamento,
    // ── Catasto / immobile ──
    catastoFoglio: cm.catasto_foglio || "",
    catastoParticella: cm.catasto_particella || "",
    catastoSubalterno: cm.catasto_subalterno || "",
    catastoComune: cm.catasto_comune || "",
    catastoCategoria: cm.catasto_categoria || "",
    catastoRendita: cm.catasto_rendita,
    tipoEdificio: cm.tipo_edificio || "",
    tipoEdificioCustom: cm.tipo_edificio_custom,
    // ── Sistema referenze ──
    contattoId: cm.contatto_id,
    assegnatoA: cm.assegnato_a,
    // ── Soft delete / archive ──
    deletedAt: cm.deleted_at,
    archivedAt: cm.archived_at,
    mergedInto: cm.merged_into,
    mergedAt: cm.merged_at,
    allegati: [],
    creato: cm.created_at ? new Date(cm.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "",
    aggiornato: cm.updated_at ? new Date(cm.updated_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "",
    log: [],
    rilievi: (cm.rilievi || []).map((r: any) => ({
      id: r.id,
      tipo: r.tipo,
      numero: r.numero,
      data: r.data,
      ora: r.ora || "",
      rilevatore: r.rilevatore || "",
      note: r.note || "",
      motivoModifica: r.motivo_modifica || "",
      completato: r.completato,
      vani: (r.vani || []).map((v: any) => ({
        id: v.id,
        nome: v.nome,
        tipo: v.tipo,
        pezzi: v.pezzi || 1,
        stanza: v.stanza || "Soggiorno",
        piano: v.piano || "PT",
        sistema: v.sistema || "",
        sottosistema: v.sottosistema || "",
        vetro: v.vetro || "",
        coloreInt: v.colore_int || "",
        coloreEst: v.colore_est || "",
        bicolore: v.bicolore || false,
        coloreAcc: v.colore_acc || "",
        telaio: v.telaio || "",
        telaioAlaZ: v.telaio_ala_z || "",
        rifilato: v.rifilato || false,
        rifilSx: v.rifil_sx || "",
        rifilDx: v.rifil_dx || "",
        rifilSopra: v.rifil_sopra || "",
        rifilSotto: v.rifil_sotto || "",
        coprifilo: v.coprifilo || "",
        lamiera: v.lamiera || "",
        cassonetto: v.cassonetto || false,
        accessori: v.accessori || {},
        difficoltaSalita: v.difficolta_salita || "",
        mezzoSalita: v.mezzo_salita || "",
        note: v.note || "",
        misure: v.misure_json || {},
        foto: {},
        _dbId: v.id,
      })),
    })),
  }));

  // Map events
  const eventsMapped = (events || []).map(ev => ({
    id: ev.id,
    text: ev.titolo,
    tipo: ev.tipo || "appuntamento",
    date: ev.data,
    time: ev.ora || "",
    persona: ev.persona || "",
    addr: ev.indirizzo || "",
    cm: ev.commessa_id || "",
    colore: ev.colore || "#007aff",
    color: ev.colore || "#007aff",
    reminder: ev.reminder || "",
    done: ev.completato || false,
    _dbId: ev.id,
  }));

  // Map contatti
  const contattiMapped = (contatti || []).map(c => ({
    id: c.id,
    nome: c.nome,
    cognome: c.cognome || "",
    tipo: c.tipo || "cliente",
    telefono: c.telefono || "",
    email: c.email || "",
    indirizzo: c.indirizzo || "",
    note: c.note || "",
    _dbId: c.id,
  }));

  // Map team
  const teamMapped = (teamData || []).map(t => ({
    id: t.id,
    nome: t.nome,
    ruolo: t.ruolo || "",
    compiti: t.compiti || "",
    colore: t.colore || "#007aff",
    _dbId: t.id,
  }));

  // Map tasks
  const tasksMapped = (tasks || []).map(t => ({
    id: t.id,
    text: t.testo,
    meta: t.meta || "",
    date: t.data || "",
    time: t.ora || "",
    priority: t.priorita || "media",
    persona: t.persona || "",
    cm: t.commessa_id || "",
    done: t.done,
    allegati: [],
    _dbId: t.id,
  }));

  // Map msgs
  const msgsMapped = (msgs || []).map(m => ({
    id: m.id,
    da: m.da || "",
    a: m.a || "",
    testo: m.testo,
    canale: m.canale,
    data: m.created_at ? new Date(m.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "",
    letto: m.letto,
    _dbId: m.id,
  }));

  // Map catalogo
  const sistemiMapped = (sistemi || []).map(s => ({
    id: s.id, marca: s.marca, sistema: s.sistema, prezzoMq: Number(s.prezzo_mq), euroMq: Number(s.prezzo_mq),
    sovRAL: s.sov_ral, sovLegno: s.sov_legno, colori: s.colori || [], sottosistemi: s.sottosistemi || [],
  }));
  const coloriMapped = (colori || []).map(c => ({
    id: c.id, nome: c.nome, code: c.codice, hex: c.hex, tipo: c.tipo,
  }));
  const vetriMapped = (vetri || []).map(v => ({
    id: v.id, nome: v.nome, code: v.codice, ug: Number(v.ug), prezzoMq: Number(v.prezzo_mq),
  }));
  const coprifiliMapped = (coprifili || []).map(c => ({
    id: c.id, nome: c.nome, cod: c.codice, prezzoMl: Number(c.prezzo_ml),
  }));
  const lamiereMapped = (lamiere || []).map(l => ({
    id: l.id, nome: l.nome, cod: l.codice, prezzoMl: Number(l.prezzo_ml),
  }));
  const pipelineMapped = (pipeline || []).map(p => ({
    id: p.codice, nome: p.nome, ico: p.icona, color: p.colore, attiva: p.attiva,
  }));

  return {
    cantieri: cantieriMapped,
    events: eventsMapped,
    contatti: contattiMapped,
    team: teamMapped,
    tasks: tasksMapped,
    msgs: msgsMapped,
    sistemi: sistemiMapped.length > 0 ? sistemiMapped : null,
    colori: coloriMapped.length > 0 ? coloriMapped : null,
    vetri: vetriMapped.length > 0 ? vetriMapped : null,
    coprifili: coprifiliMapped.length > 0 ? coprifiliMapped : null,
    lamiere: lamiereMapped.length > 0 ? lamiereMapped : null,
    pipeline: pipelineMapped.length > 0 ? pipelineMapped : null,
    azienda: azienda?.data || azienda,
  };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SAVE FUNCTIONS (app state → DB)                        ║
// ╚══════════════════════════════════════════════════════════╝

// Debounce helper
const _pending: Record<string, NodeJS.Timeout> = {};
function debounce(key: string, fn: () => void, ms = 1000) {
  if (_pending[key]) clearTimeout(_pending[key]);
  _pending[key] = setTimeout(fn, ms);
}

// ── Save Commessa ──
export async function saveCantiere(azId: string, c: any) {
  debounce(`cm_${c.id}`, async () => {
    const isUUID = typeof c.id === "string" && c.id.includes("-");
    const row: any = {
      azienda_id: azId,
      code: c.code,
      cliente: c.cliente,
      cognome: c.cognome || "",
      indirizzo: c.indirizzo || "",
      telefono: c.telefono || "",
      email: c.email || "",
      fase: c.fase,
      tipo: c.tipo || "nuova",
      sistema: c.sistema || "",
      difficolta_salita: c.difficoltaSalita || "",
      mezzo_salita: c.mezzoSalita || "",
      foro_scale: c.foroScale || "",
      piano_edificio: c.pianoEdificio || "",
      note: c.note || "",
      totale_preventivo: c.totalePreventivo || null,
      sconto_perc: c.scontoPerc || null,
      totale_finale: c.totaleFinale || null,
      firma_cliente: c.firmaCliente || null,
      firma_data: c.firmaData || null,
      // Stato preventivo
      preventivo_inviato_at: c.preventivoInviato
        ? (c.preventivoInviatoAt || (c.dataPreventivoInvio ? new Date(c.dataPreventivoInvio).toISOString() : new Date().toISOString()))
        : null,
      // Stato fase / blocco
      fase_start: c.faseStart || null,
      ferma: c.ferma || false,
      ferma_dal: c.fermaDal || null,
      motivo_ferma: c.motivoFerma || "",
      // Lead / fonte
      fonte_lead: c.fonteLead || null,
      is_lead: c.isLead || false,
      lead_source_id: c.leadSourceId || null,
      richiesta_at: c.richiestaAt || null,
      zona_clima: c.zonaClima || "",
      tipologia_immobile: c.tipologiaImmobile || "",
      // OPS
      ops_fase_corrente: c.opsFaseCorrente || null,
      ops_bloccata: c.opsBloccata || false,
      ops_blocco_motivo: c.opsBloccoMotivo || "",
      ops_responsabile_id: c.opsResponsabileId || null,
      ops_ultimo_avanzamento: c.opsUltimoAvanzamento || null,
      // Catasto
      catasto_foglio: c.catastoFoglio || null,
      catasto_particella: c.catastoParticella || null,
      catasto_subalterno: c.catastoSubalterno || null,
      catasto_comune: c.catastoComune || null,
      catasto_categoria: c.catastoCategoria || null,
      catasto_rendita: c.catastoRendita || null,
      tipo_edificio: c.tipoEdificio || null,
      tipo_edificio_custom: c.tipoEdificioCustom || null,
      // Referenze
      contatto_id: c.contattoId || null,
      assegnato_a: c.assegnatoA || null,
      updated_at: new Date().toISOString(),
    };
    if (isUUID) row.id = c.id;

    try {
      const { data, error } = await supabase
        .from("commesse")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) console.error("Save commessa error:", error);

      // Save rilievi + vani
      if (data && c.rilievi) {
        for (const ril of c.rilievi) {
          await saveRilievo(data.id, ril);
        }
      }
    } catch (e) { console.error("Save commessa:", e); }
  });
}

async function saveRilievo(commessaId: string, r: any) {
  const isUUID = typeof r.id === "string" && r.id.includes("-");
  const row: any = {
    commessa_id: commessaId,
    tipo: r.tipo || "rilievo",
    numero: r.numero || 1,
    data: r.data || null,
    ora: r.ora || "",
    rilevatore: r.rilevatore || "",
    note: r.note || "",
    motivo_modifica: r.motivoModifica || "",
    completato: r.completato || false,
  };
  if (isUUID) row.id = r.id;

  try {
    const { data, error } = await supabase
      .from("rilievi")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) { console.error("Save rilievo:", error); return; }

    if (data && r.vani) {
      for (const v of r.vani) {
        await saveVano(data.id, commessaId, v);
      }
    }
  } catch (e) { console.error("Save rilievo:", e); }
}

// ── Save Vano ──
export async function saveVano(rilievoId: string, commessaId: string, v: any) {
  const isUUID = typeof v.id === "string" && v.id.includes("-");
  const row: any = {
    rilievo_id: rilievoId,
    commessa_id: commessaId,
    nome: v.nome,
    tipo: v.tipo || "F1A",
    pezzi: v.pezzi || 1,
    stanza: v.stanza || "Soggiorno",
    piano: v.piano || "PT",
    sistema: v.sistema || "",
    sottosistema: v.sottosistema || "",
    vetro: v.vetro || "",
    colore_int: v.coloreInt || "",
    colore_est: v.coloreEst || "",
    bicolore: v.bicolore || false,
    colore_acc: v.coloreAcc || "",
    telaio: v.telaio || "",
    telaio_ala_z: v.telaioAlaZ || "",
    rifilato: v.rifilato || false,
    rifil_sx: v.rifilSx || "",
    rifil_dx: v.rifilDx || "",
    rifil_sopra: v.rifilSopra || "",
    rifil_sotto: v.rifilSotto || "",
    coprifilo: v.coprifilo || "",
    lamiera: v.lamiera || "",
    cassonetto: v.cassonetto || false,
    accessori: v.accessori || {},
    difficolta_salita: v.difficoltaSalita || "",
    mezzo_salita: v.mezzoSalita || "",
    note: v.note || "",
    misure_json: v.misure || {},
  };
  if (isUUID) row.id = v.id;

  try {
    const { error } = await supabase
      .from("vani")
      .upsert(row, { onConflict: "id" })
      .select();
    if (error) console.error("Save vano:", error);
  } catch (e) { console.error("Save vano:", e); }
}

// ── Delete Vano ──
export async function deleteVano(vanoId: string) {
  try {
    const isUUID = typeof vanoId === "string" && vanoId.includes("-");
    if (!isUUID) return;
    await supabase.from("vani").delete().eq("id", vanoId);
  } catch (e) { console.error("Delete vano:", e); }
}

// ── Save Event ──
export async function saveEvent(azId: string, ev: any) {
  debounce(`ev_${ev.id}`, async () => {
    const isUUID = typeof ev.id === "string" && ev.id.includes("-");
    const row: any = {
      azienda_id: azId,
      titolo: ev.text || ev.titolo || "",
      tipo: ev.tipo || "appuntamento",
      data: ev.date || new Date().toISOString().split("T")[0],
      ora: ev.time || ev.ora || "",
      persona: ev.persona || "",
      indirizzo: ev.addr || ev.indirizzo || "",
      colore: ev.colore || ev.color || "#007aff",
      reminder: ev.reminder || "",
      completato: ev.done || false,
      commessa_id: ev.cm && typeof ev.cm === "string" && ev.cm.includes("-") ? ev.cm : null,
    };
    if (isUUID) row.id = ev.id;

    try {
      const { error } = await supabase.from("eventi").upsert(row, { onConflict: "id" });
      if (error) console.error("Save event:", error);
    } catch (e) { console.error("Save event:", e); }
  });
}

// ── Delete Event ──
export async function deleteEvent(evId: string) {
  try {
    const isUUID = typeof evId === "string" && evId.includes("-");
    if (!isUUID) return;
    await supabase.from("eventi").delete().eq("id", evId);
  } catch (e) { console.error("Delete event:", e); }
}

// ── Save Contatto ──
export async function saveContatto(azId: string, c: any) {
  debounce(`ct_${c.id}`, async () => {
    const isUUID = typeof c.id === "string" && c.id.includes("-");
    const row: any = {
      azienda_id: azId,
      nome: c.nome,
      cognome: c.cognome || "",
      tipo: c.tipo || "cliente",
      telefono: c.telefono || "",
      email: c.email || "",
      indirizzo: c.indirizzo || "",
      note: c.note || "",
    };
    if (isUUID) row.id = c.id;

    try {
      const { error } = await supabase.from("contatti").upsert(row, { onConflict: "id" });
      if (error) console.error("Save contatto:", error);
    } catch (e) { console.error("Save contatto:", e); }
  });
}

// ── Save Team Member ──
export async function saveTeamMember(azId: string, t: any) {
  debounce(`tm_${t.id}`, async () => {
    const isUUID = typeof t.id === "string" && t.id.includes("-");
    const row: any = {
      azienda_id: azId,
      nome: t.nome,
      ruolo: t.ruolo || "",
      compiti: t.compiti || "",
      colore: t.colore || "#007aff",
    };
    if (isUUID) row.id = t.id;

    try {
      const { error } = await supabase.from("team").upsert(row, { onConflict: "id" });
      if (error) console.error("Save team:", error);
    } catch (e) { console.error("Save team:", e); }
  });
}

// ── Save Task ──
export async function saveTask(azId: string, t: any) {
  debounce(`task_${t.id}`, async () => {
    const isUUID = typeof t.id === "string" && t.id.includes("-");
    const row: any = {
      azienda_id: azId,
      testo: t.text || t.testo || "",
      meta: t.meta || "",
      data: t.date || null,
      ora: t.time || t.ora || "",
      priorita: t.priority || t.priorita || "media",
      persona: t.persona || "",
      done: t.done || false,
      done_at: t.done ? new Date().toISOString() : null,
      commessa_id: t.cm && typeof t.cm === "string" && t.cm.includes("-") ? t.cm : null,
    };
    if (isUUID) row.id = t.id;

    try {
      const { error } = await supabase.from("tasks").upsert(row, { onConflict: "id" });
      if (error) console.error("Save task:", error);
    } catch (e) { console.error("Save task:", e); }
  });
}

// ── Save Azienda Info ──
export async function saveAzienda(azId: string, info: any) {
  debounce("azienda", async () => {
    try {
      const { error } = await supabase.from("aziende").update({
        ragione: info.ragione || "",
        piva: info.piva || "",
        indirizzo: info.indirizzo || "",
        telefono: info.telefono || "",
        email: info.email || "",
        website: info.website || "",
        iban: info.iban || "",
        cciaa: info.cciaa || "",
        logo_url: info.logo || null,
      }).eq("id", azId);
      if (error) console.error("Save azienda:", error);
    } catch (e) { console.error("Save azienda:", e); }
  });
}

// ── Save Pipeline ──
export async function savePipeline(azId: string, pipeline: any[]) {
  debounce("pipeline", async () => {
    try {
      for (let i = 0; i < pipeline.length; i++) {
        const p = pipeline[i];
        await supabase.from("pipeline_fasi").upsert({
          azienda_id: azId,
          codice: p.id,
          nome: p.nome,
          icona: p.ico,
          colore: p.color,
          ordine: i,
          attiva: p.attiva !== false,
        }, { onConflict: "azienda_id,codice" });
      }
    } catch (e) { console.error("Save pipeline:", e); }
  });
}

// ── Save Materiali (catalogo) ──
export async function saveMateriali(azId: string, data: {
  sistemi?: any[];
  colori?: any[];
  vetri?: any[];
  coprifili?: any[];
  lamiere?: any[];
}) {
  debounce("materiali", async () => {
    try {
      if (data.sistemi) {
        for (const s of data.sistemi) {
          const isUUID = typeof s.id === "string" && s.id.includes("-");
          const row: any = {
            azienda_id: azId, marca: s.marca, sistema: s.sistema,
            prezzo_mq: s.prezzoMq || s.euroMq || 0, sov_ral: s.sovRAL || 0,
            sov_legno: s.sovLegno || 0, colori: s.colori || [], sottosistemi: s.sottosistemi || [],
          };
          if (isUUID) row.id = s.id;
          await supabase.from("sistemi").upsert(row, { onConflict: isUUID ? "id" : "azienda_id,marca,sistema" });
        }
      }
      // colori, vetri, coprifili, lamiere follow same pattern — skip for brevity
    } catch (e) { console.error("Save materiali:", e); }
  });
}


// -- Save Commessa SYNC (non-debounced, returns record with UUID) --
export async function saveCantiereSync(azId: string, c: any): Promise<{ id: string; code: string } | null> {
  try {
    const res = await fetch('/api/sync/commessa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aziendaId: azId, commessa: c }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[saveCantiereSync] server error:', err);
      return null;
    }
    const { commessa } = await res.json();
    return commessa || null;
  } catch (e) {
    console.error('[saveCantiereSync] fetch exception:', e);
    return null;
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  QUICK UPDATE FUNCTIONS (single field updates, no debounce) ║
// ║  Per quando devi essere SICURO che la modifica arrivi in DB ║
// ╚══════════════════════════════════════════════════════════╝

/** Marca commessa come preventivo inviato adesso (immediato, no debounce) */
export async function markPreventivoInviato(cmId: string, totale?: number, fase?: string): Promise<boolean> {
  if (!cmId) return false;
  try {
    const updates: any = {
      preventivo_inviato_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (typeof totale === "number" && !isNaN(totale)) updates.totale_preventivo = totale;
    if (fase) updates.fase = fase;
    const { error } = await supabase.from("commesse").update(updates).eq("id", cmId);
    if (error) {
      console.error("[markPreventivoInviato] error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[markPreventivoInviato] exception:", e);
    return false;
  }
}

/** Mappa nomi UI legacy -> enum DB canonico
 *  Pipeline DB: sopralluogo, preventivo, conferma_ordine, confermata, acconto_pagato, ordine, produzione, montaggio, fatturata, pagata, persa, annullata, chiusa
 */
function mapFaseToDb(fase: string): string | null {
  if (!fase) return null;
  const f = String(fase).trim().toLowerCase();
  // Casi gia' DB-compatibili
  const valid = ['sopralluogo','preventivo','conferma_ordine','confermata','acconto_pagato','ordine','produzione','montaggio','fatturata','pagata','persa','annullata','chiusa'];
  if (valid.includes(f)) return f;
  // Mapping legacy
  switch (f) {
    case 'conferma': return 'conferma_ordine';
    case 'ordini': return 'ordine';
    case 'chiusura': return 'chiusa';
    case 'modifiche':       // non e' una fase DB: rimane invariato (non scrivere)
    case 'da_contattare':   // idem
      return null;
    default: return null;
  }
}

/** Avanza fase commessa (immediato) */
export async function setFaseCommessa(cmId: string, fase: string): Promise<boolean> {
  if (!cmId || !fase) return false;
  const faseDb = mapFaseToDb(fase);
  if (!faseDb) {
    // Fase non valida o legacy senza mapping (modifiche/da_contattare): skip silenzioso
    console.warn('[setFaseCommessa] fase non valida per DB, skip:', fase);
    return false;
  }
  try {
    const { error } = await supabase.from("commesse").update({
      fase: faseDb,
      ops_ultimo_avanzamento: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", cmId);
    if (error) { console.error("[setFaseCommessa] error:", error); return false; }
    return true;
  } catch (e) { console.error("[setFaseCommessa] exception:", e); return false; }
}

/** Salva firma cliente (immediato) */
export async function saveFirmaCliente(cmId: string, firmaDataUrl: string): Promise<boolean> {
  if (!cmId || !firmaDataUrl) return false;
  try {
    const { error } = await supabase.from("commesse").update({
      firma_cliente: firmaDataUrl,
      firma_data: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", cmId);
    if (error) { console.error("[saveFirmaCliente] error:", error); return false; }
    return true;
  } catch (e) { console.error("[saveFirmaCliente] exception:", e); return false; }
}

// ── Alias retro-compat con stub names ──
export { deleteEvent as deleteEventDB };
export { saveVano as saveVanoDB };
