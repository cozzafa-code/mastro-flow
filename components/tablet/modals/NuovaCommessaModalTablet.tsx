"use client";
// MASTRO TABLET - Nuova Commessa Modal v2
// Auto-genera code progressivo S-XXXX, campi corretti per /api/sync/commessa
import * as React from "react";
import { saveCantiereSync, getAziendaId } from "@/lib/supabase-sync";
import { supabase } from "@/lib/supabase";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyTint: "#DBE6F1",
  red: "#991B1B",
  redTint: "#FEE2E2",
  green: "#065F46",
  amber: "#92400E",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (commessa: { id: string; code: string }) => void;
  setCantieri?: (fn: any) => void;
}

const TIPI_COMMESSA = [
  { value: "nuova", label: "Nuova" },
  { value: "sostituzione", label: "Sostituzione" },
  { value: "ristrutturazione", label: "Ristrutturazione" },
  { value: "manutenzione", label: "Manutenzione" },
  { value: "riparazione", label: "Riparazione" },
];

const SISTEMI = [
  "PVC",
  "Alluminio",
  "Legno",
  "Legno-Alluminio",
  "Ferro",
  "Misto",
];

const DIFFICOLTA = [
  { value: "facile", label: "Facile" },
  { value: "media", label: "Media" },
  { value: "difficile", label: "Difficile" },
];

const MEZZI_SALITA = [
  "Scala interna",
  "Ascensore",
  "Cestello",
  "Carrello elevatore",
  "Argano",
  "A mano",
];

