// lib/pdf/disegnoVanoSVG.ts
// Renderizza il disegno tecnico del vano in SVG a partire da cad_json o misure_json.
// Output SVG string → poi convertibile in PNG via canvas per embed in jsPDF.

export interface VanoPerDisegno {
  id: string;
  nome?: string | null;
  misure_json?: any;
  cad_json?: any;
  tipo?: string | null;
  vetro_config?: any;
}

interface Misure {
  L: number; // larghezza totale in mm
  H: number; // altezza totale in mm
}

function estraiMisure(v: VanoPerDisegno): Misure | null {
  const m = v.misure_json || {};
  // prova varie chiavi comuni
  const L = Number(m.L || m.larghezza || m.base || m.width);
  const H = Number(m.H || m.altezza || m.height);
  if (!L || !H || isNaN(L) || isNaN(H)) return null;
  return { L, H };
}

// Costruisce SVG stringa dimensionato a viewBox in mm.
// Disegna: telaio esterno + divisioni ante + quote.
export function buildSVGVano(v: VanoPerDisegno, opts?: {
  width?: number;   // pixel larghezza output (default 400)
  showQuote?: boolean;
  tkTelaio?: number; // spessore telaio
  tkAnta?: number;
}): string {
  const tkTelaio = opts?.tkTelaio ?? 70;
  const tkAnta = opts?.tkAnta ?? 90;
  const showQuote = opts?.showQuote !== false;

  const m = estraiMisure(v);
  if (!m) return fallbackSVG(v);
  const { L, H } = m;

  // viewBox con spazio per quote (100mm margine sotto + 80mm a sx)
  const mLeft = 80;
  const mRight = 20;
  const mTop = 25;
  const mBottom = 75;

  const vbW = L + mLeft + mRight;
  const vbH = H + mTop + mBottom;

  // Numero ante: dal tipo o default
  const numAnte = parseAnte(v.tipo) || 2;

  // Tipo apertura (per frecce)
  const tipi = (v.tipo || '').toLowerCase();
  const hasAnta = tipi.includes('anta') || tipi.includes('battente') || tipi.includes('f2a') || tipi.includes('f1a');
  const hasScorrevole = tipi.includes('scorr');

  const svg: string[] = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" width="${opts?.width ?? 400}" font-family="Helvetica, Arial, sans-serif">`);

  // Sfondo
  svg.push(`<rect width="${vbW}" height="${vbH}" fill="#FFFFFF"/>`);

  // Telaio esterno (rettangolo)
  const fx = mLeft;
  const fy = mTop;
  svg.push(`<rect x="${fx}" y="${fy}" width="${L}" height="${H}" fill="none" stroke="#0D1F1F" stroke-width="4"/>`);

  // Telaio interno (spessore)
  svg.push(`<rect x="${fx + tkTelaio}" y="${fy + tkTelaio}" width="${L - 2 * tkTelaio}" height="${H - 2 * tkTelaio}" fill="none" stroke="#28A0A0" stroke-width="2"/>`);

  // Ante (divisione verticale)
  const innerX = fx + tkTelaio;
  const innerY = fy + tkTelaio;
  const innerW = L - 2 * tkTelaio;
  const innerH = H - 2 * tkTelaio;

  if (numAnte === 2) {
    const cx = innerX + innerW / 2;
    // divisore centrale (montante)
    svg.push(`<rect x="${cx - tkAnta / 2}" y="${innerY}" width="${tkAnta}" height="${innerH}" fill="#EEF8F8" stroke="#28A0A0" stroke-width="1"/>`);

    if (hasAnta) {
      // frecce apertura anta: triangoli ai lati
      svg.push(disegnaFrecciaAnta(innerX, innerY, cx - tkAnta / 2 - innerX, innerH, 'sx'));
      svg.push(disegnaFrecciaAnta(cx + tkAnta / 2, innerY, innerX + innerW - (cx + tkAnta / 2), innerH, 'dx'));
    } else if (hasScorrevole) {
      svg.push(`<text x="${innerX + 30}" y="${innerY + innerH / 2 + 4}" font-size="60" fill="#28A0A0">→</text>`);
      svg.push(`<text x="${cx + tkAnta}" y="${innerY + innerH / 2 + 4}" font-size="60" fill="#28A0A0">←</text>`);
    }
  } else if (numAnte === 1) {
    if (hasAnta) svg.push(disegnaFrecciaAnta(innerX, innerY, innerW, innerH, 'sx'));
  } else if (numAnte >= 3) {
    for (let i = 1; i < numAnte; i++) {
      const cx = innerX + (innerW * i) / numAnte;
      svg.push(`<rect x="${cx - tkAnta / 2}" y="${innerY}" width="${tkAnta}" height="${innerH}" fill="#EEF8F8" stroke="#28A0A0" stroke-width="1"/>`);
    }
  }

  if (showQuote) {
    // Quota larghezza (sotto)
    const qy = mTop + H + 25;
    svg.push(`<line x1="${fx}" y1="${qy}" x2="${fx + L}" y2="${qy}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<line x1="${fx}" y1="${qy - 6}" x2="${fx}" y2="${qy + 6}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<line x1="${fx + L}" y1="${qy - 6}" x2="${fx + L}" y2="${qy + 6}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<text x="${fx + L / 2}" y="${qy + 22}" text-anchor="middle" font-size="28" font-weight="bold" fill="#0D1F1F">${L} mm</text>`);

    // Quota altezza (sinistra)
    const qx = mLeft - 25;
    svg.push(`<line x1="${qx}" y1="${fy}" x2="${qx}" y2="${fy + H}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<line x1="${qx - 6}" y1="${fy}" x2="${qx + 6}" y2="${fy}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<line x1="${qx - 6}" y1="${fy + H}" x2="${qx + 6}" y2="${fy + H}" stroke="#0D1F1F" stroke-width="1.5"/>`);
    svg.push(`<text x="${qx - 10}" y="${fy + H / 2}" text-anchor="end" font-size="28" font-weight="bold" fill="#0D1F1F" transform="rotate(-90 ${qx - 10} ${fy + H / 2})">${H} mm</text>`);

    // Quota interna larghezza
    svg.push(`<text x="${fx + L / 2}" y="${fy + H / 2 - 5}" text-anchor="middle" font-size="22" fill="#6A8484">luce ${L - 2 * tkTelaio} × ${H - 2 * tkTelaio}</text>`);
  }

  // Tipo etichetta in alto
  if (v.tipo) {
    svg.push(`<text x="${fx}" y="${fy - 8}" font-size="22" fill="#28A0A0" font-weight="bold">${v.tipo}</text>`);
  }

  svg.push('</svg>');
  return svg.join('\n');
}

