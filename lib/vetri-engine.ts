// lib/vetri-engine.ts
// Motore calcoli vetri stratigrafici - estratto da CostruttoreVetri desktop.
// Calcoli: EN 673 (Ug), EN 410 (g, TL), EN 12758 (Rw acustico)
// Riferimenti: UNI 7697 (sicurezza), DM 26/06/2015 (zone climatiche)

export type LayerType = 'vetro' | 'pvb' | 'canalina'

export interface VetroLayer {
  id: string
  tipo: LayerType
  spessore: number
  vetro_tipo?: 'float' | 'temperato' | 'basso_emissivo' | 'selettivo'
  gas?: 'aria' | 'argon' | 'kripton'
  canalina_tipo?: 'alluminio' | 'warm_edge' | 'super_spacer'
}

export interface VetroCalc {
  sp: number          // spessore totale mm
  peso: number        // kg/m2
  Ug: number          // W/m2K
  g: number           // fattore solare 0-1
  TL: number          // trasmissione luminosa 0-1
  Rw: number          // abbattimento acustico dB
  rwC: { cl: string; d: string }   // classe acustica
  psi: number         // psi bordo W/mK
  comp: string        // stringa composizione es "4BE/16/4"
  hasSic: boolean     // ha vetro di sicurezza
  detr: boolean       // idoneo detrazioni fiscali (Ug<=1.1)
  tips: string[]      // consigli intelligenti
  nV: number          // num lastre
  nC: number          // num camere
  nP: number          // num pvb
}

export interface ZonaClimatica {
  z: string; c: string; uw: number; ug: number
}

const EMISSIVITY: Record<string, number> = {
  float: 0.837, temperato: 0.837, basso_emissivo: 0.04, selettivo: 0.03,
}
const SOLAR_FACTOR: Record<string, number> = {
  float: 0.87, temperato: 0.85, basso_emissivo: 0.63, selettivo: 0.42,
}
const LIGHT_TX: Record<string, number> = {
  float: 0.90, temperato: 0.89, basso_emissivo: 0.80, selettivo: 0.70,
}
const GAS_L: Record<string, number> = {
  aria: 0.025, argon: 0.0162, kripton: 0.0093,
}
const PSI_SP: Record<string, number> = {
  alluminio: 0.08, warm_edge: 0.04, super_spacer: 0.03,
}

export const ZONE_CLIMATICHE: ZonaClimatica[] = [
  { z: 'A', c: 'Lampedusa, Pantelleria', uw: 4.6, ug: 2.5 },
  { z: 'B', c: 'Agrigento, Catania, Messina, Palermo, Reggio C., Siracusa, Trapani', uw: 3.0, ug: 1.7 },
  { z: 'C', c: 'Bari, Cagliari, Cosenza, Latina, Lecce, Napoli, Taranto', uw: 2.0, ug: 1.3 },
  { z: 'D', c: 'Firenze, Genova, Pescara, Roma, Sassari', uw: 1.8, ug: 1.1 },
  { z: 'E', c: 'Bologna, Milano, Torino, Venezia, Verona, Padova, Trieste', uw: 1.4, ug: 1.0 },
  { z: 'F', c: "Belluno, Cuneo, Trento, Bolzano, L'Aquila", uw: 1.0, ug: 0.7 },
]

const RWC = [
  { min: 0, max: 29, cl: '1', d: 'Scarso' },
  { min: 29, max: 32, cl: '2', d: 'Base' },
  { min: 32, max: 35, cl: '3', d: 'Medio' },
  { min: 35, max: 40, cl: '4', d: 'Buono' },
  { min: 40, max: 45, cl: '5', d: 'Ottimo' },
  { min: 45, max: 99, cl: '6', d: 'Eccellente' },
]

