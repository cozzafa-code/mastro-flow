// components/mobile/team/SquadEditSheet.tsx
// FASE 5B - sheet creazione/modifica squadra
"use client";
import React, { useState, useEffect } from "react";
import type { Operator } from "@/lib/types/team";
import { creaSquadra, aggiornaSquadra, setMembriSquadra, getSquadra, type SquadraInput } from "@/lib/team-actions";
import { TOKENS } from "@/components/widgets/MiniAppCard";
import { IconClose, IconUsers, IconUser, IconCheck } from "@/components/widgets/shared/icons";

interface Props {
  operators: Operator[];
  squadraId?: string;       // se passato, edit mode
  onClose: () => void;
  onSaved: () => void;
}

const COLORI = ["#28A0A0", "#16A34A", "#F59E0B", "#EF4444", "#3B82F6", "#9333EA", "#EC4899", "#0F172A"];

export default function SquadEditSheet({ operators, squadraId, onClose, onSaved }: Props) {
  const isEdit = !!squadraId;
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [zona, setZona] = useState("");
  const [specializzazione, setSpecializzazione] = useState("");
  const [colore, setColore] = useState(COLORI[0]);
  const [capoId, setCapoId] = useState<string | null>(null);
  const [membriIds, setMembriIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      try {
        const sq = await getSquadra(squadraId!);
        if (!alive || !sq) return;
        setNome(sq.nome);
        setDescrizione(sq.descrizione || "");
        setZona(sq.zona || "");
        setSpecializzazione(sq.specializzazione || "");
        setColore(sq.colore || COLORI[0]);
        setCapoId(sq.capo_squadra_id);
        setMembriIds(sq.membri_ids);
      } catch (e: any) {
        if (alive) setError(e?.message || "errore caricamento");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [squadraId, isEdit]);

  const toggleMembro = (opId: string) => {
    setMembriIds(prev => prev.includes(opId) ? prev.filter(x => x !== opId) : [...prev, opId]);
  };

  const handleSave = async () => {
    if (!nome.trim()) { setError("Il nome è obbligatorio"); return; }
    try {
      setBusy(true);
      setError(null);
      const input: SquadraInput = {
        nome: nome.trim(),
        descrizione: descrizione.trim() || undefined,
        capo_squadra_id: capoId,
        zona: zona.trim() || undefined,
        specializzazione: specializzazione.trim() || undefined,
        colore,
        attiva: true,
      };
      // Garantisci capo dentro membri
      const finalMembri = capoId && !membriIds.includes(capoId) ? [...membriIds, capoId] : membriIds;
      if (isEdit) {
        await aggiornaSquadra(squadraId!, input);
        await setMembriSquadra(squadraId!, finalMembri, capoId);
      } else {
        await creaSquadra(input, finalMembri);
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message || "errore salvataggio");
    } finally {
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
        maxHeight: "90vh", overflowY: "auto",
        borderRadius: "20px 20px 0 0",
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colore} 0%, ${colore}CC 100%)`,
          padding: "16px 18px", color: "#FFF",
          display: "flex", alignItems: "center", gap: 12,
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{isEdit ? "Modifica squadra" : "Nuova squadra"}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {membriIds.length} {membriIds.length === 1 ? "membro" : "membri"}{capoId ? " · capo selezionato" : ""}
            </div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <IconClose size={20} color="#FFF" />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>Caricamento...</div>
        ) : (
          <div style={{ padding: 14 }}>
            {error && (
              <div style={{ background: TOKENS.red, color: TOKENS.redInk, padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 10 }}>{error}</div>
            )}

            {/* Nome */}
            <Field label="NOME">
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="es. Squadra Cantieri" style={inputStyle} />
            </Field>

            {/* Descrizione */}
            <Field label="DESCRIZIONE">
              <input value={descrizione} onChange={e => setDescrizione(e.target.value)} placeholder="opzionale" style={inputStyle} />
            </Field>

            {/* Zona + Specializzazione side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="ZONA">
                <input value={zona} onChange={e => setZona(e.target.value)} placeholder="es. Cosenza" style={inputStyle} />
              </Field>
              <Field label="SPECIALIZZAZIONE">
                <input value={specializzazione} onChange={e => setSpecializzazione(e.target.value)} placeholder="es. PVC" style={inputStyle} />
              </Field>
            </div>

            {/* Colore */}
            <Field label="COLORE">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as any }}>
                {COLORI.map(c => (
                  <div key={c} onClick={() => setColore(c)} style={{
                    width: 32, height: 32, borderRadius: 8, background: c,
                    cursor: "pointer", border: colore === c ? "3px solid #1A1A1A" : "3px solid transparent",
                  }} />
                ))}
              </div>
            </Field>

            {/* Membri */}
            <Field label="MEMBRI">
              <div style={{ display: "flex", flexDirection: "column" as any, gap: 6 }}>
                {operators.map(op => {
                  const sel = membriIds.includes(op.id);
                  const isCapo = capoId === op.id;
                  return (
                    <div key={op.id} style={{
                      background: "#FFF", borderRadius: 10,
                      padding: "8px 10px", display: "flex", alignItems: "center", gap: 10,
                      border: sel ? `2px solid ${colore}` : `1px solid ${TOKENS.hairline}`,
                    }}>
                      <div onClick={() => toggleMembro(op.id)} style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: sel ? colore : "#FFF",
                        border: sel ? "none" : `1.5px solid ${TOKENS.hairline}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}>
                        {sel && <IconCheck size={14} color="#FFF" strokeWidth={3} />}
                      </div>
                      <Avatar name={op.name} url={op.avatar_url} size={28} />
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>{op.name}</div>
                      {sel && (
                        <div onClick={() => setCapoId(isCapo ? null : op.id)} style={{
                          fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6,
                          background: isCapo ? colore : TOKENS.hairlineSoft,
                          color: isCapo ? "#FFF" : TOKENS.muted,
                          cursor: "pointer", letterSpacing: 0.3,
                        }}>{isCapo ? "CAPO" : "+ capo"}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Field>

            {/* Save button */}
            <button onClick={handleSave} disabled={busy} style={{
              width: "100%", padding: "14px 16px",
              background: colore, color: "#FFF", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.5 : 1, fontFamily: "inherit", marginTop: 8,
            }}>{busy ? "Salvataggio..." : (isEdit ? "Salva modifiche" : "Crea squadra")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  borderRadius: 10, border: `1px solid ${TOKENS.hairline}`,
  background: "#FFF", fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box" as any,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: TOKENS.muted, marginBottom: 5, paddingLeft: 4, fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
      {children}
    </div>
  );
}

function Avatar({ name, url, size = 28 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{init}</div>;
}
