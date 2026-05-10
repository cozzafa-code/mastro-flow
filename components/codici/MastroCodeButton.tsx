"use client";
// MASTRO CODES - Bottone universale generazione codice
// Per qualsiasi entità: passi tipo+entita_id+payload, click → genera codice → mostra QR+Code128+link
import * as React from "react";
import { getAziendaId } from "../mastro-constants";
import CodiceDisplayModal from "./CodiceDisplayModal";

type CodiceTipo =
  | "commessa" | "vano" | "pezzo_cnc" | "collo"
  | "articolo" | "cantiere" | "documento"
  | "macchina" | "furgone" | "fornitore_esterno";

interface Props {
  tipo: CodiceTipo;
  entitaId: string;
  payload?: Record<string, any>;
  // UI
  label?: string;            // testo bottone (default "Genera codice")
  variant?: "primary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
  // Comportamento
  rotates?: boolean;         // codice ruotabile
  expiresInDays?: number;    // scadenza in giorni
  onCreated?: (codice: any) => void;
}

const TIPO_ICON: Record<CodiceTipo, string> = {
  commessa: "📋", vano: "🪟", pezzo_cnc: "⚙️", collo: "🎁",
  articolo: "📦", cantiere: "🏗️", documento: "📄",
  macchina: "🔧", furgone: "🚐", fornitore_esterno: "🏭",
};

const C = {
  navy: "#1E3A5F", navyDark: "#0F1B2D",
  cardSoft: "#F8FAFC", border: "#E2E8F0",
  ink: "#0A1628", sub: "#64748B",
  red: "#991B1B", redTint: "#FEE2E2",
};

export default function MastroCodeButton({
  tipo,
  entitaId,
  payload,
  label,
  variant = "primary",
  size = "md",
  rotates,
  expiresInDays,
  onCreated,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [codice, setCodice] = React.useState<any>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleGenera = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setError("Azienda non identificata");
        setLoading(false);
        return;
      }

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const res = await fetch("/api/codici/genera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          entita_id: entitaId,
          azienda_id: aziendaId,
          payload: payload || {},
          rotates: rotates || false,
          expires_at: expiresAt,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "Errore generazione codice");
        setLoading(false);
        return;
      }

      // L'RPC ritorna direttamente il record codice
      const codiceData = json.codice;
      setCodice(codiceData);
      setModalOpen(true);
      if (onCreated) onCreated(codiceData);
    } catch (e: any) {
      setError(e?.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "7px 12px", fontSize: 12, gap: 6 },
    md: { padding: "10px 16px", fontSize: 13, gap: 8 },
    lg: { padding: "13px 20px", fontSize: 14, gap: 10 },
  };

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? 0.6 : 1,
    fontFamily: "inherit",
    letterSpacing: 0.3,
    ...sizeStyles[size],
  };

  const variantStyle: React.CSSProperties = variant === "ghost" ? {
    background: C.cardSoft, color: C.ink,
    border: `1px solid ${C.border}`,
  } : variant === "icon" ? {
    background: "transparent", color: C.navy,
    padding: 8, borderRadius: 10,
    border: `1px solid ${C.border}`,
  } : {
    background: C.navy, color: "#fff",
    boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
  };

  return (
    <>
      <button
        onClick={handleGenera}
        disabled={loading}
        title={`Genera codice ${tipo}`}
        style={{ ...baseStyle, ...variantStyle }}
      >
        {variant === "icon" ? (
          <QrIcon size={18} color={C.navy} />
        ) : (
          <>
            <QrIcon size={size === "sm" ? 14 : size === "lg" ? 18 : 16} color={variant === "ghost" ? C.ink : "#fff"} />
            <span>{loading ? "Generazione..." : (label || `Genera codice ${TIPO_ICON[tipo]}`)}</span>
          </>
        )}
      </button>

      {error && (
        <div style={{
          marginTop: 8, padding: "8px 12px",
          background: C.redTint, color: C.red,
          borderRadius: 8, fontSize: 12, fontWeight: 700,
        }}>⚠ {error}</div>
      )}

      {modalOpen && codice && (
        <CodiceDisplayModal
          codice={codice}
          tipo={tipo}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

const QrIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <line x1="14" y1="14" x2="14" y2="17" />
    <line x1="17" y1="14" x2="17" y2="21" />
    <line x1="20" y1="14" x2="20" y2="17" />
    <line x1="14" y1="20" x2="20" y2="20" />
  </svg>
);
