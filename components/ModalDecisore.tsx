"use client";
// components/ModalDecisore.tsx - Aggiungi decisore a network cliente

import React, { useState } from "react";
import { aggiungiDecisore } from "../hooks/useClienteCRUD";
import { IcoUsers, IcoClose, IcoCheck } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const PESI = [
  { val: 'alto', label: 'DECIDE', col: RED, descr: 'Ha potere decisionale' },
  { val: 'medio', label: 'INFLUENZA', col: AMBER, descr: 'Influisce sulle scelte' },
  { val: 'basso', label: 'ASCOLTA', col: MUTED, descr: 'Coinvolto come informato' },
];

interface Props {
  clienteId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalDecisore({ clienteId, onClose, onSaved }: Props) {
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9970, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoUsers size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>NETWORK DECISORI</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Aggiungi decisore</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClose size={18} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <Field label="Nome *" val={nome} onChange={setNome} placeholder="Es. Sig.ra Cozza" />
            <Field label="Ruolo *" val={ruolo} onChange={setRuolo} placeholder="Es. moglie / geometra / fratello" />
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 8 }}>PESO DECISIONALE</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {PESI.map(p => (
                <button key={p.val} onClick={() => setPeso(p.val)} style={{
                  background: peso === p.val ? p.col : '#F8FAFA',
                  color: peso === p.val ? '#fff' : TEXT,
                  border: `1.5px solid ${peso === p.val ? p.col : '#E5EAF0'}`,
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' as const, fontFamily: 'inherit',
                }}>
                  <div style={{ width: 38, padding: '3px 0', textAlign: 'center' as const, background: peso === p.val ? 'rgba(255,255,255,0.25)' : p.col + '22', color: peso === p.val ? '#fff' : p.col, borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}>{p.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{p.descr}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>NOTE (opzionale)</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Es. Decide colori e dettagli estetici"
              rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const, resize: 'vertical' as const }} />
          </div>
        </div>

        <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #E5EAF0', display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={salvando} style={{ flex: 1, padding: '14px 0', background: '#fff', color: MUTED, border: '1.5px solid #E5EAF0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Annulla</button>
          <button onClick={save} disabled={salvando} style={{
            flex: 2, padding: '14px 0',
            background: salvando ? MUTED : `linear-gradient(90deg, ${TEAL_DEEP}, #047857)`,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <IcoCheck size={16} color="#fff" />
            {salvando ? 'Salvataggio...' : 'AGGIUNGI'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, val, onChange, placeholder }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <input value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
    </div>
  );
}
