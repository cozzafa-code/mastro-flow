// lib/dxf-to-svg.ts
// Parser DXF -> SVG. Estratto da components/ArchivioProfiliPanel.tsx (commit storico).
// Riusabile da: settings mobile/tablet/desktop, CAD, preventivi.

export interface DxfParseResult {
  svg: string
  width: number  // mm, da bounding box
  height: number // mm, da bounding box
}

export function parseDXFtoSVG(dxfText: string, filename = ''): DxfParseResult {
  const raw = dxfText.replace(/\r/g, '').split('\n').map(l => l.trim())
  const pairs: [number, string][] = []
  for (let i = 0; i < raw.length - 1; i += 2) {
    const code = parseInt(raw[i])
    if (!isNaN(code)) pairs.push([code, raw[i + 1]])
  }

  const svgParts: string[] = []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const ub = (x: number, y: number) => {
    if (isFinite(x) && isFinite(y)) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }

  let mainBlock = ''
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'ENTITIES') {
      for (let j = i + 2; j < pairs.length; j++) {
        if (pairs[j][0] === 0 && pairs[j][1] === 'ENDSEC') break
        if (pairs[j][0] === 0 && pairs[j][1] === 'INSERT') {
          for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) {
            if (pairs[k][0] === 2) { mainBlock = pairs[k][1]; break }
          }
          if (mainBlock) break
        }
      }
      break
    }
  }

  const fileHint = filename.replace(/\.dxf$/i, '').replace(/\.dwg$/i, '')

  function processEntity(etype: string, codes: [number, string][]) {
    const getF = (c: number) => { const p = codes.find(([cc]) => cc === c); return p ? parseFloat(p[1]) : 0 }

    if (etype === 'LINE') {
      const x1 = getF(10), y1 = getF(20), x2 = getF(11), y2 = getF(21)
      ub(x1, y1); ub(x2, y2)
      svgParts.push('<line x1="' + x1.toFixed(3) + '" y1="' + y1.toFixed(3) + '" x2="' + x2.toFixed(3) + '" y2="' + y2.toFixed(3) + '" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>')
    }
    else if (etype === 'CIRCLE') {
      const cx = getF(10), cy = getF(20), r = getF(40)
      ub(cx - r, cy - r); ub(cx + r, cy + r)
      svgParts.push('<circle cx="' + cx.toFixed(3) + '" cy="' + cy.toFixed(3) + '" r="' + r.toFixed(3) + '" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>')
    }
    else if (etype === 'ARC') {
      const cx = getF(10), cy = getF(20), r = getF(40), sa = getF(50), ea = getF(51)
      ub(cx - r, cy - r); ub(cx + r, cy + r)
      const sar = sa * Math.PI / 180, ear = ea * Math.PI / 180
      const x1 = cx + r * Math.cos(sar), y1 = cy + r * Math.sin(sar)
      const x2 = cx + r * Math.cos(ear), y2 = cy + r * Math.sin(ear)
      const sweep = ((ea - sa) % 360 + 360) % 360
      svgParts.push('<path d="M' + x1.toFixed(3) + ',' + y1.toFixed(3) + ' A' + r.toFixed(3) + ',' + r.toFixed(3) + ' 0 ' + (sweep > 180 ? 1 : 0) + ',1 ' + x2.toFixed(3) + ',' + y2.toFixed(3) + '" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>')
    }
    else if (etype === 'LWPOLYLINE') {
      const f70 = codes.find(([c]) => c === 70)
      const closed = f70 ? (parseInt(f70[1]) & 1) === 1 : false

      const verts: { x: number; y: number; bulge: number }[] = []
      for (let k = 0; k < codes.length; k++) {
        if (codes[k][0] === 10) {
          const x = parseFloat(codes[k][1])
          let y = 0, bulge = 0
          for (let j = k + 1; j < codes.length; j++) {
            if (codes[j][0] === 10) break
            if (codes[j][0] === 20) y = parseFloat(codes[j][1])
            if (codes[j][0] === 42) bulge = parseFloat(codes[j][1])
          }
          verts.push({ x, y, bulge })
        }
      }

      const len = verts.length
      if (len >= 2) {
        for (let k = 0; k < len; k++) ub(verts[k].x, verts[k].y)
        const hasBulge = verts.some(v => Math.abs(v.bulge) > 0.001)

        if (!hasBulge) {
          const pts = verts.map(v => v.x.toFixed(3) + ',' + v.y.toFixed(3)).join(' ')
          svgParts.push('<' + (closed ? 'polygon' : 'polyline') + ' points="' + pts + '" stroke="#0D1F1F" stroke-width="0.2" fill="' + (closed ? 'rgba(40,160,160,0.04)' : 'none') + '"/>')
        } else {
          let d = 'M' + verts[0].x.toFixed(3) + ',' + verts[0].y.toFixed(3)
          const n = closed ? len : len - 1
          for (let k = 0; k < n; k++) {
            const v = verts[k], nv = verts[(k + 1) % len]
            if (Math.abs(v.bulge) < 0.001) {
              d += ' L' + nv.x.toFixed(3) + ',' + nv.y.toFixed(3)
            } else {
              const angle = 4 * Math.atan(Math.abs(v.bulge))
              const dx = nv.x - v.x, dy = nv.y - v.y
              const chord = Math.sqrt(dx * dx + dy * dy)
              if (chord < 0.0001 || Math.abs(Math.sin(angle / 2)) < 0.001) {
                d += ' L' + nv.x.toFixed(3) + ',' + nv.y.toFixed(3)
                continue
              }
              const radius = chord / (2 * Math.sin(angle / 2))
              const largeArc = angle > Math.PI ? 1 : 0
              const sweep = v.bulge < 0 ? 0 : 1
              d += ' A' + radius.toFixed(3) + ',' + radius.toFixed(3) + ' 0 ' + largeArc + ',' + sweep + ' ' + nv.x.toFixed(3) + ',' + nv.y.toFixed(3)
            }
          }
          if (closed) d += ' Z'
          svgParts.push('<path d="' + d + '" stroke="#0D1F1F" stroke-width="0.2" fill="' + (closed ? 'rgba(40,160,160,0.04)' : 'none') + '"/>')
        }
      }
    }
    else if (etype === 'SOLID') {
      const x1 = getF(10), y1 = getF(20), x2 = getF(11), y2 = getF(21)
      const x3 = getF(12), y3 = getF(22), x4 = getF(13), y4 = getF(23)
      ub(x1, y1); ub(x2, y2); ub(x3, y3); ub(x4, y4)
      svgParts.push('<polygon points="' + x1.toFixed(3) + ',' + y1.toFixed(3) + ' ' + x2.toFixed(3) + ',' + y2.toFixed(3) + ' ' + x4.toFixed(3) + ',' + y4.toFixed(3) + ' ' + x3.toFixed(3) + ',' + y3.toFixed(3) + '" stroke="none" fill="rgba(13,31,31,0.1)"/>')
    }
  }

  // Find ENTITIES section
  let entStart = -1, entEnd = -1
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'ENTITIES') entStart = i + 2
    if (entStart > 0 && entEnd < 0 && pairs[i][0] === 0 && pairs[i][1] === 'ENDSEC' && i > entStart) entEnd = i
  }

  let directGeoCount = 0
  if (entStart > 0 && entEnd > 0) {
    for (let i = entStart; i < entEnd; i++) {
      if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) directGeoCount++
    }
  }

  if (directGeoCount > 10 && entStart > 0 && entEnd > 0) {
    for (let i = entStart; i < entEnd; i++) {
      if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
        const etype = pairs[i][1]
        const codes: [number, string][] = []
        let j = i + 1
        while (j < entEnd && pairs[j][0] !== 0) { codes.push(pairs[j]); j++ }
        processEntity(etype, codes)
      }
    }
  } else {
    let blocksStart = -1, blocksEnd = -1
    for (let i = 0; i < pairs.length - 1; i++) {
      if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'BLOCKS') blocksStart = i + 2
      if (blocksStart > 0 && blocksEnd < 0 && pairs[i][0] === 0 && pairs[i][1] === 'ENDSEC' && i > blocksStart) blocksEnd = i
    }

    if (blocksStart > 0 && blocksEnd > 0) {
      const blockInfo: Record<string, number> = {}
      let tmpBlock = ''
      for (let i = blocksStart; i < blocksEnd; i++) {
        if (pairs[i][0] === 0 && pairs[i][1] === 'BLOCK') {
          tmpBlock = ''
          for (let j = i + 1; j < blocksEnd && pairs[j][0] !== 0; j++) {
            if (pairs[j][0] === 2) { tmpBlock = pairs[j][1]; break }
          }
          if (tmpBlock && !tmpBlock.startsWith('*')) blockInfo[tmpBlock] = 0
        }
        if (pairs[i][0] === 0 && pairs[i][1] === 'ENDBLK') tmpBlock = ''
        if (tmpBlock && !tmpBlock.startsWith('*') && pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
          blockInfo[tmpBlock] = (blockInfo[tmpBlock] || 0) + 1
        }
      }

      let targetBlock = mainBlock
      if (!targetBlock || !blockInfo[targetBlock] || blockInfo[targetBlock] === 0) {
        const sorted = Object.entries(blockInfo).sort((a, b) => b[1] - a[1])
        const fnMatch = sorted.find(([name]) => fileHint && name.includes(fileHint))
        if (fnMatch && fnMatch[1] > 0) targetBlock = fnMatch[0]
        else if (sorted.length > 0) targetBlock = sorted[0][0]
      }

      let curBlock = ''
      for (let i = blocksStart; i < blocksEnd; i++) {
        if (pairs[i][0] === 0 && pairs[i][1] === 'BLOCK') {
          curBlock = ''
          for (let j = i + 1; j < blocksEnd && pairs[j][0] !== 0; j++) {
            if (pairs[j][0] === 2) { curBlock = pairs[j][1]; break }
          }
          continue
        }
        if (pairs[i][0] === 0 && pairs[i][1] === 'ENDBLK') { curBlock = ''; continue }
        if (curBlock !== targetBlock) continue

        if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
          const etype = pairs[i][1]
          const codes: [number, string][] = []
          let j = i + 1
          while (j < blocksEnd && pairs[j][0] !== 0) { codes.push(pairs[j]); j++ }
          processEntity(etype, codes)
        }
      }
    }
  }

  if (svgParts.length === 0) throw new Error('Nessuna entita geometrica trovata nel DXF')

  const pad = 2
  const w = maxX - minX + pad * 2
  const h = maxY - minY + pad * 2
  const svg = '<svg viewBox="' + (minX - pad).toFixed(2) + ' ' + (minY - pad).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><g transform="scale(1,-1) translate(0,' + (-(minY + maxY)).toFixed(2) + ')">' + svgParts.join('') + '</g></svg>'

  return {
    svg,
    width: Math.round((maxX - minX) * 10) / 10,
    height: Math.round((maxY - minY) * 10) / 10,
  }
}
