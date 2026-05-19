"use client";
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — MergeCommesseModal
// Modal per accorpare 2+ commesse con risoluzione conflitti.
// Design fliwoX: teal, 3D shadows, bottoni rilievo.
// ═══════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from "react";
import { mastroStore, type MergeResult } from "../lib/mastro-store";

// ─── Theme (fliwoX) ─────────────────────────────────────────
const TH = {
  ink: "#0D1F1F",
  sub: "#5A7878",
  teal: "#28A0A0",
  tealDark: "#1A7A7A",
  tealBright: "#5FD0D0",
  bgCard: "#FFFFFF",
  bgCardAlt: "#F5FBFB",
  borderSolid: "#C8E4E4",
  red: "#E24B4A",
  amber: "#F5A030",
  green: "#8BC443",
};

// ─── Campi considerati per conflitti ────────────────────────
const CONFLICT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "cliente", label: "Nome" },
  { key: "cognome", label: "Cognome" },
  { key: "telefono", label: "Telefono" },
  { key: "email", label: "Email" },
  { key: "indirizzo", label: "Indirizzo" },
];

// ─── Helpers ────────────────────────────────────────────────
const weightOfFase = (fase: string): number => {
  const order = [
    "sopralluogo", "rilievo", "preventivo", "conferma",
    "ordini", "produzione", "posa", "collaudo", "fattura", "chiusura",
  ];
  const idx = order.indexOf(fase);
  return idx === -1 ? 0 : idx;
};

/**
 * Quante "evidenze" ha una commessa (rilievi + vani + dati scalari riempiti).
 * Serve per scegliere il target di default: il più completo.
 */
const completenessScore = (c: any): number => {
  const n = (c.rilievi?.length || 0) * 10
    + (c.vani?.length || 0) * 3
    + (c.cliente ? 1 : 0)
    + (c.cognome ? 1 : 0)
    + (c.telefono ? 2 : 0)
    + (c.indirizzo ? 2 : 0)
    + (c.email ? 1 : 0)
    + weightOfFase(c.fase || "sopralluogo") * 2;
  return n;
};

const normalize = (v: any): string =>
  (v ?? "").toString().trim().toLowerCase();

// ─── Componente ─────────────────────────────────────────────
interface Props {
  commesse: any[];         // array di commesse selezionate (≥2)
  onClose: () => void;
  onDone: (result: MergeResult) => void;
}

