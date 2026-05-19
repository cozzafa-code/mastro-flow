"use client"
import React, { useEffect } from "react"
const NAVY = "#1E3A5F", TEAL = "#28A0A0", AMBER = "#BA7517", BG = "#EEF8F8", TEXT = "#0F1F33", MUTED = "#5C6B7A"

const CATEGORIE = [
  { code: "BARRE_ALLUMINIO", nome: "Barre alluminio", forn: "Twin Systems" },
  { code: "BARRE_PVC", nome: "Barre PVC", forn: "Aluplast Profili" },
  { code: "VETRI", nome: "Vetri", forn: "Vetreria Sud" },
  { code: "FERRAMENTA", nome: "Ferramenta", forn: "Maico" },
  { code: "MINUTERIE", nome: "Minuterie", forn: "Cromo Ind." },
  { code: "LAMIERE", nome: "Lamiere", forn: "Lattoneria" },
]

export default function StepTipo({ tipo, onTipoChange, categorieAttive, onCategorieChange, commessa, onPrepara }: any) {
  const numVani = commessa?.rilievi?.flatMap((r: any) => r.vani || []).length || (commessa?.vaniCount || 0)

  // Auto-prepara bozze ordini quando categorie cambiano
  useEffect(() => {
    if (tipo === "componenti") {
      const bozze = categorieAttive.map((cat: string) => {
        const c = CATEGORIE.find(x => x.code === cat)
        return {
          fornitore_id: cat.toLowerCase(),
          fornitore_nome: c?.forn || cat,
          categoria_materiale: cat,
          tipo_acquisto: "componenti",
          righe: [{ descrizione: `${c?.nome || cat} per ${numVani} vani`, qta_richiesta: numVani || 1, prezzo_unitario: 100, totale_riga: (numVani || 1) * 100 }],
          totale_stimato: (numVani || 1) * 100,
          saltato: false,
        }
      })
      onPrepara(bozze)
    } else {
      // Prodotto finito: 1 ordine per fornitore principale
      onPrepara([{
        fornitore_id: "aluplast",
        fornitore_nome: "Aluplast SRL",
        categoria_materiale: "PRODOTTO_FINITO_PVC",
        tipo_acquisto: "prodotto_finito",
        righe: [{ descrizione: `${numVani} vani IDEAL 7000 finestre complete`, qta_richiesta: numVani || 1, prezzo_unitario: 380, totale_riga: (numVani || 1) * 380 }],
        totale_stimato: (numVani || 1) * 380,
        saltato: false,
      }])
    }
  }, [tipo, categorieAttive, numVani, onPrepara])

  function toggleCat(cat: string) {
    if (categorieAttive.includes(cat)) onCategorieChange(categorieAttive.filter((c: string) => c !== cat))
    else onCategorieChange([...categorieAttive, cat])
  }

  return (
    <>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 }}>PRODOTTO FINITO O COMPONENTI?</div>
      <div style={{ fontSize: 20, color: TEXT, fontWeight: 500, marginBottom: 4 }}>Tipo di acquisto</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>{commessa?.code} \u00b7 {numVani} vani</div>

      <TipoOpt active={tipo === "prodotto_finito"} onClick={() => onTipoChange("prodotto_finito")} icon="box" title="Prodotto finito" desc="Ordini la finestra completa al fornitore. Arriva pronta da montare." />
      <TipoOpt active={tipo === "componenti"} onClick={() => onTipoChange("componenti")} icon="tool" title="Componenti \u00b7 produciamo noi" desc="Ordini barre, vetri, accessori e li assembli in officina." />

      {tipo === "componenti" ? (
        <>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1.2, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>CATEGORIE NECESSARIE \u00b7 {categorieAttive.length} ORDINI</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CATEGORIE.map(c => (
              <div key={c.code} onClick={() => toggleCat(c.code)} style={{ position: "relative", background: categorieAttive.includes(c.code) ? "#F2FAFA" : "#FFF", border: categorieAttive.includes(c.code) ? `2px solid ${TEAL}` : "2px solid transparent", borderRadius: 12, padding: "12px 10px", cursor: "pointer" }}>
                {categorieAttive.includes(c.code) ? <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: 50, background: TEAL, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg></div> : null}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: categorieAttive.includes(c.code) ? TEAL : BG, color: categorieAttive.includes(c.code) ? "#FFF" : NAVY, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={18} height={18} rx={2}/></svg>
                </div>
                <div style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{c.nome}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{c.forn}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}

function TipoOpt({ active, onClick, icon, title, desc }: any) {
  return (
    <div onClick={onClick} style={{ background: active ? "#F2FAFA" : "#FFF", border: active ? `2px solid ${TEAL}` : "2px solid transparent", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: active ? TEAL : BG, color: active ? "#FFF" : NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon === "box" ? <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> : <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: TEXT, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <div style={{ width: 22, height: 22, borderRadius: 50, border: active ? `2px solid ${TEAL}` : "2px solid #C8D2DA", background: active ? TEAL : "transparent", flexShrink: 0, marginTop: 4, position: "relative" }}>
          {active ? <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 8, height: 8, background: "#FFF", borderRadius: 50 }}/> : null}
        </div>
      </div>
    </div>
  )
}
