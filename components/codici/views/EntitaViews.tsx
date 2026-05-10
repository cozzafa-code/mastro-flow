"use client";
// MASTRO CODICI - Viste contestuali per 6 tipi entità (articolo/cantiere/documento/macchina/furgone/fornitore_esterno)
// Stile coerente con GenericoView/VanoView (dark teal mobile-first)
import * as React from "react";
import type { NextAction, Ruolo } from "@/lib/codici/types";

const C = {
  bg: "#0D1F1F",
  card: "#162E2E",
  cardSoft: "#1F3D3D",
  teal: "#28A0A0",
  tealDark: "#1a6b6b",
  tealLight: "#5DCDCD",
  light: "#EEF8F8",
  lightDim: "#EEF8F899",
  lightFaint: "#EEF8F855",
  border: "#2A4747",
  amber: "#E6A23C",
  amberTint: "#3D2D14",
  red: "#E25C5C",
  redTint: "#3D1F1F",
  green: "#2BB673",
  greenTint: "#0F2E1F",
};

interface ViewProps {
  nextAction: NextAction;
  ruolo: Ruolo;
  short: string;
}

// ============================================================
// ARTICOLO
// ============================================================
export function ArticoloView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  return (
    <Layout short={short} tipoLabel="ARTICOLO" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="📦">{p.descrizione || p.nome || "Articolo"}</Title>

      <FieldGrid>
        <Field label="Codice articolo" value={p.codice_articolo || p.sku || "—"} mono />
        <Field label="Categoria" value={p.categoria || "—"} />
        {p.fornitore && <Field label="Fornitore" value={p.fornitore} />}
        {p.qta != null && <Field label="Quantità" value={`${p.qta} ${p.um || ""}`.trim()} accent />}
        {p.prezzo_unitario != null && <Field label="Prezzo unit." value={`€ ${Number(p.prezzo_unitario).toFixed(2)}`} />}
        {p.lotto && <Field label="Lotto" value={p.lotto} mono />}
      </FieldGrid>

      {p.commessa_code && (
        <InfoBox label="Commessa di destinazione" value={p.commessa_code} accent="teal" />
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// CANTIERE
// ============================================================
export function CantiereView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  return (
    <Layout short={short} tipoLabel="CANTIERE" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="🏗️">{p.nome || p.indirizzo || "Cantiere"}</Title>

      <FieldGrid>
        {p.indirizzo && <Field label="Indirizzo" value={p.indirizzo} fullWidth />}
        {p.citta && <Field label="Città" value={p.citta} />}
        {p.cap && <Field label="CAP" value={p.cap} mono />}
        {p.referente && <Field label="Referente" value={p.referente} />}
        {p.telefono && <Field label="Telefono" value={p.telefono} mono />}
      </FieldGrid>

      {(p.lat && p.lng) && (
        <InfoBox label="Coordinate GPS" value={`${p.lat}, ${p.lng}`} accent="teal" mono />
      )}

      {p.commessa_code && (
        <InfoBox label="Commessa attiva" value={p.commessa_code} accent="amber" />
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// DOCUMENTO
// ============================================================
export function DocumentoView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  const tipo = p.tipo_documento || p.tipo || "Documento";
  return (
    <Layout short={short} tipoLabel="DOCUMENTO" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="📄">{tipo}</Title>

      <FieldGrid>
        {p.numero && <Field label="Numero" value={p.numero} mono />}
        {p.data && <Field label="Data" value={fmtDate(p.data)} />}
        {p.cliente && <Field label="Cliente" value={p.cliente} fullWidth />}
        {p.totale != null && <Field label="Totale" value={`€ ${Number(p.totale).toFixed(2)}`} accent />}
        {p.scadenza && <Field label="Scadenza" value={fmtDate(p.scadenza)} />}
      </FieldGrid>

      {p.url_pdf && (
        <a href={p.url_pdf} target="_blank" rel="noreferrer" style={{
          display: "block", marginTop: 16, padding: "14px 18px",
          background: C.cardSoft, border: `1px solid ${C.border}`,
          borderRadius: 12, color: C.tealLight,
          fontSize: 14, fontWeight: 700, textAlign: "center",
          textDecoration: "none",
        }}>📥 Scarica PDF</a>
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// MACCHINA (macchinario aziendale)
// ============================================================
export function MacchinaView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  return (
    <Layout short={short} tipoLabel="MACCHINARIO" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="🔧">{p.nome || p.modello || "Macchinario"}</Title>

      <FieldGrid>
        {p.marca && <Field label="Marca" value={p.marca} />}
        {p.modello && <Field label="Modello" value={p.modello} />}
        {p.matricola && <Field label="Matricola" value={p.matricola} mono fullWidth />}
        {p.anno && <Field label="Anno" value={String(p.anno)} />}
        {p.ubicazione && <Field label="Ubicazione" value={p.ubicazione} />}
        {p.ore_funzionamento != null && <Field label="Ore funz." value={`${p.ore_funzionamento}h`} accent />}
      </FieldGrid>

      {p.prossima_manutenzione && (
        <InfoBox
          label="Prossima manutenzione"
          value={fmtDate(p.prossima_manutenzione)}
          accent={isOverdue(p.prossima_manutenzione) ? "red" : "amber"}
        />
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// FURGONE
// ============================================================
export function FurgoneView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  return (
    <Layout short={short} tipoLabel="FURGONE" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="🚐">{p.targa || p.modello || "Furgone"}</Title>

      <FieldGrid>
        {p.targa && <Field label="Targa" value={p.targa} mono />}
        {p.modello && <Field label="Modello" value={p.modello} />}
        {p.km != null && <Field label="Chilometraggio" value={`${Number(p.km).toLocaleString("it-IT")} km`} accent />}
        {p.autista && <Field label="Autista" value={p.autista} />}
      </FieldGrid>

      {p.scadenza_revisione && (
        <InfoBox
          label="Scadenza revisione"
          value={fmtDate(p.scadenza_revisione)}
          accent={isOverdue(p.scadenza_revisione) ? "red" : "amber"}
        />
      )}
      {p.scadenza_assicurazione && (
        <InfoBox
          label="Scadenza assicurazione"
          value={fmtDate(p.scadenza_assicurazione)}
          accent={isOverdue(p.scadenza_assicurazione) ? "red" : "amber"}
        />
      )}

      {p.commessa_consegna && (
        <InfoBox label="In consegna a" value={p.commessa_consegna} accent="teal" />
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// FORNITORE ESTERNO
// ============================================================
export function FornitoreEsternoView({ nextAction, ruolo, short }: ViewProps) {
  const p = nextAction.codice.payload || {};
  return (
    <Layout short={short} tipoLabel="FORNITORE" stato={nextAction.codice.stato} ruolo={ruolo}>
      <Title icon="🏭">{p.ragione_sociale || p.nome || "Fornitore"}</Title>

      <FieldGrid>
        {p.partita_iva && <Field label="P.IVA" value={p.partita_iva} mono />}
        {p.codice_fiscale && <Field label="C.F." value={p.codice_fiscale} mono />}
        {p.referente && <Field label="Referente" value={p.referente} />}
        {p.telefono && <Field label="Telefono" value={p.telefono} mono />}
        {p.email && <Field label="Email" value={p.email} fullWidth />}
        {p.categoria && <Field label="Categoria" value={p.categoria} />}
      </FieldGrid>

      {p.indirizzo && (
        <InfoBox label="Sede" value={p.indirizzo} accent="teal" />
      )}

      {(p.lat && p.lng) && (
        <a
          href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
          target="_blank" rel="noreferrer"
          style={{
            display: "block", marginTop: 12, padding: "12px 18px",
            background: C.cardSoft, border: `1px solid ${C.border}`,
            borderRadius: 12, color: C.tealLight,
            fontSize: 13, fontWeight: 700, textAlign: "center",
            textDecoration: "none",
          }}>📍 Apri su mappa</a>
      )}

      <CtaButton label={nextAction.label} priorita={nextAction.priorita} />
    </Layout>
  );
}

// ============================================================
// LAYOUT BASE
// ============================================================
const Layout: React.FC<{
  short: string; tipoLabel: string; stato: string; ruolo: string;
  children: React.ReactNode;
}> = ({ short, tipoLabel, stato, ruolo, children }) => (
  <div style={{
    minHeight: "100vh", background: C.bg, color: C.light,
    padding: "24px 20px 32px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: 480, margin: "0 auto",
  }}>
    {/* Header */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <div>
        <p style={{
          color: C.teal, fontSize: 11, textTransform: "uppercase",
          letterSpacing: 2, fontWeight: 700, margin: 0,
        }}>{tipoLabel}</p>
        <p style={{
          fontFamily: "monospace", fontSize: 13, color: C.lightDim,
          margin: "4px 0 0", letterSpacing: 1, fontWeight: 700,
        }}>{short}</p>
      </div>
      <StatoBadge stato={stato} />
    </div>

    {children}

    <p style={{
      marginTop: 28, fontSize: 10, color: C.lightFaint, textAlign: "center",
      letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700,
    }}>Ruolo: {ruolo}</p>
  </div>
);

const Title: React.FC<{ icon: string; children: React.ReactNode }> = ({ icon, children }) => (
  <h1 style={{
    fontSize: 26, fontWeight: 800, margin: "12px 0 20px",
    lineHeight: 1.2, letterSpacing: -0.5,
    display: "flex", gap: 10, alignItems: "center",
  }}>
    <span style={{ fontSize: 30 }}>{icon}</span>
    <span>{children}</span>
  </h1>
);

const FieldGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    background: C.card, borderRadius: 14, padding: 16,
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
    border: `1px solid ${C.border}`,
  }}>{children}</div>
);

const Field: React.FC<{ label: string; value: string; mono?: boolean; accent?: boolean; fullWidth?: boolean }> = ({ label, value, mono, accent, fullWidth }) => (
  <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto", minWidth: 0 }}>
    <div style={{
      fontSize: 9, fontWeight: 800, color: C.tealLight,
      textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4,
    }}>{label}</div>
    <div style={{
      fontSize: accent ? 16 : 14,
      fontWeight: accent ? 800 : 700,
      color: accent ? C.tealLight : C.light,
      fontFamily: mono ? "monospace" : "inherit",
      letterSpacing: mono ? 0.5 : 0,
      wordBreak: "break-word",
      lineHeight: 1.3,
    }}>{value}</div>
  </div>
);

const InfoBox: React.FC<{ label: string; value: string; accent?: "teal" | "amber" | "red"; mono?: boolean }> = ({ label, value, accent, mono }) => {
  const palette = accent === "amber"
    ? { bg: C.amberTint, fg: C.amber }
    : accent === "red"
    ? { bg: C.redTint, fg: C.red }
    : { bg: "#0F2E2E", fg: C.tealLight };
  return (
    <div style={{
      marginTop: 14, padding: "12px 16px",
      background: palette.bg, borderRadius: 12,
      borderLeft: `4px solid ${palette.fg}`,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: palette.fg,
        textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: 15, fontWeight: 800, color: C.light,
        fontFamily: mono ? "monospace" : "inherit",
        letterSpacing: mono ? 0.5 : 0,
      }}>{value}</div>
    </div>
  );
};

const CtaButton: React.FC<{ label: string; priorita?: "normal" | "high" }> = ({ label, priorita }) => (
  <button style={{
    marginTop: 24, width: "100%", padding: "18px 20px",
    background: priorita === "high" ? C.amber : C.teal,
    color: "#fff", border: "none", borderRadius: 14,
    fontSize: 16, fontWeight: 800,
    boxShadow: `0 6px 0 ${priorita === "high" ? "#A87412" : C.tealDark}`,
    cursor: "pointer",
    letterSpacing: 0.4,
  }}>{label}</button>
);

const StatoBadge: React.FC<{ stato: string }> = ({ stato }) => {
  const color = stato === "consegnato" || stato === "installato" || stato === "lavorato"
    ? C.green
    : stato === "annullato" || stato === "scaduto"
    ? C.red
    : stato === "in_lavorazione" || stato === "in_consegna"
    ? C.amber
    : C.teal;
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 8,
      background: `${color}22`, color,
      fontSize: 10, fontWeight: 800,
      textTransform: "uppercase", letterSpacing: 0.5,
      whiteSpace: "nowrap",
    }}>{stato.replace(/_/g, " ")}</span>
  );
};

// ============================================================
// HELPERS
// ============================================================
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  try {
    return new Date(iso).getTime() < Date.now();
  } catch {
    return false;
  }
}
