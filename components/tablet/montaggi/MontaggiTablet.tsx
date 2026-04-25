"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

type StatoMont = "pianificato" | "in_corso" | "completato" | "rinviato";

interface Membro {
  nome: string;
  preset: "a" | "b" | "c" | "d" | "e";
}

interface Intervento {
  id: string;
  ora: string;
  durata: string;
  cliente: string;
  indirizzo: string;
  vani: number;
  pezzi: number;
  squadra: Membro[];
  stato: StatoMont;
  numero: string;
}

interface Giorno {
  data: string;
  giorno: string;
  giornoNum: number;
  isOggi?: boolean;
  interventi: Intervento[];
}

const STATI: Record<StatoMont, { label: string; tint: keyof typeof TINTS }> = {
  pianificato: { label: "Pianificato", tint: "blue"   },
  in_corso:    { label: "In corso",    tint: "amber"  },
  completato:  { label: "Completato",  tint: "green"  },
  rinviato:    { label: "Rinviato",    tint: "red"    },
};

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  red: TT.red, teal: TT.teal, violet: TT.violet,
} as const;

const DATA: Giorno[] = [
  {
    data: "Oggi", giorno: "Sab", giornoNum: 25, isOggi: true,
    interventi: [
      { id: "m1", numero: "C-2026-046", ora: "08:30", durata: "4h", cliente: "Fortini Anna",      indirizzo: "Via Marconi 18, Cosenza", vani: 6,  pezzi: 9,  squadra: [{nome:"Marco Esposito",preset:"a"},{nome:"Luca Bianchi",preset:"e"}], stato: "in_corso" },
      { id: "m2", numero: "C-2026-050", ora: "14:30", durata: "3h", cliente: "Esposito Franco",   indirizzo: "Via Garibaldi 45, Rende", vani: 3,  pezzi: 5,  squadra: [{nome:"Marco Esposito",preset:"a"},{nome:"Luca Bianchi",preset:"e"}], stato: "pianificato" },
    ],
  },
  {
    data: "Lun 27 apr", giorno: "Lun", giornoNum: 27,
    interventi: [
      { id: "m3", numero: "C-2026-045", ora: "09:00", durata: "5h", cliente: "Russo Luigi",       indirizzo: "Via Garibaldi 102, Castrovillari", vani: 2, pezzi: 3, squadra: [{nome:"Walter Cozza",preset:"b"}], stato: "pianificato" },
      { id: "m4", numero: "C-2026-049", ora: "15:00", durata: "4h", cliente: "Rossi & Co. SRL",   indirizzo: "Via Roma 88, Castrolibero",         vani: 6, pezzi: 10,squadra: [{nome:"Marco Esposito",preset:"a"},{nome:"Luca Bianchi",preset:"e"}], stato: "pianificato" },
    ],
  },
  {
    data: "Mar 28 apr", giorno: "Mar", giornoNum: 28,
    interventi: [
      { id: "m5", numero: "C-2026-047", ora: "08:00", durata: "6h", cliente: "De Luca Pasquale",  indirizzo: "Via XX Settembre 22, Mendicino",   vani: 4, pezzi: 7, squadra: [{nome:"Walter Cozza",preset:"b"},{nome:"Marco Esposito",preset:"a"}], stato: "pianificato" },
    ],
  },
  {
    data: "Mer 29 apr", giorno: "Mer", giornoNum: 29,
    interventi: [
      { id: "m6", numero: "C-2026-051", ora: "08:30", durata: "8h", cliente: "Verdi Giuseppe G1", indirizzo: "Via Roma 12, Cosenza",             vani: 4, pezzi: 7, squadra: [{nome:"Walter Cozza",preset:"b"},{nome:"Marco Esposito",preset:"a"},{nome:"Luca Bianchi",preset:"e"}], stato: "pianificato" },
    ],
  },
];

export default function MontaggiTablet() {
  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Montaggi
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            6 interventi questa settimana &middot; 2 squadre attive &middot; 35 ore stimate
          </div>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: TT.green[400],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 8px rgba(74,222,128,0.30)",
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Pianifica montaggio
        </button>
      </div>

      {/* LAYOUT 2 COLONNE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "flex-start" }}>
        {/* Colonna sinistra - lista per giorni */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DATA.map((g) => (
            <GiornoBlock key={g.data} giorno={g} />
          ))}
        </div>

        {/* Colonna destra - sidebar squadre */}
        <SidebarSquadre />
      </div>
    </div>
  );
}

// ============================================================
// GiornoBlock
// ============================================================

