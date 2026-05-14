"use client";
import React, { useState } from "react";
import { AbcRiepilogo, GroupBuying, WavePick, ABC_COLOR } from "../../hooks/useMagazzinoTop";
import { ModalNuovaWave } from "./ModaliMagazzino2";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// ============================================================
// VISTA ABC ANALYSIS
// ============================================================

export function VistaAbcAnalysis({ mag }: { mag: any }) {
  const abc: AbcRiepilogo[] = mag.abcRiepilogo || [];
  const classA = abc.find(c => c.abc_class === "A");
  const classB = abc.find(c => c.abc_class === "B");
  const classC = abc.find(c => c.abc_class === "C");

  // Pie chart calc
  const totale = (classA?.valore_classe || 0) + (classB?.valore_classe || 0) + (classC?.valore_classe || 0);
  const pctA = classA?.pct_valore || 0;
  const pctB = classB?.pct_valore || 0;
  const dashA = (pctA / 100) * 440;
  const dashB = (pctB / 100) * 440;

  const topA = mag.articoli.filter((a: any) => a.abc_class === "A").slice(0, 5);

  return (
    <div>
      <div style={sezStyle}>
        <SezTit>Distribuzione valore</SezTit>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0" }}>
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="70" fill="none" stroke={RED} strokeWidth="35"
              strokeDasharray={`${dashA} ${440 - dashA}`} strokeDashoffset="0"
              transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" r="70" fill="none" stroke={AMBER} strokeWidth="35"
              strokeDasharray={`${dashB} ${440 - dashB}`} strokeDashoffset={-dashA}
              transform="rotate(-90 90 90)" />
            <circle cx="90" cy="90" r="70" fill="none" stroke={MUTED} strokeWidth="35"
              strokeDasharray={`${440 - dashA - dashB} ${dashA + dashB}`} strokeDashoffset={-(dashA + dashB)}
              transform="rotate(-90 90 90)" />
            <text x="90" y="86" textAnchor="middle" fontSize="11" fontWeight="700" fill={MUTED}>VALORE</text>
            <text x="90" y="104" textAnchor="middle" fontSize="20" fontWeight="800" fill={NAVY}>
              €{totale.toLocaleString("it-IT")}
            </text>
          </svg>
        </div>

        <AbcBox classe="A" data={classA} bg="#FCE3E3" color={RED} desc="alta rotazione" />
        <AbcBox classe="B" data={classB} bg="#FBF0DC" color="#8B6926" desc="media rotazione" />
        <AbcBox classe="C" data={classC} bg="#F1F4F7" color={MUTED} desc="bassa rotazione" />
      </div>

      <div style={sezStyle}>
        <SezTit count={topA.length}>Top 5 articoli classe A</SezTit>
        {topA.map((a: any) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #E5EAF0" }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, background: RED, color: "#fff",
              fontSize: 10, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>A</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>{a.nome}</div>
              <div style={{ fontSize: 9.5, color: MUTED }}>
                {a.picks_30gg || 0} picks/mese · €{a.prezzo_acquisto || 0}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => mag.ricalcolaAbc()}
          style={{
            marginTop: 10, width: "100%", padding: "9px",
            background: TEAL, color: "#fff", borderRadius: 8,
            fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3,
            textTransform: "uppercase", border: "none", cursor: "pointer",
          }}>
          Ricalcola classi ABC
        </button>
      </div>
    </div>
  );
}

function AbcBox({ classe, data, bg, color, desc }: any) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "7px 9px", background: bg, borderRadius: 7, marginBottom: 5,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5, background: color, color: "#fff",
        fontSize: 10, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{classe}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color }}>Classe {classe} · {desc}</div>
        <div style={{ fontSize: 9.5, color: MUTED }}>
          {data?.n_articoli || 0} art. · €{(data?.valore_classe || 0).toLocaleString("it-IT")}
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color }}>{data?.pct_valore || 0}%</div>
    </div>
  );
}

// ============================================================
// VISTA GROUP BUYING
// ============================================================

