"use client";
import React, { useState } from "react";
import { creaCliente, aggiornaCliente, eliminaCliente, type ClienteInput } from "../hooks/useClienteCRUD";
import { IcoUser, IcoCheck, IcoTrash, IcoAlertTriangle } from "./IconLib";
import { CAT, PASTEL } from "../lib/modaleColors";
import ModalShell, { Sezione, FieldRow, Field, BtnSecondary, BtnPrimary } from "./ModalShell";

const STATI = [
  { val: 'prospect',  label: 'Prospect',  bg: PASTEL.blue.bg,   solid: PASTEL.blue.solid },
  { val: 'attivo',    label: 'Attivo',    bg: PASTEL.teal.bg,   solid: PASTEL.teal.solid },
  { val: 'storico',   label: 'Storico',   bg: PASTEL.navy.bg,   solid: PASTEL.navy.solid },
  { val: 'dormiente', label: 'Dormiente', bg: PASTEL.amber.bg,  solid: PASTEL.amber.solid },
  { val: 'perso',     label: 'Perso',     bg: PASTEL.red.bg,    solid: PASTEL.red.solid },
];

const PRIORITA = [
  { val: 'premium', label: 'Premium', bg: PASTEL.violet.bg, solid: PASTEL.violet.solid },
  { val: 'alto',    label: 'Alto',    bg: PASTEL.amber.bg,  solid: PASTEL.amber.solid },
  { val: 'medio',   label: 'Medio',   bg: PASTEL.navy.bg,   solid: PASTEL.navy.solid },
  { val: 'basso',   label: 'Basso',   bg: '#F1F4F7',        solid: '#5C6B7A' },
];

const TIPOLOGIE = ['storico', 'referral', 'referral_attivo', 'premium', 'alto_valore', 'influencer', 'problematico', 'nuovo'];

