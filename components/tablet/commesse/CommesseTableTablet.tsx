"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";
import AvatarGradient from "../AvatarGradient";

export type StatoCommessa = "rilievo" | "preventivo" | "confermata" | "produzione" | "montaggio" | "consegnata";

export interface CommessaItem {
  id: string;
  numero: string;
  cliente: string;
  citta: string;
  vani: number;
  stato: StatoCommessa;
  valore: string;
  dataAggiornamento: string;
  preset: "a" | "b" | "c" | "d" | "e";
}

const STATI: Record<StatoCommessa, { label: string; tint: keyof typeof TINTS }> = {
  rilievo:    { label: "Rilievo",    tint: "amber"  },
  preventivo: { label: "Preventivo", tint: "blue"   },
  confermata: { label: "Confermata", tint: "violet" },
  produzione: { label: "Produzione", tint: "teal"   },
  montaggio:  { label: "Montaggio",  tint: "green"  },
  consegnata: { label: "Consegnata", tint: "slate"  },
};

const TINTS = {
  amber: TT.amber, blue: TT.blue, violet: TT.violet,
  teal: TT.teal, green: TT.green, slate: TT.slate,
} as const;

const DATA: CommessaItem[] = [
  { id: "C-2026-051", numero: "C-2026-051", cliente: "Verdi Giuseppe",   citta: "Cosenza",       vani: 8,  stato: "produzione", valore: "€ 12.450", dataAggiornamento: "2 ore fa",   preset: "a" },
  { id: "C-2026-050", numero: "C-2026-050", cliente: "Bianchi Maria",    citta: "Rende",         vani: 4,  stato: "confermata", valore: "€ 6.820",  dataAggiornamento: "5 ore fa",   preset: "b" },
  { id: "C-2026-049", numero: "C-2026-049", cliente: "Rossi & Co. SRL",  citta: "Castrolibero", vani: 12, stato: "montaggio",  valore: "€ 18.900", dataAggiornamento: "ieri",       preset: "c" },
  { id: "C-2026-048", numero: "C-2026-048", cliente: "Esposito Franco",  citta: "Mendicino",    vani: 3,  stato: "preventivo", valore: "€ 4.350",  dataAggiornamento: "2 giorni fa",preset: "d" },
  { id: "C-2026-047", numero: "C-2026-047", cliente: "De Luca Pasquale", citta: "Cosenza",      vani: 6,  stato: "rilievo",    valore: "€ 9.200",  dataAggiornamento: "3 giorni fa",preset: "e" },
  { id: "C-2026-046", numero: "C-2026-046", cliente: "Greco Antonella",  citta: "Rende",        vani: 5,  stato: "produzione", valore: "€ 7.890",  dataAggiornamento: "4 giorni fa",preset: "a" },
  { id: "C-2026-045", numero: "C-2026-045", cliente: "Marino Edilizia",  citta: "Cosenza",      vani: 18, stato: "confermata", valore: "€ 28.450", dataAggiornamento: "5 giorni fa",preset: "b" },
  { id: "C-2026-044", numero: "C-2026-044", cliente: "Russo Luigi",      citta: "Castrovillari",vani: 2,  stato: "consegnata", valore: "€ 3.120",  dataAggiornamento: "1 sett. fa", preset: "c" },
];

export interface CommesseTableTabletProps {
  onSelect?: (id: string) => void;
}

export default function CommesseTableTablet({ onSelect }: CommesseTableTabletProps) {
  const [hoverId, setHoverId] = React.useState<string | null>(null);

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            <Th>Numero</Th>
            <Th>Cliente</Th>
            <Th align="center">Vani</Th>
            <Th>Stato</Th>
            <Th align="right">Valore</Th>
            <Th>Aggiornata</Th>
            <Th align="center" width="44px">{""}</Th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((c) => {
            const s = STATI[c.stato];
            const ramp = TINTS[s.tint];
            const isHover = hoverId === c.id;
            return (
              <tr
                key={c.id}
                onMouseEnter={() => setHoverId(c.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onSelect?.(c.id)}
                style={{
                  background: isHover ? TT.teal[50] : "transparent",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  borderTop: `1px solid ${TT.border}`,
                }}
              >
                <Td>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: TT.text2, fontWeight: 600 }}>
                    {c.numero}
                  </div>
                </Td>
                <Td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AvatarGradient size={28} preset={c.preset} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.cliente}
                      </div>
                      <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
                        {c.citta}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td align="center">
                  <div style={{ color: TT.text2, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {c.vani}
                  </div>
                </Td>
                <Td>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "2px 8px",
                      background: ramp[100],
                      color: ramp[500],
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.label}
                  </span>
                </Td>
                <Td align="right">
                  <div style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {c.valore}
                  </div>
                </Td>
                <Td>
                  <div style={{ fontSize: 11, color: TT.text3 }}>
                    {c.dataAggiornamento}
                  </div>
                </Td>
                <Td align="center">
                  <Icon name="chevronRight" size={14} color={isHover ? TT.teal[500] : TT.text3} strokeWidth={2} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer paginazione */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderTop: `1px solid ${TT.border}`,
          background: TT.bgSoft,
          fontSize: 11,
          color: TT.text3,
        }}
      >
        <div>Mostro 8 di 38 commesse</div>
        <div style={{ display: "flex", gap: 6 }}>
          <PageBtn>Precedente</PageBtn>
          <PageBtn active>1</PageBtn>
          <PageBtn>2</PageBtn>
          <PageBtn>3</PageBtn>
          <PageBtn>Successiva</PageBtn>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align, width }: { children: React.ReactNode; align?: "left" | "center" | "right"; width?: string }) {
  return (
    <th style={{
      padding: "10px 14px",
      textAlign: align || "left",
      fontSize: 10,
      fontWeight: 700,
      color: TT.text3,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      width,
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      style={{
        padding: "4px 10px",
        background: active ? TT.teal[400] : TT.surface,
        color: active ? "#fff" : TT.text2,
        border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: TT.fontFamily,
      }}
    >
      {children}
    </button>
  );
}