export function VistaGroupBuying({ mag }: { mag: any }) {
  const [showInfo, setShowInfo] = useState(false);
  const campagne: GroupBuying[] = mag.groupBuying || [];

  return (
    <div>
      <button onClick={() => setShowInfo(true)} style={{
        width: "100%", padding: 12, marginBottom: 9,
        background: "linear-gradient(180deg, #E8B05C, #8B6926)",
        color: "#fff", borderRadius: 11, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer",
      }}>+ ORGANIZZA ACQUISTO GRUPPO</button>
      {showInfo && (
        <div onClick={() => setShowInfo(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,31,51,0.75)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 400, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1B3A5C", marginBottom: 10 }}>Acquisto gruppo</div>
            <div style={{ fontSize: 12, color: "#5C6B7A", lineHeight: 1.5 }}>Per organizzare una campagna serve raccogliere almeno 3 serramentisti vicini. Funzione disponibile a partire dal lancio Q3/2026.</div>
            <button onClick={() => setShowInfo(false)} style={{ marginTop: 14, padding: "8px 18px", background: "#28A0A0", color: "#fff", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer" }}>OK</button>
          </div>
        </div>
      )}

      <AlertCard
        kind="good"
        title={`${campagne.length} campagne attive · €1.140 risparmiati`}
        sub="Acquisto collettivo serramentisti vicini · anonimo"
      />

      {campagne.map(c => <GroupCard key={c.id} c={c} onAderisci={(q) => mag.gbAderisci(c.id, q)} />)}

      {campagne.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessuna campagna attiva
        </div>
      )}
    </div>
  );
}

function GroupCard({ c, onAderisci }: { c: GroupBuying; onAderisci: (q: number) => void }) {
  const [q, setQ] = useState(80);
  const scadenzaH = Math.max(0, Math.round((new Date(c.scadenza_at).getTime() - Date.now()) / 3600000));

  return (
    <div style={{
      background: "linear-gradient(180deg, #FBF0DC, #fff)",
      borderRadius: 11, padding: 12,
      border: `1.5px solid ${AMBER}`, marginBottom: 9,
    }}>
      <div style={{ fontSize: 9.5, color: "#8B6926", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
        <BoltIcon size={11} />
        {c.urgenza_tempo === "urgente" ? `Scade tra ${scadenzaH}h` : "Aperta"}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginTop: 4 }}>
        {c.articolo_descrizione}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9 }}>
        <span style={{ fontSize: 11, color: MUTED, textDecoration: "line-through", fontWeight: 600 }}>
          €{c.prezzo_listino}
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>€{c.prezzo_scontato}</span>
        <span style={{ background: GREEN, color: "#fff", padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 800 }}>
          −{c.sconto_pct}%
        </span>
      </div>
      <div style={{ marginTop: 11, background: "#fff", borderRadius: 99, height: 8, overflow: "hidden", border: "1px solid #E5EAF0" }}>
        <div style={{
          height: "100%", width: `${c.perc_completamento}%`,
          background: `linear-gradient(90deg, ${GREEN}, ${TEAL})`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: MUTED, marginTop: 4, fontWeight: 600 }}>
        <span>{c.n_partecipanti} colleghi · min <b style={{ color: NAVY }}>{c.n_partecipanti_min}</b></span>
        <span><b style={{ color: NAVY }}>{c.qta_attuale_totale} / {c.qta_minima_totale} pz</b></span>
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 9 }}>
        {(c.partecipanti_iniziali || []).slice(0, 4).map((p, i) => (
          <div key={i} style={{
            width: 24, height: 24, borderRadius: "50%",
            background: i === 0 ? NAVY : ["#28A0A0", "#E8B05C", "#5C2D8C"][(i-1) % 3],
            color: "#fff", fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", marginLeft: i === 0 ? 0 : -7,
          }}>{p}</div>
        ))}
      </div>
      <button onClick={() => onAderisci(q)} style={{
        width: "100%", marginTop: 10, padding: 10,
        background: `linear-gradient(180deg, ${TEAL}, #1a6b6b)`,
        color: "#fff", borderRadius: 9,
        fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
        textTransform: "uppercase", border: "none", cursor: "pointer",
      }}>
        Aderisci con {q} pz
      </button>
    </div>
  );
}

// ============================================================
// VISTA WAVE PICKING
// ============================================================

