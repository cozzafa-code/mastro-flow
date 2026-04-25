"use client";
import * as React from "react";
import { TT, cardStyle } from "../../design-system";
import { Icon, IconName } from "../../icons";

type TipoDoc = "preventivo" | "contratto" | "foto" | "tecnico" | "fattura";
type FiltroTipo = "tutti" | TipoDoc;

interface Documento {
  id: string;
  nome: string;
  tipo: TipoDoc;
  dimensione: string;
  data: string;
  estensione: string;
}

const TIPI_DEF: Record<TipoDoc, { label: string; tint: keyof typeof TINTS; icon: IconName }> = {
  preventivo: { label: "Preventivo", tint: "blue",   icon: "preventivo" },
  contratto:  { label: "Contratto",  tint: "violet", icon: "documento"  },
  foto:       { label: "Foto",       tint: "green",  icon: "sopralluoghi" },
  tecnico:    { label: "Tecnico",    tint: "amber",  icon: "fiscale"    },
  fattura:    { label: "Fattura",    tint: "teal",   icon: "contabilita" },
};

const TINTS = {
  blue: TT.blue, violet: TT.violet, green: TT.green,
  amber: TT.amber, teal: TT.teal, slate: TT.slate,
} as const;

const FILTRI: { id: FiltroTipo; label: string; count: number }[] = [
  { id: "tutti",      label: "Tutti",      count: 12 },
  { id: "preventivo", label: "Preventivi", count: 3  },
  { id: "contratto",  label: "Contratti",  count: 2  },
  { id: "foto",       label: "Foto",       count: 4  },
  { id: "tecnico",    label: "Tecnici",    count: 2  },
  { id: "fattura",    label: "Fatture",    count: 1  },
];

const DATA: Documento[] = [
  { id: "d1",  nome: "Preventivo iniziale rev.1",   tipo: "preventivo", dimensione: "248 KB", data: "10 mar 2026", estensione: "pdf" },
  { id: "d2",  nome: "Preventivo aggiornato rev.2", tipo: "preventivo", dimensione: "267 KB", data: "18 mar 2026", estensione: "pdf" },
  { id: "d3",  nome: "Preventivo definitivo rev.3", tipo: "preventivo", dimensione: "284 KB", data: "25 mar 2026", estensione: "pdf" },
  { id: "d4",  nome: "Contratto vendita firmato",   tipo: "contratto",  dimensione: "412 KB", data: "28 mar 2026", estensione: "pdf" },
  { id: "d5",  nome: "Allegato condizioni speciali",tipo: "contratto",  dimensione: "156 KB", data: "28 mar 2026", estensione: "pdf" },
  { id: "d6",  nome: "Foto sopralluogo - facciata", tipo: "foto",       dimensione: "2.4 MB", data: "5 mar 2026",  estensione: "jpg" },
  { id: "d7",  nome: "Foto sopralluogo - cucina",   tipo: "foto",       dimensione: "1.8 MB", data: "5 mar 2026",  estensione: "jpg" },
  { id: "d8",  nome: "Foto sopralluogo - camere",   tipo: "foto",       dimensione: "2.1 MB", data: "5 mar 2026",  estensione: "jpg" },
  { id: "d9",  nome: "Foto cantiere apertura",      tipo: "foto",       dimensione: "1.6 MB", data: "20 apr 2026", estensione: "jpg" },
  { id: "d10", nome: "Scheda tecnica IDEAL 7000",   tipo: "tecnico",    dimensione: "1.2 MB", data: "12 mar 2026", estensione: "pdf" },
  { id: "d11", nome: "Marcatura CE - DoP",          tipo: "tecnico",    dimensione: "340 KB", data: "12 mar 2026", estensione: "pdf" },
  { id: "d12", nome: "Acconto 30% - Fattura 047",   tipo: "fattura",    dimensione: "98 KB",  data: "30 mar 2026", estensione: "pdf" },
];

export interface TabDocumentiTabletProps {
  onOpenDoc?: (id: string) => void;
  onUpload?: () => void;
}

export default function TabDocumentiTablet({ onOpenDoc, onUpload }: TabDocumentiTabletProps) {
  const [filtro, setFiltro] = React.useState<FiltroTipo>("tutti");

  const filtered = filtro === "tutti" ? DATA : DATA.filter((d) => d.tipo === filtro);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {FILTRI.map((f) => {
            const isActive = f.id === filtro;
            return (
              <div
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 11px",
                  background: isActive ? TT.text1 : TT.surface,
                  color: isActive ? "#fff" : TT.text2,
                  border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {f.label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : TT.bgSoft,
                  color: isActive ? "#fff" : TT.text3,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {f.count}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onUpload}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: TT.teal[400],
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 6px rgba(45,212,191,0.30)",
            flexShrink: 0,
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Carica documento
        </button>
      </div>

      {/* Grid 4 colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        {filtered.map((d) => (
          <DocCard key={d.id} doc={d} onOpen={() => onOpenDoc?.(d.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={cardStyle({ padding: "40px 28px", textAlign: "center", color: TT.text3, fontSize: 12 })}>
          Nessun documento in questa categoria.
        </div>
      )}
    </div>
  );
}

// ============================================================
// DocCard
// ============================================================

interface DocCardProps {
  doc: Documento;
  onOpen?: () => void;
}

function DocCard({ doc, onOpen }: DocCardProps) {
  const def = TIPI_DEF[doc.tipo];
  const ramp = TINTS[def.tint];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        borderColor: hover ? ramp[300] : TT.border,
        boxShadow: hover ? `0 4px 12px ${ramp[100]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      {/* Thumb */}
      <div
        style={{
          height: 110,
          background: ramp[50],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderBottom: `1px solid ${ramp[100]}`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: ramp[400],
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 6px 14px ${ramp[300]}`,
          }}
        >
          <Icon name={def.icon} size={26} color="#fff" strokeWidth={2.2} />
        </div>

        {/* Estensione badge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            padding: "2px 7px",
            background: TT.surface,
            color: TT.text2,
            borderRadius: 5,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            fontFamily: "monospace",
            border: `1px solid ${TT.border}`,
          }}
        >
          {doc.estensione}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TT.text1,
            letterSpacing: "-0.1px",
            marginBottom: 6,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {doc.nome}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10 }}>
          <span style={{
            display: "inline-flex",
            padding: "1px 6px",
            background: ramp[100],
            color: ramp[500],
            borderRadius: 999,
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}>
            {def.label}
          </span>
          <span style={{ color: TT.text3, fontVariantNumeric: "tabular-nums" }}>
            {doc.dimensione}
          </span>
        </div>

        <div style={{ fontSize: 10, color: TT.text3, marginTop: 5 }}>
          {doc.data}
        </div>
      </div>
    </div>
  );
}
