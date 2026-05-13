"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { C } from "./montaggi-editor-types";
import type { MontaggioRow, EditorState, CommessaLite, ContattoLite } from "./montaggi-editor-types";
import { buildEditorState, saveMontaggio, deleteMontaggio, buildCaricoMap, fetchContatti, commesseValide } from "./montaggi-editor-helpers";
import MontaggiTipoToggle from "./MontaggiTipoToggle";
import MontaggiEditorBody from "./MontaggiEditorBody";
import MontaggiEditorFooter from "./MontaggiEditorFooter";
import MontaggiSlotPicker from "./MontaggiSlotPicker";
import MontaggiCommessaPicker from "./MontaggiCommessaPicker";
import MontaggiContattoPicker from "./MontaggiContattoPicker";
import MontaggiExitConfirm from "./MontaggiExitConfirm";

interface Props {
  montaggio: MontaggioRow | null;
  commesse: any[];
  montaggiTutti: any[];
  aziendaId: string;
  onClose: () => void;
}

export default function MontaggiEditModalV2({ montaggio, commesse, montaggiTutti, aziendaId, onClose }: Props) {
  const initialRef = useRef<EditorState | null>(null);
  const [state, _setState] = useState<EditorState>(() => {
    const s = buildEditorState(montaggio);
    initialRef.current = s;
    return s;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [contatti, setContatti] = useState<ContattoLite[]>([]);
  const [showSlot, setShowSlot] = useState(false);
  const [showCommessa, setShowCommessa] = useState(false);
  const [showContatto, setShowContatto] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    const s = buildEditorState(montaggio);
    initialRef.current = s;
    _setState(s);
    setErr(null);
  }, [montaggio]);

  useEffect(() => {
    if (aziendaId) fetchContatti(aziendaId).then(setContatti);
  }, [aziendaId]);

  function setState(next: Partial<EditorState>) {
    _setState((s) => ({ ...s, ...next }));
  }

  const isDirty = useMemo(() => {
    if (!initialRef.current) return false;
    return JSON.stringify(state) !== JSON.stringify(initialRef.current);
  }, [state]);

  const caricoMap = useMemo(() => {
    const filtered = (montaggiTutti || []).filter((m) => !montaggio?.id || m.id !== montaggio.id);
    return buildCaricoMap(filtered);
  }, [montaggiTutti, montaggio?.id]);

  const cListaValide = useMemo(() => commesseValide(commesse), [commesse]);
  const commessaSel = useMemo(() => {
    if (!state.commessaId) return null;
    return cListaValide.find((c) => c.id === state.commessaId)
      || (commesse || []).find((c: any) => c.id === state.commessaId);
  }, [state.commessaId, cListaValide, commesse]);
  const contattoSel = useMemo(() => {
    if (!state.contattoId) return null;
    return contatti.find((c) => c.id === state.contattoId);
  }, [state.contattoId, contatti]);

  const commessaLabel = commessaSel
    ? `${commessaSel.code || ""} · ${commessaSel.cliente || ""} ${commessaSel.cognome || ""}`.trim()
    : null;
  const commessaSub = commessaSel
    ? [
      commessaSel.vani_count ? `${commessaSel.vani_count} vani` : null,
      (commessaSel.totale_finale || commessaSel.totale_preventivo) ? `€${Math.round(commessaSel.totale_finale || commessaSel.totale_preventivo || 0).toLocaleString("it-IT")}` : null,
      commessaSel.indirizzo || commessaSel.citta || null,
    ].filter(Boolean).join(" · ")
    : null;
  const contattoLabel = contattoSel ? `${contattoSel.nome || ""} ${contattoSel.cognome || ""}`.trim() : null;
  const contattoSub = contattoSel
    ? [contattoSel.telefono || "no tel", contattoSel.citta].filter(Boolean).join(" · ")
    : null;

  function tryClose() {
    if (isDirty && !saving) {
      setConfirmExit(true);
      return;
    }
    onClose();
  }

  async function handleSave() {
    setErr(null);
    setSaving(true);
    const res = await saveMontaggio(montaggio?.id || null, state, aziendaId);
    setSaving(false);
    if (!res.ok) {
      setErr(res.error || "Errore salvataggio");
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!montaggio?.id) return;
    setErr(null);
    setSaving(true);
    const res = await deleteMontaggio(montaggio.id);
    setSaving(false);
    if (!res.ok) {
      setErr(res.error || "Errore eliminazione");
      return;
    }
    onClose();
  }

  function handleConfirmSlot(dataIso: string) {
    setState({ dataInizio: dataIso });
    setShowSlot(false);
  }

  function handlePickCommessa(c: CommessaLite) {
    setState({ commessaId: c.id });
    setShowCommessa(false);
  }
  function handlePickContatto(c: ContattoLite) {
    const patch: Partial<EditorState> = { contattoId: c.id };
    if (state.tipo === "sopralluogo") {
      if (c.indirizzo && !state.indirizzoOverride) patch.indirizzoOverride = c.indirizzo;
      if (c.telefono && !state.telefonoOverride) patch.telefonoOverride = c.telefono;
    }
    setState(patch);
    setShowContatto(false);
  }

  const isNew = !montaggio?.id;
  const titoli = {
    cantiere: { t: "Pianifica cantiere", s: "Lavoro multi-giorno con squadra" },
    intervento: { t: "Nuovo intervento", s: "Lavoro breve · minuti / ore" },
    sopralluogo: { t: "Nuovo sopralluogo", s: "Visita per preventivo" },
  };
  const tt = titoli[state.tipo];

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) tryClose();
        }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(26, 42, 71, 0.55)",
          zIndex: 30,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}
      >
        <div style={{
          background: C.white,
          borderRadius: "20px 20px 0 0",
          width: "100%", maxWidth: 420,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "18px 18px 90px 18px",
          boxShadow: C.shadowLg,
          position: "relative",
        }}>
          <button
            onClick={tryClose}
            aria-label="Chiudi"
            style={{
              position: "absolute", top: 12, right: 12,
              width: 32, height: 32, borderRadius: 10,
              background: C.whiteOff, border: "none",
              cursor: "pointer", color: C.navyText, zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
          <div style={{ width: 40, height: 4, background: C.navyFaint, borderRadius: 2, margin: "0 auto 14px" }} />

          {!isNew && montaggio?.commessa_code && (
            <div style={{
              display: "inline-block",
              background: C.whiteOff, color: C.navyDim,
              fontSize: 10, fontWeight: 800,
              padding: "3px 7px", borderRadius: 6,
              marginBottom: 6, letterSpacing: 0.4,
            }}>
              {montaggio.commessa_code}
            </div>
          )}
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navyText, marginBottom: 4, letterSpacing: -0.3 }}>
            {isNew ? tt.t : "Modifica lavoro"}
          </div>
          <div style={{ fontSize: 11, color: C.navyDim, marginBottom: 16, fontWeight: 600 }}>
            {isNew ? tt.s : "Aggiorna dati e conferma"}
          </div>

          {isNew && (
            <MontaggiTipoToggle value={state.tipo} onChange={(t) => setState({ tipo: t })} />
          )}

          <MontaggiEditorBody
            state={state}
            setState={setState}
            commessaLabel={commessaLabel}
            commessaSub={commessaSub}
            contattoLabel={contattoLabel}
            contattoSub={contattoSub}
            onOpenSlot={() => setShowSlot(true)}
            onOpenCommessa={() => setShowCommessa(true)}
            onOpenContatto={() => setShowContatto(true)}
          />
        </div>
      </div>

      <MontaggiEditorFooter
        isNew={isNew}
        tipo={state.tipo}
        saving={saving}
        error={err}
        canDelete={!!montaggio?.id}
        onSave={handleSave}
        onCancel={tryClose}
        onDelete={handleDelete}
      />

      <MontaggiSlotPicker
        open={showSlot}
        state={state}
        setState={setState}
        caricoMap={caricoMap}
        commessaLabel={commessaLabel}
        onOpenCommessa={() => setShowCommessa(true)}
        onConfirm={handleConfirmSlot}
        onClose={() => setShowSlot(false)}
      />

      <MontaggiCommessaPicker
        open={showCommessa}
        commesse={commesse}
        onPick={handlePickCommessa}
        onClose={() => setShowCommessa(false)}
      />

      <MontaggiContattoPicker
        open={showContatto}
        contatti={contatti}
        aziendaId={aziendaId}
        onPick={handlePickContatto}
        onClose={() => setShowContatto(false)}
      />

      {confirmExit && (
        <MontaggiExitConfirm
          saving={saving}
          onSaveAndClose={async () => { setConfirmExit(false); await handleSave(); }}
          onDiscardAndClose={() => { setConfirmExit(false); onClose(); }}
          onContinue={() => setConfirmExit(false)}
        />
      )}
    </>
  );
}
