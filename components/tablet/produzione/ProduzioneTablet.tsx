"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

type ColonnaId = "da_iniziare" | "in_lavorazione" | "qa" | "pronto";

interface ColonnaDef {
  id: ColonnaId;
  label: string;
  tint: keyof typeof TINTS;
  icon: IconName;
}

interface CardProd {
  id: string;
  numero: string;
  cliente: string;
  preset: "a" | "b" | "c" | "d" | "e";
  vani: number;
  pezzi: number;
  sistema: string;
  consegna: string;
  giorniMancanti: number;
  progresso: number;
  posatore: string;
  posatoreAvatar: "a" | "b" | "c" | "d" | "e";
  priorita: "alta" | "media" | "bassa";
}

const TINTS = {
  blue: TT.blue, amber: TT.amber, violet: TT.violet,
  green: TT.green, red: TT.red, teal: TT.teal,
} as const;

const COLONNE: ColonnaDef[] = [
  { id: "da_iniziare",    label: "Da iniziare",        tint: "blue",   icon: "calendario" },
  { id: "in_lavorazione", label: "In lavorazione",     tint: "amber",  icon: "produzione" },
  { id: "qa",             label: "Controllo qualità", tint: "violet", icon: "fiscale"    },
  { id: "pronto",         label: "Pronto consegna",    tint: "green",  icon: "check"      },
];

const DATA: Record<ColonnaId, CardProd[]> = {
  da_iniziare: [
    { id: "p1", numero: "C-2026-053", cliente: "Marino Edilizia",  preset: "a", vani: 18, pezzi: 24, sistema: "Aluplast IDEAL 7000", consegna: "10 mag", giorniMancanti: 15, progresso: 0,  posatore: "Walter Cozza",   posatoreAvatar: "b", priorita: "alta" },
    { id: "p2", numero: "C-2026-052", cliente: "Bianchi Maria",    preset: "b", vani: 4,  pezzi: 6,  sistema: "Twin CX450",          consegna: "5 mag",  giorniMancanti: 10, progresso: 0,  posatore: "Marco Esposito", posatoreAvatar: "a", priorita: "media" },
    { id: "p3", numero: "C-2026-054", cliente: "Greco Antonella",  preset: "c", vani: 5,  pezzi: 8,  sistema: "Aluplast IDEAL 7000", consegna: "12 mag", giorniMancanti: 17, progresso: 0,  posatore: "Luca Bianchi",   posatoreAvatar: "e", priorita: "bassa" },
  ],
  in_lavorazione: [
    { id: "p4", numero: "C-2026-051", cliente: "Verdi Giuseppe",   preset: "d", vani: 8,  pezzi: 13, sistema: "Aluplast IDEAL 7000", consegna: "5 mag",  giorniMancanti: 10, progresso: 65, posatore: "Walter Cozza",   posatoreAvatar: "b", priorita: "alta" },
    { id: "p5", numero: "C-2026-050", cliente: "Esposito Franco",  preset: "e", vani: 3,  pezzi: 5,  sistema: "Aluplast ENERGETO",   consegna: "2 mag",  giorniMancanti: 7,  progresso: 40, posatore: "Marco Esposito", posatoreAvatar: "a", priorita: "alta" },
    { id: "p6", numero: "C-2026-049", cliente: "Russo Industriale",preset: "a", vani: 12, pezzi: 18, sistema: "Twin CX700",          consegna: "8 mag",  giorniMancanti: 13, progresso: 25, posatore: "Walter Cozza",   posatoreAvatar: "b", priorita: "media" },
  ],
  qa: [
    { id: "p7", numero: "C-2026-048", cliente: "Rossi & Co.",      preset: "b", vani: 6,  pezzi: 10, sistema: "Aluplast IDEAL 7000", consegna: "30 apr", giorniMancanti: 5,  progresso: 90, posatore: "Luca Bianchi",   posatoreAvatar: "e", priorita: "alta" },
    { id: "p8", numero: "C-2026-047", cliente: "De Luca Pasquale", preset: "c", vani: 4,  pezzi: 7,  sistema: "Aluplast IDEAL 7000", consegna: "29 apr", giorniMancanti: 4,  progresso: 95, posatore: "Marco Esposito", posatoreAvatar: "a", priorita: "alta" },
  ],
  pronto: [
    { id: "p9",  numero: "C-2026-046", cliente: "Fortini Anna",     preset: "d", vani: 6,  pezzi: 9,  sistema: "Aluplast IDEAL 7000", consegna: "27 apr", giorniMancanti: 2, progresso: 100, posatore: "Walter Cozza",   posatoreAvatar: "b", priorita: "alta" },
    { id: "p10", numero: "C-2026-045", cliente: "Russo Luigi",      preset: "e", vani: 2,  pezzi: 3,  sistema: "Aluplast IDEAL 7000", consegna: "26 apr", giorniMancanti: 1, progresso: 100, posatore: "Luca Bianchi",   posatoreAvatar: "e", priorita: "media" },
    { id: "p11", numero: "C-2026-044", cliente: "Marino G.",        preset: "a", vani: 3,  pezzi: 5,  sistema: "Twin CX450",          consegna: "Oggi",   giorniMancanti: 0, progresso: 100, posatore: "Marco Esposito", posatoreAvatar: "a", priorita: "alta" },
  ],
};

