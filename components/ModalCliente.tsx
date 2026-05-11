"use client";
// components/ModalCliente.tsx - Modal creazione/modifica cliente

import React, { useState, useEffect } from "react";
import { creaCliente, aggiornaCliente, eliminaCliente, type ClienteInput } from "../hooks/useClienteCRUD";
import { IcoUser, IcoClose, IcoCheck, IcoTrash, IcoAlertTriangle } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const BLUE = "#1E40AF";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const STATI = [
  { val: 'prospect', label: 'Prospect', col: BLUE },
  { val: 'attivo', label: 'Attivo', col: TEAL_DEEP },
  { val: 'storico', label: 'Storico', col: NAVY },
  { val: 'dormiente', label: 'Dormiente', col: AMBER },
  { val: 'perso', label: 'Perso', col: RED },
];

const PRIORITA = [
  { val: 'premium', label: 'Premium', col: NAVY },
  { val: 'alto', label: 'Alto', col: AMBER },
  { val: 'medio', label: 'Medio', col: MUTED },
  { val: 'basso', label: 'Basso', col: MUTED },
];

const TIPOLOGIE_RELAZIONE = [
  'storico', 'referral', 'referral_attivo', 'premium', 'alto_valore',
  'influencer', 'problematico', 'nuovo',
];