function disegnaFrecciaAnta(x: number, y: number, w: number, h: number, cerniera: 'sx' | 'dx'): string {
  if (cerniera === 'sx') {
    // Diagonali convergenti su angolo alto-sx
    return `
      <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h / 2}" stroke="#28A0A0" stroke-width="1" opacity="0.6"/>
      <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h / 2}" stroke="#28A0A0" stroke-width="1" opacity="0.6"/>
    `;
  }
  return `
    <line x1="${x + w}" y1="${y}" x2="${x}" y2="${y + h / 2}" stroke="#28A0A0" stroke-width="1" opacity="0.6"/>
    <line x1="${x + w}" y1="${y + h}" x2="${x}" y2="${y + h / 2}" stroke="#28A0A0" stroke-width="1" opacity="0.6"/>
  `;
}

function parseAnte(tipo?: string | null): number {
  if (!tipo) return 2;
  const t = tipo.toLowerCase();
  if (t.includes('f1')) return 1;
  if (t.includes('f2')) return 2;
  if (t.includes('f3')) return 3;
  if (t.includes('f4')) return 4;
  const m = t.match(/(\d+)\s*ant/);
  if (m) return parseInt(m[1]);
  return 2;
}

function fallbackSVG(v: VanoPerDisegno): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" font-family="Helvetica, Arial, sans-serif">
  <rect width="400" height="300" fill="#FFFFFF"/>
  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#C8E4E4" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="200" y="150" text-anchor="middle" font-size="14" fill="#6A8484">Misure non disponibili</text>
  <text x="200" y="170" text-anchor="middle" font-size="11" fill="#6A8484">${v.nome || v.id}</text>
</svg>`.trim();
}

// Server-side: converte SVG in PNG dataURL usando sharp/svg2png. 
// Client-side: usa Image + canvas. Firma comune per il chiamante.
export async function svgToPngDataUrl(svg: string, widthPx = 800): Promise<string> {
  if (typeof window !== 'undefined') {
    // Browser path
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = img.height / img.width;
        canvas.width = widthPx;
        canvas.height = Math.round(widthPx * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas ctx'));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    });
  }
  // Node path: usa sharp (dev dep da installare: npm i sharp)
  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(Buffer.from(svg)).resize({ width: widthPx }).png().toBuffer();
    return 'data:image/png;base64,' + png.toString('base64');
  } catch (e) {
    // Fallback: senza sharp ritorniamo SVG embedded in data URI (jsPDF.addSvg non è affidabile, lasciamo vuoto)
    throw new Error('sharp non disponibile per conversione SVG→PNG server-side: ' + (e as any).message);
  }
}
