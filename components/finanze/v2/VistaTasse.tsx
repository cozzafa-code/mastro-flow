"use client";
import React, { useState } from "react";
import { useContabilitaForfettario, TIPI_RATA_INPS_LABEL, TIPI_IRPEF_LABEL } from "../../../hooks/useContabilitaForfettario";
import { useF24 } from "../../../hooks/usePlafondBonusF24";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const MUTED = "#5C6B7A";
const RED = "#C73E1D";
const GREEN = "#0F6E56";
const AMBER = "#E8B05C";
const BG_SOFT = "#F7F9FB";
const BORDER = "#E5EAF0";

interface Props { aziendaId: string; }

export default function VistaTasse({ aziendaId }: Props) {
  const cf = useContabilitaForfettario(aziendaId);
  const fd = useF24(aziendaId);
  const [annoSel, setAnnoSel] = useState(new Date().getFullYear());

  if (cf.loading) return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Carico contabilità…</div>;

  const k = cf.kpi;
  const inpsAnno = cf.inps.filter((i) => i.anno === annoSel);
  const irpefAnno = cf.irpef.filter((i) => i.anno === annoSel);
  const f24Aperti = fd.f24.filter((f) => f.stato === "da_versare");

  const sogliaCol = !k ? MUTED : k.stato_soglia === "critico" ? RED : k.stato_soglia === "attenzione" ? AMBER : GREEN;

  return (
    <div style={{ padding: 12 }}>

      {/* HERO FORFETTARIO */}
      {k && (
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, #0F1F33)`, color: "#fff",
          borderRadius: 13, padding: "12px 14px", marginBottom: 9,
        }}>
          <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Regime {k.regime} · {k.codice_ateco}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
            €{(k.ricavi_anno || 0).toLocaleString("it-IT", { minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            Ricavi {k.anno} · Soglia €{k.soglia_passaggio.toLocaleString("it-IT")}
          </div>
          {/* progress soglia */}
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 6, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(k.pct_soglia, 100)}%`, height: "100%",
              background: sogliaCol, transition: "width 0.3s",
            }} />
          </div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
            <span>{k.pct_soglia.toFixed(1)}% della soglia</span>
            <span style={{ color: sogliaCol, fontWeight: 700 }}>{k.stato_soglia.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* KPI imposte stimate */}
      {k && (
        <Sez tit="Imposta stimata anno">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <KpiBox lbl="Coeff. redditività" val={`${k.coefficiente_redditivita}%`} c={NAVY} />
            <KpiBox lbl="Reddito imp." val={`€${Math.round(k.reddito_imponibile).toLocaleString("it-IT")}`} c={NAVY} />
            <KpiBox lbl={`Imposta ${k.aliquota_sostitutiva}%`} val={`€${Math.round(k.imposta_stimata).toLocaleString("it-IT")}`} c={TEAL} big />
          </div>
        </Sez>
      )}

      {/* Anno selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 9 }}>
        {[annoSel - 1, annoSel, annoSel + 1].map((a) => (
          <button key={a} onClick={() => setAnnoSel(a)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 7, border: "none",
            background: annoSel === a ? TEAL : "#fff", color: annoSel === a ? "#fff" : MUTED,
            fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          }}>{a}</button>
        ))}
      </div>

      {/* INPS ARTIGIANI */}
      <Sez tit={`INPS artigiani ${annoSel}`} right={
        inpsAnno.length === 0 && (
          <button onClick={() => cf.generaInpsAnno(annoSel)} style={btnGen}>+ GENERA</button>
        )
      }>
        {inpsAnno.length === 0 ? (
          <Empty msg="Nessuna scadenza INPS. Tocca + GENERA." />
        ) : (
          inpsAnno.map((i) => (
            <ScadenzaRow
              key={i.id}
              label={TIPI_RATA_INPS_LABEL[i.tipo_rata] || i.tipo_rata}
              data={i.data_scadenza}
              importo={i.importo}
              versato={i.importo_versato}
              stato={i.stato}
              onMarca={async () => await cf.marcaInpsVersata(i.id, i.importo)}
            />
          ))
        )}
      </Sez>

      {/* IRPEF / sostitutiva */}
      <Sez tit={`Imposta sostitutiva ${annoSel}`} right={
        irpefAnno.length === 0 && (
          <button onClick={() => cf.generaIrpefAnno(annoSel)} style={btnGen}>+ CALCOLA</button>
        )
      }>
        {irpefAnno.length === 0 ? (
          <Empty msg="Nessuna scadenza calcolata. Tocca + CALCOLA per stimare." />
        ) : (
          irpefAnno.map((i) => (
            <ScadenzaRow
              key={i.id}
              label={TIPI_IRPEF_LABEL[i.tipo] || i.tipo}
              data={i.data_scadenza}
              importo={i.imposta_lorda}
              versato={i.importo_versato}
              stato={i.stato}
              sub={`Reddito imp. €${Math.round(i.reddito_imponibile).toLocaleString("it-IT")} · ${i.aliquota_pct}%`}
              onMarca={async () => await cf.marcaIrpefVersata(i.id, i.imposta_lorda)}
            />
          ))
        )}
      </Sez>

      {/* F24 aperti */}
      <Sez tit="F24 da versare" right={<span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>{f24Aperti.length}</span>}>
        {f24Aperti.length === 0 ? (
          <Empty msg="Nessun F24 in scadenza." />
        ) : (
          f24Aperti.map((f) => (
            <div key={f.id} style={{ padding: "9px 0", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                  {f.tipo.toUpperCase()} · cod. {f.codice_tributo}
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
                  {f.numero_progressivo} · scad. {new Date(f.data_scadenza).toLocaleDateString("it-IT")}
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>
                  €{f.importo_netto.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </div>
                <button onClick={() => fd.marcaVersato(f.id, new Date().toISOString().split("T")[0])} style={{
                  marginTop: 4, padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800,
                  background: GREEN, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>VERSATO</button>
              </div>
            </div>
          ))
        )}
      </Sez>
    </div>
  );
}

// === helpers ===
const btnGen: React.CSSProperties = {
  padding: "5px 10px", borderRadius: 6, border: "none", background: TEAL, color: "#fff",
  fontSize: 9.5, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3, fontFamily: "inherit",
};

function Sez({ tit, right, children }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 13, padding: "11px 12px", marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{tit}</span>{right}
      </div>
      {children}
    </div>
  );
}

function KpiBox({ lbl, val, c, big }: { lbl: string; val: string; c: string; big?: boolean }) {
  return (
    <div style={{
      background: big ? `${c}15` : BG_SOFT,
      borderRadius: 8, padding: "8px 8px", textAlign: "center",
      borderTop: `2px solid ${c}`,
    }}>
      <div style={{ fontSize: 8.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{lbl}</div>
      <div style={{ fontSize: big ? 14 : 12, fontWeight: 800, color: c, marginTop: 3 }}>{val}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: 16, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>{msg}</div>;
}

function ScadenzaRow({ label, data, importo, versato, stato, sub, onMarca }: any) {
  const pagato = stato === "versato";
  return (
    <div style={{ padding: "9px 0", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: pagato ? MUTED : NAVY, textDecoration: pagato ? "line-through" : "none" }}>
          {label}
        </div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
          Scad. {new Date(data).toLocaleDateString("it-IT")}{sub ? ` · ${sub}` : ""}
        </div>
      </div>
      <div style={{ textAlign: "right", marginLeft: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: pagato ? GREEN : NAVY }}>
          €{importo.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
        </div>
        {!pagato && (
          <button onClick={onMarca} style={{
            marginTop: 4, padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800,
            background: TEAL, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>VERSATA</button>
        )}
      </div>
    </div>
  );
}
