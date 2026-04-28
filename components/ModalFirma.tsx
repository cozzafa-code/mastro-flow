// components/ModalFirma.tsx
// v50 — 4 livelli firma:
//   - FES   (canvas gratis)        → /api/firma           [GRATIS, FEA-grade eIDAS art.25]
//   - FEA   (OTP SMS, ~0,30€)      → /api/firma/crea      [provider esterno, richiede config]
//   - FEQ   (SPID/CIE, ~1,50€)     → /api/firma/crea      [Namirial qualificato]
//   - CART  (firma su carta)       → /api/firma + upload  [post-firma carica PDF/foto]
// Stile unificato Centro Comando.

import { useState } from "react";
import { comporreMessaggioFirma } from "../lib/firma/messaggi";

type TipoDocumento = "conferma_ordine" | "scheda_tecnica";
type Livello = "fes_canvas" | "fea_otp" | "feq_spid" | "cartacea";
type Canale = "whatsapp" | "email" | "copia";

type Props = {
  commessaId: string;
  clienteNome: string;
  clienteTelefono?: string | null;
  clienteEmail?: string | null;
  importo?: number;
  cmCode?: string;
  onClose: () => void;
  onEditCliente?: () => void;
  onSuccess?: (info: { token?: string; signerUrl?: string; canale: Canale; livello: Livello }) => void;
};

const T = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  tealLight: "#E8F0F0",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  danger: "#DC2626",
  ok: "#16A34A",
  amber: "#F59E0B",
  radius: 10,
  radiusSmall: 8,
};

