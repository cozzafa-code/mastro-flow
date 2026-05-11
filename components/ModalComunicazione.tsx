"use client";
// components/ModalComunicazione.tsx - Aggiungi comunicazione manuale

import React, { useState } from "react";
import { aggiungiComunicazione } from "../hooks/useClienteCRUD";
import { IcoChat, IcoClose, IcoCheck } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL_DEEP = "#0F6E56";
const BLUE = "#1E40AF";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const CANALI = [
  { val: 'whatsapp', label: 'WhatsApp' },
  { val: 'email', label: 'Email' },
  { val: 'chiamata', label: 'Chiamata' },
  { val: 'sms', label: 'SMS' },
  { val: 'manuale', label: 'Manuale' },
];

interface Props {
  aziendaId: string;
  clienteId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalComunicazione({ aziendaId, clienteId, onClose, onSaved }: Props) {
  const [canale, setCanale] = useState('chiamata');
  const [direzione, setDirezione] = useState<'in' | 'out'>('out');
  const [contenuto, setContenuto] = useState('');
  const [oggetto, setOggetto] = useState('');
  const [durata, setDurata] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function save() {
    if (!contenuto.trim()) { alert('Contenuto obbligatorio'); return; }
    setSalvando(true);
    const res = await aggiungiComunicazione({
      azienda_id: aziendaId,
      cliente_id: clienteId,
      canale,
      direzione,
      contenuto: contenuto.trim(),
      oggetto: oggetto.trim() || undefined,
      durata_secondi: durata ? Number(durata) : undefined,
      autore: typeof window !== 'undefined' ? (localStorage.getItem('mastro:nome_operatore') || 'Walter') : 'Walter',
    });
    setSalvando(false);
    if (res.error) { alert('Errore: ' + res.error.message); return; }
    onSaved?.();
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9970, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoChat size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>COMUNICAZIONE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Registra contatto</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClose size={18} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 6 }}>CANALE</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 12 }}>
              {CANALI.map(c => (
                <button key={c.val} onClick={() => setCanale(c.val)} style={{
                  background: canale === c.val ? NAVY : '#fff',
                  color: canale === c.val ? '#fff' : TEXT,
                  border: `1.5px solid ${canale === c.val ? NAVY : '#E5EAF0'}`,
                  borderRadius: 7, padding: '7px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>{c.label}</button>
              ))}
            </div>

            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 6 }}>DIREZIONE</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setDirezione('in')} style={{
                flex: 1, padding: '10px 0',
                background: direzione === 'in' ? '#FEF3C7' : '#fff',
                color: direzione === 'in' ? '#92400E' : TEXT,
                border: `1.5px solid ${direzione === 'in' ? '#D97706' : '#E5EAF0'}`,
                borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>◀ IN ARRIVO</button>
              <button onClick={() => setDirezione('out')} style={{
                flex: 1, padding: '10px 0',
                background: direzione === 'out' ? '#D1FAE5' : '#fff',
                color: direzione === 'out' ? TEAL_DEEP : TEXT,
                border: `1.5px solid ${direzione === 'out' ? TEAL_DEEP : '#E5EAF0'}`,
                borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>▶ IN USCITA</button>
            </div>
          </div>

          {canale === 'email' && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>OGGETTO EMAIL</div>
              <input value={oggetto} onChange={e => setOggetto(e.target.value)} placeholder="Es. Preventivo aggiornato"
                style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
          )}

          {canale === 'chiamata' && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>DURATA (secondi)</div>
              <input value={durata} onChange={e => setDurata(e.target.value)} placeholder="180" type="number"
                style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>CONTENUTO *</div>
            <textarea value={contenuto} onChange={e => setContenuto(e.target.value)} placeholder="Cosa è stato detto / scritto"
              rows={5} style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const, resize: 'vertical' as const, lineHeight: 1.4 }} />
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
            {salvando ? 'Salvataggio...' : 'REGISTRA'}
          </button>
        </div>
      </div>
    </div>
  );
}
