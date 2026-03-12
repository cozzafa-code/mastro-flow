// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-condivisibile.ts
// Preventivo condivisibile (link HTML), estrai dati da PDF
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// PREVENTIVO CONDIVISIBILE
// Genera pagina HTML standalone che il cliente può vedere
// via link (blob URL aperto in nuova tab)
// ─────────────────────────────────────────────────────────
export async function generaPreventivoCondivisibile(c: any, ctx: any) {
  const { aziendaInfo, calcolaVanoPrezzo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map((v: any) => ({
    ...v,
    prezzo: calcolaVanoPrezzo(v, c),
  }));

  const totBase = vaniCalc.reduce((s: number, v: any) => s + v.prezzo * (v.pezzi || 1), 0)
    + (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);

  const sconto = totBase * parseFloat(c.sconto || 0) / 100;
  const imponibile = totBase - sconto;
  const iva = imponibile * 0.10;
  const totIva = imponibile + iva;
  const acconto = parseFloat(c.accontoRicevuto || 0);

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2 });

  const righeHTML = vaniCalc.map((v: any, i: number) => {
    const m = v.misure || {};
    const desc = [
      v.nome || `Vano ${i + 1}`,
      v.tipo || "",
      m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro}mm` : "",
      v.sistema || v.modello || "",
    ].filter(Boolean).join(" · ");

    return `
    <tr>
      <td>${i + 1}</td>
      <td>${desc}</td>
      <td class="num">${v.pezzi || 1}</td>
      <td class="num">€ ${fmt(v.prezzo)}</td>
      <td class="num bold">€ ${fmt(v.prezzo * (v.pezzi || 1))}</td>
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

  const firmaHTML = c.firmaCliente ? `
    <div class="firma-box">
      <div class="label">FIRMATO DA</div>
      <p>${c.cliente}${c.cognome ? " " + c.cognome : ""} · ${c.dataFirma || ""}</p>
      <img src="${c.firmaCliente}" alt="Firma" style="max-height:60px;margin-top:8px;border:1px solid #e5e5ea;border-radius:8px;padding:4px;" />
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preventivo ${c.code || ""} — ${az.nome || "MASTRO"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Inter', sans-serif; background: #F2F1EC; padding: 24px 16px; color: #1A1A1C; }
    .card { background: #fff; border-radius: 20px; max-width: 680px; margin: 0 auto; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
    .topbar { background: #1A1A1C; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .logo-wrap { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; background: #D08008; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: #1A1A1C; }
    .az-nome { color: #fff; font-size: 15px; font-weight: 700; }
    .az-sub { color: #86868b; font-size: 11px; margin-top: 2px; }
    .tag { background: #D08008; color: #1A1A1C; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 20px; }
    .body { padding: 28px 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
    .info-box { background: #F2F1EC; border-radius: 12px; padding: 16px; }
    .label { font-size: 10px; font-weight: 700; color: #86868b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .info-box .value { font-size: 15px; font-weight: 700; }
    .info-box .sub { font-size: 12px; color: #86868b; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #1A1A1C; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; }
    th.num, td.num { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafafa; }
    .bold { font-weight: 700; }
    .totali { margin-top: 20px; }
    .tot-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .tot-row:last-child { border-bottom: none; }
    .tot-final { background: #1A1A1C; color: #fff; border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; margin-top: 8px; font-size: 16px; font-weight: 800; }
    .note-box { background: #F2F1EC; border-radius: 10px; padding: 14px; margin-top: 20px; font-size: 13px; line-height: 1.6; }
    .firma-box { background: #f0fdf4; border: 1px solid #34c759; border-radius: 10px; padding: 14px; margin-top: 20px; }
    .firma-box p { font-size: 13px; color: #166534; font-weight: 600; }
    .footer { padding: 16px 24px; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #86868b; }
    @media (max-width: 480px) { .info-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="topbar">
      <div class="logo-wrap">
        <div class="logo">M</div>
        <div>
          <div class="az-nome">${az.nome || "MASTRO ERP"}</div>
          <div class="az-sub">${[az.indirizzo, az.piva ? "P.IVA " + az.piva : ""].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div class="tag">PREVENTIVO</div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <div class="label">Cliente</div>
          <div class="value">${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</div>
          <div class="sub">${c.indirizzo || ""}</div>
          <div class="sub">${c.telefono || ""}</div>
        </div>
        <div class="info-box">
          <div class="label">Preventivo N°</div>
          <div class="value">${c.code || "—"}</div>
          <div class="sub">Data: ${new Date().toLocaleDateString("it-IT")}</div>
          <div class="sub">Validità: 30 giorni</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Descrizione</th>
            <th class="num">Q.tà</th>
            <th class="num">Prezzo unit.</th>
            <th class="num">Totale</th>
          </tr>
        </thead>
        <tbody>
          ${righeHTML}
          ${vociLibHTML}
        </tbody>
      </table>

      <div class="totali">
        ${parseFloat(c.sconto || 0) > 0 ? `<div class="tot-row"><span>Sconto ${c.sconto}%</span><span>− € ${fmt(sconto)}</span></div>` : ""}
        <div class="tot-row"><span>Imponibile</span><span>€ ${fmt(imponibile)}</span></div>
        <div class="tot-row"><span>IVA 10%</span><span>€ ${fmt(iva)}</span></div>
        <div class="tot-final">
          <span>TOTALE IVA INCLUSA</span>
          <span>€ ${fmt(totIva)}</span>
        </div>
        ${acconto > 0 ? `<div class="tot-row" style="color:#34c759;font-weight:600"><span>Saldo da pagare</span><span>€ ${fmt(totIva - acconto)}</span></div>` : ""}
      </div>

      ${c.notePreventivo ? `<div class="note-box"><div class="label">Note</div>${c.notePreventivo}</div>` : ""}
      ${firmaHTML}
    </div>

    <div class="footer">
      Documento generato da MASTRO ERP · ${new Date().toLocaleString("it-IT")}
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
