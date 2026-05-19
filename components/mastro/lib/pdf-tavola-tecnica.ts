// ═══════════════════════════════════════════════════════════
// MASTRO ERP — generaTavolaTecnica
// PDF Tavola Tecnica per vano: disegno SVG + specifiche + Uw
// ═══════════════════════════════════════════════════════════

interface TavolaCtx {
  aziendaInfo: any;
  sistemiDB: any[];
  vetriDB: any[];
  cliente: string;
  cognome: string;
  commessaCode: string;
  commessaData: string;
}

// ── SVG semplificato per tipologia ───────────────────────────
const drawVanoSVG = (tipo: string, lmm: number, hmm: number): string => {
  const w = 160, h = Math.max(60, Math.min(200, Math.round(160 * (hmm / Math.max(lmm, 1)))));
  const p = 8;
  let inner = '';

  if (tipo.includes('SC') || tipo === 'ALZSC') {
    const mid = w / 2;
    inner = `<rect x="${p+4}" y="${p+4}" width="${mid-p-6}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.7"/>
    <rect x="${mid+2}" y="${p+4}" width="${mid-p-6}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.7"/>
    <rect x="${mid-8}" y="${h/2-8}" width="3" height="16" rx="1" fill="#666"/>
    <rect x="${mid+5}" y="${h/2-8}" width="3" height="16" rx="1" fill="#666"/>`;
  } else if (tipo.includes('2A') || tipo === 'PF2A') {
    const mid = w / 2;
    inner = `<line x1="${mid}" y1="${p+3}" x2="${mid}" y2="${h-p-3}" stroke="#333" stroke-width="1.5"/>
    <rect x="${p+4}" y="${p+4}" width="${mid-p-6}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>
    <rect x="${mid+2}" y="${p+4}" width="${mid-p-6}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>
    <circle cx="${mid-8}" cy="${h/2}" r="3" fill="none" stroke="#333" stroke-width="1"/>
    <circle cx="${mid+8}" cy="${h/2}" r="3" fill="none" stroke="#333" stroke-width="1"/>`;
  } else if (tipo === 'VAS' || tipo === 'SOPR') {
    inner = `<rect x="${p+4}" y="${p+4}" width="${w-p*2-8}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>
    <line x1="${p+4}" y1="${h-p-4}" x2="${w/2}" y2="${p+4}" stroke="#ccc" stroke-width="0.4"/>
    <line x1="${w-p-4}" y1="${h-p-4}" x2="${w/2}" y2="${p+4}" stroke="#ccc" stroke-width="0.4"/>`;
  } else if (tipo === 'FIS' || tipo === 'FISTONDO') {
    inner = `<rect x="${p+4}" y="${p+4}" width="${w-p*2-8}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>
    <text x="${w/2}" y="${h/2+4}" text-anchor="middle" font-size="10" fill="#999" font-style="italic">fisso</text>`;
  } else {
    inner = `<rect x="${p+4}" y="${p+4}" width="${w-p*2-8}" height="${h-p*2-8}" fill="#e8f0fe" stroke="#555" stroke-width="0.5"/>
    <line x1="${p+4}" y1="${p+4}" x2="${w-p-4}" y2="${h-p-4}" stroke="#ccc" stroke-width="0.4"/>
    <line x1="${w-p-4}" y1="${p+4}" x2="${p+4}" y2="${h-p-4}" stroke="#ccc" stroke-width="0.4"/>
    <circle cx="${w-p-12}" cy="${h/2}" r="4" fill="none" stroke="#333" stroke-width="1.2"/>`;
  }

  return `<svg viewBox="0 0 ${w+20} ${h+20}" width="${w+20}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${p}" y="${p}" width="${w}" height="${h}" rx="2" fill="#f5f8fc" stroke="#333" stroke-width="2.5"/>
    <rect x="${p+3}" y="${p+3}" width="${w-6}" height="${h-6}" rx="1" fill="none" stroke="#555" stroke-width="0.8"/>
    ${inner}
    <text x="${w/2}" y="${h+p+10}" text-anchor="middle" font-size="9" fill="#333" font-weight="700">${lmm} mm</text>
    <text x="${w+p+4}" y="${h/2+p+3}" text-anchor="start" font-size="9" fill="#333" font-weight="700" transform="rotate(90,${w+p+4},${h/2+p})">${hmm} mm</text>
  </svg>`;
};

