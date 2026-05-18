"use client";
// @ts-nocheck
// FerroPanel - widget Ferro per VanoDetailPanel (MASTRO Suite)
// Persiste in vano.dati.ferro_*. Usa lib/ferro/* per logica pura.

import React, { useState, useMemo, useEffect, useRef } from "react";
import { defaultFerroConfig, STRUTTURE, PILASTRI, TRAVI, ARCARECCI } from "@/lib/ferro/profiles";
import { buildBOM } from "@/lib/ferro/calculations";
import { renderView } from "@/lib/ferro/renderers";
import { buildDettagliCard } from "@/lib/ferro/details";
import { buildOfficinaList } from "@/lib/ferro/officina";
import { buildMontaggioFasi } from "@/lib/ferro/montaggio";
import { buildCSV, downloadCSV } from "@/lib/ferro/csv";

const T = { bg: "#F4F1EA", card: "#FFFFFF", acc: "#28A0A0", accDeep: "#156060", accDark: "#0F6E56", text: "#0D1F1F", muted: "#888", bdr: "#C8E4E4", bdrLight: "#EEF8F8", red: "#DC4444", amber: "#D08008" };

export default function FerroPanel({ vano, onChange }) {
  // Carica config da vano.dati con fallback a default
  const stored = vano?.dati?.ferro_config;
  const [config, setConfig] = useState(stored || defaultFerroConfig("mono"));
  const [mode, setMode] = useState("generale");
  const [view, setView] = useState("frontale");
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);

  // Persisti su vano ad ogni patch
  function patch(p) {
    const next = { ...config, ...p };
    if (next.tipo !== "pergola") {
      if (p.hgronda !== undefined && next.hgronda >= next.hcolmo) next.hcolmo = next.hgronda + 200;
      if (p.hcolmo !== undefined && next.hcolmo <= next.hgronda) next.hcolmo = next.hgronda + 200;
    }
    setConfig(next);
    onChange?.({ ferro_config: next });
    setSelectedId(null);
  }

  function changeTipo(tipo) {
    const dims = STRUTTURE[tipo].dims;
    const next = { ...config, tipo };
    dims.forEach(d => { next[d.key] = d.def; });
    patch(next);
  }

  const bom = useMemo(() => buildBOM(config), [config]);
  const dettagli = useMemo(() => buildDettagliCard(config, bom), [config, bom]);
  const officina = useMemo(() => buildOfficinaList(config, bom), [config, bom]);
  const fasi = useMemo(() => buildMontaggioFasi(config, bom), [config, bom]);

  useEffect(() => {
    if (mode === "generale" && canvasRef.current) renderView(canvasRef.current, config, view, selectedId, setSelectedId);
  }, [mode, view, config, selectedId]);

  const spec = STRUTTURE[config.tipo];
  const sel = selectedId ? bom.items.find(i => i.id === selectedId) : null;

  function exportCSV() {
    const csv = buildCSV(config, bom, { progetto: vano?.label || "vano-ferro" });
    downloadCSV(`ferro-${config.tipo}-${Date.now()}.csv`, csv);
  }

  return (
    <div style={{ background: T.bg, padding: 16, borderRadius: 12, fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 240px", gap: 12, minHeight: 600 }}>

        {/* SIDEBAR LEFT - Config */}
        <div style={{ background: T.card, borderRadius: 12, padding: 12, border: `1px solid ${T.bdr}`, overflow: "auto", maxHeight: 700 }}>
          <Lab>Tipo struttura</Lab>
          <Sel value={config.tipo} onChange={e => changeTipo(e.target.value)}>
            {Object.keys(STRUTTURE).map(k => <option key={k} value={k}>{STRUTTURE[k].label}</option>)}
          </Sel>

          <Lab style={{ marginTop: 14 }}>Dimensioni</Lab>
          {spec.dims.map(d => (
            <div key={d.key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 2 }}>
                <span>{d.label}</span><span style={{ color: T.text, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>{config[d.key]}{d.unit ?? " mm"}</span>
              </div>
              <input type="range" min={d.min} max={d.max} step={d.step} value={config[d.key]}
                onChange={e => patch({ [d.key]: parseInt(e.target.value) })}
                style={{ width: "100%", accentColor: T.acc }} />
            </div>
          ))}

          <Lab style={{ marginTop: 12 }}>Profili</Lab>
          <ProfSel label="Pilastri" list={PILASTRI} value={config.pilastro} onChange={p => patch({ pilastro: p })} />
          <ProfSel label="Travi" list={TRAVI} value={config.trave} onChange={p => patch({ trave: p })} />
          <ProfSel label="Arcarecci" list={ARCARECCI} value={config.arcareccio} onChange={p => patch({ arcareccio: p })} />

          <Lab style={{ marginTop: 12 }}>Collegamenti</Lab>
          <Sel value={config.collegamento} onChange={e => patch({ collegamento: e.target.value })}>
            <option value="bullonato">Bullonato</option><option value="saldato">Saldato</option><option value="misto">Misto</option>
          </Sel>
          {spec.fixType === "terra" ? (
            <Sel style={{ marginTop: 6 }} value={config.fixTerra} onChange={e => patch({ fixTerra: e.target.value })}>
              <option value="tasselli">Piastra + tasselli</option><option value="tirafondi">Piastra + tirafondi</option>
              <option value="annegato">Annegato cls</option><option value="staffa">Staffa laterale</option>
            </Sel>
          ) : (
            <Sel style={{ marginTop: 6 }} value={config.fixMuro} onChange={e => patch({ fixMuro: e.target.value })}>
              <option value="tasselli-chim">Tasselli chimici</option><option value="barre-filettate">Barre filettate</option>
              <option value="piastra-murale">Piastra murale</option><option value="staffa-lat">Staffe laterali</option>
            </Sel>
          )}

          <Lab style={{ marginTop: 12 }}>Carico</Lab>
          <Sel value={config.carico} onChange={e => patch({ carico: e.target.value })}>
            <option value="leggero">Leggero - lamiera</option><option value="medio">Medio - sandwich</option><option value="pesante">Pesante - tegole</option>
          </Sel>
        </div>

        {/* CENTER - Canvas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Tabs items={[["generale","Tavola"],["dettagli","Particolari"],["officina","Officina"],["montaggio","Montaggio"]]} active={mode} onChange={setMode} />
          {mode === "generale" && <Tabs items={[["frontale","Frontale"],["laterale","Laterale"],["pianta","Pianta"],["iso","Iso"]]} active={view} onChange={setView} small />}
          <div style={{ flex: 1, background: T.card, borderRadius: 12, padding: 12, border: `1px solid ${T.bdr}`, minHeight: 460, overflow: "auto" }}>
            {mode === "generale" && <div ref={canvasRef} style={{ width: "100%", minHeight: 440 }} />}
            {mode === "dettagli" && <DettagliGrid cards={dettagli} />}
            {mode === "officina" && <OfficinaPanel sections={officina} />}
            {mode === "montaggio" && <MontaggioPanel fasi={fasi} />}
          </div>
          <div style={{ background: T.text, color: T.bg, borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "JetBrains Mono, monospace", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span>{spec.label} - {config.larghezza}x{config.lunghezza}mm - {bom.totals.totPeso}kg - <b style={{ color: T.acc }}>EUR {bom.totals.totGen.toFixed(2)}</b></span>
            <button onClick={exportCSV} style={{ background: T.acc, color: "#FFF", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 0 0 ${T.accDark}` }}>? CSV</button>
          </div>
        </div>

        {/* SIDEBAR RIGHT - BOM + selected */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 700, overflow: "auto" }}>
          {sel && (
            <Card>
              <Lab style={{ color: T.acc }}>{sel.codice}</Lab>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{sel.nome}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: T.muted, marginTop: 4 }}>{sel.profilo}</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>Qta {sel.qta} - {sel.peso}kg - <b style={{ color: T.acc }}>EUR {sel.costo.toFixed(2)}</b></div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 4, fontStyle: "italic" }}>{sel.nota}</div>
            </Card>
          )}
          <Card>
            <Lab>Distinta</Lab>
            {["profili","arcarecci","piastre","bulloneria","saldature","accessori"].map(s => bom.sections[s]?.length > 0 && (
              <div key={s} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: T.acc, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{s}</div>
                {bom.sections[s].map(it => (
                  <div key={it.id} onClick={() => setSelectedId(selectedId === it.id ? null : it.id)}
                    style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", fontSize: 10, fontFamily: "JetBrains Mono, monospace", cursor: "pointer", background: selectedId === it.id ? T.bdrLight : "transparent", borderRadius: 3 }}>
                    <span style={{ color: T.acc, fontWeight: 600 }}>{it.codice}</span>
                    <span style={{ color: T.muted }}>{it.qta} - EUR{it.costo.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ))}
          </Card>
          <Card>
            <Lab>Totali</Lab>
            <Row k="Peso" v={`${bom.totals.totPeso} kg`} />
            <Row k="Materiale" v={`EUR ${bom.totals.totCosto.toFixed(2)}`} />
            <Row k="Ore" v={`${bom.totals.oreStimate} h`} />
            <Row k="Manodopera" v={`EUR ${bom.totals.manodopera.toFixed(2)}`} />
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: `2px solid ${T.text}`, display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: 11 }}>TOTALE</b>
              <b style={{ color: T.acc, fontSize: 14, fontFamily: "JetBrains Mono, monospace" }}>EUR {bom.totals.totGen.toFixed(2)}</b>
            </div>
          </Card>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 9, color: T.amber, fontStyle: "italic", textAlign: "center" }}>
        Configuratore preventivo/officina - NON costituisce verifica strutturale - Per calcolo statico e necessario professionista abilitato
      </div>
    </div>
  );
}

