// components/montaggi/MontaggiEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { C, MontaggioRow } from "./montaggi-types";
import {
  MontaggioFormData,
  rowToForm,
  emptyForm,
  saveMontaggio,
  deleteMontaggio,
  commesseValide,
} from "./montaggi-editor-helpers";
import {
  Field,
  Input,
  Textarea,
  Row2,
  SquadraPicker,
  StatoPicker,
  CommessaPicker,
} from "./MontaggiFormFields";
import MontaggiEditFooter from "./MontaggiEditFooter";

interface Props {
  montaggio: MontaggioRow | null;
  commesse: any[];
  aziendaId: string;
  onClose: () => void;
}

export default function MontaggiEditModal({
  montaggio,
  commesse,
  aziendaId,
  onClose,
}: Props) {
  const [form, setForm] = useState<MontaggioFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const isNew = !montaggio?.id;
  const isPianifica =
    !isNew && montaggio?.stato === "da_pianificare";

  useEffect(() => {
    if (!montaggio) return;
    if (montaggio.id) setForm(rowToForm(montaggio));
    else setForm(emptyForm());
    setError(null);
    setShowDelConfirm(false);
  }, [montaggio]);

  if (!montaggio) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await saveMontaggio(form, aziendaId);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Errore salvataggio");
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!form.id) return;
    setSaving(true);
    setError(null);
    const res = await deleteMontaggio(form.id);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Errore eliminazione");
      return;
    }
    onClose();
  }

  const cliente =
    `${montaggio.commessa_cliente || ""} ${montaggio.commessa_cognome || ""}`.trim() ||
    "—";
  const validCommesse = commesseValide(commesse);

  let title = "Modifica montaggio";
  if (isNew) title = "Nuovo montaggio";
  else if (isPianifica) title = "Pianifica montaggio";

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
          padding: "20px 20px 110px 20px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: C.shadowLg,
          position: "relative",
          WebkitOverflowScrolling: "touch" as any,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Chiudi"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 10,
            background: C.whiteOff,
            border: "none",
            color: C.navyText,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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
            fontSize: 19,
            fontWeight: 800,
            color: C.navyText,
            marginBottom: 4,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </div>
        {!isNew && (
          <div
            style={{
              fontSize: 12,
              color: C.navyDim,
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            {montaggio.commessa_code || ""} · {cliente}
          </div>
        )}

        {isNew && (
          <Field label="Commessa">
            <CommessaPicker
              commesse={validCommesse}
              selectedId={form.commessa_id}
              onChange={(id) => setForm({ ...form, commessa_id: id })}
            />
          </Field>
        )}

        <Field
          label="Data montaggio"
          hint={isPianifica ? "Senza data resta da pianificare" : undefined}
        >
          <Input
            type="date"
            value={form.data_montaggio || ""}
            onChange={(v) => setForm({ ...form, data_montaggio: v || null })}
          />
        </Field>

        <Row2
          left={
            <Field label="Ora inizio">
              <Input
                type="time"
                value={form.ora_inizio || ""}
                onChange={(v) => setForm({ ...form, ora_inizio: v || null })}
              />
            </Field>
          }
          right={
            <Field label="Ora fine">
              <Input
                type="time"
                value={form.ora_fine || ""}
                onChange={(v) => setForm({ ...form, ora_fine: v || null })}
              />
            </Field>
          }
        />

        <Field label="Ore preventivate" hint="Stima carico squadra in ore">
          <Input
            type="number"
            value={form.ore_preventivate?.toString() || ""}
            onChange={(v) =>
              setForm({
                ...form,
                ore_preventivate: v === "" ? null : Number(v),
              })
            }
          />
        </Field>

        <Field label="Squadra">
          <SquadraPicker
            selected={form.squadra}
            onChange={(s) => setForm({ ...form, squadra: s })}
          />
        </Field>

        {!isNew && (
          <Field label="Stato">
            <StatoPicker
              value={form.stato}
              onChange={(s) => setForm({ ...form, stato: s })}
            />
          </Field>
        )}

        <Field label="Note">
          <Textarea
            value={form.note || ""}
            placeholder="Note operative, indicazioni squadra, accessi..."
            onChange={(v) => setForm({ ...form, note: v || null })}
          />
        </Field>

        <MontaggiEditFooter
          isNew={isNew}
          isPianifica={isPianifica}
          saving={saving}
          error={error}
          showDelConfirm={showDelConfirm}
          onSave={handleSave}
          onDelete={handleDelete}
          onAskDelete={() => setShowDelConfirm(true)}
          onCancelDelete={() => setShowDelConfirm(false)}
        />
      </div>
    </div>
  );
}
