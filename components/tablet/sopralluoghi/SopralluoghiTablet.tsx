"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

type Filtro = "oggi" | "settimana" | "futuri" | "completati" | "in_attesa";
type StatoSopr = "in_attesa" | "confermato" | "in_corso" | "completato" | "annullato";

interface Sopralluogo {
  id: string;
  numero: string;
  cliente: string;
  citta: string;
  indirizzo: string;
  data: string;
  ora: string;
  giorno: string;
  posatore: string;
  preset: "a" | "b" | "c" | "d" | "e";
  stato: StatoSopr;
  vani: number;
  note?: string;
}

const STATI: Record<StatoSopr, { label: string; tint: keyof typeof TINTS }> = {
  in_attesa:    { label: "In attesa",   tint: "amber"  },
  confermato:   { label: "Confermato",  tint: "blue"   },
  in_corso:     { label: "In corso",    tint: "teal"   },
  completato:   { label: "Completato",  tint: "green"  },
  annullato:    { label: "Annullato",   tint: "slate"  },
};

const TINTS = {
  amber: TT.amber, blue: TT.blue, teal: TT.teal,
  green: TT.green, slate: TT.slate, red: TT.red,
} as const;

const FILTRI: { id: Filtro; label: string; count: number; tint?: keyof typeof TINTS }[] = [
  { id: "oggi",       label: "Oggi",       count: 2,  tint: "red"   },
  { id: "settimana",  label: "Settimana",  count: 7,  tint: "blue"  },
  { id: "futuri",     label: "Futuri",     count: 12              },
  { id: "in_attesa",  label: "In attesa",  count: 4,  tint: "amber" },
  { id: "completati", label: "Completati", count: 28, tint: "green" },
];

const DATA: Sopralluogo[] = [
  { id: "s1",  numero: "SP-2026-068", cliente: "Fortini Anna",         citta: "Cosenza",       indirizzo: "Via Marconi 18",       data: "Oggi",     ora: "09:00", giorno: "Sab 25 apr", posatore: "Marco Esposito", preset: "a", stato: "confermato", vani: 6,  note: 'Appartamento 3 piano. Citofonare "Fortini".' },
  { id: "s2",  numero: "SP-2026-067", cliente: "De Luca Pasquale",     citta: "Mendicino",    indirizzo: "Via XX Settembre 22",  data: "Oggi",     ora: "15:00", giorno: "Sab 25 apr", posatore: "Luca Bianchi",   preset: "b", stato: "confermato", vani: 4 },
  { id: "s3",  numero: "SP-2026-069", cliente: "Greco Antonella",      citta: "Rende",        indirizzo: "Via Pinelli 8",        data: "Domani",   ora: "09:30", giorno: "Dom 26 apr", posatore: "Marco Esposito", preset: "c", stato: "confermato", vani: 5 },
  { id: "s4",  numero: "SP-2026-070", cliente: "Russo Industriale SRL",citta: "Castrolibero", indirizzo: "Via dell'Industria 4", data: "Lun 27 apr", ora: "10:00", giorno: "Lun 27 apr", posatore: "Walter Cozza",   preset: "d", stato: "confermato", vani: 18, note: "Capannone industriale, 18 vani serramenti grandi." },
  { id: "s5",  numero: "SP-2026-071", cliente: "Marino Edilizia SAS",  citta: "Cosenza",       indirizzo: "Via Roma 88",          data: "Mar 28 apr", ora: "11:30", giorno: "Mar 28 apr", posatore: "Walter Cozza",   preset: "e", stato: "in_attesa",  vani: 22 },
  { id: "s6",  numero: "SP-2026-072", cliente: "Fortini Anna",         citta: "Cosenza",       indirizzo: "Via Marconi 18",       data: "Mer 29 apr", ora: "14:00", giorno: "Mer 29 apr", posatore: "Marco Esposito", preset: "a", stato: "in_attesa",  vani: 6,  note: "Sopralluogo definitivo dopo prima visita." },
  { id: "s7",  numero: "SP-2026-073", cliente: "Russo Luigi",          citta: "Castrovillari",indirizzo: "Via Garibaldi 102",    data: "Gio 30 apr", ora: "09:00", giorno: "Gio 30 apr", posatore: "Luca Bianchi",   preset: "c", stato: "in_attesa",  vani: 3 },
  { id: "s8",  numero: "SP-2026-074", cliente: "Esposito Franco",      citta: "Rende",        indirizzo: "Via Garibaldi 45",     data: "Ven 1 mag",  ora: "10:30", giorno: "Ven 1 mag",  posatore: "Walter Cozza",   preset: "d", stato: "in_attesa",  vani: 8 },
];

