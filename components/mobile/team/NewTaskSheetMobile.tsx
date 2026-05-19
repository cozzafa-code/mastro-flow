// components/mobile/team/NewTaskSheetMobile.tsx
// FASE 5D - sheet "Nuovo task" con campi REALI (operatore reale, commessa reale, data/ora pickers)
"use client";
import React, { useState, useEffect, useMemo } from "react";
import type { Operator } from "@/lib/types/team";
import { listaCommesseAttive, type CommessaPerAvvio } from "@/lib/team-actions";
import { TOKENS } from "@/components/widgets/MiniAppCard";
import { IconClose, IconUser, IconFile, IconAlert } from "@/components/widgets/shared/icons";

interface Props {
  operators: Operator[];
  defaultOperatorId?: string;
  defaultCommessaId?: string;
  onClose: () => void;
  onSubmit: (data: {
    operatore_id: string;
    operatore_nome: string;
    cm_id?: string;
    cliente?: string;
    titolo: string;
    note?: string;
    giorno: string;
    ora_inizio: string;
    ora_fine: string;
    tipo: string;
  }) => Promise<void> | void;
}

type Tipo = "task" | "sopralluogo" | "consegna" | "ritiro" | "incontro" | "altro";

const TIPI: { id: Tipo; label: string; emoji: string }[] = [
  { id: "task", label: "Task", emoji: "✓" },
  { id: "sopralluogo", label: "Sopralluogo", emoji: "📐" },
  { id: "consegna", label: "Consegna", emoji: "📦" },
  { id: "ritiro", label: "Ritiro", emoji: "🚚" },
  { id: "incontro", label: "Incontro", emoji: "👥" },
  { id: "altro", label: "Altro", emoji: "•" },
];

const HEADER_GRAD = "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)";

function todayYMD(): string {
  return new Date().toISOString().slice(0, 10);
}

function addOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h + 1, m || 0, 0, 0);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function NewTaskSheetMobile({
  operators, defaultOperatorId, defaultCommessaId, onClose, onSubmit,
}: Props) {
  const [operatorId, setOperatorId] = useState<string>(defaultOperatorId || operators[0]?.id || "");
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);
  const [commessaId, setCommessaId] = useState<string>(defaultCommessaId || "");
  const [showCommessaPicker, setShowCommessaPicker] = useState(false);
  const [titolo, setTitolo] = useState("");
  const [note, setNote] = useState("");
  const [tipo, setTipo] = useState<Tipo>("task");
  const [giorno, setGiorno] = useState<string>(todayYMD());
  const [oraInizio, setOraInizio] = useState<string>("09:00");
  const [oraFine, setOraFine] = useState<string>("10:00");
  const [touchedOraFine, setTouchedOraFine] = useState(false);
  const [commesse, setCommesse] = useState<CommessaPerAvvio[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-aggiorna oraFine quando cambia oraInizio (se non manualmente toccata)
  useEffect(() => {
    if (!touchedOraFine) {
      setOraFine(addOneHour(oraInizio));
    }
  }, [oraInizio, touchedOraFine]);

  // Carica commesse (solo se non gia' precaricato)
  useEffect(() => {
    let alive = true;
    listaCommesseAttive()
      .then(list => { if (alive) setCommesse(list); })
      .catch(e => alive && setError("Errore commesse: " + (e?.message || "")));
    return () => { alive = false; };
  }, []);

  const operator = operators.find(o => o.id === operatorId);
  const commessa = commesse.find(c => c.id === commessaId);

  const valid = !!operatorId && !!titolo.trim() && !!giorno && !!oraInizio && !!oraFine;

  const handleSubmit = async () => {
    if (!valid) {
      setError("Compila operatore, titolo, data e orari");
      return;
    }
    if (oraFine <= oraInizio) {
      setError("L'ora di fine deve essere dopo quella di inizio");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      await onSubmit({
        operatore_id: operatorId,
        operatore_nome: operator?.name || "",
        cm_id: commessaId || undefined,
        cliente: commessa ? `${commessa.cliente || ""}${commessa.cognome ? " " + commessa.cognome : ""}`.trim() : undefined,
        titolo: titolo.trim(),
        note: note.trim() || undefined,
        giorno,
        ora_inizio: oraInizio,
        ora_fine: oraFine,
        tipo,
      });
    } catch (e: any) {
      setError(e?.message || "Errore salvataggio");
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#F4F1EA", width: "100%", maxWidth: 480,
        maxHeight: "94vh", overflowY: "auto",
        borderRadius: "20px 20px 0 0",
      }}>
        {/* Header */}
        <div style={{
          background: HEADER_GRAD,
          padding: "16px 18px", color: "#FFF",
          display: "flex", alignItems: "center", gap: 12,
          borderRadius: "20px 20px 0 0",
          position: "sticky" as any, top: 0, zIndex: 5,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Nuovo task</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {operator ? `Per ${operator.name}` : "Seleziona operatore"}
            </div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <IconClose size={20} color="#FFF" />
          </div>
        </div>

        <div style={{ padding: 14 }}>
          {error && (
            <div style={{
              background: TOKENS.red, color: TOKENS.redInk,
              padding: 10, borderRadius: 10, fontSize: 12,
              marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <IconAlert size={14} color={TOKENS.redInk} />
              {error}
            </div>
          )}

          {/* Tipo */}
          <FieldLabel>TIPO</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14 }}>
            {TIPI.map(t => {
              const sel = tipo === t.id;
              return (
                <div key={t.id} onClick={() => setTipo(t.id)} style={{
                  background: sel ? TOKENS.tealLight : "#FFF",
                  border: sel ? `2px solid ${TOKENS.teal}` : `1px solid ${TOKENS.hairline}`,
                  borderRadius: 10, padding: "8px 6px",
                  display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 4,
                  cursor: "pointer",
                }}>
                  <div style={{ fontSize: 16, lineHeight: 1 }}>{t.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: sel ? TOKENS.tealInk : TOKENS.ink }}>{t.label}</div>
                </div>
              );
            })}
          </div>

          {/* Operatore */}
          <FieldLabel>ASSEGNA A</FieldLabel>
          <div onClick={() => setShowOperatorPicker(true)} style={{
            background: "#FFF", borderRadius: 10, padding: "10px 12px",
            border: `1px solid ${TOKENS.hairline}`, marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            {operator ? (
              <>
                <Avatar name={operator.name} url={operator.avatar_url} size={28} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>{operator.name}</div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 13, color: TOKENS.muted }}>Seleziona operatore...</div>
            )}
            <span style={{ color: TOKENS.muted, fontSize: 14 }}>▾</span>
          </div>

          {/* Commessa (opzionale) */}
          <FieldLabel>COMMESSA <span style={{ fontWeight: 400, color: TOKENS.muted }}>(opzionale)</span></FieldLabel>
          <div onClick={() => setShowCommessaPicker(true)} style={{
            background: "#FFF", borderRadius: 10, padding: "10px 12px",
            border: `1px solid ${TOKENS.hairline}`, marginBottom: 14,
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            {commessa ? (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconFile size={13} color={TOKENS.teal} />
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                  {commessa.code} · {commessa.cliente}{commessa.cognome ? " " + commessa.cognome : ""}
                </div>
                <span onClick={(e) => { e.stopPropagation(); setCommessaId(""); }} style={{ color: TOKENS.muted, fontSize: 16, cursor: "pointer" }}>×</span>
              </>
            ) : (
              <>
                <div style={{ flex: 1, fontSize: 13, color: TOKENS.muted }}>Nessuna commessa</div>
                <span style={{ color: TOKENS.muted, fontSize: 14 }}>▾</span>
              </>
            )}
          </div>

          {/* Titolo */}
          <FieldLabel>TITOLO</FieldLabel>
          <input type="text" placeholder="es. Sopralluogo per misure"
            value={titolo} onChange={e => setTitolo(e.target.value)}
            style={inputStyle} />

          <div style={{ height: 14 }} />

          {/* Data + Ora inizio + Ora fine */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8 }}>
            <div>
              <FieldLabel>DATA</FieldLabel>
              <input type="date" value={giorno} onChange={e => setGiorno(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>INIZIO</FieldLabel>
              <input type="time" value={oraInizio} onChange={e => setOraInizio(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>FINE</FieldLabel>
              <input type="time" value={oraFine}
                onChange={e => { setOraFine(e.target.value); setTouchedOraFine(true); }}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ height: 14 }} />

          {/* Note */}
          <FieldLabel>NOTE <span style={{ fontWeight: 400, color: TOKENS.muted }}>(opzionali)</span></FieldLabel>
          <textarea placeholder="Es. portare silicone e tasselli, nominativo cliente, accesso cantiere..."
            value={note} onChange={e => setNote(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" as any, fontFamily: "inherit", minHeight: 64 }} />

          {/* Submit */}
          <button onClick={handleSubmit} disabled={busy || !valid} style={{
            width: "100%", marginTop: 16, padding: "14px 16px",
            background: valid ? TOKENS.teal : TOKENS.hairlineSoft,
            color: valid ? "#FFF" : TOKENS.muted,
            border: "none", borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            cursor: (busy || !valid) ? "default" : "pointer",
            opacity: busy ? 0.5 : 1,
            fontFamily: "inherit",
          }}>{busy ? "Creazione..." : "Crea task"}</button>
        </div>
      </div>

      {/* Picker operatore */}
      {showOperatorPicker && (
        <div onClick={() => setShowOperatorPicker(false)} style={{
          position: "fixed", inset: 0, background: "rgba(13,31,31,0.6)", zIndex: 10000,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#FFF", width: "100%", maxWidth: 480,
            maxHeight: "70vh", overflowY: "auto",
            borderRadius: "20px 20px 0 0",
          }}>
            <div style={{ padding: "14px 16px 8px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${TOKENS.hairline}`, position: "sticky" as any, top: 0, background: "#FFF", zIndex: 1 }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: TOKENS.ink }}>Scegli operatore</div>
              <div onClick={() => setShowOperatorPicker(false)} style={{ cursor: "pointer", color: TOKENS.muted, fontSize: 18 }}>×</div>
            </div>
            <div style={{ padding: 8 }}>
              {operators.map(op => (
                <div key={op.id} onClick={() => { setOperatorId(op.id); setShowOperatorPicker(false); }} style={{
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  background: op.id === operatorId ? TOKENS.tealLight : "transparent",
                }}>
                  <Avatar name={op.name} url={op.avatar_url} size={32} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>{op.name}</div>
                  {op.id === operatorId && <span style={{ color: TOKENS.teal, fontSize: 14 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Picker commessa */}
      {showCommessaPicker && (
        <CommessaPicker
          commesse={commesse}
          selectedId={commessaId}
          onPick={(id) => { setCommessaId(id); setShowCommessaPicker(false); }}
          onClose={() => setShowCommessaPicker(false)}
        />
      )}
    </div>
  );
}

function CommessaPicker({ commesse, selectedId, onPick, onClose }: {
  commesse: CommessaPerAvvio[];
  selectedId: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return commesse;
    const s = search.toLowerCase();
    return commesse.filter(c =>
      (c.code || "").toLowerCase().includes(s) ||
      (c.cliente || "").toLowerCase().includes(s) ||
      (c.cognome || "").toLowerCase().includes(s) ||
      (c.indirizzo || "").toLowerCase().includes(s)
    );
  }, [commesse, search]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.6)", zIndex: 10000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFF", width: "100%", maxWidth: 480,
        maxHeight: "75vh", overflowY: "auto",
        borderRadius: "20px 20px 0 0",
      }}>
        <div style={{ padding: "14px 16px 8px", borderBottom: `1px solid ${TOKENS.hairline}`, position: "sticky" as any, top: 0, background: "#FFF", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: TOKENS.ink }}>Scegli commessa</div>
            <div onClick={onClose} style={{ cursor: "pointer", color: TOKENS.muted, fontSize: 18 }}>×</div>
          </div>
          <input type="text" placeholder="Cerca codice, cliente, indirizzo..."
            value={search} onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{ ...inputStyle, fontSize: 13 }} />
        </div>
        <div style={{ padding: 8 }}>
          <div onClick={() => onPick("")} style={{
            padding: "10px 12px", borderRadius: 10, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
            background: !selectedId ? TOKENS.tealLight : "transparent",
            marginBottom: 4,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: TOKENS.hairlineSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: TOKENS.muted, fontSize: 16 }}>×</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TOKENS.muted }}>Nessuna commessa</div>
            {!selectedId && <span style={{ color: TOKENS.teal, fontSize: 14 }}>✓</span>}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center" as any, color: TOKENS.muted, fontSize: 13 }}>
              {commesse.length === 0 ? "Caricamento..." : "Nessun risultato"}
            </div>
          )}
          {filtered.map(c => (
            <div key={c.id} onClick={() => onPick(c.id)} style={{
              padding: "10px 12px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              background: c.id === selectedId ? TOKENS.tealLight : "transparent",
              marginBottom: 4,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconFile size={13} color={TOKENS.teal} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>
                  {c.code} {c.cliente && `· ${c.cliente}${c.cognome ? " " + c.cognome : ""}`}
                </div>
                {c.indirizzo && (
                  <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{c.indirizzo}</div>
                )}
              </div>
              {c.id === selectedId && <span style={{ color: TOKENS.teal, fontSize: 14 }}>✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: TOKENS.muted, marginBottom: 5, paddingLeft: 4, letterSpacing: 0.4 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  borderRadius: 10, border: `1px solid ${TOKENS.hairline}`,
  background: "#FFF", fontSize: 13, color: TOKENS.ink,
  outline: "none", boxSizing: "border-box" as any,
  fontFamily: "inherit",
};

function Avatar({ name, url, size = 28 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{init}</div>;
}