interface Props {
  aziendaId: string;
  cliente?: any;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export default function ModalCliente({ aziendaId, cliente, onClose, onSaved }: Props) {
  const isEdit = !!cliente?.id;
  const cat = CAT.cliente;

  const [f, setF] = useState<any>({
    nome: cliente?.nome || '', cognome: cliente?.cognome || '',
    telefono: cliente?.telefono || '', email: cliente?.email || '',
    codice_fiscale: cliente?.codice_fiscale || '',
    indirizzo: cliente?.indirizzo || '', citta: cliente?.citta || '',
    cap: cliente?.cap || '', provincia: cliente?.provincia || '',
    stato_cliente: cliente?.stato_cliente || 'prospect',
    livello_priorita: cliente?.livello_priorita || 'medio',
    professione: cliente?.professione || '',
    settore_lavorativo: cliente?.settore_lavorativo || '',
    tipologia_relazione: Array.isArray(cliente?.tipologia_relazione) ? cliente.tipologia_relazione : [],
    preferenze_no_dopo: cliente?.preferenze_contatto?.no_dopo || '',
    preferenze_canale: cliente?.preferenze_contatto?.canale_preferito || '',
    prossima_azione: cliente?.prossima_azione || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [confermaDelete, setConfermaDelete] = useState(false);

  const upd = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const toggleTip = (t: string) => upd('tipologia_relazione',
    f.tipologia_relazione.includes(t) ? f.tipologia_relazione.filter((x: string) => x !== t) : [...f.tipologia_relazione, t]);

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
    const res = isEdit ? await aggiornaCliente(cliente.id, payload) : await creaCliente(payload);
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
    if ((res as any).error) { alert((res as any).error.message); setConfermaDelete(false); return; }
    onSaved?.('');
    onClose();
  }

  return (
    <ModalShell
      cat={cat} Ico={IcoUser}
      kicker="CLIENTE" title={isEdit ? 'Modifica cliente' : 'Nuovo cliente'}
      onClose={onClose}
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={salvando}>Annulla</BtnSecondary>
          <BtnPrimary onClick={save} disabled={salvando} cat={cat}>
            <IcoCheck size={16} color="#fff" />
            <span>{salvando ? 'Salvataggio...' : (isEdit ? 'AGGIORNA' : 'CREA CLIENTE')}</span>
          </BtnPrimary>
        </>
      }
    >
      <Sezione titolo="IDENTITÀ" accent={cat.solid}>
        <FieldRow>
          <Field label="Nome *" val={f.nome} onChange={(v: any) => upd('nome', v)} placeholder="Es. MARIO" />
          <Field label="Cognome" val={f.cognome} onChange={(v: any) => upd('cognome', v)} placeholder="Es. ROSSI" />
        </FieldRow>
        <Field label="Codice fiscale" val={f.codice_fiscale} onChange={(v: any) => upd('codice_fiscale', v)} placeholder="RSSMRA80A01H501Z" />
      </Sezione>

      <Sezione titolo="CONTATTI">
        <Field label="Telefono" val={f.telefono} onChange={(v: any) => upd('telefono', v)} placeholder="+39 333 1234567" type="tel" />
        <Field label="Email" val={f.email} onChange={(v: any) => upd('email', v)} placeholder="mario@example.com" type="email" />
      </Sezione>

      <Sezione titolo="INDIRIZZO">
        <Field label="Via e numero" val={f.indirizzo} onChange={(v: any) => upd('indirizzo', v)} placeholder="Via Roma 12" />
        <FieldRow>
          <Field label="CAP" val={f.cap} onChange={(v: any) => upd('cap', v)} placeholder="87100" />
          <Field label="Città" val={f.citta} onChange={(v: any) => upd('citta', v)} placeholder="Cosenza" />
          <Field label="Prov" val={f.provincia} onChange={(v: any) => upd('provincia', v)} placeholder="CS" />
        </FieldRow>
      </Sezione>

      <Sezione titolo="STATO COMMERCIALE">
        <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 6 }}>STATO CLIENTE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 12 }}>
          {STATI.map(s => (
            <button key={s.val} onClick={() => upd('stato_cliente', s.val)} style={{
              background: f.stato_cliente === s.val ? s.bg : '#fff',
              color: f.stato_cliente === s.val ? s.solid : '#0F1F33',
              border: `1.5px solid ${f.stato_cliente === s.val ? s.solid : '#E5EAF0'}`,
              borderRadius: 8, padding: '8px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{s.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 6 }}>LIVELLO PRIORITÀ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {PRIORITA.map(p => (
            <button key={p.val} onClick={() => upd('livello_priorita', p.val)} style={{
              background: f.livello_priorita === p.val ? p.bg : '#fff',
              color: f.livello_priorita === p.val ? p.solid : '#0F1F33',
              border: `1.5px solid ${f.livello_priorita === p.val ? p.solid : '#E5EAF0'}`,
              borderRadius: 8, padding: '8px 13px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{p.label}</button>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="PROFILO LAVORATIVO">
        <Field label="Professione" val={f.professione} onChange={(v: any) => upd('professione', v)} placeholder="Es. Avvocato civilista" />
        <Field label="Settore" val={f.settore_lavorativo} onChange={(v: any) => upd('settore_lavorativo', v)} placeholder="Es. Studio in centro Cosenza" />
      </Sezione>

      <Sezione titolo={`TIPOLOGIE RELAZIONE · ${f.tipologia_relazione.length}`}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {TIPOLOGIE.map(t => (
            <button key={t} onClick={() => toggleTip(t)} style={{
              background: f.tipologia_relazione.includes(t) ? cat.bg : '#fff',
              color: f.tipologia_relazione.includes(t) ? cat.text : '#0F1F33',
              border: `1.5px solid ${f.tipologia_relazione.includes(t) ? cat.solid : '#E5EAF0'}`,
              borderRadius: 7, padding: '6px 11px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{t.replace(/_/g, ' ')}</button>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="PREFERENZE CONTATTO">
        <FieldRow>
          <Field label="Non chiamare dopo" val={f.preferenze_no_dopo} onChange={(v: any) => upd('preferenze_no_dopo', v)} placeholder="18:00" />
          <div style={{ flex: 1, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 4 }}>CANALE PREFERITO</div>
            <select value={f.preferenze_canale} onChange={e => upd('preferenze_canale', e.target.value)}
              style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #E5EAF0', borderRadius: 9, background: '#fff', fontFamily: 'inherit', color: '#0F1F33', boxSizing: 'border-box' as const }}>
              <option value="">—</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="chiamata">Chiamata</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </FieldRow>
      </Sezione>

      <Sezione titolo="PROSSIMA AZIONE">
        <Field label="Cosa fare" val={f.prossima_azione} onChange={(v: any) => upd('prossima_azione', v)} placeholder="Es. Chiamare per acconto" />
      </Sezione>

      {isEdit && (
        <div style={{ marginTop: 16, padding: 14, background: PASTEL.red.bg, borderRadius: 14, borderLeft: `4px solid ${PASTEL.red.solid}` }}>
          {!confermaDelete ? (
            <button onClick={() => setConfermaDelete(true)} style={{ width: '100%', padding: 12, background: '#fff', color: PASTEL.red.solid, border: `1.5px solid ${PASTEL.red.solid}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
              <IcoTrash size={14} color={PASTEL.red.solid} />ELIMINA CLIENTE
            </button>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <IcoAlertTriangle size={18} color={PASTEL.red.solid} />
                <div style={{ fontSize: 12, fontWeight: 800, color: PASTEL.red.text }}>Confermi eliminazione?</div>
              </div>
              <div style={{ fontSize: 10, color: PASTEL.red.text, marginBottom: 10 }}>Tutti gli eventi, comunicazioni e documenti collegati saranno persi. Le commesse attive bloccheranno l'operazione.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfermaDelete(false)} disabled={salvando} style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#5C6B7A', border: '1px solid #E5EAF0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
                <button onClick={elimina} disabled={salvando} style={{ flex: 1, padding: '10px 0', background: PASTEL.red.solid, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{salvando ? 'Eliminazione...' : 'CONFERMA'}</button>
              </div>
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
}