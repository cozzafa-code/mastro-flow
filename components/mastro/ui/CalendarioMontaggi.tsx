// ═══ MASTRO ERP — CalendarioMontaggi (Phase B) ═══
import { useMastro } from "../../MastroContext";

export default function CalendarioMontaggi({ targetMontaggioId }: { targetMontaggioId?: string }) {
  const { T, S, Ico, cantieri, setCantieri, fattureDB, setFattureDB, ordiniFornDB, setOrdiniFornDB, squadreDB, montaggiDB, setMontaggiDB, calMontaggiWeek, setCalMontaggiWeek, selectedCM, setSelectedCM, isTablet, isDesktop } = useMastro();

    const days = getWeekDays(calMontaggiWeek);
    const durataGiorni = (d: string) => d === "mezza" ? 0.5 : d === "2giorni" ? 2 : d === "3giorni" ? 3 : 1;
    const isOccupied = (sq: any, day: Date) => {
      const dayStr = day.toISOString().split("T")[0];
      return montaggiDB.some(m => {
        if (m.squadraId !== sq.id || !m.data || m.stato === "completato") return false;
        const startDate = new Date(m.data);
        const numDays = durataGiorni(m.durata);
        for (let i = 0; i < Math.ceil(numDays); i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          if (d.toISOString().split("T")[0] === dayStr) return m;
        }
        return false;
      });
    };
    const today = new Date().toISOString().split("T")[0];
    const isSunday = (d: Date) => d.getDay() === 0;

    return (
      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
        {/* Header navigazione settimana */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: T.bg, borderBottom: `1px solid ${T.bdr}` }}>
          <div onClick={() => setCalMontaggiWeek(w => w - 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 16, fontWeight: 700, color: T.acc }}>◀</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
            {days[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div onClick={() => setCalMontaggiWeek(0)} style={{ padding: "3px 8px", borderRadius: 6, background: calMontaggiWeek === 0 ? T.acc : "transparent", color: calMontaggiWeek === 0 ? "#fff" : T.sub, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Oggi</div>
            <div onClick={() => setCalMontaggiWeek(w => w + 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 16, fontWeight: 700, color: T.acc }}>▶</div>
          </div>
        </div>

        {/* Griglia: header giorni */}
        <div style={{ display: "grid", gridTemplateColumns: `80px repeat(7, 1fr)`, fontSize: 9 }}>
          <div style={{ padding: "6px 4px", fontWeight: 700, color: T.sub, textAlign: "center", borderBottom: `1px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}` }}>Squadra</div>
          {days.map((d, i) => {
            const isToday = d.toISOString().split("T")[0] === today;
            const isSun = isSunday(d);
            return (
              <div key={i} style={{
                padding: "6px 2px", textAlign: "center", fontWeight: 700,
                color: isToday ? "#fff" : isSun ? T.red : T.text,
                background: isToday ? T.acc : isSun ? "#ff3b3010" : "transparent",
                borderBottom: `1px solid ${T.bdr}`,
                borderRight: i < 6 ? `1px solid ${T.bdr}` : "none",
              }}>
                <div>{["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"][i]}</div>
                <div style={{ fontSize: 12 }}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* Righe squadre */}
          {squadreDB.map(sq => (
            <React.Fragment key={sq.id}>
              <div style={{ padding: "8px 6px", fontWeight: 700, fontSize: 10, color: sq.colore, borderRight: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: sq.colore, flexShrink: 0 }} />
                {sq.nome}
              </div>
              {days.map((d, i) => {
                const occ = isOccupied(sq, d);
                const dayStr = d.toISOString().split("T")[0];
                const isPast = dayStr < today;
                const isSun = isSunday(d);
                const canClick = !occ && !isPast && !isSun && targetMontaggioId;
                return (
                  <div key={i} onClick={() => {
                    if (canClick) {
                      setMontaggiDB(prev => prev.map(m => m.id === targetMontaggioId ? { ...m, data: dayStr, squadraId: sq.id } : m));
                    }
                  }} style={{
                    padding: "4px 3px", borderBottom: `1px solid ${T.bdr}`,
                    borderRight: i < 6 ? `1px solid ${T.bdr}` : "none",
                    background: occ ? sq.colore + "20" : isPast ? T.bg + "80" : isSun ? "#ff3b3005" : canClick ? "#34c75908" : "transparent",
                    cursor: canClick ? "pointer" : "default",
                    minHeight: 36, position: "relative" as any,
                  }}>
                    {occ && (
                      <div style={{ fontSize: 7, fontWeight: 700, color: sq.colore, lineHeight: 1.2 }}>
                        <div>{(occ as any).cliente?.slice(0, 8)}</div>
                        <div style={{ color: T.sub }}>{(occ as any).vaniCount}v · {(occ as any).durata === "mezza" ? "½" : (occ as any).durata === "2giorni" ? "2g" : (occ as any).durata === "3giorni" ? "3g" : "1g"}</div>
                      </div>
                    )}
                    {canClick && !occ && (
                      <div style={{ position: "absolute" as any, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#34c75950" }}>+</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legenda */}
        <div style={{ padding: "6px 12px", display: "flex", gap: 12, flexWrap: "wrap" as any, fontSize: 9, color: T.sub, borderTop: `1px solid ${T.bdr}` }}>
          {squadreDB.map(sq => (
            <span key={sq.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: sq.colore }} />
              {sq.nome}: {montaggiDB.filter(m => m.squadraId === sq.id && m.stato !== "completato").length} in programma
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#ff9500" }} />
            Consegne: {ordiniFornDB.filter(o => o.dataConsegnaPrev && o.stato !== "consegnato").length} attese
          </span>
        </div>

        {/* Consegne fornitore nella settimana */}
        {(() => {
          const weekDeliveries = ordiniFornDB.filter(o => {
            if (!o.dataConsegnaPrev || o.stato === "consegnato") return false;
            const d = new Date(o.dataConsegnaPrev);
            return d >= days[0] && d <= days[6];
          });
          if (weekDeliveries.length === 0) return null;
          return (
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.bdr}`, background: "#ff950008" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#ff9500", marginBottom: 4 }}>🚛 Consegne questa settimana:</div>
              {weekDeliveries.map(o => {
                const cm = cantieri.find(cc => cc.id === o.cmId);
                const isLate = new Date(o.dataConsegnaPrev) < new Date();
                return (
                  <div key={o.id} style={{ fontSize: 10, color: isLate ? T.red : T.text, padding: "2px 0", display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700, width: 30, color: "#ff9500" }}>{new Date(o.dataConsegnaPrev).toLocaleDateString("it-IT", { weekday: "short" })}</span>
                    <span style={{ fontWeight: 600 }}>{o.fornitore}</span>
                    <span style={{ color: T.sub }}>→ {cm?.cliente || o.cmId}</span>
                    {o.costo > 0 && <span style={{ color: T.sub }}>€{o.costo.toLocaleString("it-IT")}</span>}
                    {isLate && <span style={{ color: T.red, fontWeight: 700 }}>⚠️ RITARDO</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  // === PAGINA PREVENTIVO CONDIVISIBILE (link per cliente) ===
  const generaPreventivoCondivisibile = async (c) => {
    const az = aziendaDB;
    const vani = getVaniAttivi(c);
    const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
    // Calcola prezzi reali dai sistemi/griglie
    const vaniConPrezzi = vani.map(v => ({ ...v, _prezzo: calcolaVanoPrezzo(v, c) }));
    const subtot = vaniConPrezzi.reduce((s, v) => s + v._prezzo, 0) + (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
    const iva = subtot * 0.1;
    const tot = subtot + iva;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1d1d1f;max-width:600px;margin:0 auto;padding:16px;background:#f5f5f7}
      .card{background:#fff;border-radius:14px;padding:18px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
      .header{text-align:center;margin-bottom:16px}
      .logo{max-height:50px;margin-bottom:8px}
      .title{font-size:22px;font-weight:800;color:#1d1d1f}
      .sub{font-size:12px;color:#86868b}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
      .row:last-child{border:none}
      .total{font-size:18px;font-weight:800;color:#007aff;text-align:right;padding:12px 0}
      .btn{width:100%;padding:16px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;font-family:inherit}
      .btn-green{background:#34c759;color:#fff}
      .btn-outline{background:#fff;color:#007aff;border:2px solid #007aff}
      canvas{border:1px solid #e5e5ea;border-radius:10px;background:#fff;touch-action:none}
      .firma-done{background:#f0fdf4;border:2px solid #34c759;border-radius:12px;padding:16px;text-align:center}
    </style></head><body>
    <div class="header">
      ${az.logo ? `<img src="${az.logo}" class="logo"/><br>` : ""}
      <div class="title">${az.nome || "MASTRO"}</div>
      <div class="sub">${az.indirizzo || ""}<br>${az.tel || ""} · ${az.email || ""}</div>
    </div>

    <div class="card">
      <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:8px">Preventivo</div>
      <div style="font-size:16px;font-weight:700">${c.code}</div>
      <div style="font-size:13px;color:#86868b;margin-top:2px">Per: ${c.cliente} ${c.cognome || ""}</div>
      <div style="font-size:12px;color:#86868b">${c.indirizzo || ""}</div>
      <div style="font-size:11px;color:#86868b;margin-top:4px">Data: ${new Date().toLocaleDateString("it-IT")}</div>
    </div>

    <div class="card">
      <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:10px">Riepilogo fornitura</div>
      ${vaniConPrezzi.map((v, i) => {
        const tipLabel = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo || "Vano";
        return `<div class="row">
          <div><strong>${i + 1}. ${tipLabel}</strong><br><span style="font-size:11px;color:#86868b">${v.stanza || ""} ${v.piano || ""} — ${v.misure?.lCentro || 0}×${v.misure?.hCentro || 0} mm</span></div>
          <div style="font-weight:700;white-space:nowrap">&euro;${fmt(v._prezzo)}</div>
        </div>`;
      }).join("")}
      ${(c.vociLibere || []).map(vl => `<div class="row"><div>${vl.desc}</div><div style="font-weight:700">&euro;${fmt(vl.importo)}</div></div>`).join("")}
      <div style="border-top:2px solid #e5e5ea;margin-top:8px;padding-top:8px">
        <div class="row"><span>Imponibile</span><span style="font-weight:600">&euro;${fmt(subtot)}</span></div>
        <div class="row"><span>IVA 10%</span><span>&euro;${fmt(iva)}</span></div>
      </div>
      <div class="total">TOTALE: &euro;${fmt(tot)}</div>
    </div>

    ${c.condPagamento ? `<div class="card"><div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:6px">Condizioni di pagamento</div><div style="font-size:12px;line-height:1.5">${c.condPagamento.replace(/\n/g, "<br>")}</div></div>` : ""}

    <div class="card" id="firma-section">
      <div style="font-size:11px;text-transform:uppercase;color:#86868b;letter-spacing:1px;margin-bottom:10px">Firma di accettazione</div>
      <div id="firma-pad" style="text-align:center">
        <canvas id="sigCanvas" width="340" height="150" style="width:100%;max-width:340px"></canvas>
        <div style="font-size:10px;color:#86868b;margin-top:4px">Firma con il dito o con il mouse</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-outline" onclick="clearSig()" style="flex:1;padding:10px;font-size:13px">Cancella</button>
          <button class="btn btn-green" onclick="confirmSig()" style="flex:1;padding:10px;font-size:13px">✅ Conferma e Firma</button>
        </div>
      </div>
      <div id="firma-done" class="firma-done" style="display:none">
        <div style="font-size:24px;margin-bottom:6px">✅</div>
        <div style="font-size:16px;font-weight:700;color:#34c759">Preventivo Firmato!</div>
        <div style="font-size:12px;color:#86868b;margin-top:4px">Grazie per la conferma. Riceverà aggiornamenti sull'avanzamento del suo ordine.</div>
        <img id="firma-img" style="max-height:60px;margin-top:10px" alt=""/>
      </div>
    </div>

    <div style="text-align:center;font-size:10px;color:#ccc;margin-top:16px">Generato con MASTRO · ${new Date().toLocaleDateString("it-IT")}</div>

    <script>
    const canvas=document.getElementById('sigCanvas'),ctx=canvas.getContext('2d');
    let drawing=false,lastX=0,lastY=0,hasDrawn=false;
    ctx.strokeStyle='#1d1d1f';ctx.lineWidth=2;ctx.lineCap='round';
    function getPos(e){const r=canvas.getBoundingClientRect();const t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
    canvas.addEventListener('mousedown',e=>{drawing=true;const p=getPos(e);lastX=p.x;lastY=p.y;});
    canvas.addEventListener('mousemove',e=>{if(!drawing)return;hasDrawn=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y;});
    canvas.addEventListener('mouseup',()=>drawing=false);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const p=getPos(e);lastX=p.x;lastY=p.y;},{passive:false});
    canvas.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;hasDrawn=true;const p=getPos(e);ctx.beginPath();ctx.moveTo(lastX,lastY);ctx.lineTo(p.x,p.y);ctx.stroke();lastX=p.x;lastY=p.y;},{passive:false});
    canvas.addEventListener('touchend',()=>drawing=false);
    function clearSig(){ctx.clearRect(0,0,canvas.width,canvas.height);hasDrawn=false;}
    function confirmSig(){
      if(!hasDrawn){alert('Firma prima di confermare');return;}
      const img=canvas.toDataURL();
      document.getElementById('firma-pad').style.display='none';
      document.getElementById('firma-done').style.display='block';
      document.getElementById('firma-img').src=img;
    }
    <\/script>
    </body></html>`;

    // Upload to Supabase Storage per URL pubblico condivisibile
    const fileName = `preventivo_${c.code}_${Date.now()}.html`;
    try {
      const blob = new Blob([html], { type: "text/html" });
      const { data: uploadData, error } = await supabase.storage
        .from("preventivi")
        .upload(`public/${fileName}`, blob, { contentType: "text/html", upsert: true });
      
      if (!error && uploadData) {
        const { data: urlData } = supabase.storage.from("preventivi").getPublicUrl(`public/${fileName}`);
        const publicUrl = urlData?.publicUrl;
        if (publicUrl) {
          // Salva URL nella commessa
          setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, linkPreventivo: publicUrl } : x));
          setSelectedCM(p => p?.id === c.id ? { ...p, linkPreventivo: publicUrl } : p);
          
          // Apri link + offri invio WhatsApp
          window.open(publicUrl, "_blank");
          
          // Auto-WhatsApp
          const tel = (c.telefono || "").replace(/\D/g, "");
          if (tel) {
            const msg = `Gentile ${c.cliente}, ecco il preventivo per ${c.code}:\n${publicUrl}\n\nPuò visionarlo e firmarlo direttamente dal suo telefono.\n\nCordiali saluti,\n${aziendaDB.nome || "MASTRO"}`;
            setTimeout(() => {
              if (confirm("Inviare il link via WhatsApp al cliente?")) {
                window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(msg)}`, "_blank");
              }
            }, 500);
          }
          return publicUrl;
        }
      }
    } catch (e) { console.warn("Upload Supabase non riuscito, uso blob locale:", e); }
    
    // Fallback: blob locale se Supabase non disponibile
    const blobFallback = new Blob([html], { type: "text/html" });
    const urlFallback = URL.createObjectURL(blobFallback);
    window.open(urlFallback, "_blank");
    return urlFallback;
  };

  // === UPLOAD CONFERMA FORNITORE (Supabase Storage + AI Extraction) ===
  const uploadConfermaFornitore = (ordId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. Upload a Supabase Storage
      const fileName = `conferma_${ordId}_${Date.now()}_${file.name}`;
      let fileUrl = "";
      try {
        const { data: uploadData, error } = await supabase.storage
          .from("conferme-fornitore")
          .upload(`docs/${fileName}`, file, { contentType: file.type, upsert: true });
        if (!error && uploadData) {
          const { data: urlData } = supabase.storage.from("conferme-fornitore").getPublicUrl(`docs/${fileName}`);
          fileUrl = urlData?.publicUrl || "";
        }
      } catch (err) { console.warn("Upload Supabase fallito:", err); }

      // 2. AI Extraction — funziona con PDF, immagini, scansioni
      let extractedData: any = {};
      setExtractingPDF(true);
      try {
        extractedData = await estraiDatiPDF(file);
      } catch (err) { console.warn("Estrazione:", err); }
      setExtractingPDF(false);

      // 3. Aggiorna ordine con allegato + dati estratti
      setOrdiniFornDB(prev => prev.map(o => {
        if (o.id !== ordId) return o;
        const updated = {
          ...o,
          conferma: {
            ...o.conferma,
            ricevuta: true,
            dataRicezione: new Date().toISOString().split("T")[0],
            nomeFile: file.name,
            fileUrl: fileUrl,
            datiEstratti: extractedData, // salva tutto per riferimento
          },
          stato: o.stato === "bozza" || o.stato === "inviato" ? "confermato" : o.stato,
        };
        // Auto-fill dati estratti
        if (extractedData.totale) updated.totaleIva = extractedData.totale;
        if (extractedData.imponibile) updated.totale = extractedData.imponibile;
        if (extractedData.settimane) updated.consegna = { ...updated.consegna, settimane: extractedData.settimane };
        if (extractedData.dataConsegna) updated.consegna = { ...updated.consegna, prevista: extractedData.dataConsegna };
        if (extractedData.pagamento) updated.pagamento = { ...updated.pagamento, termini: extractedData.pagamento };
        if (extractedData.fornitoreNome && !o.fornitore?.nome) updated.fornitore = { ...updated.fornitore, nome: extractedData.fornitoreNome };
        if (extractedData.numeroOrdine) updated.numero = extractedData.numeroOrdine;
        // Auto-fill righe se estratte dall'AI
        if (extractedData.righe?.length > 0 && (!o.righe || o.righe.length === 0)) {
          updated.righe = extractedData.righe.map((r: any, i: number) => ({
            id: Date.now() + i,
            desc: r.descrizione || "",
            misure: r.misure || "",
            qta: r.quantita || 1,
            prezzoUnit: r.prezzo_unitario || 0,
            totale: r.prezzo_totale || (r.prezzo_unitario || 0) * (r.quantita || 1),
            note: "",
          }));
        }
        return updated;
      }));
    };
    input.click();
  };

  // === AI PDF EXTRACTION — Claude legge QUALSIASI PDF ===
  const estraiDatiPDF = async (file: File): Promise<any> => {
    // METODO 1: Supabase Edge Function + Claude API (funziona con TUTTO)
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = (supabase as any).supabaseUrl || "";
      
      const resp = await fetch(`${supabaseUrl}/functions/v1/extract-pdf`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: formData,
      });
      
      if (resp.ok) {
        const result = await resp.json();
        if (result.success && result.data) {
          const d = result.data;
          const extracted: any = {};
          if (d.totale) extracted.totale = d.totale;
          if (d.imponibile) extracted.imponibile = d.imponibile;
          if (d.settimane) extracted.settimane = d.settimane;
          if (d.data_consegna) extracted.dataConsegna = d.data_consegna;
          if (d.termini_pagamento) extracted.pagamento = d.termini_pagamento;
          if (d.fornitore_nome) extracted.fornitoreNome = d.fornitore_nome;
          if (d.numero_ordine) extracted.numeroOrdine = d.numero_ordine;
          if (d.righe) extracted.righe = d.righe;
          if (d.note) extracted.note = d.note;
          return extracted;
        }
      }
    } catch (e) { console.warn("Edge Function non disponibile, uso fallback locale:", e); }

    // METODO 2: Fallback — estrazione testo locale (PDF text-based)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const extracted: any = {};

        // Totale
        const totMatch = text.match(/(?:TOTALE|Totale\s*(?:Documento|Ordine|Generale)?|Tot\.?\s*€?)\s*[€:]?\s*([\d.,]+)/i);
        if (totMatch) {
          const val = parseFloat(totMatch[1].replace(/\./g, "").replace(",", "."));
          if (val > 0 && val < 1000000) extracted.totale = val;
        }
        // Imponibile
        const impMatch = text.match(/(?:Imponibile|Subtotale|Sub\s*tot)\s*[€:]?\s*([\d.,]+)/i);
        if (impMatch) {
          const val = parseFloat(impMatch[1].replace(/\./g, "").replace(",", "."));
          if (val > 0) extracted.imponibile = val;
        }
        // Settimane
        const settMatch = text.match(/(\d{1,2})\s*(?:settiman[ea]|sett\.?|weeks?)/i);
        if (settMatch) extracted.settimane = parseInt(settMatch[1]);
        const giorniMatch = text.match(/(\d{1,3})\s*(?:giorni?\s*(?:lavorativ|lavor))/i);
        if (giorniMatch) extracted.settimane = Math.ceil(parseInt(giorniMatch[1]) / 5);
        // Data consegna
        const consMatch = text.match(/(?:consegna|delivery|spedizione)\s*(?:prevista)?:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
        if (consMatch) {
          const parts = consMatch[1].split(/[\/\-]/);
          if (parts.length === 3) {
            const y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
            extracted.dataConsegna = `${y}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
        }
        // Pagamento
        const pagMatch = text.match(/(\d{2,3})\s*(?:gg|giorni)\s*(?:FM|D\.?F\.?|f\.?m\.?)?/i);
        if (pagMatch) {
          const days = parseInt(pagMatch[1]);
          extracted.pagamento = days <= 30 ? "30gg_fm" : days <= 60 ? "60gg_fm" : "90gg_fm";
        }
        if (text.match(/anticip/i)) extracted.pagamento = "anticipato";
        if (text.match(/ricevimento\s*merce/i)) extracted.pagamento = "ricevuta_merce";

        resolve(extracted);
      };
      reader.readAsText(file);
    });
  };

  // === 📥 INBOX UNIVERSALE — Classifica qualsiasi documento ===
  const apriInboxDocumento = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/*,.jpg,.jpeg,.png";
    input.onchange = async (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      setShowInboxDoc(true);
      setInboxResult({ stato: "caricamento", file: file.name, tipo: file.type });

      let fileUrl = "";
      let extractedData: any = {};

      try {
        try {
          if (typeof supabase !== "undefined" && supabase?.storage) {
            const fileName = `inbox_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const result: any = await Promise.race([
              supabase.storage.from("conferme-fornitore").upload(`docs/${fileName}`, file, { contentType: file.type, upsert: true }),
              new Promise((_, rej) => setTimeout(() => rej("timeout"), 5000)),
            ]).catch(() => null);
            if (result && !result.error) {
              const { data: urlData } = supabase.storage.from("conferme-fornitore").getPublicUrl(`docs/${fileName}`);
              fileUrl = urlData?.publicUrl || "";
            }
          }
        } catch (err) { /* skip upload */ }

        setInboxResult(prev => ({ ...prev, stato: "analisi" }));
        try {
          extractedData = await Promise.race([
            estraiDatiPDF(file),
            new Promise((_, rej) => setTimeout(() => rej("timeout"), 8000)),
          ]).catch(() => ({ nomeFile: file.name }));
        } catch (err) { extractedData = { nomeFile: file.name }; }
      } catch (err) { console.warn("Inbox error:", err); }

      // === CLASSIFICAZIONE UNIVERSALE ===
      const fname = file.name.toLowerCase();
      const dati = extractedData;
      let docTipo: string = "sconosciuto"; // firma | conferma | fattura | ricevuta | foto
      let matchedCommessa: any = null;
      let matchedOrdine: any = null;
      let confidence = 0;

      // 1. Detect tipo from filename + content
      if (fname.includes("firmato") || fname.includes("firma") || fname.includes("signed") || dati.text?.match(/firmato|firma.*cliente|approvato/i)) {
        docTipo = "firma"; confidence = 90;
      } else if (fname.includes("conferma") || fname.includes("order_confirm") || dati.fornitoreNome || dati.settimane) {
        docTipo = "conferma"; confidence = 85;
      } else if (fname.includes("fattura") || fname.includes("invoice") || dati.text?.match(/fattura\s*(n\.?|numero)/i)) {
        docTipo = "fattura"; confidence = 85;
      } else if (fname.includes("bonifico") || fname.includes("ricevuta") || fname.includes("pagamento") || dati.text?.match(/bonifico|accredito|pagamento/i)) {
        docTipo = "ricevuta"; confidence = 80;
      } else if (file.type.startsWith("image/") && !dati.fornitoreNome && !dati.totale) {
        docTipo = "foto"; confidence = 60;
      } else if (dati.fornitoreNome || dati.settimane) {
        docTipo = "conferma"; confidence = 70;
      } else if (dati.totale > 0) {
        docTipo = "fattura"; confidence = 50;
      }

      // 2. Match to commessa/ordine
      const ordiniAttivi = ordiniFornDB.filter(o => !o.conferma?.ricevuta);
      
      if (docTipo === "conferma") {
        // Match conferma to ordine fornitore
        if (dati.fornitoreNome) {
          matchedOrdine = ordiniAttivi.find(o =>
            (o.fornitore?.nome || "").toLowerCase().includes(dati.fornitoreNome.toLowerCase()) ||
            dati.fornitoreNome.toLowerCase().includes((o.fornitore?.nome || "").toLowerCase())
          );
        }
        if (!matchedOrdine && dati.totale) {
          matchedOrdine = ordiniAttivi.find(o => Math.abs((o.totaleIva || o.totale || 0) - dati.totale) < 100);
        }
        if (!matchedOrdine && ordiniAttivi.length === 1) matchedOrdine = ordiniAttivi[0];
        if (matchedOrdine) matchedCommessa = cantieri.find(cm => cm.id === matchedOrdine.cmId);
      } else if (docTipo === "firma") {
        // Match firma to commessa in attesa firma
        const cmInAttesaFirma = cantieri.filter(cm => !cm.firmaCliente && cm.rilievi?.length > 0);
        // Try match by client name in filename
        for (const cm of cmInAttesaFirma) {
          const cliName = `${cm.cliente} ${cm.cognome || ""}`.toLowerCase();
          if (fname.includes(cm.cliente.toLowerCase()) || fname.includes((cm.cognome || "").toLowerCase()) || fname.includes(cm.code.toLowerCase())) {
            matchedCommessa = cm; confidence = 95; break;
          }
        }
        if (!matchedCommessa && cmInAttesaFirma.length === 1) { matchedCommessa = cmInAttesaFirma[0]; confidence = 75; }
        if (!matchedCommessa && cmInAttesaFirma.length > 0) { matchedCommessa = null; } // ambiguous — will show options
      } else if (docTipo === "ricevuta") {
        // Match ricevuta to fattura non pagata
        const fatNonPagate = fattureDB.filter(f => !f.pagata);
        if (dati.totale) {
          const match = fatNonPagate.find(f => Math.abs(f.importo - dati.totale) < 10);
          if (match) matchedCommessa = cantieri.find(cm => cm.id === match.cmId);
        }
        if (!matchedCommessa && fatNonPagate.length === 1) {
          matchedCommessa = cantieri.find(cm => cm.id === fatNonPagate[0].cmId);
        }
      } else if (docTipo === "foto") {
        // Match foto to montaggio in corso
        const montInCorso = montaggiDB.filter(m => m.stato === "in_corso" || m.stato === "programmato");
        if (montInCorso.length === 1) matchedCommessa = cantieri.find(cm => cm.id === montInCorso[0].cmId);
      }

      // All commesse for manual selection
      const commesseAttive = cantieri.filter(cm => cm.fase !== "chiusura");

      setInboxResult({
        stato: "completato", file: file.name, tipo: file.type, fileUrl,
        dati: extractedData, docTipo, confidence,
        matchedOrdine, matchedCommessa, tuttiOrdini: ordiniAttivi, commesseAttive,
      });
    };
    input.click();
  };

  // Conferma inbox → assegna a ordine
  const confermaInboxDoc = (ordId: string) => {
    const res = inboxResult;
    if (!res || !ordId) return;
    setOrdiniFornDB(prev => prev.map(o => {
      if (o.id !== ordId) return o;
      const updated = {
        ...o,
        conferma: {
          ...o.conferma,
          ricevuta: true,
          dataRicezione: new Date().toISOString().split("T")[0],
          nomeFile: res.file,
          fileUrl: res.fileUrl || "",
          datiEstratti: res.dati,
        },
        stato: o.stato === "bozza" || o.stato === "inviato" ? "confermato" : o.stato,
      };
      if (res.dati?.totale) updated.totaleIva = res.dati.totale;
      if (res.dati?.imponibile) updated.totale = res.dati.imponibile;
      if (res.dati?.settimane) updated.consegna = { ...updated.consegna, settimane: res.dati.settimane };
      if (res.dati?.dataConsegna) updated.consegna = { ...updated.consegna, prevista: res.dati.dataConsegna };
      if (res.dati?.pagamento) updated.pagamento = { ...updated.pagamento, termini: res.dati.pagamento };
      if (res.dati?.righe?.length > 0 && (!o.righe || o.righe.length === 0)) {
        updated.righe = res.dati.righe.map((r: any, i: number) => ({
          id: Date.now() + i, desc: r.descrizione || "", misure: r.misure || "",
          qta: r.quantita || 1, prezzoUnit: r.prezzo_unitario || 0,
          totale: r.prezzo_totale || 0, note: "",
        }));
      }
      return updated;
    }));
    // Auto-advance commessa
    const ord = ordiniFornDB.find(o => o.id === ordId);
    if (ord?.cmId) setFaseTo(ord.cmId, "produzione");
    setShowInboxDoc(false);
    setInboxResult(null);
  };

  // Assegna documento universale a commessa/step
  const assegnaDocUniversale = (cmId: number, tipo: string) => {
    const res = inboxResult;
    if (!res) return;
    const allegato = { id: Date.now(), tipo, nome: res.file, data: new Date().toLocaleDateString("it-IT"), dataUrl: res.fileUrl || "" };
    
    if (tipo === "firma") {
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0],
        firmaDocumento: allegato, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `📥 documento firmato caricato da inbox`, quando: "Adesso", color: "#34c759" }, ...(cm.log || [])]
      } : cm));
      if (selectedCM?.id === cmId) setSelectedCM(prev => ({ ...prev, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0] }));
    } else if (tipo === "ricevuta") {
      // Segna fattura come pagata
      const fatNonPagata = fattureDB.find(f => f.cmId === cmId && !f.pagata);
      if (fatNonPagata) {
        setFattureDB(prev => prev.map(f => f.id === fatNonPagata.id ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
      }
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `📥 ricevuta pagamento caricata da inbox`, quando: "Adesso", color: "#007aff" }, ...(cm.log || [])]
      } : cm));
    } else if (tipo === "foto") {
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `📥 foto cantiere caricata da inbox`, quando: "Adesso", color: "#5856d6" }, ...(cm.log || [])]
      } : cm));
    } else {
      // Generic: just add as allegato
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `📥 documento "${res.file}" caricato da inbox`, quando: "Adesso", color: "#86868b" }, ...(cm.log || [])]
      } : cm));
    }
    
    setShowInboxDoc(false); setInboxResult(null);
  };

  // === TRACKING CLIENTE (pagina pubblica) ===
  const generaTrackingCliente = (c) => {
    const az = aziendaDB;
    const trackSteps = [
      { id: "ordinato", label: "Ordinato", icon: "📦", desc: "Il materiale è stato ordinato al fornitore" },
      { id: "produzione", label: "In Produzione", icon: "🏭", desc: "I serramenti sono in fase di produzione" },
      { id: "pronto", label: "Pronto", icon: "✅", desc: "Il materiale è pronto per la consegna" },
      { id: "consegnato", label: "Consegnato", icon: "🚛", desc: "Il materiale è stato consegnato" },
      { id: "montato", label: "Montato", icon: "🔧", desc: "L'installazione è completata" },
    ];
    const curIdx = trackSteps.findIndex(s => s.id === c.trackingStato);
    const fatture = fattureDB.filter(f => f.cmId === c.id);
    const totFat = fatture.reduce((s, f) => s + f.importo, 0);
    const totPag = fatture.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0);
    const montaggio = montaggiDB.find(m => m.cmId === c.id && m.stato !== "completato");
    const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Tracking Ordine ${c.code} — ${az.nome || "MASTRO"}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;color:#1a1a1c;padding:16px;max-width:480px;margin:0 auto}
      .card{background:#fff;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
      .step{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #f0f0f2}
      .step:last-child{border-bottom:none}
      .dot{width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      .active .dot{background:#007aff20} .done .dot{background:#34c75920} .pending .dot{background:#f0f0f2}
      .line{width:2px;height:20px;margin:0 17px;background:#e0e0e2}
      .done .line{background:#34c759} .active .line{background:#007aff}
      .badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700}
      h2{font-size:20px;font-weight:800;letter-spacing:-0.3px}
    </style></head><body>
    <div class="card" style="text-align:center">
      ${az.logo ? `<img src="${az.logo}" style="max-height:50px;max-width:180px;margin-bottom:8px" alt="">` : ""}
      <h2>${az.nome || "MASTRO"}</h2>
      <div style="font-size:12px;color:#8e8e93;margin-top:4px">${az.tel || ""} · ${az.email || ""}</div>
    </div>

    <div class="card">
      <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Ordine</div>
      <h2>${c.code}</h2>
      <div style="font-size:13px;color:#8e8e93;margin-top:2px">${c.cliente} ${c.cognome || ""}</div>
      <div style="font-size:12px;color:#8e8e93">${c.indirizzo || ""}</div>
      ${c.dataPrevConsegna ? `<div style="margin-top:10px;padding:8px 12px;background:#007aff10;border-radius:8px;font-size:12px;color:#007aff;font-weight:600">📅 Consegna prevista: ${new Date(c.dataPrevConsegna).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>` : ""}
      ${montaggio?.data ? `<div style="margin-top:6px;padding:8px 12px;background:#30b0c710;border-radius:8px;font-size:12px;color:#30b0c7;font-weight:600">🔧 Montaggio programmato: ${new Date(montaggio.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} ore ${montaggio.oraInizio || "08:00"}</div>` : ""}
    </div>

    <div class="card">
      <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Stato avanzamento</div>
      ${trackSteps.map((st, i) => {
        const isDone = i < curIdx;
        const isActive = i === curIdx;
        const cls = isDone ? "done" : isActive ? "active" : "pending";
        return `<div class="step ${cls}">
          <div>
            <div class="dot">${st.icon}</div>
            ${i < trackSteps.length - 1 ? `<div class="line"></div>` : ""}
          </div>
          <div style="padding-top:6px">
            <div style="font-size:14px;font-weight:700;color:${isDone ? "#34c759" : isActive ? "#007aff" : "#c7c7cc"}">${st.label}</div>
            <div style="font-size:11px;color:#8e8e93;margin-top:2px">${st.desc}</div>
            ${isDone && c["tracking_" + st.id + "_data"] ? `<div style="font-size:10px;color:#34c759;margin-top:2px">✅ ${c["tracking_" + st.id + "_data"]}</div>` : ""}
            ${isActive ? `<span class="badge" style="background:#007aff20;color:#007aff;margin-top:4px">In corso</span>` : ""}
          </div>
        </div>`;
      }).join("")}
    </div>

    ${fatture.length > 0 ? `<div class="card">
      <div style="font-size:11px;color:#8e8e93;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Situazione pagamenti</div>
      ${fatture.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f2">
        <div>
          <div style="font-size:12px;font-weight:600">${f.tipo === "acconto" ? "Acconto" : f.tipo === "saldo" ? "Saldo" : "Fattura"} N.${f.numero}/${f.anno}</div>
          <div style="font-size:10px;color:#8e8e93">${f.data}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:800">&euro;${fmt(f.importo)}</div>
          <div style="font-size:10px;color:${f.pagata ? "#34c759" : "#ff3b30"};font-weight:600">${f.pagata ? "✅ Pagata" : "⏳ Da pagare"}</div>
        </div>
      </div>`).join("")}
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:4px">
        <span style="font-size:12px;color:#8e8e93">Totale: &euro;${fmt(totFat)}</span>
        <span style="font-size:12px;font-weight:700;color:${totPag >= totFat ? "#34c759" : "#ff9500"}">${totPag >= totFat ? "✅ Saldato" : `Da pagare: €${fmt(totFat - totPag)}`}</span>
      </div>
    </div>` : ""}

    <div style="text-align:center;font-size:10px;color:#c7c7cc;margin-top:16px;padding:12px">
      Pagina generata da MASTRO · ${new Date().toLocaleDateString("it-IT")}
    </div>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    return url;
}