export function VistaWavePicking({ mag }: { mag: any }) {
  const [openWave, setOpenWave] = useState(false);
  const waves: WavePick[] = mag.waves || [];

  return (
    <div>
      <AlertCard
        kind="info"
        title="AI raggruppa per percorso minimo"
        sub="Ondate ottimizzate · risparmio 26 min/giorno medio"
      />

      <div style={sezStyle}>
        <SezTit count={waves.length}>Onde di oggi</SezTit>

        {waves.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessuna onda programmata
          </div>
        ) : waves.map(w => <WaveCard key={w.id} w={w} />)}
      </div>

      <button onClick={() => setOpenWave(true)} style={{
        width: "100%", padding: 12, marginBottom: 9,
        background: "linear-gradient(180deg, #28A0A0, #1a6b6b)",
        color: "#fff", borderRadius: 11, fontSize: 12, fontWeight: 800,
        letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer",
      }}>+ NUOVA WAVE</button>
      {openWave && <ModalNuovaWave mag={mag} onClose={() => setOpenWave(false)} />}

      <div style={sezStyle}>
        <SezTit>Confronto modalità (5 commesse)</SezTit>
        <div style={{ display: "grid", gap: 5 }}>
          <ConfrontoRow label="Discrete picking" tempo="38 min" color={RED} />
          <ConfrontoRow label="Batch picking" tempo="22 min" color={AMBER} />
          <ConfrontoRow label="Wave picking (AI)" tempo="12 min ←" color={GREEN} highlight />
        </div>
      </div>
    </div>
  );
}

function WaveCard({ w }: { w: WavePick }) {
  const colorMap: Record<string, string> = {
    in_corso: TEAL, programmata: AMBER, completata: GREEN, annullata: RED,
  };
  const color = colorMap[w.stato] || MUTED;

  return (
    <div style={{
      background: "#F7F9FB", borderRadius: 9, padding: "10px 12px",
      marginBottom: 7, borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: NAVY }}>
          Wave {w.ora_inizio?.slice(0, 5) || "—"} · {w.operatore_nome || "—"}
        </div>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>
          {w.stato === "in_corso" ? `${w.perc_completamento}%` : w.stato}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, fontSize: 10, color: MUTED, fontWeight: 600 }}>
        <span><b style={{ color: NAVY }}>{w.commesse_ids?.length || 0}</b> commesse</span>
        <span><b style={{ color: NAVY }}>{w.n_articoli}</b> art.</span>
        <span><b style={{ color: NAVY }}>{w.tempo_stimato_min || "—"} min</b></span>
      </div>
      <div style={{ background: "#fff", height: 5, borderRadius: 99, overflow: "hidden", marginTop: 6 }}>
        <div style={{ height: "100%", width: `${w.perc_completamento}%`, background: `linear-gradient(90deg, ${TEAL}, #1a6b6b)` }} />
      </div>
    </div>
  );
}

function ConfrontoRow({ label, tempo, color, highlight }: any) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "6px 9px",
      background: highlight ? "rgba(40,160,160,0.1)" : "#F7F9FB",
      borderRadius: 6, fontSize: 11,
    }}>
      <span style={{ color: highlight ? NAVY : MUTED, fontWeight: highlight ? 700 : 400 }}>{label}</span>
      <span style={{ fontWeight: 800, color }}>{tempo}</span>
    </div>
  );
}

// ============================================================
// HELPERS condivisi
// ============================================================

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

function SezTit({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div style={{
      fontSize: 9.5, fontWeight: 800, color: NAVY,
      letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span>{children}</span>
      {count !== undefined && (
        <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function AlertCard({ kind, title, sub }: { kind: "urg" | "warn" | "info" | "good"; title: string; sub: string }) {
  const cfg: any = {
    urg: { bg: "#FCE3E3", col: RED },
    warn: { bg: "#FBF0DC", col: "#8B6926" },
    info: { bg: "#E3EDF9", col: "#2D5A8C" },
    good: { bg: "#D5EBE0", col: GREEN },
  };
  const c = cfg[kind];
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 9, fontSize: 11, marginBottom: 8,
      display: "flex", alignItems: "center", gap: 9,
      background: c.bg, color: c.col, borderLeft: `3px solid ${c.col}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 9.5, marginTop: 2, opacity: 0.9 }}>{sub}</div>
      </div>
    </div>
  );
}

const BoltIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
