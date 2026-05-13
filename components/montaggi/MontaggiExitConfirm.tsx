"use client";
import React from "react";
import { C } from "./montaggi-editor-types";

interface Props {
  saving: boolean;
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onContinue: () => void;
}

export default function MontaggiExitConfirm({
  saving, onSaveAndClose, onDiscardAndClose, onContinue,
}: Props) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onContinue(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(26, 42, 71, 0.75)",
        zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: C.white,
        borderRadius: 16,
        width: "100%", maxWidth: 340,
        padding: 18,
        boxShadow: C.shadowLg,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.navyText, marginBottom: 6 }}>
          Salvare le modifiche?
        </div>
        <div style={{ fontSize: 12, color: C.navyDim, marginBottom: 14, fontWeight: 600 }}>
          Hai dati non salvati. Vuoi salvare prima di chiudere?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={onSaveAndClose}
            disabled={saving}
            style={{
              padding: 12, borderRadius: 10,
              background: saving ? C.navyFaint : C.navy,
              color: C.white, border: "none",
              fontSize: 14, fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Salvataggio…" : "Salva e chiudi"}
          </button>
          <button
            onClick={onDiscardAndClose}
            style={{
              padding: 12, borderRadius: 10,
              background: C.redSoft, color: C.red,
              border: `1.5px solid ${C.red}`,
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Esci senza salvare
          </button>
          <button
            onClick={onContinue}
            style={{
              padding: 10, background: "transparent",
              color: C.navyDim, border: "none",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Continua a modificare
          </button>
        </div>
      </div>
    </div>
  );
}