export interface VetroPreset { n: string; l: Omit<VetroLayer, 'id'>[] }
export const PRESETS: VetroPreset[] = [
  { n: '4/16/4 Base', l: [
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
    { tipo: 'canalina', spessore: 16, gas: 'aria', canalina_tipo: 'alluminio' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
  ] },
  { n: '4BE/16Ar/4 Low-E', l: [
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'basso_emissivo' },
    { tipo: 'canalina', spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
  ] },
  { n: '6BE/16Ar/6 Acustico', l: [
    { tipo: 'vetro', spessore: 6, vetro_tipo: 'basso_emissivo' },
    { tipo: 'canalina', spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 6, vetro_tipo: 'float' },
  ] },
  { n: '44.2/16Ar/4BE Sicurezza', l: [
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
    { tipo: 'pvb', spessore: 0.76 },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
    { tipo: 'canalina', spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'basso_emissivo' },
  ] },
  { n: '4BE/14Ar/4/14Ar/4BE Triplo', l: [
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'basso_emissivo' },
    { tipo: 'canalina', spessore: 14, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
    { tipo: 'canalina', spessore: 14, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'basso_emissivo' },
  ] },
  { n: '33.1/16/33.1 Antinfortunio', l: [
    { tipo: 'vetro', spessore: 3, vetro_tipo: 'float' },
    { tipo: 'pvb', spessore: 0.38 },
    { tipo: 'vetro', spessore: 3, vetro_tipo: 'float' },
    { tipo: 'canalina', spessore: 16, gas: 'aria', canalina_tipo: 'alluminio' },
    { tipo: 'vetro', spessore: 3, vetro_tipo: 'float' },
    { tipo: 'pvb', spessore: 0.38 },
    { tipo: 'vetro', spessore: 3, vetro_tipo: 'float' },
  ] },
  { n: '6T/16Ar/6T Temperato', l: [
    { tipo: 'vetro', spessore: 6, vetro_tipo: 'temperato' },
    { tipo: 'canalina', spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 6, vetro_tipo: 'temperato' },
  ] },
  { n: '4S/16Ar/4 Selettivo solare', l: [
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'selettivo' },
    { tipo: 'canalina', spessore: 16, gas: 'argon', canalina_tipo: 'warm_edge' },
    { tipo: 'vetro', spessore: 4, vetro_tipo: 'float' },
  ] },
]

export function buildComposizione(ls: VetroLayer[]): string {
  const p: string[] = []
  let i = 0
  while (i < ls.length) {
    if (ls[i].tipo === 'vetro') {
      let lb = String(ls[i].spessore)
      if (ls[i].vetro_tipo === 'basso_emissivo') lb += 'BE'
      if (ls[i].vetro_tipo === 'selettivo') lb += 'S'
      if (ls[i].vetro_tipo === 'temperato') lb += 'T'
      if (i + 2 < ls.length && ls[i + 1].tipo === 'pvb' && ls[i + 2].tipo === 'vetro') {
        let sl = lb, j = i + 1
        while (j < ls.length - 1 && ls[j].tipo === 'pvb' && ls[j + 1].tipo === 'vetro') {
          let nl = String(ls[j + 1].spessore)
          if (ls[j + 1].vetro_tipo === 'basso_emissivo') nl += 'BE'
          if (ls[j + 1].vetro_tipo === 'selettivo') nl += 'S'
          if (ls[j + 1].vetro_tipo === 'temperato') nl += 'T'
          sl += nl
          j += 2
        }
        p.push(sl + '.' + Math.round(ls[i + 1].spessore * 10 / 3.8))
        i = j
      } else { p.push(lb); i++ }
    } else if (ls[i].tipo === 'canalina') {
      p.push(String(ls[i].spessore)); i++
    } else i++
  }
  return p.join('/')
}

