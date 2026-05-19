"use client";
// @ts-nocheck
// MASTRO ERP - RilieviVaniPanel
// Pannello rilievi multipli (R1/R2/R3) con tab Lista vani + Report
// Tap su vano apre VanoDetailPanel (intoccabile) tramite onOpenVano callback
import React, { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FM } from "./mastro-constants";

const NAVY = "#1E3A5F";
const NAVY_D = "#0F1B2D";
const VIO = "#7B6BA5"; const VIO_LT = "#EEEDFE";
const BLU = "#3572A5"; const BLU_LT = "#E6F1FB";
const GRN = "#0F6E56"; const GRN_LT = "#E1F5EE";
const AMB = "#854F0B"; const AMB_LT = "#FAEEDA";
const SUB = "#6B7785"; const SUB2 = "#9AA3AE";

type Props = { onOpenVano?: (vanoId: any, rilievoId: any) => void };

export default function RilieviVaniPanel({ onOpenVano }: Props) {
  const { T, selectedCM, setSelectedCM, setCantieri } = useMastro();
  const [activeRid, setActiveRid] = useState<any>(null);
  const [view, setView] = useState<"lista" | "report">("lista");

  if (!selectedCM) return null;
  const c = selectedCM;
  const rilievi = c.rilievi || [];

  // Auto-select primo rilievo se nessuno attivo
  const currentRid = activeRid ?? (rilievi[0]?.id ?? null);
  const current = rilievi.find((r: any) => r.id === currentRid) || null;

  const updRilievo = (rid: any, patch: any) => {
    const upd = rilievi.map((r: any) => r.id === rid ? { ...r, ...patch } : r);
    setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, rilievi: upd } : x));
    setSelectedCM((p: any) => ({ ...p, rilievi: upd }));
  };

  const addRilievo = () => {
    const newR = {
      id: Date.now(), n: rilievi.length + 1,
      data: new Date().toISOString().slice(0, 10),
      ora: new Date().toTimeString().slice(0, 5),
      rilevatore: "Fabio", tipo: "rilievo", stato: "in corso",
      nome: rilievi.length === 0 ? "Rilievo iniziale" : `Rilievo ${rilievi.length + 1}`,
      vani: [],
    };
    const upd = [...rilievi, newR];
    setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, rilievi: upd } : x));
    setSelectedCM((p: any) => ({ ...p, rilievi: upd }));
    setActiveRid(newR.id);
  };

  if (rilievi.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: SUB, marginBottom: 12 }}>Nessun rilievo presente.</div>
        <div onClick={addRilievo} style={{ display: "inline-block", padding: "12px 24px", background: NAVY, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Crea primo rilievo</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* TAB RILIEVI */}
      <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: T.card, borderBottom: `1px solid ${T.bdr}`, overflowX: "auto" }}>
        {rilievi.map((r: any, i: number) => {
          const active = r.id === currentRid;
          return (
            <div key={r.id} onClick={() => setActiveRid(r.id)}
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", border: `1px solid ${active ? NAVY : T.bdr}`, background: active ? NAVY : T.card, color: active ? "#fff" : SUB, display: "flex", alignItems: "center", gap: 6 }}>
              R{i + 1}
              <span style={{ background: active ? "rgba(255,255,255,0.25)" : T.bg, padding: "1px 6px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: active ? "#fff" : SUB }}>
                {(r.vani || []).length}
              </span>
            </div>
          );
        })}
        <div onClick={addRilievo}
          style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", border: `1.5px dashed ${NAVY}`, background: "transparent", color: NAVY }}>
          + R{rilievi.length + 1}
        </div>
      </div>

      {/* TAB VISTA */}
      <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}`, padding: "0 8px" }}>
        {[
          { id: "lista", l: "Lista vani", i: "📋" },
          { id: "report", l: "Report", i: "📊" },
        ].map(t => {
          const a = view === t.id;
          return (
            <div key={t.id} onClick={() => setView(t.id as any)}
              style={{ flex: 1, textAlign: "center", padding: "12px 4px", fontSize: 12, fontWeight: 700, color: a ? NAVY : SUB, borderBottom: `2px solid ${a ? NAVY : "transparent"}`, cursor: "pointer" }}>
              {t.l}
            </div>
          );
        })}
      </div>

      {/* CONTENT */}
      {current && view === "lista" && (
        <ListaVaniView rilievo={current} index={rilievi.findIndex((x: any) => x.id === current.id)} T={T} onOpenVano={onOpenVano} addVano={() => {
          const nv = { id: Date.now(), nome: `Vano ${(current.vani || []).length + 1}`, tipo: "F2A", pezzi: 1, misure: {}, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
          updRilievo(current.id, { vani: [...(current.vani || []), nv] });
        }} />
      )}
      {current && view === "report" && (
        <ReportView rilievo={current} index={rilievi.findIndex((x: any) => x.id === current.id)} prevRilievo={rilievi.findIndex((x: any) => x.id === current.id) > 0 ? rilievi[rilievi.findIndex((x: any) => x.id === current.id) - 1] : null} T={T} />
      )}
    </div>
  );
}

// ============================================================
// LISTA VANI VIEW
// ============================================================
function ListaVaniView({ rilievo, index, T, onOpenVano, addVano }: any) {
  const vani = rilievo.vani || [];
  const completi = vani.filter((v: any) => v.misure?.lCentro && v.misure?.hCentro && Object.keys(v.foto || {}).length > 0).length;
  const fotoCount = vani.reduce((s: number, v: any) => s + Object.keys(v.foto || {}).length, 0);

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* HEADER RILIEVO */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: index === 0 ? VIO_LT : BLU_LT, color: index === 0 ? VIO : BLU, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>R{index + 1}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{rilievo.nome || `Rilievo ${index + 1}`}</div>
              <div style={{ fontSize: 11, color: SUB, marginTop: 1 }}>{rilievo.data} · {rilievo.ora || ""} · {rilievo.rilevatore || ""}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 8, background: rilievo.stato === "completato" ? GRN_LT : AMB_LT, color: rilievo.stato === "completato" ? GRN : AMB, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {rilievo.stato || "In corso"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, paddingTop: 10, borderTop: `1px solid ${T.bdr}` }}>
          <Meta l="Vani" v={String(vani.length)} />
          <Meta l="Completi" v={`${completi} / ${vani.length}`} c={completi === vani.length ? GRN : AMB} />
          <Meta l="Foto" v={String(fotoCount)} />
          <Meta l="Stato" v={vani.length === 0 ? "Vuoto" : "OK"} c={SUB} />
        </div>
      </div>

      <SecLabel txt={`Vani di R${index + 1}`} count={vani.length} />

      {vani.map((v: any, i: number) => {
        const m = v.misure || {};
        const hasMisure = m.lCentro && m.hCentro;
        const hasFoto = Object.keys(v.foto || {}).length > 0;
        const completo = hasMisure && hasFoto;
        const acc = v.accessori || {};
        return (
          <div key={v.id} onClick={() => onOpenVano?.(v.id, rilievo.id)}
            style={{ background: T.card, borderRadius: 14, border: `1px solid ${completo ? T.bdr : AMB}`, padding: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: completo ? NAVY : AMB, color: "#fff", fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{v.nome || `Vano ${i + 1}`}</div>
                {v.tipo && <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: T.bg, color: SUB }}>{v.tipo}</div>}
              </div>
              <div style={{ fontSize: 12, color: hasMisure ? SUB : AMB }}>
                {hasMisure ? `${m.lCentro} × ${m.hCentro} mm${v.coloreInt ? ` · ${v.coloreInt}` : ""}` : "Tocca per inserire misure"}
              </div>
              {(acc.tapparella?.attivo || acc.zanzariera?.attivo || acc.persiana?.attivo) && (
                <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                  {acc.tapparella?.attivo && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: AMB_LT, color: AMB, textTransform: "uppercase", letterSpacing: 0.4 }}>Tapp.</span>}
                  {acc.zanzariera?.attivo && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: BLU_LT, color: BLU, textTransform: "uppercase", letterSpacing: 0.4 }}>Zanz.</span>}
                  {acc.persiana?.attivo && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: VIO_LT, color: VIO, textTransform: "uppercase", letterSpacing: 0.4 }}>Pers.</span>}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {completo
                ? <div style={{ width: 24, height: 24, borderRadius: "50%", background: GRN, color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✓</div>
                : <div style={{ width: 24, height: 24, borderRadius: "50%", background: AMB_LT, color: AMB, border: `1.5px dashed ${AMB}`, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>!</div>}
              <div style={{ color: SUB2, fontSize: 18 }}>›</div>
            </div>
          </div>
        );
      })}

      <div onClick={addVano}
        style={{ padding: 14, borderRadius: 12, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${NAVY}`, background: "rgba(30,58,95,0.04)", fontSize: 13, fontWeight: 700, color: NAVY }}>
        + Aggiungi vano a R{index + 1}
      </div>
    </div>
  );
}

