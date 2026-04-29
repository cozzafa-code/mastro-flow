// lib/vetri-section.ts
// Parser composizione vetro stratigrafico: "4float+16argon+4BE" -> strati strutturati
// + generatore SVG sezione visualizzabile.

export interface StratoVetro {
  spessore: number      // mm
  tipo: 'float' | 'BE' | 'stratificato' | 'satinato' | 'cattedrale' | 'tempera' | 'aria' | 'argon' | 'kripton' | 'sconosciuto'
  isGas: boolean        // true se camera, false se lastra
  raw: string           // stringa originale es "4BE"
}

const PATTERN_GAS = /^(\d+(?:[.,]\d+)?)(aria|argon|kripton|gas|ar)$/i
const PATTERN_LASTRA = /^(\d+(?:[.,]\d+)?)([a-z]*)$/i

function parseStrato(raw: string): StratoVetro | null {
  const s = raw.trim()
  if (!s) return null

  // gas (camera)
  const mGas = PATTERN_GAS.exec(s)
  if (mGas) {
    const sp = parseFloat(mGas[1].replace(',', '.'))
    const t = mGas[2].toLowerCase()
    const tipo: StratoVetro['tipo'] =
      t.startsWith('argon') || t === 'ar' ? 'argon' :
      t.startsWith('krip') ? 'kripton' :
      'aria'
    return { spessore: sp, tipo, isGas: true, raw: s }
  }

  // lastra
  const mLastra = PATTERN_LASTRA.exec(s)
  if (mLastra) {
    const sp = parseFloat(mLastra[1].replace(',', '.'))
    const suffix = mLastra[2].toLowerCase()
    let tipo: StratoVetro['tipo'] = 'float'
    if (suffix.includes('strat')) tipo = 'stratificato'
    else if (suffix.includes('be')) tipo = 'BE'
    else if (suffix.includes('sat')) tipo = 'satinato'
    else if (suffix.includes('catt')) tipo = 'cattedrale'
    else if (suffix.includes('temp')) tipo = 'tempera'
    else if (suffix && suffix !== 'float' && suffix !== 'mm') tipo = 'sconosciuto'
    return { spessore: sp, tipo, isGas: false, raw: s }
  }

  return null
}

export function parseComposizione(composizione: string): StratoVetro[] {
  if (!composizione) return []
  return composizione
    .split(/[+\/]/)
    .map(s => parseStrato(s))
    .filter((x): x is StratoVetro => x !== null)
}

export function generaSvgVetro(strati: StratoVetro[], height = 200): string {
  if (strati.length === 0) {
    return '<svg viewBox="0 0 200 ' + height + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><text x="100" y="' + (height / 2) + '" text-anchor="middle" fill="#6B8585" font-size="11">Composizione non riconosciuta</text></svg>'
  }

  const totale = strati.reduce((s, x) => s + x.spessore, 0)
  const widthSvg = 200
  const labelArea = 60
  const drawArea = widthSvg - labelArea * 2
  const scaleX = drawArea / totale

  let x = labelArea
  const parts: string[] = []
  const labels: string[] = []

  strati.forEach((s, i) => {
    const w = s.spessore * scaleX
    const colore = coloreStrato(s)
    parts.push('<rect x="' + x.toFixed(2) + '" y="20" width="' + w.toFixed(2) + '" height="' + (height - 60) + '" fill="' + colore.fill + '" stroke="' + colore.stroke + '" stroke-width="0.8"/>')

    if (s.tipo === 'BE') {
      // banda emissiva sul lato interno
      parts.push('<rect x="' + x.toFixed(2) + '" y="20" width="' + Math.min(w, 1.5).toFixed(2) + '" height="' + (height - 60) + '" fill="#86CFE0" opacity="0.7"/>')
    }
    if (s.tipo === 'satinato' || s.tipo === 'cattedrale') {
      // texture
      const stripeId = 'tex' + i
      parts.unshift('<defs><pattern id="' + stripeId + '" patternUnits="userSpaceOnUse" width="3" height="3"><line x1="0" y1="0" x2="3" y2="3" stroke="#B0CCD9" stroke-width="0.5"/></pattern></defs>')
      parts.push('<rect x="' + x.toFixed(2) + '" y="20" width="' + w.toFixed(2) + '" height="' + (height - 60) + '" fill="url(#' + stripeId + ')"/>')
    }

    // etichetta sotto
    const cx = x + w / 2
    labels.push('<text x="' + cx.toFixed(2) + '" y="' + (height - 22) + '" text-anchor="middle" fill="#0F2A2A" font-size="9" font-weight="600">' + s.spessore + '</text>')
    labels.push('<text x="' + cx.toFixed(2) + '" y="' + (height - 10) + '" text-anchor="middle" fill="#6B8585" font-size="7">' + tipoLabel(s) + '</text>')

    x += w
  })

  // labels esterno/interno
  const labelEsterno = '<text x="6" y="' + (height / 2) + '" fill="#6B8585" font-size="9" font-weight="600">ESTERNO</text>'
  const labelInterno = '<text x="' + (widthSvg - 6) + '" y="' + (height / 2) + '" text-anchor="end" fill="#6B8585" font-size="9" font-weight="600">INTERNO</text>'

  // totale in alto
  const totaleLabel = '<text x="' + (widthSvg / 2) + '" y="14" text-anchor="middle" fill="#0F766E" font-size="10" font-weight="700">Sezione totale: ' + totale.toFixed(0) + ' mm</text>'

  return '<svg viewBox="0 0 ' + widthSvg + ' ' + height + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">'
    + totaleLabel + parts.join('') + labelEsterno + labelInterno + labels.join('') + '</svg>'
}

function coloreStrato(s: StratoVetro): { fill: string; stroke: string } {
  if (s.isGas) {
    if (s.tipo === 'argon') return { fill: '#E8F4F4', stroke: '#9DC8C8' }
    if (s.tipo === 'kripton') return { fill: '#E1ECEC', stroke: '#85B5B5' }
    return { fill: '#F4F8F8', stroke: '#C0D8D8' }
  }
  if (s.tipo === 'BE') return { fill: '#D6F0F8', stroke: '#5A8FA0' }
  if (s.tipo === 'stratificato') return { fill: '#C4E0F0', stroke: '#4A7090' }
  if (s.tipo === 'satinato' || s.tipo === 'cattedrale') return { fill: '#E0E8E8', stroke: '#7090A0' }
  if (s.tipo === 'tempera') return { fill: '#C8DCE0', stroke: '#5878A0' }
  return { fill: '#DCE8E8', stroke: '#7090A0' }
}

function tipoLabel(s: StratoVetro): string {
  if (s.isGas) return s.tipo
  if (s.tipo === 'BE') return 'BE'
  if (s.tipo === 'stratificato') return 'strat.'
  if (s.tipo === 'satinato') return 'sat.'
  if (s.tipo === 'cattedrale') return 'catt.'
  if (s.tipo === 'tempera') return 'temp.'
  if (s.tipo === 'float') return 'float'
  return ''
}
