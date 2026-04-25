// components/ModalFirma.tsx
// Modal per avviare firma certificata: scelta tipo PDF + livello firma (FEA/FEQ) + canale invio.
// Chiama /api/firma/crea, riceve signer_url, apre WhatsApp/email con link.
// Stile unificato Centro Comando / RILIEVO MISURE.

import { useState } from "react";
import LivelloFirmaCard from "./LivelloFirmaCard";
import { comporreMessaggioFirma } from "../lib/firma/messaggi";

type TipoDocumento = "conferma_ordine" | "scheda_tecnica";
type Livello = "fea_otp" | "feq_spid";
type Canale = "whatsapp" | "email" | "copia";

type Props = {
  commessaId: string;
  clienteNome: string;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;
  onClose: () => void;
  onEditCliente?: () => void;
  onSuccess?: (info: { token: string; signerUrl: string; canale: Canale }) => void;
};

const T = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  danger: "#DC2626",
  ok: "#16A34A",
  radius: 10,
  radiusSmall: 8,
};

export default function ModalFirma({
  commessaId, clienteNome, clienteTelefono, clienteEmail,
  onClose, onSuccess, onEditCliente,
}: Props) {
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>("conferma_ordine");
  const [livello, setLivello] = useState<Livello>("fea_otp");
  const [canale, setCanale] = useState<Canale>(clienteTelefono ? "whatsapp" : "email");
  const [sending, setSending] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canaleDisponibile = (c: Canale): boolean => {
    if (c === "whatsapp") return !!clienteTelefono;
    if (c === "email") return !!clienteEmail;
    return true;
  };

  const invia = async () => {
    setSending(true);
    setErrore(null);
    try {
      const res = await fetch("/api/firma/crea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commessaId,
          tipoDocumento: tipoDoc,
          livello,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setErrore(j.error || "errore creazione firma");
        setSending(false);
        return;
      }

      const signerUrl: string = j.signer_url;
      const msg = comporreMessaggioFirma(clienteNome, tipoDoc, livello, signerUrl);

      if (canale === "whatsapp" && clienteTelefono) {
        const tel = clienteTelefono.replace(/[^0-9+]/g, "");
        const num = tel.startsWith("+") ? tel.slice(1) : "39" + tel;
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
      } else if (canale === "email" && clienteEmail) {
        const subj = tipoDoc === "conferma_ordine"
          ? "Conferma d'ordine da firmare"
          : "Scheda tecnica commessa da firmare";
        window.location.href = `mailto:${clienteEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(msg)}`;
      } else if (canale === "copia") {
        await navigator.clipboard.writeText(signerUrl);
      }

      setSuccessMsg("✓ Link firma inviato");
      onSuccess?.({ token: j.token, signerUrl, canale });
      setTimeout(() => { onClose(); }, 1200);

    } catch (e: any) {
      setErrore(e.message || "errore rete");
    } finally {
      setSending(false);
    }
  };

  const card = (sel: boolean): React.CSSProperties => ({
    flex: 1,
    padding: 12,
    borderRadius: T.radiusSmall,
    background: sel ? T.teal : T.lightBg,
    color: sel ? "#fff" : T.textDark,
    border: `1px solid ${sel ? T.teal : T.border}`,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    transition: "all .15s",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: T.teal, marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.6px",
  };

  const canali: { id: Canale; label: string }[] = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "email", label: "Email" },
    { id: "copia", label: "Copia link" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#0D1F1FCC", zIndex: 9999,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: 560, maxHeight: "92vh",
          overflowY: "auto", borderRadius: "16px 16px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header dark */}
        <div style={{
          background: T.darkBg, color: "#fff", padding: 18,
          borderRadius: "16px 16px 0 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 3 }}>
              Firma certificata
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px" }}>
              Genera PDF + invio firma
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{clienteNome}</div>
          </div>
          <div
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#ffffff18", fontSize: 16,
            }}
          >×</div>
        </div>

        <div style={{ padding: 18 }}>
          {/* TIPO DOCUMENTO */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Documento</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setTipoDoc("conferma_ordine")} style={card(tipoDoc === "conferma_ordine")}>
                Conferma ordine
              </div>
              <div onClick={() => setTipoDoc("scheda_tecnica")} style={card(tipoDoc === "scheda_tecnica")}>
                Scheda tecnica
              </div>
            </div>
          </div>

          {/* LIVELLO FIRMA */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Tipo firma legale</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <LivelloFirmaCard
                selected={livello === "fea_otp"}
                titolo="FEA · OTP SMS"
                sottotitolo="Firma Elettronica Avanzata"
                dettaglio="Il cliente riceve un codice via SMS e conferma con click. Valida per contratti standard."
                costo="~ 0,30 €"
                onClick={() => setLivello("fea_otp")}
                abilitato={!!clienteTelefono}
                motivoDisabilitato="Manca telefono cliente"
              />
              <LivelloFirmaCard
                selected={livello === "feq_spid"}
                titolo="FEQ · SPID / CIE"
                sottotitolo="Firma Elettronica Qualificata"
                dettaglio="Identificazione con SPID o CIE. Valore legale pieno, equiparata alla firma autografa autenticata."
                costo="~ 1,50 €"
                onClick={() => setLivello("feq_spid")}
                abilitato={true}
              />
            </div>
          </div>

          {/* CANALE INVIO */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Invio link al cliente</div>
            <div style={{ display: "flex", gap: 6 }}>
              {canali.map(c => {
                const ok = canaleDisponibile(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => ok && setCanale(c.id)}
                    style={{
                      ...card(canale === c.id),
                      opacity: ok ? 1 : 0.4,
                      cursor: ok ? "pointer" : "not-allowed",
                    }}
                  >
                    {c.label}
                  </div>
                );
              })}
            </div>
            {((canale === "whatsapp" && !clienteTelefono) || (canale === "email" && !clienteEmail)) && (
              <div style={{ fontSize: 10, color: T.danger, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "6px 8px", background: "#FEE2E2", borderRadius: 6 }}>
                <span>Manca {canale === "whatsapp" ? "telefono" : "email"} cliente</span>
                {onEditCliente && (
                  <button onClick={() => { onClose(); onEditCliente(); }} style={{ padding: "4px 10px", borderRadius: 5, background: "#fff", border: `1px solid ${T.danger}`, color: T.danger, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Aggiungi ora
                  </button>
                )}
              </div>
            )}
          </div>

          {/* FEEDBACK */}
          {errore && (
            <div style={{
              padding: 10, borderRadius: T.radiusSmall, background: "#FEE2E2",
              color: T.danger, fontSize: 11, marginBottom: 12, border: `1px solid #FCA5A5`,
            }}>
              ✗ {errore}
            </div>
          )}
          {successMsg && (
            <div style={{
              padding: 10, borderRadius: T.radiusSmall, background: "#DCFCE7",
              color: T.ok, fontSize: 11, marginBottom: 12, border: `1px solid #86EFAC`,
            }}>
              {successMsg}
            </div>
          )}

          {/* AZIONI */}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              onClick={onClose}
              style={{
                padding: "12px 18px", borderRadius: T.radiusSmall,
                background: "#fff", color: T.teal,
                border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >Annulla</button>
            <button
              onClick={invia}
              disabled={sending || !canaleDisponibile(canale)}
              style={{
                flex: 1, padding: "12px 18px", borderRadius: T.radiusSmall,
                background: T.teal, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit",
                opacity: (sending || !canaleDisponibile(canale)) ? 0.5 : 1,
              }}
            >
              {sending ? "Invio in corso…" : "Genera PDF + invia"}
            </button>
          </div>

          <div style={{
            fontSize: 10, color: T.textSub, marginTop: 12, lineHeight: 1.5, textAlign: "center",
          }}>
            Firma conforme eIDAS · Validità legale · Documento conservato in MASTRO 10 anni
          </div>
        </div>
      </div>
    </div>
  );
}


