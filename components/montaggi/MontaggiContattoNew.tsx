"use client";
import React, { useState } from "react";
import { C } from "./montaggi-editor-types";
import type { ContattoLite } from "./montaggi-editor-types";
import { supabase } from "@/lib/supabase";

interface Props {
  aziendaId: string;
  onPick: (c: ContattoLite) => void;
  onBack: () => void;
}

export default function MontaggiContattoNew({ aziendaId, onPick, onBack }: Props) {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [tel, setTel] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function salva() {
    setErr(null);
    const n = nome.trim();
    const c = cognome.trim();
    if (!n && !c) {
      setErr("Inserisci almeno nome o cognome");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("contatti")
        .insert({
          azienda_id: aziendaId,
          nome: n || null,
          cognome: c || null,
          telefono: tel.trim() || null,
          tipo: "cliente",
        })
        .select("id, nome, cognome, telefono, email, citta, indirizzo, tipo")
        .single();
      if (error) {
        setErr(error.message);
        setSaving(false);
        return;
      }
      onPick(data as ContattoLite);
    } catch (e: any) {
      setErr(e?.message || "Errore");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
      <Field label="Nome" value={nome} onChange={setNome} placeholder="Mario" />
      <Field label="Cognome" value={cognome} onChange={setCognome} placeholder="Rossi" />
      <Field label="Telefono" value={tel} onChange={setTel} placeholder="3xx xxx xxxx" type="tel" />
      {err && (
        <div style={{
          background: C.redSoft, color: C.red,
          padding: "8px 10px", borderRadius: 8,
          fontSize: 11, fontWeight: 700, marginBottom: 10,
        }}>
          {err}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={onBack}
          disabled={saving}
          style={{
            flex: "0 0 90px",
            padding: 11, borderRadius: 10,
            background: C.whiteOff, color: C.navyText,
            border: `1.5px solid ${C.borderStrong}`,
            fontSize: 13, fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Indietro
        </button>
        <button
          onClick={salva}
          disabled={saving}
          style={{
            flex: 1, padding: 11, borderRadius: 10,
            background: saving ? C.navyFaint : C.navy,
            color: C.white, border: "none",
            fontSize: 13, fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Salvataggio…" : "Salva e usa"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10, fontWeight: 800,
        color: C.navyDim,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 5,
      }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 12px",
          borderRadius: 10,
          border: `1.5px solid ${C.borderStrong}`,
          background: C.white, color: C.navyText,
          fontSize: 14, fontWeight: 600,
          outline: "none", boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