export default function SopralluoghiTablet() {
  const [filtro, setFiltro] = React.useState<Filtro>("oggi");
  const [search, setSearch] = React.useState("");

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Sopralluoghi
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            8 sopralluoghi attivi &middot; 2 oggi &middot; 4 in attesa di conferma
          </div>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: TT.red[400],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 8px rgba(248,113,113,0.30)",
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo sopralluogo
        </button>
      </div>

      {/* KPI MINI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="sopralluoghi" label="Oggi"          value="2"  tint="red"   />
        <KpiMini icon="calendario"   label="Questa sett."  value="7"  tint="blue"  />
        <KpiMini icon="bell"         label="In attesa"     value="4"  tint="amber" />
        <KpiMini icon="check"        label="Completati mese" value="28" tint="green" />
      </div>

      {/* FILTRI + SEARCH */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {FILTRI.map((f) => {
            const ramp = f.tint ? TINTS[f.tint] : null;
            const isActive = f.id === filtro;
            return (
              <div
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                  color: isActive ? "#fff" : TT.text2,
                  border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {f.label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                  color: isActive ? "#fff" : (ramp ? ramp[500] : TT.text3),
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {f.count}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", width: 240 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={13} color={TT.text3} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca cliente, indirizzo..."
            style={{
              width: "100%", height: 36,
              padding: "0 12px 0 34px",
              background: TT.surface,
              border: `1px solid ${TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12, fontFamily: TT.fontFamily,
              color: TT.text1, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* LISTA - card grid 2 colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {DATA.map((s) => (
          <SopralluogoCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// KpiMini
// ============================================================

function KpiMini({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
      <div style={{
        width: 38, height: 38,
        borderRadius: 10,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: ramp[500], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SopralluogoCard
// ============================================================

function SopralluogoCard({ s }: { s: Sopralluogo }) {
  const stato = STATI[s.stato];
  const ramp = TINTS[stato.tint];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "14px 16px",
        cursor: "pointer",
        borderColor: hover ? ramp[100] : TT.border,
        boxShadow: hover ? `0 4px 12px ${ramp[100]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      {/* Header: data box + cliente */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 56,
          padding: "6px 4px",
          background: ramp[50],
          border: `1px solid ${ramp[100]}`,
          borderRadius: 10,
          textAlign: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: ramp[500], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>
            {s.giorno.split(" ")[0]}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>
            {s.giorno.split(" ")[1] || ""}
          </div>
          <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, marginTop: 2 }}>
            {s.giorno.split(" ")[2] || ""}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1, marginTop: 4, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${ramp[100]}`, paddingTop: 3 }}>
            {s.ora}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Riga 1: numero + stato */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{
              fontFamily: "monospace", fontSize: 10,
              color: TT.text3, fontWeight: 600,
            }}>
              {s.numero}
            </span>
            <span style={{
              padding: "1px 7px",
              background: ramp[100], color: ramp[500],
              borderRadius: 999,
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {stato.label}
            </span>
          </div>

          {/* Cliente */}
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: TT.text1, letterSpacing: "-0.2px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 3,
          }}>
            {s.cliente}
          </div>

          {/* Indirizzo */}
          <div style={{ fontSize: 11, color: TT.text2, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="sopralluoghi" size={11} color={TT.text3} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.indirizzo}, {s.citta}
            </span>
          </div>
        </div>
      </div>

      {/* Body: posatore + vani */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px",
        background: TT.bgSoft,
        borderRadius: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AvatarGradient size={28} preset={s.preset} />
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Posatore
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, letterSpacing: "-0.1px" }}>
              {s.posatore}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", textAlign: "right" }}>
            Vani
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px", textAlign: "right" }}>
            {s.vani}
          </div>
        </div>
      </div>

      {/* Note */}
      {s.note && (
        <div style={{
          marginTop: 8,
          padding: "6px 10px",
          background: TT.amber[50],
          border: `1px solid ${TT.amber[100]}`,
          borderRadius: 6,
          fontSize: 10,
          color: TT.text2,
          fontStyle: "italic",
          lineHeight: 1.4,
        }}>
          {s.note}
        </div>
      )}
    </div>
  );
}