function GiornoBlock({ giorno }: { giorno: Giorno }) {
  const headerTint = giorno.isOggi ? TT.teal : TT.slate;

  return (
    <div>
      {/* Header giorno */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}>
        <div style={{
          width: 44,
          padding: "5px 4px",
          background: giorno.isOggi ? TT.teal[400] : TT.surface,
          border: giorno.isOggi ? "none" : `1px solid ${TT.borderStrong}`,
          borderRadius: 8,
          textAlign: "center",
          flexShrink: 0,
          boxShadow: giorno.isOggi ? "0 2px 6px rgba(45,212,191,0.30)" : "none",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: giorno.isOggi ? "rgba(255,255,255,0.85)" : TT.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
            {giorno.giorno}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: giorno.isOggi ? "#fff" : TT.text1, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px", marginTop: 2 }}>
            {giorno.giornoNum}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            {giorno.data}
          </div>
          <div style={{ fontSize: 11, color: TT.text3 }}>
            {giorno.interventi.length} intervent{giorno.interventi.length === 1 ? "o" : "i"}
          </div>
        </div>
      </div>

      {/* Lista interventi */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {giorno.interventi.map((i) => (
          <InterventoCard key={i.id} intervento={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// InterventoCard
// ============================================================

function InterventoCard({ intervento }: { intervento: Intervento }) {
  const stato = STATI[intervento.stato];
  const ramp = TINTS[stato.tint];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "12px 16px",
        cursor: "pointer",
        borderColor: hover ? ramp[100] : TT.border,
        boxShadow: hover ? `0 4px 12px ${ramp[100]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Ora + durata */}
        <div style={{
          minWidth: 64,
          padding: "8px 6px",
          background: ramp[50],
          border: `1px solid ${ramp[100]}`,
          borderRadius: 8,
          textAlign: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px", lineHeight: 1 }}>
            {intervento.ora}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: ramp[500], opacity: 0.7, marginTop: 2, letterSpacing: "0.3px" }}>
            {intervento.durata}
          </div>
        </div>

        {/* Cliente + indirizzo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 600 }}>
              {intervento.numero}
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
          <div style={{
            fontSize: 13, fontWeight: 700, color: TT.text1,
            letterSpacing: "-0.15px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 2,
          }}>
            {intervento.cliente}
          </div>
          <div style={{ fontSize: 11, color: TT.text2, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="sopralluoghi" size={11} color={TT.text3} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {intervento.indirizzo}
            </span>
          </div>
        </div>

        {/* Vani / Pezzi */}
        <div style={{ display: "flex", gap: 14, paddingLeft: 14, borderLeft: `1px solid ${TT.border}`, flexShrink: 0 }}>
          <Stat label="Vani" value={intervento.vani} />
          <Stat label="Pezzi" value={intervento.pezzi} />
        </div>

        {/* Squadra avatars */}
        <div style={{ display: "flex", alignItems: "center", paddingLeft: 14, borderLeft: `1px solid ${TT.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "row-reverse" }}>
            {[...intervento.squadra].reverse().map((m, i) => (
              <div
                key={i}
                style={{
                  marginLeft: i === intervento.squadra.length - 1 ? 0 : -10,
                  border: `2px solid ${TT.surface}`,
                  borderRadius: "50%",
                  display: "flex",
                }}
                title={m.nome}
              >
                <AvatarGradient size={28} preset={m.preset} />
              </div>
            ))}
          </div>
        </div>

        {/* Chevron */}
        <Icon name="chevronRight" size={16} color={hover ? ramp[500] : TT.text3} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// SidebarSquadre - colonna destra
// ============================================================

function SidebarSquadre() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* KPI mini */}
      <div style={cardStyle({ padding: "14px 16px" })}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 12, letterSpacing: "-0.1px" }}>
          Settimana corrente
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <KpiCell label="Interventi" value="6"  tint="green" />
          <KpiCell label="Vani tot."  value="25" tint="blue"  />
          <KpiCell label="Pezzi tot." value="41" tint="amber" />
          <KpiCell label="Ore stimate" value="35" tint="violet" />
        </div>
      </div>

      {/* Squadre disponibili */}
      <div style={cardStyle({ padding: "14px 16px" })}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 10, letterSpacing: "-0.1px" }}>
          Squadre disponibili
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SquadraRow nome="Squadra A" membri={[{nome:"Walter",preset:"b"}]} occupazione={45} />
          <SquadraRow nome="Squadra B" membri={[{nome:"Marco",preset:"a"},{nome:"Luca",preset:"e"}]} occupazione={85} />
          <SquadraRow nome="Squadra C" membri={[]} occupazione={0} />
        </div>
      </div>
    </div>
  );
}

function KpiCell({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "8px 10px",
      background: ramp[50],
      border: `1px solid ${ramp[100]}`,
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: ramp[500], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function SquadraRow({ nome, membri, occupazione }: { nome: string; membri: Membro[]; occupazione: number }) {
  const tint =
    occupazione === 0 ? TT.slate :
    occupazione < 60 ? TT.green :
    occupazione < 85 ? TT.amber :
    TT.red;

  return (
    <div style={{
      padding: "8px 10px",
      background: TT.bgSoft,
      borderRadius: 8,
      border: `1px solid ${TT.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1, letterSpacing: "-0.05px" }}>
          {nome}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: tint[500], fontVariantNumeric: "tabular-nums" }}>
          {occupazione}%
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex" }}>
          {membri.length > 0 ? membri.map((m, i) => (
            <div
              key={i}
              style={{
                marginLeft: i === 0 ? 0 : -8,
                border: `2px solid ${TT.bgSoft}`,
                borderRadius: "50%",
                display: "flex",
              }}
            >
              <AvatarGradient size={24} preset={m.preset} />
            </div>
          )) : (
            <span style={{ fontSize: 10, color: TT.text3, fontStyle: "italic" }}>Nessun membro</span>
          )}
        </div>
        <div style={{ flex: 1, height: 4, background: TT.surface, borderRadius: 2, overflow: "hidden", maxWidth: 80 }}>
          <div style={{
            height: "100%",
            width: `${occupazione}%`,
            background: tint[400],
            borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}
