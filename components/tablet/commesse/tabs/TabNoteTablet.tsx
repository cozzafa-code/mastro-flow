"use client";
import * as React from "react";
import { TT, cardStyle } from "../../design-system";
import { Icon } from "../../icons";
import AvatarGradient from "../../AvatarGradient";

type CategoriaNota = "generale" | "tecnica" | "cliente" | "interna" | "urgente";

interface Nota {
  id: string;
  autore: string;
  ruolo: string;
  preset: "a" | "b" | "c" | "d" | "e";
  testo: string;
  categoria: CategoriaNota;
  data: string;
  oraRelativa: string;
}

const CATS: Record<CategoriaNota, { label: string; tint: keyof typeof TINTS }> = {
  generale: { label: "Generale", tint: "slate"  },
  tecnica:  { label: "Tecnica",  tint: "blue"   },
  cliente:  { label: "Cliente",  tint: "violet" },
  interna:  { label: "Interna",  tint: "teal"   },
  urgente:  { label: "Urgente",  tint: "red"    },
};

const TINTS = {
  slate: TT.slate, blue: TT.blue, violet: TT.violet,
  teal: TT.teal, red: TT.red,
} as const;

const DATA: Nota[] = [
  {
    id: "n1", autore: "Walter Cozza", ruolo: "Titolare", preset: "b",
    testo: "Cliente ha confermato che preferisce le maniglie in colore antracite invece del bianco standard. Aggiornare ordine fornitore.",
    categoria: "cliente", data: "23 apr 2026, 14:32", oraRelativa: "2 giorni fa",
  },
  {
    id: "n2", autore: "Marco Esposito", ruolo: "Posatore", preset: "a",
    testo: "Sopralluogo definitivo OK. Verificate dimensioni V-001 e V-002. Aggiornati i numeri di pezzo a 2+2 invece di 2+1 come da preventivo iniziale.",
    categoria: "tecnica", data: "20 apr 2026, 09:15", oraRelativa: "5 giorni fa",
  },
  {
    id: "n3", autore: "Walter Cozza", ruolo: "Titolare", preset: "b",
    testo: "ATTENZIONE: SAL del 5 maggio. Mandare reminder al cliente 2 giorni prima.",
    categoria: "urgente", data: "18 apr 2026, 17:44", oraRelativa: "1 settimana fa",
  },
  {
    id: "n4", autore: "Anna Verdi", ruolo: "Segreteria", preset: "c",
    testo: "Inviata mail di benvenuto con planning lavori e calendario consegne. Cliente ha risposto confermando le date proposte.",
    categoria: "interna", data: "15 apr 2026, 11:20", oraRelativa: "10 giorni fa",
  },
  {
    id: "n5", autore: "Walter Cozza", ruolo: "Titolare", preset: "b",
    testo: "Apertura commessa dopo accettazione preventivo definitivo rev.3. Importo totale concordato.",
    categoria: "generale", data: "28 mar 2026, 16:00", oraRelativa: "1 mese fa",
  },
];

export interface TabNoteTabletProps {
  onAddNota?: (testo: string, categoria: CategoriaNota) => void;
}

export default function TabNoteTablet({ onAddNota }: TabNoteTabletProps) {
  const [testo, setTesto] = React.useState("");
  const [cat, setCat] = React.useState<CategoriaNota>("generale");

  const handleSubmit = () => {
    if (!testo.trim()) return;
    onAddNota?.(testo, cat);
    setTesto("");
  };

  return (
    <div>
      {/* Composer nuova nota */}
      <div style={cardStyle({ padding: "14px 16px", marginBottom: 14 })}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AvatarGradient size={36} preset="b" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Scrivi una nota su questa commessa..."
              rows={2}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: TT.bgSoft,
                border: `1px solid ${TT.border}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: TT.fontFamily,
                color: TT.text1,
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {(Object.keys(CATS) as CategoriaNota[]).map((c) => {
                  const def = CATS[c];
                  const ramp = TINTS[def.tint];
                  const isActive = c === cat;
                  return (
                    <div
                      key={c}
                      onClick={() => setCat(c)}
                      style={{
                        padding: "3px 9px",
                        background: isActive ? ramp[400] : TT.surface,
                        color: isActive ? "#fff" : ramp[500],
                        border: `1px solid ${isActive ? "transparent" : ramp[100]}`,
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      {def.label}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!testo.trim()}
                style={{
                  padding: "7px 14px",
                  background: testo.trim() ? TT.teal[400] : TT.bgSoft,
                  color: testo.trim() ? "#fff" : TT.text3,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: testo.trim() ? "pointer" : "not-allowed",
                  fontFamily: TT.fontFamily,
                  letterSpacing: "-0.05px",
                  whiteSpace: "nowrap",
                }}
              >
                Pubblica nota
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista note */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DATA.map((n) => (
          <NotaCard key={n.id} nota={n} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// NotaCard
// ============================================================

function NotaCard({ nota }: { nota: Nota }) {
  const def = CATS[nota.categoria];
  const ramp = TINTS[def.tint];

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AvatarGradient size={36} preset={nota.preset} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header autore */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
              {nota.autore}
            </span>
            <span style={{ fontSize: 11, color: TT.text3 }}>{nota.ruolo}</span>
            <span style={{ fontSize: 10, color: TT.text3 }}>&middot;</span>
            <span style={{ fontSize: 11, color: TT.text3 }}>{nota.oraRelativa}</span>
            <span style={{
              marginLeft: "auto",
              padding: "1px 7px",
              background: ramp[100],
              color: ramp[500],
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}>
              {def.label}
            </span>
          </div>

          {/* Testo */}
          <div style={{ fontSize: 12, color: TT.text2, lineHeight: 1.55, letterSpacing: "-0.05px" }}>
            {nota.testo}
          </div>

          {/* Data assoluta */}
          <div style={{ fontSize: 10, color: TT.text3, marginTop: 6 }}>
            {nota.data}
          </div>
        </div>
      </div>
    </div>
  );
}
