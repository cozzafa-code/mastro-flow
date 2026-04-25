"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

const TINTS = {
  green: TT.green, blue: TT.blue, amber: TT.amber,
  violet: TT.violet, teal: TT.teal, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

interface Pratica {
  id: string;
  numero: string;
  cliente: string;
  commessa: string;
  tipo: TipoBonus;
  importoLordo: number;
  importoDetraibile: number;
  iva: 4 | 10 | 22;
  zonaClimatica: string;
  cam: boolean;
  enea: "inviata" | "da_inviare" | "non_richiesta";
  stato: StatoPratica;
}

type TipoBonus = "ecobonus_65" | "ecobonus_50" | "bonus_casa_50" | "iva_10" | "iva_4";
type StatoPratica = "aperta" | "in_lavorazione" | "completata" | "richiede_doc";

const TIPO_DEF: Record<TipoBonus, { label: string; tint: keyof typeof TINTS; norma: string; desc: string }> = {
  ecobonus_65:    { label: "Ecobonus 65%",    tint: "green",  norma: "DL 34/2020 art.119-ter",  desc: "Riqualificazione energetica" },
  ecobonus_50:    { label: "Ecobonus 50%",    tint: "blue",   norma: "L.296/2006 c.345",        desc: "Sostituzione infissi" },
  bonus_casa_50:  { label: "Bonus Casa 50%",  tint: "violet", norma: "DPR 917/86 art.16-bis",   desc: "Ristrutturazione edilizia" },
  iva_10:         { label: "IVA 10%",         tint: "amber",  norma: "DPR 633/72 tab.A III",    desc: "Manutenzione straord." },
  iva_4:          { label: "IVA 4%",          tint: "teal",   norma: "DPR 633/72 art.10",       desc: "Prima casa" },
};

const STATO_DEF: Record<StatoPratica, { label: string; tint: keyof typeof TINTS }> = {
  aperta:          { label: "Aperta",          tint: "blue"   },
  in_lavorazione:  { label: "In lavorazione",  tint: "amber"  },
  completata:      { label: "Completata",      tint: "green"  },
  richiede_doc:    { label: "Richiede doc.",   tint: "red"    },
};

const ENEA_DEF = {
  inviata:        { label: "Inviata ENEA",   tint: TT.green },
  da_inviare:     { label: "Da inviare",     tint: TT.amber },
  non_richiesta:  { label: "Non richiesta",  tint: TT.slate },
} as const;

const DATA: Pratica[] = [
  { id: "f1", numero: "PR-2026-024", cliente: "Verdi Giuseppe",   commessa: "C-2026-051", tipo: "ecobonus_65",   importoLordo: 12450, importoDetraibile: 8093, iva: 10, zonaClimatica: "C",  cam: true,  enea: "da_inviare",     stato: "in_lavorazione" },
  { id: "f2", numero: "PR-2026-023", cliente: "Bianchi Maria",    commessa: "C-2026-050", tipo: "ecobonus_50",   importoLordo: 6820,  importoDetraibile: 3410, iva: 10, zonaClimatica: "C",  cam: true,  enea: "inviata",        stato: "completata" },
  { id: "f3", numero: "PR-2026-022", cliente: "Rossi & Co. SRL",  commessa: "C-2026-049", tipo: "bonus_casa_50", importoLordo: 18900, importoDetraibile: 9450, iva: 22, zonaClimatica: "C",  cam: false, enea: "non_richiesta",  stato: "aperta"         },
  { id: "f4", numero: "PR-2026-021", cliente: "Esposito Franco",  commessa: "C-2026-048", tipo: "iva_10",        importoLordo: 4350,  importoDetraibile: 0,    iva: 10, zonaClimatica: "B",  cam: true,  enea: "non_richiesta",  stato: "completata"     },
  { id: "f5", numero: "PR-2026-020", cliente: "De Luca Pasquale", commessa: "C-2026-047", tipo: "ecobonus_65",   importoLordo: 9200,  importoDetraibile: 5980, iva: 10, zonaClimatica: "C",  cam: true,  enea: "da_inviare",     stato: "richiede_doc"   },
  { id: "f6", numero: "PR-2026-019", cliente: "Marino Edilizia",  commessa: "C-2026-053", tipo: "iva_4",         importoLordo: 28450, importoDetraibile: 0,    iva: 4,  zonaClimatica: "C",  cam: true,  enea: "non_richiesta",  stato: "aperta"         },
  { id: "f7", numero: "PR-2026-018", cliente: "Greco Antonella",  commessa: "C-2026-046", tipo: "ecobonus_50",   importoLordo: 7890,  importoDetraibile: 3945, iva: 10, zonaClimatica: "C",  cam: true,  enea: "inviata",        stato: "completata"     },
];

export default function FiscaleTablet() {
  const [filtro, setFiltro] = React.useState<"tutte" | TipoBonus>("tutte");

  const filtered = filtro === "tutte" ? DATA : DATA.filter((p) => p.tipo === filtro);
  const totDetraibile = DATA.reduce((s, p) => s + p.importoDetraibile, 0);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Fiscale
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            7 pratiche aperte &middot; € 30.878 detraibili &middot; 4 ENEA da inviare
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSecondario}>
            <Icon name="ai" size={13} color={TT.text2} strokeWidth={2.2} />
            Decisore IA
          </button>
          <button style={btnPrimario(TT.green[400], TT.green[300])}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
            Nuova pratica
          </button>
        </div>
      </div>

      {/* KPI 4 INDICATORI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="fiscale"  label="Pratiche aperte"   value="7"           tint="blue"   />
        <KpiMini icon="check"    label="Tot detraibile"     value={fmt(totDetraibile)}  tint="green"  />
        <KpiMini icon="bell"     label="ENEA da inviare"    value="4"           tint="amber"  />
        <KpiMini icon="x"        label="Doc. mancanti"      value="1"           tint="red"    />
      </div>

      {/* INFO BOX normative */}
      <div style={cardStyle({
        padding: "12px 16px",
        marginBottom: 14,
        background: TT.blue[50],
        borderColor: TT.blue[100],
      })}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: TT.blue[400],
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="ai" size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TT.blue[500], letterSpacing: "-0.1px", marginBottom: 2 }}>
              Decisore fiscale automatico attivo
            </div>
            <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.5 }}>
              Per ogni nuova pratica l'AI determina automaticamente IVA, detrazione applicabile e documenti necessari. Riferimenti: DPR 633/72, DPR 917/86 art.16-bis, L.296/2006, DL 34/2020.
            </div>
          </div>
        </div>
      </div>

      {/* FILTRI bonus */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <FiltroChip id="tutte" label="Tutte" count={DATA.length} active={filtro === "tutte"} onClick={() => setFiltro("tutte")} />
        {(Object.keys(TIPO_DEF) as TipoBonus[]).map((t) => {
          const def = TIPO_DEF[t];
          const count = DATA.filter((p) => p.tipo === t).length;
          return (
            <FiltroChip
              key={t}
              id={t}
              label={def.label}
              count={count}
              tint={def.tint}
              active={filtro === t}
              onClick={() => setFiltro(t)}
            />
          );
        })}
      </div>

      {/* TABELLA PRATICHE */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.bgSoft }}>
              <Th>Pratica / Cliente</Th>
              <Th>Tipologia bonus</Th>
              <Th align="center">IVA</Th>
              <Th align="center">CAM</Th>
              <Th align="right">Importo lordo</Th>
              <Th align="right">Detraibile</Th>
              <Th>ENEA</Th>
              <Th>Stato</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <PraticaRow key={p.id} pratica={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PraticaRow
// ============================================================

function PraticaRow({ pratica }: { pratica: Pratica }) {
  const tipo = TIPO_DEF[pratica.tipo];
  const tipoRamp = TINTS[tipo.tint];
  const stato = STATO_DEF[pratica.stato];
  const statoRamp = TINTS[stato.tint];
  const enea = ENEA_DEF[pratica.enea];
  const [hover, setHover] = React.useState(false);

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? tipoRamp[50] : "transparent",
        cursor: "pointer",
        borderTop: `1px solid ${TT.border}`,
      }}
    >
      <Td>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>
            {pratica.numero} &middot; {pratica.commessa}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
            {pratica.cliente}
          </div>
          <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
            Zona climatica: {pratica.zonaClimatica}
          </div>
        </div>
      </Td>
      <Td>
        <div>
          <span style={{
            display: "inline-block",
            padding: "2px 8px",
            background: tipoRamp[400],
            color: "#fff",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "-0.05px",
            marginBottom: 4,
          }}>
            {tipo.label}
          </span>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: TT.text3, fontWeight: 600 }}>
            {tipo.norma}
          </div>
        </div>
      </Td>
      <Td align="center">
        <span style={{
          display: "inline-flex",
          padding: "3px 9px",
          background: TT.bgSoft,
          color: TT.text1,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.1px",
        }}>
          {pratica.iva}%
        </span>
      </Td>
      <Td align="center">
        {pratica.cam ? (
          <Icon name="check" size={16} color={TT.green[500]} strokeWidth={3} />
        ) : (
          <Icon name="x" size={16} color={TT.slate[400]} strokeWidth={3} />
        )}
      </Td>
      <Td align="right">
        <div style={{ fontWeight: 700, color: TT.text2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {fmt(pratica.importoLordo)}
        </div>
      </Td>
      <Td align="right">
        <div style={{
          fontWeight: 800,
          color: pratica.importoDetraibile > 0 ? TT.green[500] : TT.text3,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}>
          {pratica.importoDetraibile > 0 ? fmt(pratica.importoDetraibile) : "—"}
        </div>
      </Td>
      <Td>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          background: enea.tint[100],
          color: enea.tint[500],
          borderRadius: 999,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
        }}>
          {enea.label}
        </span>
      </Td>
      <Td>
        <span style={{
          display: "inline-flex",
          padding: "2px 8px",
          background: statoRamp[100],
          color: statoRamp[500],
          borderRadius: 12,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
        }}>
          {stato.label}
        </span>
      </Td>
    </tr>
  );
}