export default function ModalFirma({
  commessaId, clienteNome, clienteTelefono, clienteEmail, importo, cmCode,
  onClose, onSuccess, onEditCliente,
}: Props) {
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>("conferma_ordine");
  const [livello, setLivello] = useState<Livello>("fes_canvas"); // default GRATIS
  const [canale, setCanale] = useState<Canale>(clienteTelefono ? "whatsapp" : "email");
  const [sending, setSending] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canaleDisponibile = (c: Canale): boolean => {
    if (c === "whatsapp") return !!clienteTelefono;
    if (c === "email") return !!clienteEmail;
    return true;
  };

  const apriCanale = (signerUrl: string) => {
    const msg = comporreMessaggioFirma(
      clienteNome,
      tipoDoc,
      livello === "feq_spid" ? "feq_spid" : "fea_otp",
      signerUrl
    );
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
      navigator.clipboard.writeText(signerUrl).catch(() => {});
    }
  };

  // ───────────────── INVIO LINK FIRMA ─────────────────
  const invia = async () => {
    setSending(true);
    setErrore(null);

    try {
      // ─── FIRMA CARTACEA: nessun link, apre upload ───
      if (livello === "cartacea") {
        // crea solo un token di tracking (livello "cartacea")
        const res = await fetch("/api/firma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "genera",
            data: {
              cmId: commessaId,
              cmCode: cmCode || null,
              cliente: clienteNome,
              importo: importo ?? null,
              descrizione: tipoDoc === "conferma_ordine" ? "Conferma ordine" : "Scheda tecnica",
              telefono: clienteTelefono || null,
              email: clienteEmail || null,
              livello: "cartacea",
            },
          }),
        });
        const j = await res.json();
        if (!res.ok || j.error) {
          setErrore(j.error || "errore creazione token");
          setSending(false);
          return;
        }
        setSuccessMsg("✓ Pronto per upload firma cartacea");
        onSuccess?.({ token: j.token, canale, livello });
        setTimeout(() => onClose(), 900);
        return;
      }

      // ─── FES CANVAS: endpoint MASTRO gratis ───
      if (livello === "fes_canvas") {
        const res = await fetch("/api/firma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "genera",
            data: {
              cmId: commessaId,
              cmCode: cmCode || null,
              cliente: clienteNome,
              importo: importo ?? null,
              descrizione: tipoDoc === "conferma_ordine" ? "Conferma ordine" : "Scheda tecnica",
              telefono: clienteTelefono || null,
              email: clienteEmail || null,
              livello: "fes",
            },
          }),
        });
        const j = await res.json();
        if (!res.ok || j.error) {
          setErrore(j.error || "errore creazione link firma");
          setSending(false);
          return;
        }
        const fullUrl = window.location.origin + j.url;
        apriCanale(fullUrl);
        setSuccessMsg("✓ Link firma inviato");
        onSuccess?.({ token: j.token, signerUrl: fullUrl, canale, livello });
        setTimeout(() => onClose(), 1200);
        return;
      }

      // ─── FEA OTP / FEQ SPID: Namirial via /api/firma/crea ───
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
      if (!res.ok || (!j.ok && !j.signer_url)) {
        const msg = j.error
          ? j.error.includes("non configurate")
            ? "Provider Namirial non configurato. Vai in Impostazioni → Firma digitale, oppure usa la firma FES (gratis)."
            : j.error
          : "Errore Namirial. Prova con FES (gratis).";
        setErrore(msg);
        setSending(false);
        return;
      }
      const signerUrl: string = j.signer_url;
      apriCanale(signerUrl);
      setSuccessMsg("✓ Link firma inviato");
      onSuccess?.({ token: j.token, signerUrl, canale, livello });
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      setErrore(e?.message || "errore rete");
    } finally {
      setSending(false);
    }
  };

  // ──────────────── STILI ────────────────
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

  // Card livello firma — versione MASTRO inline
  const livCard = (
    id: Livello,
    titolo: string,
    sotto: string,
    desc: string,
    costo: string,
    abilitato: boolean,
    motivoDisabilitato?: string,
    badgeColor?: string,
  ) => {
    const sel = livello === id;
    return (
      <div
        key={id}
        onClick={() => abilitato && setLivello(id)}
        style={{
          padding: 12,
          borderRadius: T.radiusSmall,
          background: sel ? T.tealLight : "#fff",
          border: `1.5px solid ${sel ? T.teal : T.border}`,
          cursor: abilitato ? "pointer" : "not-allowed",
          opacity: abilitato ? 1 : 0.55,
          transition: "all .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: `2px solid ${sel ? T.teal : "#C8E4E4"}`,
              background: sel ? T.teal : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.textDark }}>{titolo}</span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800,
            color: badgeColor || T.teal,
            padding: "2px 8px",
            background: (badgeColor || T.teal) + "15",
            borderRadius: 6,
            whiteSpace: "nowrap" as const,
          }}>{costo}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, marginBottom: 4, marginLeft: 24, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          {sotto}
        </div>
        <div style={{ fontSize: 11, color: T.textSub, marginLeft: 24, lineHeight: 1.4 }}>
          {desc}
        </div>
        {!abilitato && motivoDisabilitato && (
          <div style={{ fontSize: 10, color: T.danger, marginLeft: 24, marginTop: 4, fontWeight: 600 }}>
            ⚠ {motivoDisabilitato}
          </div>
        )}
      </div>
    );
  };

  const canali: { id: Canale; label: string }[] = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "email", label: "Email" },
    { id: "copia", label: "Copia link" },
  ];

  const ctaLabel = (() => {
    if (sending) return "Invio in corso…";
    if (livello === "cartacea") return "Conferma firma cartacea";
    if (livello === "fes_canvas") return "Invia link firma";
    return "Genera PDF + invia";
  })();

  // ──────────────── RENDER ────────────────
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
              Firma cliente
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px" }}>
              {livello === "cartacea" ? "Carica firma cartacea" : "Invia link firma al cliente"}
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

          {/* LIVELLO FIRMA — 4 opzioni */}
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Tipo firma</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {livCard(
                "fes_canvas",
                "FES · Firma a dito",
                "Firma Elettronica Semplice",
                "Cliente apre il link, firma a dito sul telefono. Token + IP + timestamp tracciati. Valida per preventivi e accettazioni standard.",
                "GRATIS",
                true,
                undefined,
                T.ok,
              )}
              {livCard(
                "fea_otp",
                "FEA · OTP SMS",
                "Firma Elettronica Avanzata",
                "Il cliente riceve un codice via SMS e conferma. Valida per contratti vincolanti.",
                "~ 0,30 €",
                !!clienteTelefono,
                "Manca telefono cliente",
              )}
              {livCard(
                "feq_spid",
                "FEQ · SPID / CIE",
                "Firma Elettronica Qualificata",
                "Identificazione con SPID o CIE. Valore legale pieno, equiparata alla firma autografa autenticata.",
                "~ 1,50 €",
                true,
              )}
              {livCard(
                "cartacea",
                "Cartacea",
                "Firma su foglio fisico",
                "Il cliente firma sul foglio cartaceo. Carichi tu la foto/scan in MASTRO. Nessun link inviato.",
                "GRATIS",
                true,
                undefined,
                T.amber,
              )}
            </div>
          </div>

          {/* CANALE INVIO — solo se NON cartacea */}
          {livello !== "cartacea" && (
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
          )}

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
              disabled={sending || (livello !== "cartacea" && !canaleDisponibile(canale))}
              style={{
                flex: 1, padding: "12px 18px", borderRadius: T.radiusSmall,
                background: T.teal, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
                fontFamily: "inherit",
                opacity: (sending || (livello !== "cartacea" && !canaleDisponibile(canale))) ? 0.5 : 1,
              }}
            >
              {ctaLabel}
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
