"use client";
import React, { useState } from "react";
import { aggiungiDecisore } from "../hooks/useClienteCRUD";
import { IcoUsers, IcoCheck } from "./IconLib";
import { CAT, PASTEL } from "../lib/modaleColors";
import ModalShell, { Sezione, Field, TextareaField, BtnSecondary, BtnPrimary } from "./ModalShell";

const PESI = [
  { val: 'alto',  label: 'DECIDE',    bg: PASTEL.red.bg,   solid: PASTEL.red.solid,   descr: 'Ha potere decisionale' },
  { val: 'medio', label: 'INFLUENZA', bg: PASTEL.amber.bg, solid: PASTEL.amber.solid, descr: 'Influisce sulle scelte' },
  { val: 'basso', label: 'ASCOLTA',   bg: '#F1F4F7',       solid: '#5C6B7A',          descr: 'Coinvolto come informato' },
];

interface Props {
  clienteId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalDecisore({ clienteId, onClose, onSaved }: Props) {
  const cat = CAT.decisore;
  const [nome, setNome] = useState('');
  const [ruolo, setRuolo] = useState('');
  const [peso, setPeso] = useState('medio');
  const [note, setNote] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function save() {
    if (!nome.trim() || !ruolo.trim()) { alert('Nome e ruolo obbligatori'); return; }
    setSalvando(true);
    const res = await aggiungiDecisore(clienteId, {
      nome: nome.trim(), ruolo: ruolo.trim(), peso_decisionale: peso, note: note.trim() || undefined,
    });
    setSalvando(false);
    if ((res as any).error) { alert('Errore: ' + (res as any).error.message); return; }
    onSaved?.();
    onClose();
  }

  return (
    <ModalShell
      cat={cat} Ico={IcoUsers}
      kicker="NETWORK DECISORI" title="Aggiungi decisore"
      onClose={onClose} maxWidth={500}
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={salvando}>Annulla</BtnSecondary>
          <BtnPrimary onClick={save} disabled={salvando} cat={cat}>
            <IcoCheck size={16} color="#fff" />
            <span>{salvando ? 'Salvataggio...' : 'AGGIUNGI'}</span>
          </BtnPrimary>
        </>
      }
    >
      <Sezione titolo="IDENTITÀ" accent={cat.solid}>
        <Field label="Nome *" val={nome} onChange={setNome} placeholder="Es. Sig.ra Cozza" />
        <Field label="Ruolo *" val={ruolo} onChange={setRuolo} placeholder="Es. moglie / geometra / fratello" />
      </Sezione>

      <Sezione titolo="PESO DECISIONALE">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {PESI.map(p => {
            const sel = peso === p.val;
            return (
              <button key={p.val} onClick={() => setPeso(p.val)} style={{
                background: sel ? p.bg : '#F8FAFA',
                color: sel ? p.solid : '#0F1F33',
                border: `1.5px solid ${sel ? p.solid : '#E5EAF0'}`,
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left' as const, fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 70, padding: '4px 0', textAlign: 'center' as const,
                  background: sel ? '#fff' : p.solid + '15',
                  color: sel ? p.solid : p.solid,
                  borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                }}>{p.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{p.descr}</div>
              </button>
            );
          })}
        </div>
      </Sezione>

      <Sezione titolo="NOTE">
        <TextareaField label="Note (opzionale)" val={note} onChange={setNote} placeholder="Es. Decide colori e dettagli estetici" rows={3} />
      </Sezione>
    </ModalShell>
  );
}