function Lab({ children, style }) { return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, color: "#888", textTransform: "uppercase", marginBottom: 4, ...style }}>{children}</div>; }
function Sel({ children, ...p }) { return <select {...p} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #C8E4E4", background: "#FFF", fontSize: 11, fontFamily: "Inter", ...(p.style || {}) }}>{children}</select>; }
function Card({ children }) { return <div style={{ background: "#FFF", borderRadius: 10, padding: 10, border: "1px solid #C8E4E4" }}>{children}</div>; }
function Row({ k, v }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}><span style={{ color: "#888" }}>{k}</span><span>{v}</span></div>; }

function ProfSel({ label, list, value, onChange }) {
  const idx = list.findIndex(p => p.name === value.name);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
      <Sel value={idx < 0 ? 0 : idx} onChange={e => onChange(list[parseInt(e.target.value)])}>
        {list.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
      </Sel>
    </div>
  );
}

function Tabs({ items, active, onChange, small }) {
  return (
    <div style={{ display: "flex", background: "#FFF", borderRadius: 8, padding: 3, border: "1px solid #C8E4E4" }}>
      {items.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)}
          style={{ flex: 1, padding: small ? 5 : 7, fontSize: 11, fontWeight: 600, border: "none", borderRadius: 5, cursor: "pointer", background: active === k ? "#0D1F1F" : "transparent", color: active === k ? "#F4F1EA" : "#0D1F1F", fontFamily: "Inter" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

function DettagliGrid({ cards }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background: "#FFF", border: "1px solid #0D1F1F", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ background: "#0D1F1F", color: "#F4F1EA", padding: "4px 8px", fontSize: 9, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 16, height: 16, background: "#28A0A0", color: "#FFF", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{c.letter}</span>
            {c.titolo}
          </div>
          <div style={{ padding: 4 }} dangerouslySetInnerHTML={{ __html: c.svgMarkup }} />
          <div style={{ padding: "6px 8px", fontFamily: "JetBrains Mono, monospace", fontSize: 9, lineHeight: 1.5, borderTop: "0.5px solid #C8E4E4", background: "#FAFAF7" }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}

function OfficinaPanel({ sections }) {
  return (
    <div style={{ background: "#0D1F1F", borderRadius: 8, padding: 10, maxHeight: 500, overflow: "auto" }}>
      {sections.map((s, i) => (
        <div key={i} style={{ background: "#1A2D2D", borderRadius: 4, padding: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: "#28A0A0", fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>? {s.titolo}</div>
          {s.righe.map((r, j) => (
            <div key={j} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#E5E3D8", lineHeight: 1.6 }}>
              <span style={{ color: "#28A0A0" }}>{r.codice}</span> - {r.nome} - {r.profilo} - <span style={{ color: "#28A0A0" }}>{r.qta} pz{r.lungU ? ` x ${r.lungU} mm` : ""}</span> <span style={{ color: "#888" }}>{r.nota}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MontaggioPanel({ fasi }) {
  return (
    <div style={{ maxHeight: 500, overflow: "auto" }}>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 12, padding: "8px 10px", background: "#FFF8EC", borderLeft: "3px solid #D08008", borderRadius: 3 }}>
        Sequenza orientativa di montaggio. Da adattare in base al cantiere e alle istruzioni del DL/coordinatore sicurezza.
      </div>
      {fasi.map(f => (
        <div key={f.n} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: "0.5px solid #EFEDE5" }}>
          <div style={{ flexShrink: 0, width: 32, height: 32, background: "#0D1F1F", color: "#28A0A0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>{f.n}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#0D1F1F", marginBottom: 4 }}>{f.titolo}</div>
            <div style={{ fontSize: 11, color: "#4A4A47", lineHeight: 1.5 }}>{f.descrizione}</div>
          </div>
        </div>
      ))}
      <div style={{ background: "#FFF8EC", borderLeft: "3px solid #D08008", padding: "10px 12px", borderRadius: 3, marginTop: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#8C5A0A", letterSpacing: 0.6, marginBottom: 4 }}>SICUREZZA OBBLIGATORIA</div>
        <div style={{ fontSize: 10, color: "#0D1F1F", lineHeight: 1.5 }}>DPI: imbragatura, casco, scarpe S3, occhiali. POS predisposto. Linee vita su copertura. Verifica abilitazioni saldatori e gruisti.</div>
      </div>
    </div>
  );
}
