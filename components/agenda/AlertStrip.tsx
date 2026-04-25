"use client";

import type { KpiAlert } from "@/hooks/useAgenda";

export function AlertStrip({ alert }: { alert: KpiAlert }) {
  const eur = (alert.eur_a_rischio ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 0 });

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8, padding: "10px 14px",
      background: "#F4F6F5",
    }}>
      {/* Ritardi */}
      <Block tone="ambra"
        n={alert.ritardi} lbl="ritardi" sub="da gestire"
        ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>}
      />
      {/* Urgenze */}
      <Block tone="rosso"
        n={alert.urgenze} lbl="urgenze" sub="da evadere"
        ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
      />
      {/* € a rischio */}
      <Block tone="teal"
        n={`€${eur}`} lbl="a rischio" sub="fatturato"
        ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8M12 6v2m0 8v2"/></svg>}
      />
    </div>
  );
}

function Block({ tone, n, lbl, sub, ico }: {
  tone: "ambra" | "rosso" | "teal"; n: number | string; lbl: string; sub: string; ico: JSX.Element;
}) {
  const TONE: Record<string, { bg: string; fg: string }> = {
    ambra: { bg: "linear-gradient(135deg, rgba(250,199,117,0.18), rgba(239,159,39,0.06))", fg: "#854F0B" },
    rosso: { bg: "linear-gradient(135deg, rgba(255,100,100,0.18), rgba(220,68,68,0.06))",  fg: "#7F1D1D" },
    teal:  { bg: "linear-gradient(135deg, rgba(58,189,189,0.18), rgba(40,160,160,0.06))",  fg: "#04403B" },
  };
  const t = TONE[tone];
  return (
    <div style={{
      padding: "8px 10px", borderRadius: 12,
      background: t.bg,
      border: "1px solid rgba(200,228,228,0.5)",
      boxShadow: "0 1px 3px rgba(13,31,31,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.fg, marginBottom: 2 }}>
        {ico}
        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase" }}>{lbl}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: t.fg, letterSpacing: -0.4, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: t.fg, opacity: 0.7, marginTop: 1 }}>{sub}</div>
    </div>
  );
}
