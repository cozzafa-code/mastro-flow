"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

interface Movimento {
  id: string;
  data_movimento: string;
  tipo: string;
  articolo_id: string;
  articolo_nome: string | null;
  quantita: number;
  prezzo_unitario: number | null;
  scorta_prima: number | null;
  scorta_dopo: number | null;
  causale: string | null;
  note: string | null;
  ddt_numero: string | null;
  operatore_nome: string | null;
  commessa_code: string | null;
}

type FilterTipo = "tutti" | "carico" | "scarico" | "rettifica" | "reso";

export default function VistaMovimenti({ mag }: { mag: any }) {
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTipo>("tutti");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("movimenti_magazzino")
        .select("id, data_movimento, tipo, articolo_id, quantita, prezzo_unitario, scorta_prima, scorta_dopo, causale, note, ddt_numero, operatore_nome, articoli_magazzino(nome), commesse(code)")
        .order("data_movimento", { ascending: false })
        .limit(100);

      const mov = (data || []).map((m: any) => ({
        ...m,
        articolo_nome: m.articoli_magazzino?.nome || null,
        commessa_code: m.commesse?.code || null,
      }));
      setMovimenti(mov as any);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "tutti" ? movimenti : movimenti.filter(m => m.tipo === filter);

  // Raggruppa per data
  const byDay = filtered.reduce((acc, m) => {
    const d = m.data_movimento.split("T")[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {} as Record<string, Movimento[]>);

  return (
    <div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
        <Pill active={filter === "tutti"} onClick={() => setFilter("tutti")} count={movimenti.length}>Tutti</Pill>
        <Pill active={filter === "carico"} onClick={() => setFilter("carico")} color={GREEN}>Carichi</Pill>
        <Pill active={filter === "scarico"} onClick={() => setFilter("scarico")} color={TEAL}>Scarichi</Pill>
        <Pill active={filter === "rettifica"} onClick={() => setFilter("rettifica")} color={AMBER}>Rettifiche</Pill>
        <Pill active={filter === "reso"} onClick={() => setFilter("reso")} color={"#5C2D8C"}>Resi</Pill>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: MUTED }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessun movimento trovato
        </div>
      ) : (
        Object.entries(byDay).map(([data, mov]) => (
          <div key={data} style={sezStyle}>
            <div style={{
              fontSize: 9.5, fontWeight: 800, color: NAVY,
              letterSpacing: 0.8, textTransform: "uppercase",
              marginBottom: 8, display: "flex", justifyContent: "space-between",
            }}>
              <span>{formatDate(data)}</span>
              <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10 }}>
                {mov.length}
              </span>
            </div>
            {mov.map(m => <MovRow key={m.id} m={m} />)}
          </div>
        ))
      )}
    </div>
  );
}

function MovRow({ m }: { m: Movimento }) {
  const cfg = tipoConfig(m.tipo);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: "1px solid #E5EAF0" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7, background: cfg.bg, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        fontSize: 14, fontWeight: 800,
      }}>{cfg.sym}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {m.articolo_nome || "—"}
        </div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
          {cfg.lbl} {m.commessa_code && `· ${m.commessa_code}`} {m.ddt_numero && `· DDT ${m.ddt_numero}`} {m.operatore_nome && `· ${m.operatore_nome}`}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: cfg.bg }}>
          {cfg.sym}{Math.abs(m.quantita)}
        </div>
        <div style={{ fontSize: 9, color: MUTED }}>
          {m.scorta_prima} → {m.scorta_dopo}
        </div>
      </div>
    </div>
  );
}

function tipoConfig(tipo: string) {
  const m: Record<string, any> = {
    carico: { bg: GREEN, sym: "+", lbl: "Carico" },
    scarico: { bg: TEAL, sym: "−", lbl: "Scarico" },
    rettifica: { bg: AMBER, sym: "=", lbl: "Rettifica" },
    reso: { bg: "#5C2D8C", sym: "↺", lbl: "Reso" },
    trasferimento: { bg: NAVY, sym: "↔", lbl: "Trasferim." },
  };
  return m[tipo] || { bg: MUTED, sym: "·", lbl: tipo };
}

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Oggi";
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return "Ieri";
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function Pill({ children, active, onClick, count, color }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px",
      background: active ? (color || TEAL) : "#fff",
      borderRadius: 99, fontSize: 10, fontWeight: 800,
      color: active ? "#fff" : MUTED,
      border: `1px solid ${active ? (color || TEAL) : "#D8DEE5"}`,
      letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {children}
      {count !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.3)" : "#E5EAF0",
          color: active ? "#fff" : MUTED,
          padding: "0 5px", borderRadius: 99, fontSize: 9,
        }}>{count}</span>
      )}
    </button>
  );
}

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};
