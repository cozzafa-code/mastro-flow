"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

interface Categoria {
  id: string;
  label: string;
  funzioni: number;
  attive: number;
  tint: keyof typeof TINTS;
  icon: IconName;
}

const CATEGORIE: Categoria[] = [
  { id: "lead",        label: "Lead Mgmt",      funzioni: 5, attive: 3, tint: "violet", icon: "clienti"    },
  { id: "rilievo",     label: "Rilievo",        funzioni: 8, attive: 6, tint: "red",    icon: "sopralluoghi" },
  { id: "preventivo",  label: "Preventivo",     funzioni: 6, attive: 5, tint: "blue",   icon: "preventivo" },
  { id: "ordine",      label: "Ordine",         funzioni: 4, attive: 4, tint: "orange", icon: "ordini"     },
  { id: "produzione",  label: "Produzione",     funzioni: 7, attive: 5, tint: "amber",  icon: "produzione" },
  { id: "logistica",   label: "Logistica",      funzioni: 5, attive: 3, tint: "teal",   icon: "magazzino"  },
  { id: "montaggio",   label: "Montaggio",      funzioni: 6, attive: 6, tint: "green",  icon: "montaggi"   },
  { id: "fatturazione",label: "Fatturazione",   funzioni: 4, attive: 4, tint: "pink",   icon: "contabilita" },
  { id: "fiscale",     label: "Fiscale",        funzioni: 5, attive: 3, tint: "green",  icon: "fiscale"    },
  { id: "post_vendita",label: "Post-vendita",   funzioni: 4, attive: 2, tint: "blue",   icon: "chat"       },
  { id: "marketing",   label: "Marketing",      funzioni: 3, attive: 1, tint: "violet", icon: "trendUp"    },
  { id: "hr",          label: "HR",             funzioni: 2, attive: 2, tint: "slate",  icon: "team"       },
  { id: "amministr",   label: "Amministr.",     funzioni: 2, attive: 2, tint: "amber",  icon: "fiscale"    },
];

interface Funzione {
  id: string;
  codice: string;
  nome: string;
  categoria: string;
  fase: string;
  stato: "attiva" | "manuale" | "disabilitata";
  esecuzioniMese: number;
  ultimaEsecuzione: string;
  trigger: "evento" | "tempo" | "manuale";
}

const STATO_DEF = {
  attiva:       { label: "Auto",     tint: TT.green },
  manuale:      { label: "Manuale",  tint: TT.amber },
  disabilitata: { label: "Off",      tint: TT.slate },
} as const;

const TRIGGER_DEF = {
  evento:  { label: "Evento",  icon: "trendUp" as IconName    },
  tempo:   { label: "Schedulato", icon: "calendario" as IconName },
  manuale: { label: "Manuale", icon: "task" as IconName       },
};

const FUNZIONI: Funzione[] = [
  { id: "f1", codice: "F-RIL-03",  nome: "Conferma rilievo dopo seconda visita",   categoria: "Rilievo",        fase: "Rilievo",      stato: "attiva",       esecuzioniMese: 12, ultimaEsecuzione: "2 ore fa",   trigger: "evento"  },
  { id: "f2", codice: "F-PRE-02",  nome: "Auto-genera preventivo da listino",       categoria: "Preventivo",     fase: "Preventivo",   stato: "attiva",       esecuzioniMese: 18, ultimaEsecuzione: "30 min fa", trigger: "evento"  },
  { id: "f3", codice: "F-PRO-04",  nome: "Notifica ritardo produzione",             categoria: "Produzione",     fase: "Produzione",   stato: "attiva",       esecuzioniMese: 4,  ultimaEsecuzione: "Ieri",       trigger: "tempo"   },
  { id: "f4", codice: "F-MON-01",  nome: "Pianifica intervento montaggio",           categoria: "Montaggio",      fase: "Montaggio",    stato: "attiva",       esecuzioniMese: 9,  ultimaEsecuzione: "5 ore fa",  trigger: "evento"  },
  { id: "f5", codice: "F-FAT-02",  nome: "Genera fattura SAL automatica",           categoria: "Fatturazione",   fase: "Fattura",      stato: "manuale",      esecuzioniMese: 6,  ultimaEsecuzione: "3 giorni fa",trigger: "manuale" },
  { id: "f6", codice: "F-FIS-01",  nome: "Invio dichiarazione ENEA",                 categoria: "Fiscale",        fase: "Post-vendita", stato: "manuale",      esecuzioniMese: 3,  ultimaEsecuzione: "1 sett. fa",trigger: "manuale" },
  { id: "f7", codice: "F-POS-02",  nome: "Reminder Google Review post-consegna",    categoria: "Post-vendita",   fase: "Post-vendita", stato: "attiva",       esecuzioniMese: 5,  ultimaEsecuzione: "Oggi",       trigger: "tempo"   },
  { id: "f8", codice: "F-MKT-01",  nome: "Pubblica auto su Facebook/Instagram",      categoria: "Marketing",      fase: "Marketing",    stato: "disabilitata", esecuzioniMese: 0,  ultimaEsecuzione: "—",     trigger: "evento"  },
];