export default function NuovaCommessaModalTablet({ open, onClose, onCreated, setCantieri }: Props) {
  // Anagrafica
  const [nome, setNome] = React.useState("");
  const [cognome, setCognome] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");

  // Indirizzo cantiere
  const [indirizzo, setIndirizzo] = React.useState("");
  const [citta, setCitta] = React.useState("Cosenza");
  const [pianoEdificio, setPianoEdificio] = React.useState("");

  // Lavori
  const [tipo, setTipo] = React.useState("nuova");
  const [sistema, setSistema] = React.useState("");
  const [difficoltaSalita, setDifficoltaSalita] = React.useState("");
  const [mezzoSalita, setMezzoSalita] = React.useState("");
  const [importoStimato, setImportoStimato] = React.useState("");
  const [scadenza, setScadenza] = React.useState("");
  const [note, setNote] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setNome("");
      setCognome("");
      setTelefono("");
      setEmail("");
      setIndirizzo("");
      setCitta("Cosenza");
      setPianoEdificio("");
      setTipo("nuova");
      setSistema("");
      setDifficoltaSalita("");
      setMezzoSalita("");
      setImportoStimato("");
      setScadenza("");
      setNote("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  // Genera prossimo code progressivo (S-XXXX) leggendo da DB
  const generaCode = async (aziendaId: string): Promise<string> => {
    const { data } = await supabase
      .from("commesse")
      .select("code")
      .eq("azienda_id", aziendaId)
      .order("created_at", { ascending: false })
      .limit(50);

    let maxN = 0;
    (data || []).forEach((r: any) => {
      const m = String(r?.code || "").match(/S-(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxN) maxN = n;
      }
    });
    return `S-${String(maxN + 1).padStart(4, "0")}`;
  };

  const handleSave = async () => {
    const cognomeTrim = cognome.trim();
    const nomeTrim = nome.trim();
    if (!cognomeTrim && !nomeTrim) {
      setError("Inserisci nome o cognome del cliente");
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

      const code = await generaCode(aziendaId);
      const tempId = `cm_${Date.now()}`;

      const indirizzoFull = [indirizzo.trim(), citta.trim()].filter(Boolean).join(", ");

      const newCantiere: any = {
        id: tempId,
        code,
        cliente: nomeTrim,
        cognome: cognomeTrim,
        indirizzo: indirizzoFull,
        telefono: telefono.trim(),
        email: email.trim(),
        tipo,
        sistema,
        difficoltaSalita,
        mezzoSalita,
        pianoEdificio: pianoEdificio.trim(),
        fase: "sopralluogo",
        rilievi: [],
        scadenza: scadenza || null,
        totalePreventivo: importoStimato ? parseFloat(importoStimato) : null,
        note: note.trim(),
        deleted_at: null,
        archived_at: null,
        created_at: new Date().toISOString(),
      };

      const result = await saveCantiereSync(aziendaId, newCantiere);
      if (!result || !result.id) {
        setError("Errore nel salvataggio. Verifica i dati e riprova.");
        setSaving(false);
        return;
      }

      const finalCantiere = { ...newCantiere, id: result.id, code: result.code };
      if (setCantieri) {
        setCantieri((prev: any[]) => [finalCantiere, ...(prev || [])]);
      }
      if (onCreated) onCreated({ id: result.id, code: result.code });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Errore creazione commessa");
      setSaving(false);
    }
  };

  const canSave = (nome.trim() || cognome.trim()) && !saving;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 27, 45, 0.6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
        backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          marginTop: 20,
          marginBottom: 20,
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
          background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          color: "#fff",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>Nuova commessa</div>
            <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 2 }}>
              Crea una nuova lavorazione
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.12)", border: "none",
              cursor: "pointer", fontSize: 22, fontWeight: 700,
              color: "#fff",
            }}
          >×</button>
        </div>

        {/* BODY */}
        <div style={{ padding: 22 }}>

          {/* SECTION: ANAGRAFICA */}
          <SectionTitle>Anagrafica cliente</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome" required>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Mario"
                autoFocus
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
            <Field label="Cognome" required>
              <input
                type="text"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                placeholder="Rossi"
                autoComplete="off"
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
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@..."
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* SECTION: INDIRIZZO */}
          <SectionTitle>Indirizzo cantiere</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="Via e numero civico">
              <input
                type="text"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                placeholder="Via Roma, 12"
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
            <Field label="Città">
              <input
                type="text"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
                placeholder="Cosenza"
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="Piano / Scala / Interno">
            <input
              type="text"
              value={pianoEdificio}
              onChange={(e) => setPianoEdificio(e.target.value)}
              placeholder="Piano 3 · Scala A · Int. 12"
              autoComplete="off"
              style={inputStyle}
            />
          </Field>

          {/* SECTION: LAVORI */}
          <SectionTitle>Dettagli lavorazione</SectionTitle>
          <Field label="Tipo intervento">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TIPI_COMMESSA.map(t => (
                <Chip key={t.value} active={tipo === t.value} onClick={() => setTipo(t.value)}>{t.label}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Sistema infisso">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SISTEMI.map(s => (
                <Chip key={s} active={sistema === s} onClick={() => setSistema(s === sistema ? "" : s)}>{s}</Chip>
              ))}
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Difficoltà salita">
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {DIFFICOLTA.map(d => (
                  <Chip key={d.value} active={difficoltaSalita === d.value} onClick={() => setDifficoltaSalita(d.value === difficoltaSalita ? "" : d.value)} small>{d.label}</Chip>
                ))}
              </div>
            </Field>
            <Field label="Mezzo salita">
              <select
                value={mezzoSalita}
                onChange={(e) => setMezzoSalita(e.target.value)}
                style={inputStyle}
              >
                <option value="">Seleziona...</option>
                {MEZZI_SALITA.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>

          {/* SECTION: ECONOMICI */}
          <SectionTitle>Stima economica e tempi</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Importo stimato (€)">
              <input
                type="number"
                step="0.01"
                value={importoStimato}
                onChange={(e) => setImportoStimato(e.target.value)}
                placeholder="0,00"
                autoComplete="off"
                style={inputStyle}
              />
            </Field>
            <Field label="Scadenza prevista">
              <input
                type="date"
                value={scadenza}
                onChange={(e) => setScadenza(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note, riferimenti, agenti, info aggiuntive..."
              rows={3}
              autoComplete="off"
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
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "11px 22px",
              background: "transparent",
              color: C.sub,
              border: "none",
              borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.5 : 1,
            }}
          >Annulla</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: "11px 24px",
              background: !canSave ? C.subLight : C.navy,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13, fontWeight: 800,
              cursor: !canSave ? "not-allowed" : "pointer",
              letterSpacing: 0.4,
              boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
              opacity: saving ? 0.6 : 1,
            }}
          >{saving ? "Salvataggio..." : "Crea commessa"}</button>
        </div>
      </div>
    </div>
  );
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 800, color: C.navy,
    textTransform: "uppercase", letterSpacing: 0.6,
    marginTop: 18, marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `1px solid ${C.border}`,
  }}>{children}</div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
      {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
    </div>
    {children}
  </div>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }> = ({ active, onClick, small, children }) => (
  <div
    onClick={onClick}
    style={{
      padding: small ? "6px 11px" : "8px 14px",
      borderRadius: 9,
      background: active ? C.navy : C.cardSoft,
      color: active ? "#fff" : C.ink,
      fontSize: small ? 11 : 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >{children}</div>
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