export function calcolaVetro(layers: VetroLayer[]): VetroCalc | null {
  if (!layers.length) return null

  const sp = layers.reduce((s, l) => s + l.spessore, 0)
  const peso = layers.reduce((w, l) =>
    l.tipo === 'vetro' ? w + (l.spessore / 1000) * 2500 :
    l.tipo === 'pvb' ? w + (l.spessore / 1000) * 1100 : w, 0)

  const vetri = layers.filter(l => l.tipo === 'vetro')
  const cam = layers.filter(l => l.tipo === 'canalina')
  const pvbs = layers.filter(l => l.tipo === 'pvb')

  // Ug (EN 673 simplified)
  let Ug = 5.8
  if (cam.length > 0 && vetri.length >= 2) {
    let R = 0.13 + 0.04
    vetri.forEach(v => { R += (v.spessore / 1000) / 1.0 })
    cam.forEach(c => {
      const s = c.spessore / 1000
      const lam = GAS_L[c.gas || 'aria'] || 0.025
      const idx = layers.indexOf(c)
      const gL = layers.slice(0, idx).reverse().find(x => x.tipo === 'vetro')
      const gR = layers.slice(idx + 1).find(x => x.tipo === 'vetro')
      const e1 = EMISSIVITY[gL?.vetro_tipo || 'float'] || 0.837
      const e2 = EMISSIVITY[gR?.vetro_tipo || 'float'] || 0.837
      const eEff = 1 / (1 / e1 + 1 / e2 - 1)
      const hr = 4 * 5.67e-8 * Math.pow(283, 3) * eEff
      const Nu = Math.max(1, 0.035 * Math.pow(s * 1000, 0.38))
      const hg = Nu * lam / s
      R += 1 / (hg + hr)
    })
    Ug = 1 / R
  }
  Ug = Math.round(Ug * 100) / 100

  // g solare (EN 410)
  let g = vetri.reduce((a, v) => a * (SOLAR_FACTOR[v.vetro_tipo || 'float'] || 0.87), 1)
  g *= Math.pow(0.95, pvbs.length) * Math.pow(0.97, cam.length)
  g = Math.round(g * 100) / 100

  // TL (EN 410)
  let TL = vetri.reduce((a, v) => a * (LIGHT_TX[v.vetro_tipo || 'float'] || 0.90), 1)
  TL *= Math.pow(0.98, pvbs.length) * Math.pow(0.99, cam.length)
  TL = Math.round(TL * 100) / 100

  // Rw (EN 12758)
  let Rw = peso > 0 ? 20 * Math.log10(peso) + 12 : 25
  const spV = vetri.map(v => v.spessore)
  if (spV.length >= 2 && new Set(spV).size > 1) Rw += 2
  if (pvbs.length > 0) Rw += 3 * pvbs.length
  cam.forEach(c => { if (c.spessore >= 16) Rw += 1 })
  Rw = Math.round(Math.min(52, Math.max(25, Rw)))
  const rwC = RWC.find(c => Rw >= c.min && Rw < c.max) || RWC[0]

  const psi = cam.length
    ? cam.reduce((s, c) => s + (PSI_SP[c.canalina_tipo || 'alluminio'] || 0.08), 0) / cam.length
    : 0
  const comp = buildComposizione(layers)
  const hasSic = pvbs.length > 0 || vetri.some(v => v.vetro_tipo === 'temperato')
  const detr = Ug <= 1.1

  // Consigli intelligenti
  const tips: string[] = []
  if (Ug > 1.4) tips.push('Per zona E/F (Milano, Torino, Bologna) serve Ug piu basso. Aggiungi vetro basso emissivo + argon.')
  if (Ug > 2.0 && cam.length > 0) tips.push('Ug troppo alto per detrazioni fiscali. Obiettivo: Ug <= 1.0-1.1 W/m2K.')
  if (cam.some(c => c.canalina_tipo === 'alluminio')) tips.push('Canalina alluminio = ponte termico. Warm Edge riduce condensa sul bordo e migliora Uw di 0.1-0.2 W/m2K. Costa pochi EUR in piu.')
  if (cam.some(c => c.gas === 'aria') && cam.length > 0) tips.push('Sostituire aria con argon migliora Ug di 0.2-0.3 W/m2K. Il costo aggiuntivo si recupera in bolletta in 1-2 anni.')
  if (g > 0.5 && !vetri.some(v => v.vetro_tipo === 'selettivo')) tips.push('Fattore solare g=' + g + ' alto. Per finestre esposte a sud/ovest usa vetro selettivo: riduce surriscaldamento estivo del 30-40%.')
  if (Rw < 33) tips.push('Abbattimento acustico Rw=' + Rw + 'dB insufficiente per zone trafficate. Usa spessori asimmetrici (es. 6/16/4) o aggiungi PVB acustico (+3dB per foglio).')
  if (sp > 44) tips.push('Spessore ' + sp + 'mm elevato. Verificare compatibilita con fermavetro del profilo (tipico max 44-48mm).')
  if (vetri.length === 1) tips.push('Vetro singolo non idoneo per serramenti esterni. Obbligatorio minimo doppio vetro camera (DM 26/06/2015).')
  if (!vetri.some(v => v.vetro_tipo === 'basso_emissivo' || v.vetro_tipo === 'selettivo') && cam.length > 0) tips.push('Nessun vetro basso emissivo. Una lastra Low-E migliora Ug del 40-50% senza costo significativo. E lo standard minimo oggi.')
  if (!hasSic) tips.push('Nessuna lastra di sicurezza (stratificato/temperato). Per altezza caduta >1m, porte-finestra, e bagni serve vetro di sicurezza (UNI 7697:2014).')
  if (cam.length >= 2 && !vetri.some(v => v.vetro_tipo === 'basso_emissivo')) tips.push('Triplo vetro senza Low-E ha senso limitato. Aggiungi almeno una lastra basso emissivo per ottenere Ug < 0.8.')
  if (cam.some(c => c.gas === 'kripton')) tips.push('Kripton ottimo per prestazioni (+15% vs argon) ma costoso. Ideale per tripli vetri con camere strette (10-12mm).')
  if (detr) tips.push('Questo vetro e idoneo per detrazioni fiscali Ecobonus 50%/65% e Superbonus. Ug=' + Ug + ' <= 1.1 W/m2K.')

  return {
    sp,
    peso: Math.round(peso * 10) / 10,
    Ug, g, TL, Rw, rwC,
    psi: Math.round(psi * 1000) / 1000,
    comp, hasSic, detr, tips,
    nV: vetri.length, nC: cam.length, nP: pvbs.length,
  }
}

