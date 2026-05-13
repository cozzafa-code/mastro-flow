"use client";
import React from "react";
import { C, fmtDataBreve } from "./montaggi-editor-types";
import type { EditorState } from "./montaggi-editor-types";
import { Field, FieldDataDurata, Banner, PickerRow, inputStyle, labelMinuti, fmtDataInputIt } from "./MontaggiEditorFields";

interface Props {
  state: EditorState;
  setState: (n: Partial<EditorState>) => void;
  commessaLabel: string | null;
  commessaSub: string | null;
  contattoLabel: string | null;
  contattoSub: string | null;
  onOpenSlot: () => void;
  onOpenCommessa: () => void;
  onOpenContatto: () => void;
}

export default function MontaggiEditorBody({
  state, setState,
  commessaLabel, commessaSub,
  contattoLabel, contattoSub,
  onOpenSlot, onOpenCommessa, onOpenContatto,
}: Props) {
  const totLabel = state.tipo === "cantiere"
    ? `${state.giorni * state.oreGiorno} h`
    : state.tipo === "intervento"
      ? labelMinuti(state.durataMinuti)
      : "1 h";

  const dataLabel = state.dataInizio ? fmtDataInputIt(state.dataInizio) : "";
  const riepDataLabel = state.dataInizio
    ? (state.tipo === "cantiere"
      ? `Da ${fmtDataBreve(state.dataInizio)} · ${state.giorni} ${state.giorni === 1 ? "giorno" : "giorni"}`
      : `${fmtDataBreve(state.dataInizio)} · ${state.oraInizio}`)
    : "";

  return (
    <>
      {/* CANTIERE */}
      {state.tipo === "cantiere" && (
        <>
          <FieldDataDurata
            label="Data e durata"
            hint={state.giorni === 1 ? "Singolo giorno" : `${state.giorni} giorni`}
            value={dataLabel}
            onOpen={onOpenSlot}
          />
          {state.dataInizio && <Banner label={riepDataLabel} value={totLabel} />}
          {commessaLabel && (
            <PickerRow
              label={commessaLabel}
              sub={commessaSub || ""}
              onClick={onOpenCommessa}
              variant="amber"
            />
          )}
        </>
      )}

      {/* INTERVENTO */}
      {state.tipo === "intervento" && (
        <>
          <Field label="Cliente o commessa">
            <PickerRow
              label={contattoLabel || commessaLabel || "Scegli cliente dalla rubrica"}
              sub={contattoSub || commessaSub || "Tap per cercare"}
              onClick={onOpenContatto}
              variant="green"
              placeholder={!contattoLabel && !commessaLabel}
            />
            {!contattoLabel && !commessaLabel && (
              <div style={{
                marginTop: 4, fontSize: 10, color: C.navyFaint,
                fontWeight: 600, textAlign: "center",
              }}>
                oppure <span onClick={onOpenCommessa} style={{ color: C.amberDark, textDecoration: "underline", cursor: "pointer" }}>scegli da commesse esistenti</span>
              </div>
            )}
          </Field>
          <Field label="Cosa fare">
            <input
              type="text"
              value={state.titolo}
              onChange={(e) => setState({ titolo: e.target.value })}
              placeholder="Es. regolazione cerniera, sostituzione maniglia"
              style={inputStyle}
            />
          </Field>
          <FieldDataDurata
            label="Data e durata"
            hint="Tap 'Pianifica'"
            value={dataLabel}
            onOpen={onOpenSlot}
          />
          {state.dataInizio && <Banner label={riepDataLabel} value={totLabel} />}
          <Field label="Ora inizio">
            <input
              type="time"
              value={state.oraInizio}
              onChange={(e) => setState({ oraInizio: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </>
      )}

      {/* SOPRALLUOGO */}
      {state.tipo === "sopralluogo" && (
        <>
          <Field label="Cliente" hint="Esistente o nuovo">
            <PickerRow
              label={contattoLabel || "Cerca o aggiungi nuovo"}
              sub={contattoSub || "Tap per scegliere"}
              onClick={onOpenContatto}
              variant="green"
              placeholder={!contattoLabel}
            />
          </Field>
          <Field label="Indirizzo">
            <input
              type="text"
              value={state.indirizzoOverride}
              onChange={(e) => setState({ indirizzoOverride: e.target.value })}
              placeholder="Via, n., città"
              style={inputStyle}
            />
          </Field>
          <Field label="Telefono">
            <input
              type="tel"
              value={state.telefonoOverride}
              onChange={(e) => setState({ telefonoOverride: e.target.value })}
              placeholder="3xx xxx xxxx"
              style={inputStyle}
            />
          </Field>
          <FieldDataDurata
            label="Data sopralluogo"
            hint="Slot 1h"
            value={dataLabel}
            onOpen={onOpenSlot}
          />
          <Field label="Ora">
            <input
              type="time"
              value={state.oraInizio}
              onChange={(e) => setState({ oraInizio: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </>
      )}

      {/* NOTE */}
      <Field label="Note" hint="opzionale">
        <textarea
          value={state.note}
          onChange={(e) => setState({ note: e.target.value })}
          rows={2}
          placeholder="Es. portare coprifili 40mm, citofono guasto…"
          style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
        />
      </Field>
    </>
  );
}
