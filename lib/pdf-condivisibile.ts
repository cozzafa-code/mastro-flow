// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-condivisibile.ts
// Conferma d'Ordine con firma cliente (documento commerciale)
// Sostituisce il semplice "preventivo" — è il contratto reale
// ═══════════════════════════════════════════════════════════

export async function generaPreventivoCondivisibile(c: any, ctx: any) {
  const { aziendaInfo, calcolaVanoPrezzo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map((v: any) => ({
    ...v,
    prezzo: calcolaVanoPrezzo(v, c) * (v.pezzi || 1),
    prezzoUnit: calcolaVanoPrezzo(v, c),
  }));

  const totBase = vaniCalc.reduce((s: number, v: any) => s + v.prezzo, 0)
    + (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);

  const scontoPerc = parseFloat(c.scontoPerc || c.sconto || 0);
  const sconto = totBase * scontoPerc / 100;
  const imponibile = totBase - sconto;
  const ivaPerc = c.ivaPerc || 10;
  const iva = imponibile * ivaPerc / 100;
  const totIva = imponibile + iva;
  const acconto = parseFloat(c.accontoRicevuto || 0);

  // Fix decimali: sempre 2 cifre
  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─── Righe vani con dettaglio completo ───
  const righeHTML = vaniCalc.map((v: any, i: number) => {
    const m = v.misure || {};
    const misureStr = m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro} mm` : "";
    const colori = v.coloreInt && v.coloreEst && v.coloreInt !== v.coloreEst
      ? `${v.coloreInt} int. / ${v.coloreEst} est.`
      : (v.coloreInt || v.coloreEst || v.colore || "");
    const dettagli = [
      v.tipo || "",
      misureStr,
      v.sistema || v.modello || "",
      v.vetro || "",
      colori,
    ].filter(Boolean).join(" · ");

    // Accessori su sub-riga — legge struttura con/senza .attivo
    const acc = v.accessori || {};
    const accList: string[] = [];
    
    // Helper: controlla se un accessorio è attivo in qualsiasi formato
    const isAttivo = (a: any) => a && (a === true || a.attivo === true || a.presente === true || a.inclusa === true || a.incluso === true);
    
    // Tapparella — sia da v.accessori.tapparella che da v.tapparella diretto
    const tapp = acc.tapparella || (v.tapparella ? { attivo: true } : null);
    if (isAttivo(tapp)) {
      const parts = ["Tapparella"];
      if (tapp.tipo && tapp.tipo !== true) parts.push(tapp.tipo);
      if (tapp.colore) parts.push(tapp.colore);
      if (tapp.azionamento) parts.push(tapp.azionamento);
      if (tapp.motorizzata) parts.push("Motorizzata");
      if (tapp.l && tapp.h) parts.push(`${tapp.l}×${tapp.h} mm`);
      accList.push(parts.join(" "));
    }
    // Persiana
    const pers = acc.persiana || (v.persiana ? { attivo: true } : null);
    if (isAttivo(pers)) {
      const parts = ["Persiana"];
      if (pers.tipo && pers.tipo !== true) parts.push(pers.tipo);
      if (pers.colore) parts.push(pers.colore);
      accList.push(parts.join(" "));
    }
    // Zanzariera
    const zanz = acc.zanzariera || (v.zanzariera ? { attivo: true } : null);
    if (isAttivo(zanz)) {
      const parts = ["Zanzariera"];
      if (zanz.tipo && zanz.tipo !== true) parts.push(zanz.tipo);
      if (zanz.colore) parts.push(zanz.colore);
      accList.push(parts.join(" "));
    }
    // Controtelaio
    if (v.controtelaio || acc.cassonetto?.attivo) accList.push(`Controtelaio`);
    // Accessori catalogo aggiuntivi
    (v.accessoriCatalogo || []).forEach((ac: any) => {
      if (ac.nome) accList.push(`${(ac.quantita || 1) > 1 ? (ac.quantita || 1) + "× " : ""}${ac.nome}${ac.colore ? " " + ac.colore : ""}`);
    });
    // Voci libere vano
    (v.vociLibere || []).forEach((vl: any) => {
      if (vl.desc) accList.push(vl.desc);
    });
    const accHTML = accList.length > 0
      ? `<div style="font-size:11px;color:#86868b;margin-top:3px;">↳ ${accList.join(" · ")}</div>`
      : "";

    return `
    <tr>
      <td style="vertical-align:top">${i + 1}</td>
      <td>
        <div style="font-weight:700">${v.nome || `Vano ${i + 1}`}</div>
        <div style="font-size:11px;color:#86868b;margin-top:2px">${dettagli}</div>
        ${accHTML}
      </td>
      <td class="num" style="vertical-align:top">${v.pezzi || 1}</td>
      <td class="num" style="vertical-align:top">€ ${fmt(v.prezzoUnit)}</td>
      <td class="num bold" style="vertical-align:top">€ ${fmt(v.prezzo)}</td>
    </tr>`;
  }).join("");

  const vociLibHTML = (c.vociLibere || []).map((vl: any) => `
    <tr>
      <td>—</td>
      <td>${vl.desc || vl.descrizione || "Voce aggiuntiva"}</td>
      <td class="num">${vl.qta || 1}</td>
      <td class="num">€ ${fmt(vl.importo || 0)}</td>
      <td class="num bold">€ ${fmt((vl.importo || 0) * (vl.qta || 1))}</td>
    </tr>`).join("");

  // ─── Condizioni commerciali — prima da Settings azienda, poi da commessa ───
  const condPag = az.condPagamento || c.condPagamento || "";
  const condConsegna = az.condConsegna || c.tempiConsegna || "";
  const condFornitura = az.condFornitura || "";
  const condContratto = az.condContratto || c.garanzia || "";
  const condDettagli = az.condDettagli || "";
  const dataPrevConsegna = c.dataPrevConsegna || "";

  const condizioniHTML = (condPag || condConsegna || condFornitura || condContratto || condDettagli || dataPrevConsegna) ? `
    <div class="condizioni-grid">
      ${condPag ? `<div class="cond-item"><div class="label">💳 Condizioni di pagamento</div><div class="cond-val" style="white-space:pre-wrap">${condPag}</div></div>` : ""}
      ${condConsegna ? `<div class="cond-item"><div class="label">📦 Tempi di consegna</div><div class="cond-val" style="white-space:pre-wrap">${condConsegna}</div></div>` : ""}
      ${condFornitura ? `<div class="cond-item"><div class="label">📋 Condizioni di fornitura</div><div class="cond-val" style="white-space:pre-wrap">${condFornitura}</div></div>` : ""}
      ${condContratto ? `<div class="cond-item"><div class="label">🛡 Garanzia e contratto</div><div class="cond-val" style="white-space:pre-wrap">${condContratto}</div></div>` : ""}
      ${condDettagli ? `<div class="cond-item" style="grid-column:1/-1"><div class="label">📄 Documenti alla consegna</div><div class="cond-val" style="white-space:pre-wrap">${condDettagli}</div></div>` : ""}
      ${dataPrevConsegna ? `<div class="cond-item"><div class="label">📅 Data prevista consegna</div><div class="cond-val">${new Date(dataPrevConsegna).toLocaleDateString("it-IT")}</div></div>` : ""}
    </div>` : "";

  // ─── Note ───
  const noteHTML = c.notePreventivo ? `
    <div class="note-box">
      <div class="label">Note e condizioni particolari</div>
      <div style="margin-top:6px;line-height:1.6;font-size:13px;white-space:pre-wrap">${c.notePreventivo}</div>
    </div>` : "";

  // ─── Firma ───
  const firmaHTML = c.firmaCliente ? `
    <div class="firma-box">
      <div class="firma-header">
        <div>
          <div class="label">Documento firmato da</div>
          <div class="firma-nome">${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</div>
          ${c.dataFirma ? `<div style="font-size:12px;color:#166534;margin-top:2px">Data firma: ${c.dataFirma}</div>` : ""}
        </div>
        <div style="font-size:22px">✅</div>
      </div>
      <img src="${c.firmaCliente}" alt="Firma cliente" style="max-height:70px;margin-top:12px;border:1px solid #bbf7d0;border-radius:8px;padding:6px;display:block;" />
    </div>` : `
    <div class="firma-attesa">
      <div class="label">Firma cliente</div>
      <div style="border:2px dashed #d0d0d0;border-radius:10px;height:60px;margin-top:8px;display:flex;align-items:center;justify-content:center;color:#86868b;font-size:12px">
        In attesa di firma
      </div>
      <div style="margin-top:12px;display:flex;justify-content:space-between;border-top:1px solid #e5e5ea;padding-top:12px;font-size:12px;color:#86868b">
        <span>Luogo e data: _________________</span>
        <span>Firma: _________________</span>
      </div>
    </div>`;

  // ─── Acconto box ───
  const accontoHTML = acconto > 0 ? `
    <div style="margin-top:8px;background:#f0fdf4;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;color:#166534;font-size:13px;font-weight:700">
      <span>Acconto ricevuto</span><span>− € ${fmt(acconto)}</span>
    </div>
    <div style="margin-top:6px;background:#fff;border:2px solid #166534;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;color:#166534;font-size:15px;font-weight:800">
      <span>Saldo da incassare</span><span>€ ${fmt(totIva - acconto)}</span>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conferma d'Ordine ${c.code || ""} — ${az.nome || "MASTRO"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Inter', sans-serif; background: #F2F1EC; padding: 24px 16px; color: #1A1A1C; }
    .card { background: #fff; border-radius: 20px; max-width: 700px; margin: 0 auto; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
    .topbar { background: #1A1A1C; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .logo-wrap { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; background: #D08008; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #1A1A1C; }
    .az-nome { color: #fff; font-size: 15px; font-weight: 700; }
    .az-sub { color: #86868b; font-size: 11px; margin-top: 2px; }
    .tag { background: #1A9E73; color: #fff; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px; }
    .body { padding: 28px 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .info-box { background: #F2F1EC; border-radius: 12px; padding: 16px; }
    .label { font-size: 10px; font-weight: 700; color: #86868b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
    .info-box .value { font-size: 15px; font-weight: 700; }
    .info-box .sub { font-size: 12px; color: #86868b; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 4px; }
    th { background: #1A1A1C; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; }
    th.num, td.num { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafafa; }
    .bold { font-weight: 700; }
    .totali { margin-top: 20px; border: 1px solid #f0f0f0; border-radius: 10px; overflow: hidden; }
    .tot-row { display: flex; justify-content: space-between; padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; background: #fff; }
    .tot-row:last-child { border-bottom: none; }
    .tot-final { background: #1A1A1C; color: #fff; padding: 14px 16px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; }
    /* Condizioni */
    .condizioni-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
    .cond-item { background: #F2F1EC; border-radius: 10px; padding: 12px 14px; }
    .cond-val { font-size: 13px; font-weight: 600; margin-top: 4px; color: #1A1A1C; }
    /* Note */
    .note-box { background: #F2F1EC; border-radius: 10px; padding: 14px; margin-top: 16px; }
    /* Firma */
    .firma-box { background: #f0fdf4; border: 1.5px solid #34c759; border-radius: 12px; padding: 16px; margin-top: 20px; }
    .firma-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .firma-nome { font-size: 15px; font-weight: 700; color: #166534; margin-top: 4px; }
    .firma-attesa { border: 1.5px solid #e5e5ea; border-radius: 12px; padding: 16px; margin-top: 20px; }
    .sezione-title { font-size: 11px; font-weight: 800; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 10px; }
    .footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #86868b; }
    .cf-box { font-size: 11px; color: #86868b; margin-top: 4px; }
    @media print { body { background: white; padding: 0; } .card { box-shadow: none; border-radius: 0; max-width: 100%; } }
    @media (max-width: 500px) { .info-grid, .condizioni-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="topbar">
      <div class="logo-wrap">
        ${az.logo ? `<img src="${az.logo}" style="width:40px;height:40px;border-radius:10px;object-fit:cover;" />` : `<div class="logo">M</div>`}
        <div>
          <div class="az-nome">${az.ragione || az.nome || "MASTRO ERP"}</div>
          <div class="az-sub">${[az.indirizzo, az.piva ? "P.IVA " + az.piva : ""].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div class="tag">CONFERMA D'ORDINE</div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <div class="label">Cliente</div>
          <div class="value">${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</div>
          <div class="sub">${c.indirizzo || ""}</div>
          ${c.telefono ? `<div class="sub">${c.telefono}</div>` : ""}
          ${c.email ? `<div class="sub">${c.email}</div>` : ""}
          ${c.cf ? `<div class="cf-box">C.F. ${c.cf}</div>` : ""}
        </div>
        <div class="info-box">
          <div class="label">Riferimento ordine</div>
          <div class="value">${c.code || "—"}</div>
          <div class="sub">Data: ${new Date().toLocaleDateString("it-IT")}</div>
          ${c.sistema ? `<div class="sub">Sistema: ${c.sistema}</div>` : ""}
          ${c.detrazione && c.detrazione !== "nessuna" ? `<div class="sub" style="color:#D08008;font-weight:700">Detrazione: ${c.detrazione}%</div>` : ""}
        </div>
      </div>

      <div class="sezione-title">Descrizione lavori</div>
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Descrizione</th>
            <th class="num" style="width:40px">Q.tà</th>
            <th class="num" style="width:90px">Prezzo unit.</th>
            <th class="num" style="width:90px">Totale</th>
          </tr>
        </thead>
        <tbody>
          ${righeHTML}
          ${vociLibHTML}
        </tbody>
      </table>

      <div class="totali">
        ${scontoPerc > 0 ? `<div class="tot-row"><span>Subtotale</span><span>€ ${fmt(totBase)}</span></div><div class="tot-row" style="color:#D08008"><span>Sconto ${scontoPerc}%</span><span>− € ${fmt(sconto)}</span></div>` : ""}
        <div class="tot-row"><span>Imponibile</span><span>€ ${fmt(imponibile)}</span></div>
        <div class="tot-row"><span>IVA ${ivaPerc}%</span><span>€ ${fmt(iva)}</span></div>
        <div class="tot-final">
          <span>TOTALE IVA INCLUSA</span>
          <span>€ ${fmt(totIva)}</span>
        </div>
      </div>
      ${accontoHTML}

      ${condizioniHTML ? `<div class="sezione-title">Condizioni commerciali</div>${condizioniHTML}` : ""}
      ${noteHTML}

      <div class="sezione-title">Accettazione ordine</div>
      ${firmaHTML}
    </div>

    <div class="footer">
      ${az.ragione || az.nome || "MASTRO ERP"}${az.piva ? " · P.IVA " + az.piva : ""} · Documento generato il ${new Date().toLocaleString("it-IT")}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  return url;
}


// ─────────────────────────────────────────────────────────
// ESTRAI DATI DA PDF (conferma fornitore)
// Legge testo grezzo da un PDF caricato e restituisce
// un oggetto con i dati estratti per pre-compilare l'ordine
// ─────────────────────────────────────────────────────────
export async function estraiDatiPDF(file: File): Promise<Record<string, any>> {
  // Estrazione base: legge testo dal PDF usando FileReader
  // Per un'estrazione più precisa integrare pdf.js in futuro
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || "";

      // Pattern comuni in conferme d'ordine italiane
      const result: Record<string, any> = {
        rawText: text.slice(0, 2000),
        estratto: true,
      };

      // Importo totale
      const totMatch = text.match(/totale[:\s]+€?\s*([\d.,]+)/i);
      if (totMatch) result.importoTotale = parseFloat(totMatch[1].replace(".", "").replace(",", "."));

      // Data consegna
      const consMatch = text.match(/consegna[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
      if (consMatch) result.dataConsegna = consMatch[1];

      // Numero ordine/conferma
      const numMatch = text.match(/n[°.]\s*(\d+\/\d+|\d+)/i);
      if (numMatch) result.numeroRiferimento = numMatch[1];

      // Settimane consegna
      const settMatch = text.match(/(\d+)\s*settiman/i);
      if (settMatch) result.settimaneConsegna = parseInt(settMatch[1]);

      resolve(result);
    };
    reader.onerror = () => resolve({ errore: "Impossibile leggere il file", estratto: false });
    reader.readAsText(file, "utf-8");
  });
}
