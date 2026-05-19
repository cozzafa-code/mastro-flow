// components/montaggi/MontaggiEditFooter.tsx
"use client";

import React from "react";
import { C } from "./montaggi-types";

interface Props {
  isNew: boolean;
  isPianifica: boolean;
  saving: boolean;
  error: string | null;
  showDelConfirm: boolean;
  onSave: () => void;
  onDelete: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
}

export default function MontaggiEditFooter({
  isNew,
  isPianifica,
  saving,
  error,
  showDelConfirm,
  onSave,
  onDelete,
  onAskDelete,
  onCancelDelete,
}: Props) {
  return (
    <>
      {/* Errore */}
      {error && (
        <div
          style={{
            background: C.redSoft,
            color: C.red,
            padding: "10px 12px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Conferma delete */}
      {showDelConfirm && (
        <div
          style={{
            background: C.redSoft,
            border: `1px solid ${C.red}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: C.red,
              marginBottom: 10,
            }}
          >
            Eliminare il montaggio?
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.navyDim,
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Azione irreversibile. La commessa resta intatta.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCancelDelete}
              style={{
                flex: 1,
                padding: 11,
                borderRadius: 10,
                background: C.white,
                color: C.navyText,
                border: `1.5px solid ${C.borderStrong}`,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Annulla
            </button>
            <button
              onClick={onDelete}
              disabled={saving}
              style={{
                flex: 1,
                padding: 11,
                borderRadius: 10,
                background: C.red,
                color: C.white,
                border: "none",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Elimino..." : "Elimina"}
            </button>
          </div>
        </div>
      )}

      {/* Azioni primarie */}
      <div style={{ display: "flex", gap: 8 }}>
        {!isNew && !showDelConfirm && (
          <button
            onClick={onAskDelete}
            style={{
              padding: "13px 16px",
              borderRadius: 12,
              background: C.white,
              color: C.red,
              border: `1.5px solid ${C.red}`,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Elimina
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: "13px 16px",
            borderRadius: 12,
            background: C.navy,
            color: C.white,
            border: "none",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            opacity: saving ? 0.6 : 1,
            boxShadow: "0 2px 8px rgba(26, 42, 71, 0.25)",
          }}
        >
          {saving
            ? "Salvo..."
            : isNew
              ? "Crea montaggio"
              : isPianifica
                ? "Pianifica"
                : "Salva modifiche"}
        </button>
      </div>
    </>
  );
}
