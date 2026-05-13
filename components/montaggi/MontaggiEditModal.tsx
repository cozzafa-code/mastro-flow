// components/montaggi/MontaggiEditModal.tsx
"use client";

import React from "react";
import { C, MontaggioRow } from "./montaggi-types";

interface Props {
  montaggio: MontaggioRow | null;
  onClose: () => void;
}

/**
 * Modal placeholder per edit montaggio.
 * In futuro: form completo data/ora/squadra/note con persistenza Supabase.
 */
export default function MontaggiEditModal({ montaggio, onClose }: Props) {
  if (!montaggio) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26, 42, 71, 0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: "20px 20px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 420,
          boxShadow: C.shadowLg,
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: C.navyFaint,
            borderRadius: 2,
            margin: "0 auto 16px auto",
          }}
        />
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: C.navyText,
            marginBottom: 8,
          }}
        >
          {montaggio.id ? "Modifica montaggio" : "Nuovo montaggio"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.navyDim,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          {montaggio.commessa_code
            ? `${montaggio.commessa_code} · ${montaggio.commessa_cognome || "Cliente"}`
            : "Editor in arrivo (data, ora, squadra, note)"}
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            background: C.navy,
            color: C.white,
            border: "none",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
