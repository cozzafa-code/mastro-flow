"use client";
// MASTRO TABLET - Nuova Commessa Modal autonomo
// Usa saveCantiereSync per creare commessa via API /api/sync/commessa
import * as React from "react";
import { saveCantiereSync, getAziendaId } from "@/lib/supabase-sync";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  red: "#991B1B",
  redTint: "#FEE2E2",
  green: "#065F46",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (commessa: { id: string; code: string }) => void;
  setCantieri?: (fn: any) => void;
}

const TIPOLOGIE = [
  "Sopralluogo",
  "Preventivo",
  "Cliente diretto",
  "Showroom",
  "Telefonata",
];

export default function NuovaCommessaModalTablet({ open, onClose, onCreated, setCantieri }: Props) {
  const [cliente, setCliente] = React.useState("");
  const [indirizzo, setIndirizzo] = React.useState("");
  const [citta, setCitta] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [tipologia, setTipologia] = React.useState("Sopralluogo");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCliente("");
      setIndirizzo("");
      setCitta("");
      setTelefono("");
      setEmail("");
      setTipologia("Sopralluogo");
      setNote("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!cliente.trim()) {
      setError("Inserisci il nome del cliente");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const aziendaId = await getAziendaId();
      if (!aziendaId) {
        setError("Azienda non identificata");
        setSaving(false);
        return;
      }

      const tempId = `cm_${Date.now()}`;
      const newCantiere: any = {
        id: tempId,
        cliente: cliente.trim(),
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        tipologia,
        note: note.trim(),
        fase: "rilievo",
        rilievi: [],
        euro: 0,
        scadenza: null,
        deleted_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
      };

      const result = await saveCantiereSync(aziendaId, newCantiere);
      if (!result) {
        setError("Errore nel salvataggio. Riprova.");
        setSaving(false);
        return;
      }

      const finalCantiere = { ...newCantiere, id: result.id, code: result.code };
      if (setCantieri) {
        setCantieri((prev: any[]) => [finalCantiere, ...(prev || [])]);
      }
      if (onCreated) onCreated(result);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Errore creazione commessa");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 27, 45, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "18px 22px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>Nuova commessa</div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginTop: 2 }}>
              Crea una nuova lavorazione
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.cardSoft, border: "none",
              cursor: "pointer", fontSize: 20, fontWeight: 700,
              color: C.sub,
            }}
          >×</button>
        </div>

        {/* BODY */}
        <div style={{ padding: 22 }}>
          <Field label="Cliente *" required>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nome o ragione sociale"
              autoFocus
              style={inputStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <Field label="Indirizzo">
              <input
                type="text"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                placeholder="Via, numero civico"
                style={inputStyle}
              />
            </Field>
            <Field label="Città">
              <input
                type="text"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
                placeholder="Cosenza"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Telefono">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+39 ..."
                style={inputStyle}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@..."
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Tipologia commessa">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TIPOLOGIE.map(t => (
                <div
                  key={t}
                  onClick={() => setTipologia(t)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 9,
                    background: tipologia === t ? C.navy : C.cardSoft,
                    color: tipologia === t ? "#fff" : C.ink,
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >{t}</div>
              ))}
            </div>
          </Field>

          <Field label="Note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
            />
          </Field>

          {error && (
            <div style={{
              padding: "10px 14px",
              background: C.redTint,
              color: C.red,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              marginTop: 4,
            }}>⚠ {error}</div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          background: C.cardSoft,
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: C.sub,
              border: "none",
              borderRadius: 9,
              fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
            }}
          >Annulla</button>
          <button
            onClick={handleSave}
            disabled={saving || !cliente.trim()}
            style={{
              padding: "10px 22px",
              background: !cliente.trim() ? C.subLight : C.navy,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              fontSize: 13, fontWeight: 800,
              cursor: (saving || !cliente.trim()) ? "not-allowed" : "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
              opacity: saving ? 0.6 : 1,
            }}
          >{saving ? "Salvataggio..." : "Crea commessa"}</button>
        </div>
      </div>
    </div>
  );
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </div>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: C.cardSoft,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  color: C.ink,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
