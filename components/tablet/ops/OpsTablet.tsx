"use client";
// MASTRO TABLET - OPS v1
// Widget riassuntivo + CTA per app satellite mastro-ops.vercel.app
import * as React from "react";
import { supabase } from "../../../lib/supabase";
import { getAziendaId } from "../../mastro-constants";

const C = {
  bg: "#94A3B8",
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyTint: "#DBE6F1",
  amber: "#92400E",
  amberTint: "#FEF3C7",
  green: "#065F46",
  greenTint: "#ECFDF5",
  red: "#991B1B",
  redTint: "#FEE2E2",
  redSoft: "#FEF2F2",
  blue: "#3B7FE0",
  blueTint: "#DBEAFE",
  purple: "#6D28D9",
  purpleTint: "#EDE9FE",
};

const OPS_URL = "https://mastro-ops.vercel.app";

type Stats = {
  catalogo: number;
  template: number;
  alertAttivi: number;
  esecuzioniMese: number;
  vocabolario: number;
};

export default function OpsTablet() {
  const [stats, setStats] = React.useState<Stats>({ catalogo: 0, template: 0, alertAttivi: 0, esecuzioniMese: 0, vocabolario: 0 });
  const [loading, setLoading] = React.useState(true);

  const loadStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setLoading(false);
        return;
      }
      const meseInizio = new Date();
      meseInizio.setDate(1);
      meseInizio.setHours(0, 0, 0, 0);

      const [catalogoRes, templateRes, alertRes, esecuzioniRes, vocabolarioRes] = await Promise.all([
        supabase.from("ops_funzioni_catalogo").select("id", { count: "exact", head: true }),
        supabase.from("ops_template_settore").select("id", { count: "exact", head: true }),
        supabase.from("ops_alert").select("id", { count: "exact", head: true }).eq("azienda_id", aziendaId),
        supabase.from("ops_esecuzioni").select("id", { count: "exact", head: true }).eq("azienda_id", aziendaId).gte("created_at", meseInizio.toISOString()),
        supabase.from("ops_vocabolario").select("id", { count: "exact", head: true }).eq("azienda_id", aziendaId),
      ]);

      setStats({
        catalogo: catalogoRes.count || 0,
        template: templateRes.count || 0,
        alertAttivi: alertRes.count || 0,
        esecuzioniMese: esecuzioniRes.count || 0,
        vocabolario: vocabolarioRes.count || 0,
      });
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);

  const apriOps = () => {
    window.open(OPS_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", padding: 20 }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
        borderRadius: 16, padding: "24px 26px", color: "#fff",
        marginBottom: 14, boxShadow: "0 8px 24px rgba(15,27,45,0.4)",
        display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, flexShrink: 0,
        }}>⚡</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>MASTRO Suite</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 4 }}>
            MASTRO OPS
          </div>
          <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4 }}>
            Cervello operativo · Workflow · Catalogo Galassia
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
        <Kpi label="Funzioni Galassia" value={loading ? "…" : String(stats.catalogo)} color="navy" icon="🌌" />
        <Kpi label="Template settore" value={loading ? "…" : String(stats.template)} color="purple" icon="📋" />
        <Kpi label="Esecuzioni mese" value={loading ? "…" : String(stats.esecuzioniMese)} color="green" icon="✅" />
        <Kpi label="Alert attivi" value={loading ? "…" : String(stats.alertAttivi)} color="amber" icon="⚠️" alert={stats.alertAttivi > 0} />
      </div>

      {/* COSA È OPS */}
      <div style={{
        background: C.card, borderRadius: 14, padding: 22,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)", marginBottom: 14,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 12, letterSpacing: -0.3 }}>
          Cos'è MASTRO OPS
        </div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>
          Il <strong style={{ color: C.ink }}>cervello operativo</strong> di MASTRO. Cattura il know-how operativo dei tuoi cantieri (foto, audio, vocabolario di cantiere, workflow per fase) e lo trasforma nel <strong style={{ color: C.ink }}>dataset verticale Galassia</strong>: il vero moat AI per la tua azienda.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 18 }}>
          <Feature
            icon="📸"
            title="Cattura cantiere"
            desc="Foto, audio, vocabolario dialettale dai tuoi operai sul campo"
          />
          <Feature
            icon="🔄"
            title="Workflow Fasi"
            desc="14 fasi serramentista · 50 template per altri settori artigiani"
          />
          <Feature
            icon="🤖"
            title="AI Onboarding"
            desc="Claude proxy guidato: setup workflow in pochi minuti"
          />
          <Feature
            icon="📊"
            title="Medie settore"
            desc="Confronta i tuoi tempi con la media dei serramentisti italiani"
          />
        </div>

        {/* CTA BOTTONE */}
        <button
          onClick={apriOps}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: `linear-gradient(135deg, ${C.navy} 0%, ${C.purple} 100%)`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            letterSpacing: 0.3,
            boxShadow: "0 4px 14px rgba(30,58,95,0.4)",
            fontFamily: "inherit",
          }}
        >
          <span>Apri MASTRO OPS</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H8M17 7V16" />
          </svg>
        </button>
        <div style={{ fontSize: 11, color: C.subLight, fontWeight: 600, textAlign: "center", marginTop: 8 }}>
          {OPS_URL.replace("https://", "")}
        </div>
      </div>

      {/* STATO INTEGRAZIONE */}
      <div style={{
        background: C.card, borderRadius: 14, padding: 18,
        boxShadow: "0 4px 16px rgba(15,23,42,0.18)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 12, letterSpacing: -0.3 }}>
          Stato integrazione tua azienda
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <StatusRow
            label="Vocabolario di cantiere"
            value={stats.vocabolario === 0 ? "Da popolare" : `${stats.vocabolario} termini`}
            ok={stats.vocabolario > 0}
            hint={stats.vocabolario === 0 ? "Inizia raccogliendo audio dai tuoi operai" : undefined}
          />
          <StatusRow
            label="Esecuzioni questo mese"
            value={stats.esecuzioniMese === 0 ? "Nessuna" : `${stats.esecuzioniMese} fasi tracciate`}
            ok={stats.esecuzioniMese > 0}
          />
          <StatusRow
            label="Alert da gestire"
            value={stats.alertAttivi === 0 ? "Nessuno" : `${stats.alertAttivi} attivi`}
            ok={stats.alertAttivi === 0}
            warn={stats.alertAttivi > 0}
          />
        </div>
      </div>

    </div>
  );
}

