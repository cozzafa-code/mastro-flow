// ======================================================================
// MASTRO ERP - Vano Detail / Report Overlay
// Estratto da components/VanoDetailPanel.tsx (refactor S5)
// ======================================================================

import React from "react";
import { FF } from "@/components/mastro-constants";

interface ReportOverlayProps {
  selectedRilievo: any;
  selectedCM: any;
  setCantieri: (updater: (cs: any[]) => any[]) => void;
  setSelectedRilievo: (r: any) => void;
  onClose: () => void;
}

export default function ReportOverlay({
  selectedRilievo,
  selectedCM,
  setCantieri,
  setSelectedRilievo,
  onClose,
}: ReportOverlayProps) {
  if (!selectedRilievo) return null;
  return (

        <div style={{ position: "fixed", inset: 0, background: "#F4F1EA", zIndex: 9900, overflow: "auto", fontFamily: FF }}>
          <div style={{ position: "sticky", top: 0, background: "#0D1F1F", color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
            <div onClick={() => onClose()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Report rilievo R{selectedRilievo.n || ""}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{(selectedRilievo.vani||[]).length} vani totali · {(() => { const vs = selectedRilievo.vani || []; if (!vs.length) return "0%"; let tot = 0, ok = 0; vs.forEach((v: any) => { const ver = v.verificato || {}; const keys = ["tipo","stanza","piano","pezzi","sistema","vetro","telaio","telaioAlaZ","rifilato","coprifilo","coloreInt","coloreEst","bicolore","coloreAcc","larghezze","altezze","diagonali","tapparella","persiana","zanzariera","difficoltaSalita","mezzoSalita","note"]; tot += keys.length; ok += keys.filter(k => ver[k]).length; }); return Math.round((ok/tot)*100) + "% verificato"; })()}</div>
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {(selectedRilievo.vani||[]).map((vr: any, idx: number) => {
              const mm = vr.misure || {};
              const ac = vr.accessori || {};
              const hasMis = Object.values(mm).filter((x: any) => x > 0).length;
              const livelli = [vr.livello_1, vr.livello_2, vr.livello_3].filter(Boolean).join(" · ");
              const verificato = vr.verificato || {};
              // Lista flat di tutti i campi con chiave univoca
              const ALL_FIELDS: [string, any, string][] = [
                ["Tipo", vr.tipo, "tipo"],
                ["Stanza", vr.stanza, "stanza"],
                ["Piano", vr.piano, "piano"],
                ["Pezzi", vr.pezzi, "pezzi"],
                ["Profilo", vr.sistema, "sistema"],
                ["Vetro", vr.vetro, "vetro"],
                ["Telaio", vr.telaio, "telaio"],
                ["Ala Z", vr.telaioAlaZ, "telaioAlaZ"],
                ["Rifilato", vr.rifilato ? "Si" : "No", "rifilato"],
                ["Coprifilo", vr.coprifilo, "coprifilo"],
                ["Interno", vr.coloreInt, "coloreInt"],
                ["Esterno", vr.coloreEst, "coloreEst"],
                ["Bicolore", vr.bicolore ? "Si" : "No", "bicolore"],
                ["Accessori", vr.coloreAcc, "coloreAcc"],
                ["Larghezze", [mm.lAlto, mm.lCentro, mm.lBasso].filter(Boolean).join(" / ") || null, "larghezze"],
                ["Altezze", [mm.hSx, mm.hCentro, mm.hDx].filter(Boolean).join(" / ") || null, "altezze"],
                ["Diagonali", [mm.d1, mm.d2].filter(Boolean).join(" / ") || null, "diagonali"],
                ["Tapparella", ac.tapparella?.attivo ? "Si" : null, "tapparella"],
                ["Persiana", ac.persiana?.attivo ? "Si" : null, "persiana"],
                ["Zanzariera", ac.zanzariera?.attivo ? "Si" : null, "zanzariera"],
                ["Difficolta", vr.difficoltaSalita, "difficoltaSalita"],
                ["Mezzo", vr.mezzoSalita, "mezzoSalita"],
                ["Note", vr.note, "note"],
              ];
              // Stato globale: tutti flag ok + tutti campi pieni = OK / flag ok ma campi vuoti = INCOMPLETO / altrimenti NON VERIF
              const flaggedCount = ALL_FIELDS.filter(([,,k]) => verificato[k]).length;
              const emptyFlagged = ALL_FIELDS.filter(([,v,k]) => verificato[k] && !v).length;
              let statoVano: "ok" | "incompleto" | "non" = "non";
              if (flaggedCount === ALL_FIELDS.length && emptyFlagged === 0) statoVano = "ok";
              else if (flaggedCount === ALL_FIELDS.length && emptyFlagged > 0) statoVano = "incompleto";
              else if (flaggedCount > 0) statoVano = "incompleto";
              const statoColor = statoVano === "ok" ? "#1A9E73" : statoVano === "incompleto" ? "#E8A30A" : "#999";
              const statoLabel = statoVano === "ok" ? "✓ OK" : statoVano === "incompleto" ? "⚠ Verificato incompleto" : "○ Non verificato";

              const toggleFlag = async (fieldKey: string) => {
                const next = { ...verificato, [fieldKey]: !verificato[fieldKey] };
                const updVano = { ...vr, verificato: next };
                // Aggiorna stato locale
                if (selectedRilievo) {
                  const updR = { ...selectedRilievo, vani: selectedRilievo.vani.map((x: any) => x.id === vr.id ? updVano : x) };
                  setCantieri((cs: any[]) => cs.map((c: any) => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map((r: any) => r.id === selectedRilievo.id ? updR : r) } : c));
                  setSelectedRilievo(updR);
                }
                // Persisti su Supabase
                try {
                  const { supabase } = await import("@/lib/supabase");
                  await supabase.from("vani").update({ verificato: next }).eq("id", vr.id);
                } catch (e) { console.error("toggleFlag save", e); }
              };

              const Row = (label: string, value: any, fieldKey: string) => {
                const ok = !!verificato[fieldKey];
                return (
                  <div key={fieldKey} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0EDE5", gap: 8 }}>
                    <div onClick={() => toggleFlag(fieldKey)} style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: "2px solid " + (ok ? "#1A9E73" : "#CCC"),
                      background: ok ? "#1A9E73" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}>
                      {ok && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1, fontSize: 11, color: "#888", fontWeight: 600 }}>{label}</div>
                    <div style={{ flex: 1.5, fontSize: 12, color: value ? "#0D1F1F" : "#CCC", fontWeight: value ? 700 : 400, textAlign: "right" as any }}>{value || "—"}</div>
                  </div>
                );
              };
              const Sez = (title: string, rows: [string, any, string][], sk: string) => (
                <div key={sk} style={{ marginTop: 10, padding: "10px 12px", background: "#FAFAF5", borderRadius: 10, border: "1px solid #F0EDE5" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#0D1F1F", textTransform: "uppercase" as any, letterSpacing: "0.8px", marginBottom: 6 }}>{title}</div>
                  {rows.map((r) => Row(r[0], r[1], r[2]))}
                </div>
              );
              return (
                <div key={vr.id} style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: "#1E3A5F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>{idx+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#0D1F1F" }}>{vr.nome || ("Vano " + (idx+1))}</div>
                      {livelli && <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{livelli}</div>}
                    </div>
                    <div style={{ padding: "6px 10px", borderRadius: 8, background: statoColor + "22", color: statoColor, fontSize: 10, fontWeight: 800, border: "1px solid " + statoColor + "66" }}>{statoLabel}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>{hasMis} misure · {Object.keys(vr.foto||{}).length} foto · {flaggedCount}/{ALL_FIELDS.length} verificati</div>
                  {Sez("TIPOLOGIA", ALL_FIELDS.slice(0, 4), "tip" + idx)}
                  {Sez("SISTEMA", ALL_FIELDS.slice(4, 10), "sis" + idx)}
                  {Sez("COLORI", ALL_FIELDS.slice(10, 14), "col" + idx)}
                  {Sez("MISURE", ALL_FIELDS.slice(14, 17), "mis" + idx)}
                  {Sez("ACCESSORI", ALL_FIELDS.slice(17, 20), "acc" + idx)}
                  {Sez("ALTRO", ALL_FIELDS.slice(20, 23), "alt" + idx)}
                </div>
              );
            })}
          </div>
        </div>
      
  );
}