export default function MergeCommesseModal({ commesse, onClose, onDone }: Props) {
  // Target: default = quella con score più alto
  const defaultTarget = useMemo(() => {
    return [...commesse].sort(
      (a, b) => completenessScore(b) - completenessScore(a)
    )[0];
  }, [commesse]);

  const [targetId, setTargetId] = useState<string>(defaultTarget?.id || "");

  // Conflitti: per ogni campo conflittuale, il valore scelto
  const [choices, setChoices] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = commesse.find((c) => c.id === targetId) || defaultTarget;
  const sources = commesse.filter((c) => c.id !== targetId);

  // Calcola conflitti su campi scalari
  const conflicts = useMemo(() => {
    const out: Array<{ key: string; label: string; values: Array<{ id: string; value: any; from: string }> }> = [];
    for (const f of CONFLICT_FIELDS) {
      const map = new Map<string, { value: any; from: string }>();
      for (const c of commesse) {
        const v = c[f.key];
        if (v === null || v === undefined || v === "") continue;
        const norm = normalize(v);
        if (!map.has(norm)) {
          map.set(norm, { value: v, from: `${c.code || c.id.slice(0, 6)}` });
        }
      }
      if (map.size >= 2) {
        out.push({
          key: f.key,
          label: f.label,
          values: Array.from(map.entries()).map(([_, v]) => ({ id: v.from, value: v.value, from: v.from })),
        });
      }
    }
    return out;
  }, [commesse, targetId]);

  // Auto-pre-select: per ogni conflitto, di default scegli il valore del target
  useEffect(() => {
    const init: Record<string, any> = {};
    for (const c of conflicts) {
      init[c.key] = target?.[c.key] ?? c.values[0].value;
    }
    setChoices(init);
  }, [conflicts, target]);

  const handleMerge = async () => {
    if (!target || sources.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      // Costruisci overrides: solo le scelte che differiscono dal target attuale
      const overrides: Record<string, any> = {};
      for (const c of conflicts) {
        if (choices[c.key] !== undefined && choices[c.key] !== target[c.key]) {
          overrides[c.key] = choices[c.key];
        }
      }

      const result = await mastroStore.mergeCommesse(
        target.id,
        sources.map((s) => s.id),
        overrides
      );

      onDone(result);
    } catch (e: any) {
      setError(e?.message || "Errore durante il merge");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,31,31,0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
          borderRadius: 22,
          boxShadow: "0 20px 48px rgba(13,31,31,0.4)",
          fontFamily: "'Manrope', -apple-system, system-ui, sans-serif",
        }}
      >
        {/* Header teal */}
        <div
          style={{
            background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
            padding: "16px 20px",
            borderRadius: "22px 22px 0 0",
            color: "#fff",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1px", opacity: 0.85, textTransform: "uppercase" }}>
            Azione bulk
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 2 }}>
            Unisci {commesse.length} commesse
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
            Scegli quale tenere. Le altre finiranno nel cestino (30gg recuperabili).
          </div>

          {/* Close X */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: 10,
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px" }}>
          {/* Step 1: scelta target */}
          <div style={{ fontSize: 10, fontWeight: 900, color: TH.tealDark, letterSpacing: "1px", marginBottom: 8 }}>
            1 · COMMESSA DA TENERE
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {commesse.map((c) => {
              const selected = c.id === targetId;
              const score = completenessScore(c);
              const nRil = c.rilievi?.length || 0;
              const nVani = (c.rilievi || []).reduce((a: number, r: any) => a + (r.vani?.length || 0), 0);
              return (
                <div
                  key={c.id}
                  onClick={() => setTargetId(c.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: selected ? "rgba(40,160,160,0.08)" : "#fff",
                    border: `2px solid ${selected ? TH.teal : TH.borderSolid}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: selected ? `0 4px 10px rgba(40,160,160,0.2)` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${selected ? TH.tealDark : TH.borderSolid}`,
                      background: selected ? TH.teal : "#fff",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.cliente}{c.cognome ? " " + c.cognome : ""}
                    </div>
                    <div style={{ fontSize: 10, color: TH.sub, fontWeight: 600, marginTop: 1 }}>
                      {c.code}{c.indirizzo ? " · " + c.indirizzo : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: TH.sub, letterSpacing: "0.3px" }}>
                      {nRil}R · {nVani}V
                    </div>
                    {c === commesse.sort((a, b) => completenessScore(b) - completenessScore(a))[0] && (
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 900,
                          color: "#fff",
                          background: TH.green,
                          padding: "2px 6px",
                          borderRadius: 5,
                          letterSpacing: "0.3px",
                        }}
                      >
                        PIÙ COMPLETA
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 2: conflitti */}
          {conflicts.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 900, color: TH.amber, letterSpacing: "1px", marginBottom: 8 }}>
                ⚠ 2 · CONFLITTI ({conflicts.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {conflicts.map((cf) => (
                  <div
                    key={cf.key}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "rgba(245,160,48,0.06)",
                      border: "1px solid rgba(245,160,48,0.3)",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 900, color: TH.sub, letterSpacing: "0.5px", marginBottom: 6 }}>
                      {cf.label.toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {cf.values.map((v, i) => {
                        const isChosen = normalize(choices[cf.key]) === normalize(v.value);
                        return (
                          <div
                            key={i}
                            onClick={() => setChoices((p) => ({ ...p, [cf.key]: v.value }))}
                            style={{
                              padding: "7px 10px",
                              borderRadius: 9,
                              background: isChosen ? TH.tealDark : "#fff",
                              color: isChosen ? "#fff" : TH.ink,
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              border: `1px solid ${isChosen ? TH.tealDark : TH.borderSolid}`,
                            }}
                          >
                            <div
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: isChosen ? "#fff" : "transparent",
                                border: `2px solid ${isChosen ? "#fff" : TH.borderSolid}`,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {String(v.value)}
                            </span>
                            <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 600 }}>
                              {v.from}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Sommario */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(40,160,160,0.08)",
              border: "1px solid rgba(40,160,160,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: TH.tealDark, letterSpacing: "0.5px", marginBottom: 4 }}>
              COSA SUCCEDE
            </div>
            <div style={{ fontSize: 11, color: TH.ink, fontWeight: 600, lineHeight: 1.5 }}>
              Rilievi e vani di <strong>{sources.length} commess{sources.length === 1 ? "a" : "e"}</strong> verranno spostati su <strong>{target?.code}</strong>. I rilievi duplicati saranno rinumerati in automatico. Le sorgenti finiranno nel cestino (30gg per recuperare).
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(226,75,74,0.1)",
                color: TH.red,
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              disabled={busy}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${TH.borderSolid}`,
                background: "#fff",
                color: TH.sub,
                fontSize: 12,
                fontWeight: 800,
                cursor: busy ? "not-allowed" : "pointer",
                letterSpacing: "0.3px",
              }}
            >
              ANNULLA
            </button>
            <button
              onClick={handleMerge}
              disabled={busy || !target || sources.length === 0}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background: busy
                  ? "rgba(40,160,160,0.3)"
                  : "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 900,
                cursor: busy ? "wait" : "pointer",
                letterSpacing: "0.4px",
                boxShadow: busy ? "none" : "0 5px 12px rgba(31,120,120,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {busy ? "UNISCO..." : `UNISCI ${sources.length} → ${target?.code || ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
