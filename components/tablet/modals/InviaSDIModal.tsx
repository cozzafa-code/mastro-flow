"use client";
// MASTRO TABLET - Invio SDI Modal
// Visualizza fattura, verifica configurazione FIC, invia
import * as React from "react";
import { supabase } from "../../../lib/supabase";
import { getAziendaId } from "../../mastro-constants";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyTint: "#DBE6F1",
  green: "#065F46",
  greenTint: "#ECFDF5",
  amber: "#92400E",
  amberTint: "#FEF3C7",
  red: "#991B1B",
  redTint: "#FEE2E2",
};

interface Fattura {
  id: string;
  numero: string;
  data_emissione: string | null;
  cliente: string | null;
  cliente_piva: string | null;
  cliente_cf: string | null;
  cliente_indirizzo: string | null;
  totale: number | null;
  imponibile: number | null;
  iva: number | null;
  righe: any;
  sdi_inviata?: boolean;
  sdi_status?: string | null;
}

interface Props {
  open: boolean;
  fattura: Fattura | null;
  onClose: () => void;
  onSent?: () => void;
}

type FicStatus = "checking" | "configured" | "not_configured" | "error";

export default function InviaSDIModal({ open, fattura, onClose, onSent }: Props) {
  const [ficStatus, setFicStatus] = React.useState<FicStatus>("checking");
  const [ficLabel, setFicLabel] = React.useState<string>("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!open || !fattura) return;
    setError(null);
    setSuccess(false);
    setSending(false);
    checkFicConfig();
  }, [open, fattura]);

  const checkFicConfig = async () => {
    setFicStatus("checking");
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) { setFicStatus("error"); return; }

      const { data, error } = await supabase
        .from("user_integrazioni")
        .select("servizio, stato, account_label, config")
        .eq("azienda_id", aziendaId)
        .eq("servizio", "fatture_in_cloud")
        .maybeSingle();

      if (error || !data) {
        setFicStatus("not_configured");
        return;
      }
      const config = (data.config || {}) as any;
      if (!config.accessToken || !config.companyId) {
        setFicStatus("not_configured");
        return;
      }
      setFicLabel(data.account_label || "Fatture in Cloud");
      setFicStatus("configured");
    } catch {
      setFicStatus("error");
    }
  };

  const handleSend = async () => {
    if (!fattura) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/fatture/${fattura.id}/send-sdi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.message || json.error || "Errore invio SDI");
        setSending(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        if (onSent) onSent();
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "Errore di rete");
    } finally {
      setSending(false);
    }
  };

  if (!open || !fattura) return null;

  const totale = Number(fattura.totale || 0);
  const imponibile = Number(fattura.imponibile || 0);
  const iva = Number(fattura.iva || 0);
  const numRighe = Array.isArray(fattura.righe) ? fattura.righe.length : 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 27, 45, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: 20, backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16,
          width: "100%", maxWidth: 540,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "16px 22px",
          background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Invio SDI
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
              Fattura {fattura.numero}
            </div>
          </div>
          <button onClick={onClose} disabled={sending} style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(255,255,255,0.12)", border: "none",
            cursor: sending ? "not-allowed" : "pointer",
            fontSize: 22, fontWeight: 700, color: "#fff",
          }}>×</button>
        </div>

        {/* SUCCESS STATE */}
        {success && (
          <div style={{ padding: 30, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginBottom: 6 }}>
              Fattura inviata a SDI
            </div>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>
              La fattura è stata trasmessa al sistema di interscambio
            </div>
          </div>
        )}

        {!success && (
          <>
            {/* FIC STATUS BADGE */}
            <div style={{ padding: "14px 22px 0" }}>
              {ficStatus === "checking" && (
                <div style={{
                  padding: "10px 14px", background: C.cardSoft, borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: C.sub,
                }}>Verifica configurazione Fatture in Cloud...</div>
              )}
              {ficStatus === "configured" && (
                <div style={{
                  padding: "10px 14px", background: C.greenTint, borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: C.green,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>✓</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>Fatture in Cloud connesso</div>
                    <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>{ficLabel}</div>
                  </div>
                </div>
              )}
              {ficStatus === "not_configured" && (
                <div style={{
                  padding: "12px 14px", background: C.amberTint, borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: C.amber,
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>⚠ Fatture in Cloud non configurato</div>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4 }}>
                    Devi connettere il tuo account FIC dalle Impostazioni → Integrazioni esterne prima di poter inviare fatture al SDI.
                  </div>
                </div>
              )}
              {ficStatus === "error" && (
                <div style={{
                  padding: "10px 14px", background: C.redTint, borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: C.red,
                }}>⚠ Errore verifica configurazione</div>
              )}
            </div>

            {/* PREVIEW FATTURA */}
            <div style={{ padding: 22 }}>
              <div style={{
                background: C.cardSoft, borderRadius: 12, padding: 16,
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Numero" value={fattura.numero} mono />
                  <Field label="Data emissione" value={fmtDate(fattura.data_emissione)} />
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
                  <Field label="Cliente" value={fattura.cliente || "—"} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                    {fattura.cliente_piva && <Field label="P.IVA" value={fattura.cliente_piva} mono />}
                    {fattura.cliente_cf && <Field label="C.F." value={fattura.cliente_cf} mono />}
                  </div>
                  {fattura.cliente_indirizzo && (
                    <div style={{ marginTop: 10 }}>
                      <Field label="Indirizzo" value={fattura.cliente_indirizzo} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Imponibile" value={`€ ${imponibile.toFixed(2)}`} />
                    <Field label="IVA" value={`€ ${iva.toFixed(2)}`} />
                    <Field label="Totale" value={`€ ${totale.toFixed(2)}`} accent />
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 10 }}>
                    {numRighe} righe in fattura
                  </div>
                </div>
              </div>

              {/* WARNINGS */}
              {!fattura.cliente_piva && !fattura.cliente_cf && (
                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: C.amberTint, borderRadius: 10,
                  fontSize: 11, fontWeight: 700, color: C.amber, lineHeight: 1.4,
                }}>⚠ Cliente senza P.IVA né C.F. — l'invio potrebbe essere scartato dal SDI</div>
              )}

              {error && (
                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: C.redTint, borderRadius: 10,
                  fontSize: 12, fontWeight: 700, color: C.red, lineHeight: 1.4,
                }}>⚠ {error}</div>
              )}
            </div>

            {/* FOOTER */}
            <div style={{
              padding: "14px 22px",
              borderTop: `1px solid ${C.border}`,
              background: C.cardSoft,
              display: "flex", gap: 10, justifyContent: "flex-end",
            }}>
              <button
                onClick={onClose}
                disabled={sending}
                style={{
                  padding: "11px 18px",
                  background: "transparent", color: C.sub,
                  border: `1px solid ${C.border}`, borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.5 : 1,
                }}
              >Annulla</button>
              <button
                onClick={handleSend}
                disabled={sending || ficStatus !== "configured"}
                style={{
                  padding: "11px 22px",
                  background: (sending || ficStatus !== "configured") ? C.subLight : C.green,
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 800,
                  cursor: (sending || ficStatus !== "configured") ? "not-allowed" : "pointer",
                  letterSpacing: 0.4,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {sending ? "Invio in corso..." : "📤 Invia a SDI"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const Field: React.FC<{ label: string; value: string; mono?: boolean; accent?: boolean }> = ({ label, value, mono, accent }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 9, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>
      {label}
    </div>
    <div style={{
      fontSize: accent ? 16 : 13,
      fontWeight: accent ? 800 : 700,
      color: accent ? C.navy : C.ink,
      fontFamily: mono ? "monospace" : "inherit",
      letterSpacing: mono ? 0.5 : 0,
      wordBreak: "break-word",
      lineHeight: 1.3,
    }}>{value}</div>
  </div>
);

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