// ============================================================
// Helpers
// ============================================================

function KpiMini({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
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
        <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function FiltroChip({
  id, label, count, tint, active, onClick,
}: { id: string; label: string; count: number; tint?: keyof typeof TINTS; active: boolean; onClick: () => void }) {
  const ramp = tint ? TINTS[tint] : null;
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: active ? (ramp ? ramp[400] : TT.text1) : TT.surface,
        color: active ? "#fff" : TT.text2,
        border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
        color: active ? "#fff" : (ramp ? ramp[500] : TT.text3),
        fontSize: 9, fontWeight: 700,
        padding: "1px 6px", borderRadius: 999,
        fontVariantNumeric: "tabular-nums",
      }}>
        {count}
      </span>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th style={{
      padding: "10px 12px",
      textAlign: align || "left",
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.6px", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td style={{ padding: "10px 12px", textAlign: align || "left", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

const btnSecondario: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 12px",
  background: TT.surface, color: TT.text2,
  border: `1px solid ${TT.borderStrong}`,
  borderRadius: 10, fontSize: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: TT.fontFamily,
};

function btnPrimario(bg: string, shadow: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 14px",
    background: bg, color: "#fff",
    border: "none", borderRadius: 10,
    fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: TT.fontFamily,
    boxShadow: `0 2px 8px ${shadow}`,
  };
}