// SVG sezione: identica al desktop, scale 3x, height 50*S
export function generaSvgSezione(layers: VetroLayer[], scale = 3): string {
  if (!layers.length) return ''
  const S = scale
  const totalW = layers.reduce((s, l) => s + Math.max(l.spessore * S, l.tipo === 'pvb' ? 3 : 0), 0)
  const H = 50 * S
  let x = 0
  const p: string[] = []

  layers.forEach(l => {
    const w = Math.max(l.spessore * S, l.tipo === 'pvb' ? 3 : 0)
    if (l.tipo === 'canalina') {
      const bH = 4 * S
      const fillC = l.gas === 'argon' ? '#E0E8FF' : l.gas === 'kripton' ? '#E8E0FF' : '#F0F0F0'
      p.push('<rect x="' + x + '" y="0" width="' + w + '" height="' + H + '" fill="' + fillC + '"/>')
      const canColor = l.canalina_tipo === 'warm_edge' ? '#555' : '#888'
      p.push('<rect x="' + x + '" y="0" width="' + w + '" height="' + bH + '" fill="' + canColor + '" rx="1"/>')
      p.push('<rect x="' + x + '" y="' + (H - bH) + '" width="' + w + '" height="' + bH + '" fill="' + canColor + '" rx="1"/>')
      p.push('<text x="' + (x + w / 2) + '" y="' + (H / 2 + 3) + '" text-anchor="middle" font-size="7" fill="#999" font-family="monospace">' + (l.gas || 'aria')[0].toUpperCase() + '</text>')
      p.push('<text x="' + (x + w / 2) + '" y="' + (H + 14) + '" text-anchor="middle" font-size="9" fill="#666" font-family="monospace" font-weight="700">' + l.spessore + '</text>')
    } else if (l.tipo === 'pvb') {
      p.push('<rect x="' + x + '" y="0" width="' + w + '" height="' + H + '" fill="#E8D090" stroke="#C0A050" stroke-width="0.5"/>')
    } else {
      p.push('<rect x="' + x + '" y="0" width="' + w + '" height="' + H + '" fill="#B8E0E0" stroke="#0D1F1F" stroke-width="1" rx="0.5"/>')
      if (l.vetro_tipo === 'basso_emissivo' || l.vetro_tipo === 'selettivo') {
        const lc = l.vetro_tipo === 'selettivo' ? '#D08008' : '#3B7FE0'
        p.push('<line x1="' + (x + w - 1) + '" y1="3" x2="' + (x + w - 1) + '" y2="' + (H - 3) + '" stroke="' + lc + '" stroke-width="2" stroke-dasharray="4,2"/>')
      }
      if (l.vetro_tipo === 'temperato') {
        p.push('<text x="' + (x + w / 2) + '" y="' + (H / 2 + 3) + '" text-anchor="middle" font-size="8" fill="#0D1F1F" font-weight="800">T</text>')
      }
      const suf = l.vetro_tipo === 'basso_emissivo' ? 'BE' : l.vetro_tipo === 'selettivo' ? 'S' : l.vetro_tipo === 'temperato' ? 'T' : ''
      p.push('<text x="' + (x + w / 2) + '" y="' + (H + 14) + '" text-anchor="middle" font-size="9" fill="#0D1F1F" font-family="monospace" font-weight="700">' + l.spessore + suf + '</text>')
    }
    x += w
  })

  return '<svg viewBox="-2 -2 ' + (x + 4) + ' ' + (H + 22) + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" >' + p.join('') + '</svg>'
}

let _id = 0
export const gid = () => String(++_id)