export default function OpsTablet() {
  const [filtroCat, setFiltroCat] = React.useState<string>("tutte");

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            OPS &middot; Operations
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            61 funzioni in 13 categorie &middot; 47 attive &middot; 134 esecuzioni questo mese
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSecondario}>
            <Icon name="ai" size={13} color={TT.text2} strokeWidth={2.2} />
            Vocabolario
          </button>
          <button style={btnPrimario(TT.teal[400], TT.teal[300])}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
            Nuova funzione
          </button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div style={cardStyle({
        padding: "14px 18px",
        marginBottom: 14,
        background: TT.teal[50],
        borderColor: TT.teal[100],
      })}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: TT.teal[400],
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name="ai" size={22} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TT.teal[500], letterSpacing: "-0.1px", marginBottom: 3 }}>
              Conversational Ops Engine attivo
            </div>
            <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.55 }}>
              Le funzioni MASTRO si attivano automaticamente in base agli eventi del workflow (RILIEVO → PREVENTIVO → ORDINE → PRODUZIONE → MONTAGGIO → FATTURA → PAGATA). Vocabolario aziendale: 142 termini gergo serramentistico.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, paddingLeft: 16, borderLeft: `1px solid ${TT.teal[100]}` }}>
            <BannerStat label="Attive" value="47" tint="green" />
            <BannerStat label="Manuali" value="11" tint="amber" />
            <BannerStat label="Off" value="3" tint="slate" />
          </div>
        </div>
      </div>

      {/* GRIGLIA CATEGORIE */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TT.text2, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8 }}>
          13 Categorie funzionali
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          <CategoriaTile
            id="tutte"
            label="Tutte"
            funzioni={61}
            attive={47}
            tint="slate"
            icon="dashboard"
            active={filtroCat === "tutte"}
            onClick={() => setFiltroCat("tutte")}
          />
          {CATEGORIE.slice(0, 6).map((c) => (
            <CategoriaTile key={c.id} {...c} active={filtroCat === c.id} onClick={() => setFiltroCat(c.id)} />
          ))}
          {CATEGORIE.slice(6).map((c) => (
            <CategoriaTile key={c.id} {...c} active={filtroCat === c.id} onClick={() => setFiltroCat(c.id)} />
          ))}
        </div>
      </div>

      {/* TABELLA FUNZIONI */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: TT.bgSoft,
          borderBottom: `1px solid ${TT.border}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
            Funzioni recenti
          </div>
          <div style={{ fontSize: 11, color: TT.teal[500], fontWeight: 700, cursor: "pointer" }}>
            Vedi tutte (61) &rsaquo;
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.surface }}>
              <Th>Codice / Funzione</Th>
              <Th>Categoria</Th>
              <Th>Fase</Th>
              <Th>Trigger</Th>
              <Th align="center">Esec. mese</Th>
              <Th>Ultima esec.</Th>
              <Th align="right">Stato</Th>
            </tr>
          </thead>
          <tbody>
            {FUNZIONI.map((f) => (
              <FunzioneRow key={f.id} f={f} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// CategoriaTile
// ============================================================

function CategoriaTile({
  label, funzioni, attive, tint, icon, active, onClick,
}: { label: string; funzioni: number; attive: number; tint: keyof typeof TINTS; icon: IconName; active: boolean; onClick: () => void; id?: string; }) {
  const ramp = TINTS[tint];
  const pct = Math.round((attive / Math.max(1, funzioni)) * 100);
  return (
    <div
      onClick={onClick}
      style={cardStyle({
        padding: "10px 10px",
        cursor: "pointer",
        background: active ? ramp[400] : TT.surface,
        borderColor: active ? "transparent" : TT.border,
        boxShadow: active ? `0 4px 10px ${ramp[300]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: active ? "rgba(255,255,255,0.22)" : ramp[100],
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 6,
      }}>
        <Icon name={icon} size={14} color={active ? "#fff" : ramp[500]} strokeWidth={2.4} />
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: active ? "#fff" : TT.text1,
        letterSpacing: "-0.05px",
        marginBottom: 3,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 9,
        color: active ? "rgba(255,255,255,0.85)" : TT.text3,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}>
        {attive}/{funzioni} attive &middot; {pct}%
      </div>
    </div>
  );
}

function BannerStat({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// FunzioneRow
// ============================================================

function FunzioneRow({ f }: { f: Funzione }) {
  const stato = STATO_DEF[f.stato];
  const trigger = TRIGGER_DEF[f.trigger];
  const [hover, setHover] = React.useState(false);

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? TT.teal[50] : "transparent",
        cursor: "pointer",
        borderTop: `1px solid ${TT.border}`,
      }}
    >
      <Td>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: TT.text3, marginBottom: 2 }}>
            {f.codice}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: TT.text1,
            letterSpacing: "-0.1px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 280,
          }}>
            {f.nome}
          </div>
        </div>
      </Td>
      <Td>
        <span style={{
          padding: "2px 8px",
          background: TT.bgSoft,
          color: TT.text2,
          border: `1px solid ${TT.border}`,
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}>
          {f.categoria}
        </span>
      </Td>
      <Td>
        <span style={{ fontSize: 11, color: TT.text2, fontWeight: 600 }}>
          {f.fase}
        </span>
      </Td>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name={trigger.icon} size={12} color={TT.text3} strokeWidth={2.2} />
          <span style={{ fontSize: 11, color: TT.text2, fontWeight: 500 }}>
            {trigger.label}
          </span>
        </div>
      </Td>
      <Td align="center">
        <div style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>
          {f.esecuzioniMese}
        </div>
      </Td>
      <Td>
        <span style={{ fontSize: 11, color: TT.text3 }}>
          {f.ultimaEsecuzione}
        </span>
      </Td>
      <Td align="right">
        <span style={{
          display: "inline-flex",
          padding: "2px 9px",
          background: stato.tint[100],
          color: stato.tint[500],
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
        }}>
          {stato.label}
        </span>
      </Td>
    </tr>
  );
}

// ============================================================
// helpers
// ============================================================

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
