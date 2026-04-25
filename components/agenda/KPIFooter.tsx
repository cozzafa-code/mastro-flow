"use client";

import { useAgenda } from "@/hooks/useAgenda";

export function KPIFooter() {
  const { kpiOggi } = useAgenda();
  const eur = kpiOggi.fatturato_eur.toLocaleString("it-IT", { maximumFractionDigits: 0 });

  return (
    <div style={{
      position: "absolute", bottom: 56, left: 0, right: 0, zIndex: 5,
      padding: "8px 12px",
      background: "linear-gradient(180deg, rgba(13,31,31,0.92), rgba(13,31,31,0.98))",
      backdropFilter: "blur(14px)",
      display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4,
      borderTop: "1px solid rgba(255,255,255,0.08)",
    }}>
      <FooterStat n={kpiOggi.sopralluoghi} lbl="Sopralluoghi" color="#B5B0EE" />
      <FooterStat n={kpiOggi.montaggi} lbl="Montaggi" color="#5DCAA5" />
      <FooterStat n={kpiOggi.produzioni} lbl="Produzione" color="#85B7EB" />
      <FooterStat n={kpiOggi.ritardi} lbl="Ritardi" color="#FF6464" />
      <FooterStat n={"€" + eur} lbl="Fatturato" color="#FAC775" />
    </div>
  );
}

function FooterStat({ n, lbl, color }: { n: string | number; lbl: string; color: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2px 0" }}>
      <div style={{ fontSize: 14, fontWeight: 900, color, letterSpacing: -0.3, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 7.5, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 1 }}>{lbl}</div>
    </div>
  );
}