const Kpi: React.FC<{ label: string; value: string; color: "navy" | "green" | "amber" | "red" | "purple"; icon?: string; alert?: boolean }> = ({ label, value, color, icon, alert }) => {
  const cm = { navy: C.navy, green: C.green, amber: C.amber, red: C.red, purple: C.purple };
  return (
    <div style={{
      background: alert ? C.redSoft : C.card, borderRadius: 12, padding: 12,
      boxShadow: "0 4px 16px rgba(15,23,42,0.18)", borderTop: `4px solid ${cm[color]}`,
      display: "flex", flexDirection: "column", gap: 3, minWidth: 0, overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{ fontSize: 22, fontWeight: 800, color: cm[color], letterSpacing: -0.5, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
      <div style={{ fontSize: 10, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
};

const Feature: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div style={{
    background: C.cardSoft,
    borderRadius: 11,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, letterSpacing: -0.2 }}>{title}</div>
    </div>
    <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, lineHeight: 1.4 }}>
      {desc}
    </div>
  </div>
);

const StatusRow: React.FC<{ label: string; value: string; ok?: boolean; warn?: boolean; hint?: string }> = ({ label, value, ok, warn, hint }) => {
  const dotColor = warn ? C.amber : ok ? C.green : C.subLight;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px dashed ${C.border}` }}>
      <div style={{
        width: 8, height: 8, borderRadius: 999,
        background: dotColor,
        marginTop: 6,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: warn ? C.amber : ok ? C.green : C.sub, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
};