// ============================================================
// REPORT VIEW
// ============================================================
function ReportView({ rilievo, index, prevRilievo, T }: any) {
  const vani = rilievo.vani || [];
  const completi = vani.filter((v: any) => v.misure?.lCentro && v.misure?.hCentro && Object.keys(v.foto || {}).length > 0).length;
  const perc = vani.length === 0 ? 0 : Math.round((completi / vani.length) * 100);
  const fotoCount = vani.reduce((s: number, v: any) => s + Object.keys(v.foto || {}).length, 0);
  const misCount = vani.reduce((s: number, v: any) => s + Object.values(v.misure || {}).filter((x: any) => x > 0).length, 0);
  const mqTot = vani.reduce((s: number, v: any) => {
    const l = (v.misure?.lCentro || 0) / 1000;
    const h = (v.misure?.hCentro || 0) / 1000;
    return s + (l * h * (v.pezzi || 1));
  }, 0);

  // Tipologie raggruppate
  const tipi: Record<string, number> = {};
  vani.forEach((v: any) => { const t = v.tipo || "—"; tipi[t] = (tipi[t] || 0) + 1; });

  // Diff vs precedente
  const diff = prevRilievo ? calcDiff(prevRilievo.vani || [], vani) : null;

  const r = 42, circ = 2 * Math.PI * r;
  const offset = circ - (perc / 100) * circ;
  const ringColor = perc === 100 ? GRN : perc >= 50 ? NAVY : AMB;

  return (
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* HERO */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
        <div style={{ position: "relative", width: 96, height: 96 }}>
          <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={r} stroke={T.bdr} strokeWidth="6" fill="none" />
            <circle cx="48" cy="48" r={r} stroke={ringColor} strokeWidth="6" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ringColor, fontFamily: FM }}>{perc}%</div>
            <div style={{ fontSize: 9, color: SUB, textTransform: "uppercase", letterSpacing: 0.6 }}>{perc === 100 ? "Completo" : "In corso"}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{rilievo.nome || `Rilievo ${index + 1}`}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{rilievo.data} · {rilievo.ora || ""} · {rilievo.rilevatore || ""}</div>
        </div>
      </div>

      {diff && (
        <div style={{ background: VIO_LT, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: VIO, fontWeight: 700 }}>
          ℹ Diff vs R{index}: +{diff.added} · {diff.modified} mod · {diff.unchanged} invariati
        </div>
      )}

      <SecLabel txt="Numeri" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Kpi l="Vani" v={String(vani.length)} s={completi === vani.length && vani.length > 0 ? "tutti completi" : `${completi} completi`} />
        <Kpi l="Foto" v={String(fotoCount)} s={vani.length > 0 ? `${(fotoCount / vani.length).toFixed(1)} per vano` : "—"} />
        <Kpi l="Misure" v={String(misCount)} s={`su ${vani.length * 8} attese`} c={misCount >= vani.length * 6 ? T.text : AMB} />
        <Kpi l="Mq totali" v={mqTot.toFixed(1)} s="superficie" />
      </div>

      {Object.keys(tipi).length > 0 && (
        <>
          <SecLabel txt="Vani per tipologia" />
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px" }}>
            {Object.entries(tipi).map(([t, n]) => (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.text }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: NAVY }}></div>
                  Tipo {t}
                </div>
                <div style={{ fontWeight: 700, color: T.text }}>{n}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {rilievo.note && (
        <>
          <SecLabel txt="Note rilievo" />
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", fontSize: 12, color: T.text, lineHeight: 1.6 }}>
            {rilievo.note}
          </div>
        </>
      )}

      <SecLabel txt="Esporta" />
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { i: "📄", l: "PDF" },
          { i: "🔗", l: "Condividi" },
          { i: "✉", l: "Email" },
        ].map(b => (
          <div key={b.l} style={{ flex: 1, background: T.card, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "10px 8px", fontSize: 12, fontWeight: 700, color: NAVY, cursor: "pointer", textAlign: "center" }}>
            {b.l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function Meta({ l, v, c }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: SUB2, textTransform: "uppercase", letterSpacing: 0.6 }}>{l}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c || "#1A1A18", marginTop: 1 }}>{v}</div>
    </div>
  );
}

