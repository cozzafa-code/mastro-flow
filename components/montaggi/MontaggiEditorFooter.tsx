"use client";
import React, { useState } from "react";
import { C } from "./montaggi-editor-types";

interface Props {
  isNew: boolean;
  tipo: "cantiere" | "intervento" | "sopralluogo";
  saving: boolean;
  error: string | null;
  canDelete: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function MontaggiEditorFooter({
  isNew, tipo, saving, error, canDelete,
  onSave, onCancel, onDelete,
}: Props) {
  const [confirmDel, setConfirmDel] = useState(false);

  const lblSalva = isNew
    ? (tipo === "sopralluogo" ? "Programma" : "Pianifica")
    : "Salva modifiche";

  return (
    <div
      style={{
        position: "fixed",
        left: "50%", transform: "translateX(-50%)",
        bottom: 0,
        width: "100%", maxWidth: 420,
        background: C.white,
        padding: "12px 18px 16px 18px",
        borderTop: `1px solid ${C.border}`,
        zIndex: 5,
      }}
    >
      {error && (
        <div style={{
          background: C.redSoft, color: C.red,
          padding: "8px 10px", borderRadius: 8,
          fontSize: 11, fontWeight: 700,
          marginBottom: 8,
        }}>
          {error}
        </div>
      )}

      {!confirmDel ? (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCancel}
              disabled={saving}
              style={{
                padding: "13px 16px", borderRadius: 12,
                background: C.whiteOff, color: C.navyText,
                border: `1.5px solid ${C.borderStrong}`,
                fontSize: 14, fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              Annulla
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "13px 16px", borderRadius: 12,
                background: saving ? C.navyFaint : C.navy,
                color: C.white, border: "none",
                fontSize: 14, fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Salvataggio…" : lblSalva}
            </button>
          </div>
          {canDelete && (
            <button
              onClick={() => setConfirmDel(true)}
              disabled={saving}
              style={{
                marginTop: 8,
                width: "100%",
                padding: 10,
                background: "transparent",
                color: C.red,
                border: "none",
                fontSize: 12, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                textDecoration: "underline",
              }}
            >
              Elimina questo lavoro
            </button>
          )}
        </>
      ) : (
        <>
          <div style={{
            background: C.redSoft, color: C.red,
            padding: "10px 12px", borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            marginBottom: 8, textAlign: "center",
          }}>
            Eliminare definitivamente? L'azione non si può annullare.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfirmDel(false)}
              disabled={saving}
              style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: C.whiteOff, color: C.navyText,
                border: `1.5px solid ${C.borderStrong}`,
                fontSize: 13, fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Annulla
            </button>
            <button
              onClick={onDelete}
              disabled={saving}
              style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: C.red, color: C.white,
                border: "none",
                fontSize: 13, fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Elimina
            </button>
          </div>
        </>
      )}
    </div>
  );
}