export default function ProduzioneTablet() {
  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Produzione
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            11 commesse attive &middot; 95 pezzi in lavorazione &middot; 3 pronte alla consegna
          </div>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: TT.blue[400],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 8px rgba(96,165,250,0.30)",
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Avvia produzione
        </button>
      </div>

      {/* KANBAN */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, alignItems: "flex-start" }}>
        {COLONNE.map((c) => (
          <Colonna key={c.id} colonna={c} cards={DATA[c.id]} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Colonna
// ============================================================

function Colonna({ colonna, cards }: { colonna: ColonnaDef; cards: CardProd[] }) {
  const ramp = TINTS[colonna.tint];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {/* Header colonna */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        background: ramp[50],
        border: `1px solid ${ramp[100]}`,
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26,
            borderRadius: 7,
            background: ramp[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={colonna.icon} size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ramp[500], letterSpacing: "-0.1px" }}>
            {colonna.label}
          </div>
        </div>
        <div style={{
          padding: "1px 8px",
          background: ramp[400],
          color: "#fff",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}>
          {cards.length}
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cards.map((c) => (
          <ProdCard key={c.id} card={c} colonnaTint={colonna.tint} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ProdCard
// ============================================================

function ProdCard({ card, colonnaTint }: { card: CardProd; colonnaTint: keyof typeof TINTS }) {
  const [hover, setHover] = React.useState(false);
  const ramp = TINTS[colonnaTint];

  // Priorita
  const prioColor =
    card.priorita === "alta" ? TT.red[400] :
    card.priorita === "media" ? TT.amber[400] :
    TT.slate[400];

  // Urgenza giorni
  const urgenzaTint =
    card.giorniMancanti <= 2 ? TT.red :
    card.giorniMancanti <= 7 ? TT.amber :
    TT.slate;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "12px 14px",
        cursor: "grab",
        boxShadow: hover ? `0 4px 12px ${ramp[100]}` : TT.shadowSm,
        borderColor: hover ? ramp[300] : TT.border,
        transition: "all 0.12s",
        position: "relative",
      })}
    >
      {/* Bordo priorita sinistra */}
      <div style={{
        position: "absolute",
        left: 0, top: 8, bottom: 8,
        width: 3,
        background: prioColor,
        borderRadius: "0 2px 2px 0",
      }} />

      {/* Header: numero + giorni */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: "monospace", fontSize: 10,
          color: TT.text3, fontWeight: 700,
        }}>
          {card.numero}
        </span>
        <span style={{
          padding: "1px 7px",
          background: urgenzaTint[100],
          color: urgenzaTint[500],
          borderRadius: 999,
          fontSize: 9, fontWeight: 700,
          letterSpacing: "0.2px",
          whiteSpace: "nowrap",
        }}>
          {card.giorniMancanti === 0 ? "OGGI" : `${card.giorniMancanti}g`}
        </span>
      </div>

      {/* Cliente */}
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: TT.text1, letterSpacing: "-0.15px",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        marginBottom: 8,
      }}>
        {card.cliente}
      </div>

      {/* Sistema */}
      <div style={{
        fontSize: 10, color: TT.text3,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        marginBottom: 8,
      }}>
        {card.sistema}
      </div>

      {/* Stats: vani + pezzi */}
      <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11 }}>
        <div>
          <span style={{ color: TT.text3, fontWeight: 600 }}>Vani: </span>
          <span style={{ color: TT.text1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{card.vani}</span>
        </div>
        <div>
          <span style={{ color: TT.text3, fontWeight: 600 }}>Pezzi: </span>
          <span style={{ color: TT.text1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{card.pezzi}</span>
        </div>
      </div>

      {/* Progresso */}
      {card.progresso > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Avanzamento
            </span>
            <span style={{ fontSize: 10, color: ramp[500], fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {card.progresso}%
            </span>
          </div>
          <div style={{ height: 5, background: TT.bgSoft, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${card.progresso}%`,
              background: ramp[400],
              borderRadius: 3,
            }} />
          </div>
        </div>
      )}

      {/* Footer: posatore + consegna */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        borderTop: `1px solid ${TT.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AvatarGradient size={22} preset={card.posatoreAvatar} />
          <span style={{
            fontSize: 10,
            color: TT.text2,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 80,
          }}>
            {card.posatore.split(" ")[0]}
          </span>
        </div>
        <div style={{ fontSize: 10, color: TT.text2, fontWeight: 600, letterSpacing: "-0.05px" }}>
          {card.consegna}
        </div>
      </div>
    </div>
  );
}