function SecLabel({ txt, count }: any) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: SUB2, margin: "6px 4px 2px", display: "flex", justifyContent: "space-between" }}>
      <span>{txt}</span>
      {count !== undefined && <span style={{ color: NAVY }}>{count}</span>}
    </div>
  );
}

function Kpi({ l, v, s, c }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, border: `1px solid #D6DDE5`, padding: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: SUB2, textTransform: "uppercase", letterSpacing: 0.6 }}>{l}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: c || "#1A1A18", marginTop: 4, letterSpacing: -0.5, fontFamily: FM }}>{v}</div>
      <div style={{ fontSize: 10, color: SUB, marginTop: 1 }}>{s}</div>
    </div>
  );
}

function calcDiff(prev: any[], curr: any[]) {
  const prevNames = new Set(prev.map((v: any) => v.nome));
  const currNames = new Set(curr.map((v: any) => v.nome));
  let added = 0, modified = 0, unchanged = 0;
  curr.forEach((v: any) => {
    if (!prevNames.has(v.nome)) { added++; return; }
    const p = prev.find((x: any) => x.nome === v.nome);
    const sameMisure = p?.misure?.lCentro === v.misure?.lCentro && p?.misure?.hCentro === v.misure?.hCentro;
    if (sameMisure) unchanged++; else modified++;
  });
  return { added, modified, unchanged };
}