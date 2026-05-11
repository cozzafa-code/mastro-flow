"use client";
import React, { useState } from "react";
import { aggiungiComunicazione } from "../hooks/useClienteCRUD";
import { IcoChat, IcoCheck } from "./IconLib";
import { CAT, PASTEL } from "../lib/modaleColors";
import ModalShell, { Sezione, Field, TextareaField, BtnSecondary, BtnPrimary } from "./ModalShell";

const CANALI = [
  { val: 'whatsapp', label: 'WhatsApp' },
  { val: 'email',    label: 'Email' },
  { val: 'chiamata', label: 'Chiamata' },
  { val: 'sms',      label: 'SMS' },
  { val: 'manuale',  label: 'Manuale' },
];

interface Props {
  aziendaId: string;
  clienteId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalComunicazione({ aziendaId, clienteId, onClose, onSaved }: Props) {
  const cat = CAT.comunicazione;
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
      canale, direzione,
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
    <ModalShell
      cat={cat} Ico={IcoChat}
      kicker="COMUNICAZIONE" title="Registra contatto"
      onClose={onClose} maxWidth={500}
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={salvando}>Annulla</BtnSecondary>
          <BtnPrimary onClick={save} disabled={salvando} cat={cat}>
            <IcoCheck size={16} color="#fff" />
            <span>{salvando ? 'Salvataggio...' : 'REGISTRA'}</span>
          </BtnPrimary>
        </>
      }
    >
      <Sezione titolo="CANALE" accent={cat.solid}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 14 }}>
          {CANALI.map(c => (
            <button key={c.val} onClick={() => setCanale(c.val)} style={{
              background: canale === c.val ? cat.bg : '#fff',
              color: canale === c.val ? cat.text : '#0F1F33',
              border: `1.5px solid ${canale === c.val ? cat.solid : '#E5EAF0'}`,
              borderRadius: 8, padding: '8px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{c.label}</button>
          ))}
        </div>

        <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 6 }}>DIREZIONE</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setDirezione('in')} style={{
            flex: 1, padding: '12px 0',
            background: direzione === 'in' ? PASTEL.amber.bg : '#fff',
            color: direzione === 'in' ? PASTEL.amber.text : '#0F1F33',
            border: `1.5px solid ${direzione === 'in' ? PASTEL.amber.solid : '#E5EAF0'}`,
            borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.3,
          }}>◀ IN ARRIVO</button>
          <button onClick={() => setDirezione('out')} style={{
            flex: 1, padding: '12px 0',
            background: direzione === 'out' ? PASTEL.teal.bg : '#fff',
            color: direzione === 'out' ? PASTEL.teal.text : '#0F1F33',
            border: `1.5px solid ${direzione === 'out' ? PASTEL.teal.solid : '#E5EAF0'}`,
            borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.3,
          }}>▶ IN USCITA</button>
        </div>
      </Sezione>

      {canale === 'email' && (
        <Sezione titolo="OGGETTO EMAIL">
          <Field label="Oggetto" val={oggetto} onChange={setOggetto} placeholder="Es. Preventivo aggiornato" />
        </Sezione>
      )}

      {canale === 'chiamata' && (
        <Sezione titolo="DURATA CHIAMATA">
          <Field label="Secondi" val={durata} onChange={setDurata} placeholder="180" type="number" />
        </Sezione>
      )}

      <Sezione titolo="CONTENUTO">
        <TextareaField label="Cosa è stato detto / scritto *" val={contenuto} onChange={setContenuto}
          placeholder="Descrivi il contenuto della comunicazione" rows={5} />
      </Sezione>
    </ModalShell>
  );
}