// ── Funzione principale ───────────────────────────────────────
export const generaTavolaTecnica = (v: any, ctx: TavolaCtx): void => {
  const m = v.misure || {};
  const lmm = m.lCentro || m.lAlto || m.lBasso || 0;
  const hmm = m.hCentro || m.hSx || m.hDx || 0;
  const mq = lmm > 0 && hmm > 0 ? ((lmm / 1000) * (hmm / 1000)).toFixed(2) : '—';
  const oggi = new Date().toLocaleDateString('it-IT');

  const az = ctx.aziendaInfo || {};
  const sysRec = ctx.sistemiDB?.find((s: any) =>
    (s.marca + ' ' + s.sistema) === v.sistema || s.sistema === v.sistema
  );
  const vetroRec = ctx.vetriDB?.find((g: any) => g.code === v.vetro || g.nome === v.vetro);

  const TIPI_LABEL: Record<string, string> = {
    F1A: 'Finestra 1 anta', F2A: 'Finestra 2 ante', PF1A: 'Portafinestra 1 anta',
    PF2A: 'Portafinestra 2 ante', SC2A: 'Scorrevole 2 ante', SC4A: 'Scorrevole 4 ante',
    VAS: 'Vasistas', SOPR: 'Sopraluce', FIS: 'Fisso', ALZSC: 'Alzante scorrevole',
  };
  const tipoLabel = TIPI_LABEL[v.tipo || 'F1A'] || (v.tipo || 'Infisso');
  const uwVal = v.trasmittanzaUw || sysRec?.uw || '—';
  const colInt = v.coloreInt || v.coloreInterno || v.colore || 'Bianco';
  const colEst = v.coloreEst || v.coloreEsterno || v.colore || 'Bianco';
  const svg = drawVanoSVG(v.tipo || 'F1A', lmm, hmm);

  // Nodi costruttivi (se presenti)
  const nodi = v.nodi || sysRec?.nodi || [];
  const nodiHtml = nodi.length > 0
    ? `<div style="margin-top:16px">
        <div style="font-size:11px;font-weight:700;color:#444;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Nodi costruttivi</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${nodi.slice(0, 4).map((n: any) => `<div style="border:1px solid #ddd;border-radius:4px;padding:6px;text-align:center;min-width:80px">
            ${n.immagine ? `<img src="${n.immagine}" style="width:60px;height:45px;object-fit:contain;display:block;margin:0 auto 4px"/>` : '<div style="width:60px;height:45px;background:#f5f5f5;border-radius:3px;margin:0 auto 4px"></div>'}
            <div style="font-size:8px;color:#666">${n.nome || n.tipo || ''}</div>
          </div>`).join('')}
        </div>
      </div>`
    : '';

  // Controtelaio
  const ct = v.controtelaio;
  const ctHtml = ct && ct.sistema && ct.sistema !== 'nessuno'
    ? `<div style="margin-top:12px;padding:10px;background:#f0f8ff;border:1px solid #bee3f8;border-radius:6px">
        <div style="font-size:11px;font-weight:700;color:#2b6cb0;margin-bottom:6px">CONTROTELAIO ${(ct.tipo || ct.sistema || '').toUpperCase()}</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <tr>
            <td style="padding:3px 6px;border:1px solid #bee3f8">Larghezza</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8;font-weight:700">${ct.l || lmm} mm</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8">Altezza</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8;font-weight:700">${ct.h || hmm} mm</td>
          </tr>
          ${ct.hCass ? `<tr>
            <td style="padding:3px 6px;border:1px solid #bee3f8">H Cassonetto</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8;font-weight:700">${ct.hCass} mm</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8">Sezione</td>
            <td style="padding:3px 6px;border:1px solid #bee3f8;font-weight:700">${ct.sezione || '—'}</td>
          </tr>` : ''}
        </table>
      </div>`
    : '';

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/>
<title>Tavola Tecnica — ${v.nome || 'Vano'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:12mm 10mm 15mm 10mm}
body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1c;font-size:10px;line-height:1.4;background:#fff}
.pg{max-width:210mm;margin:0 auto;padding:12px 16px}
.pb{display:block;margin:0 auto 14px;padding:9px 24px;background:#1A9E73;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
@media print{.pb{display:none!important}}
.hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;margin-bottom:14px;border-bottom:3px solid #1A9E73}
.an{font-size:18px;font-weight:900;color:#1A9E73}
.ai{font-size:9px;color:#555;line-height:1.6}
.tit{font-size:20px;font-weight:900;color:#1a1a1c;margin-bottom:2px}
.sub{font-size:11px;color:#666}
table.sp{border-collapse:collapse;width:100%}
table.sp td{padding:4px 8px;font-size:10px;border:1px solid #e0e0e0;vertical-align:top}
table.sp td:first-child{color:#666;background:#f9f9f9;white-space:nowrap;width:130px}
table.sp td b{color:#1a1a1c;font-weight:700}
.uw{display:inline-block;padding:6px 16px;border-radius:8px;font-size:22px;font-weight:900;
  background:${parseFloat(uwVal) <= 1.2 ? '#d8f2ec' : parseFloat(uwVal) <= 1.6 ? '#fef3c7' : '#fee2e2'};
  color:${parseFloat(uwVal) <= 1.2 ? '#0a5a3a' : parseFloat(uwVal) <= 1.6 ? '#7a4800' : '#8a1818'}}
</style></head><body>
<div class="pg">
<button class="pb" onclick="window.print()">&#128438; Stampa / Salva PDF</button>

<div class="hd">
  <div>
    ${az.logo ? `<img src="${az.logo}" style="height:40px;max-width:100px;object-fit:contain;margin-bottom:6px;display:block" alt=""/>` : ''}
    <div class="an">${az.ragione || 'La Tua Azienda'}</div>
    <div class="ai">${az.indirizzo || ''}${az.telefono ? ' · Tel. ' + az.telefono : ''}${az.piva ? '<br/>P.IVA ' + az.piva : ''}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:11px;color:#666">Commessa <b>${ctx.commessaCode}</b></div>
    <div style="font-size:11px;color:#666">Cliente <b>${ctx.cliente} ${ctx.cognome}</b></div>
    <div style="font-size:11px;color:#666">Data <b>${oggi}</b></div>
  </div>
</div>

<div style="display:flex;gap:20px;margin-bottom:16px;align-items:flex-start">
  <div style="flex-shrink:0;text-align:center">
    ${svg}
    <div style="font-size:9px;color:#999;margin-top:4px;font-style:italic">Vista interna</div>
    <div style="font-size:11px;font-weight:700;color:#333;margin-top:4px">${tipoLabel}</div>
    <div style="font-size:10px;color:#666">${v.stanza || ''}${v.piano ? ' · ' + v.piano : ''}</div>
  </div>
  <div style="flex:1">
    <div class="tit">${v.nome || 'Vano'}</div>
    <div class="sub" style="margin-bottom:12px">${lmm} × ${hmm} mm · ${mq} m²</div>
    <table class="sp">
      <tr><td>Sistema</td><td><b>${sysRec ? (sysRec.marca ? sysRec.marca + ' ' + sysRec.sistema : sysRec.sistema) : (v.sistema || '—')}</b></td></tr>
      <tr><td>Colore interno</td><td><b>${colInt}</b></td></tr>
      <tr><td>Colore esterno</td><td><b>${colEst}</b></td></tr>
      ${v.bicolore ? `<tr><td>Finitura</td><td><b>Bicolore</b></td></tr>` : ''}
      <tr><td>Vetro</td><td><b>${vetroRec ? (vetroRec.code + (vetroRec.nome ? ' ' + vetroRec.nome : '')) : (v.vetro || '—')}</b></td></tr>
      ${v.maniglia ? `<tr><td>Martellina</td><td><b>${v.maniglia}</b></td></tr>` : ''}
      ${v.telaio ? `<tr><td>Telaio fisso</td><td><b>${v.telaio}</b></td></tr>` : ''}
      ${v.telaioAlaZ ? `<tr><td>Telaio mobile</td><td><b>${v.telaioAlaZ}</b></td></tr>` : ''}
      <tr><td>Superficie</td><td><b>${mq} m²</b></td></tr>
      ${v.pezzi > 1 ? `<tr><td>Pezzi</td><td><b>${v.pezzi}</b></td></tr>` : ''}
      ${v.note ? `<tr><td>Note</td><td>${v.note}</td></tr>` : ''}
    </table>

    <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
      <div>
        <div style="font-size:9px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Trasmittanza termica</div>
        <span class="uw">Uw = ${uwVal} W/m²K</span>
      </div>
      ${sysRec?.euroMq ? `<div style="margin-left:auto;text-align:right"><div style="font-size:9px;color:#666;margin-bottom:2px">Prezzo base</div><div style="font-size:14px;font-weight:700">&#8364;${sysRec.euroMq}/m²</div></div>` : ''}
    </div>

    ${ctHtml}
  </div>
</div>

${nodiHtml}

<div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-end">
  <div style="font-size:8px;color:#aaa">Documento generato con MASTRO ERP · ${oggi}</div>
  <div style="font-size:8px;color:#aaa">${ctx.commessaCode} · ${v.nome || 'Vano'}</div>
</div>

</div></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};