interface Props {
  aziendaId: string;
  cliente?: any;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export default function ModalCliente({ aziendaId, cliente, onClose, onSaved }: Props) {
  const isEdit = !!cliente?.id;
  const [f, setF] = useState<any>({
    nome: cliente?.nome || '',
    cognome: cliente?.cognome || '',
    telefono: cliente?.telefono || '',
    email: cliente?.email || '',
    codice_fiscale: cliente?.codice_fiscale || '',
    indirizzo: cliente?.indirizzo || '',
    citta: cliente?.citta || '',
    cap: cliente?.cap || '',
    provincia: cliente?.provincia || '',
    stato_cliente: cliente?.stato_cliente || 'prospect',
    livello_priorita: cliente?.livello_priorita || 'medio',
    professione: cliente?.professione || '',
    settore_lavorativo: cliente?.settore_lavorativo || '',
    tipologia_relazione: Array.isArray(cliente?.tipologia_relazione) ? cliente.tipologia_relazione : [],
    tag_emozionali: Array.isArray(cliente?.tag_emozionali) ? cliente.tag_emozionali : [],
    preferenze_no_dopo: cliente?.preferenze_contatto?.no_dopo || '',
    preferenze_canale: cliente?.preferenze_contatto?.canale_preferito || '',
    prossima_azione: cliente?.prossima_azione || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [confermaDelete, setConfermaDelete] = useState(false);

  function update(field: string, val: any) {
    setF((prev: any) => ({ ...prev, [field]: val }));
  }

  function toggleTipologia(t: string) {
    update('tipologia_relazione', f.tipologia_relazione.includes(t)
      ? f.tipologia_relazione.filter((x: string) => x !== t)
      : [...f.tipologia_relazione, t]);
  }

  async function save() {
    if (!f.nome.trim()) { alert('Nome obbligatorio'); return; }
    setSalvando(true);

    const payload: ClienteInput = {
      azienda_id: aziendaId,
      nome: f.nome.trim().toUpperCase(),
      cognome: f.cognome.trim().toUpperCase(),
      telefono: f.telefono.trim() || null,
      email: f.email.trim() || null,
      codice_fiscale: f.codice_fiscale.trim().toUpperCase() || null,
      indirizzo: f.indirizzo.trim() || null,
      citta: f.citta.trim() || null,
      cap: f.cap.trim() || null,
      provincia: f.provincia.trim().toUpperCase() || null,
      stato_cliente: f.stato_cliente,
      livello_priorita: f.livello_priorita,
      professione: f.professione.trim() || null,
      settore_lavorativo: f.settore_lavorativo.trim() || null,
      tipologia_relazione: f.tipologia_relazione,
      preferenze_contatto: {
        no_dopo: f.preferenze_no_dopo || undefined,
        canale_preferito: f.preferenze_canale || undefined,
      },
      prossima_azione: f.prossima_azione.trim() || null,
    };

    let res;
    if (isEdit) {
      res = await aggiornaCliente(cliente.id, payload);
    } else {
      res = await creaCliente(payload);
    }
    setSalvando(false);

    if (res.error) { alert('Errore: ' + res.error.message); return; }
    onSaved?.(res.data?.id || cliente?.id);
    onClose();
  }

  async function elimina() {
    if (!isEdit) return;
    setSalvando(true);
    const res = await eliminaCliente(cliente.id);
    setSalvando(false);
    if ((res as any).error) {
      alert((res as any).error.message);
      setConfermaDelete(false);
      return;
    }
    onSaved?.('');
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9950, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '95vh', display: 'flex', flexDirection: 'column' as const }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoUser size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CLIENTE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{isEdit ? 'Modifica cliente' : 'Nuovo cliente'}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClose size={18} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const }}>
          {/* IDENTITÀ */}
          <Sezione titolo="IDENTITÀ">
            <Row>
              <Field label="Nome *" val={f.nome} onChange={(v: any) => update('nome', v)} placeholder="Es. MARIO" />
              <Field label="Cognome" val={f.cognome} onChange={(v: any) => update('cognome', v)} placeholder="Es. ROSSI" />
            </Row>
            <Field label="Codice fiscale" val={f.codice_fiscale} onChange={(v: any) => update('codice_fiscale', v)} placeholder="RSSMRA80A01H501Z" />
          </Sezione>

          {/* CONTATTI */}
          <Sezione titolo="CONTATTI">
            <Field label="Telefono" val={f.telefono} onChange={(v: any) => update('telefono', v)} placeholder="+39 333 1234567" type="tel" />
            <Field label="Email" val={f.email} onChange={(v: any) => update('email', v)} placeholder="mario@example.com" type="email" />
          </Sezione>

          {/* INDIRIZZO */}
          <Sezione titolo="INDIRIZZO">
            <Field label="Via e numero" val={f.indirizzo} onChange={(v: any) => update('indirizzo', v)} placeholder="Via Roma 12" />
            <Row>
              <Field label="CAP" val={f.cap} onChange={(v: any) => update('cap', v)} placeholder="87100" />
              <Field label="Città" val={f.citta} onChange={(v: any) => update('citta', v)} placeholder="Cosenza" />
              <Field label="Prov" val={f.provincia} onChange={(v: any) => update('provincia', v)} placeholder="CS" />
            </Row>
          </Sezione>

          {/* STATO + PRIORITÀ */}
          <Sezione titolo="STATO COMMERCIALE">
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 5 }}>STATO CLIENTE</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 12 }}>
              {STATI.map(s => (
                <button key={s.val} onClick={() => update('stato_cliente', s.val)} style={{
                  background: f.stato_cliente === s.val ? s.col : '#fff',
                  color: f.stato_cliente === s.val ? '#fff' : TEXT,
                  border: `1.5px solid ${f.stato_cliente === s.val ? s.col : '#E5EAF0'}`,
                  borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>{s.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 5 }}>LIVELLO PRIORITÀ</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {PRIORITA.map(p => (
                <button key={p.val} onClick={() => update('livello_priorita', p.val)} style={{
                  background: f.livello_priorita === p.val ? p.col : '#fff',
                  color: f.livello_priorita === p.val ? '#fff' : TEXT,
                  border: `1.5px solid ${f.livello_priorita === p.val ? p.col : '#E5EAF0'}`,
                  borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>{p.label}</button>
              ))}
            </div>
          </Sezione>

          {/* PROFILO LAVORATIVO */}
          <Sezione titolo="PROFILO LAVORATIVO">
            <Field label="Professione" val={f.professione} onChange={(v: any) => update('professione', v)} placeholder="Es. Avvocato civilista" />
            <Field label="Settore lavorativo" val={f.settore_lavorativo} onChange={(v: any) => update('settore_lavorativo', v)} placeholder="Es. Studio in centro Cosenza" />
          </Sezione>

          {/* TIPOLOGIE RELAZIONE */}
          <Sezione titolo={`TIPOLOGIE RELAZIONE · ${f.tipologia_relazione.length}`}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {TIPOLOGIE_RELAZIONE.map(t => (
                <button key={t} onClick={() => toggleTipologia(t)} style={{
                  background: f.tipologia_relazione.includes(t) ? TEAL_DEEP : '#fff',
                  color: f.tipologia_relazione.includes(t) ? '#fff' : TEXT,
                  border: `1.5px solid ${f.tipologia_relazione.includes(t) ? TEAL_DEEP : '#E5EAF0'}`,
                  borderRadius: 6, padding: '5px 9px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                }}>{t.replace(/_/g, ' ')}</button>
              ))}
            </div>
          </Sezione>

          {/* PREFERENZE */}
          <Sezione titolo="PREFERENZE CONTATTO">
            <Row>
              <Field label="Non chiamare dopo (es. 18:00)" val={f.preferenze_no_dopo} onChange={(v: any) => update('preferenze_no_dopo', v)} placeholder="18:00" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>CANALE PREFERITO</div>
                <select value={f.preferenze_canale} onChange={e => update('preferenze_canale', e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, background: '#fff', fontFamily: 'inherit' }}>
                  <option value="">—</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="chiamata">Chiamata</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </Row>
          </Sezione>

          {/* PROSSIMA AZIONE */}
          <Sezione titolo="PROSSIMA AZIONE">
            <Field label="Cosa fare" val={f.prossima_azione} onChange={(v: any) => update('prossima_azione', v)} placeholder="Es. Chiamare per acconto" />
          </Sezione>

          {/* DELETE per edit */}
          {isEdit && (
            <div style={{ marginTop: 16, padding: 14, background: '#FEE2E2', borderRadius: 10, borderLeft: `4px solid ${RED}` }}>
              {!confermaDelete ? (
                <button onClick={() => setConfermaDelete(true)} style={{ width: '100%', padding: '11px 12px', background: '#fff', color: RED, border: `1.5px solid ${RED}`, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IcoTrash size={14} color={RED} />ELIMINA CLIENTE
                </button>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <IcoAlertTriangle size={18} color={RED} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#991B1B' }}>Confermi eliminazione?</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#991B1B', marginBottom: 10 }}>Tutti gli eventi, comunicazioni e documenti collegati saranno persi. Le commesse attive bloccheranno l'operazione.</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfermaDelete(false)} disabled={salvando} style={{ flex: 1, padding: '9px 0', background: '#fff', color: MUTED, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Annulla</button>
                    <button onClick={elimina} disabled={salvando} style={{ flex: 1, padding: '9px 0', background: RED, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer' }}>{salvando ? 'Eliminazione...' : 'CONFERMA ELIMINAZIONE'}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #E5EAF0', display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={salvando} style={{
            flex: 1, padding: '14px 0', background: '#fff', color: MUTED,
            border: '1.5px solid #E5EAF0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Annulla</button>
          <button onClick={save} disabled={salvando} style={{
            flex: 2, padding: '14px 0',
            background: salvando ? MUTED : `linear-gradient(90deg, ${TEAL_DEEP}, #047857)`,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <IcoCheck size={16} color="#fff" />
            {salvando ? 'Salvataggio...' : (isEdit ? 'AGGIORNA' : 'CREA CLIENTE')}
          </button>
        </div>
      </div>
    </div>
  );
}

// === Helpers ===
function Sezione({ titolo, children }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10, fontWeight: 800 }}>{titolo}</div>
      {children}
    </div>
  );
}

function Row({ children }: any) {
  return <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{children}</div>;
}

function Field({ label, val, onChange, placeholder, type = 'text' }: any) {
  return (
    <div style={{ flex: 1, marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
    </div>
  );
}
