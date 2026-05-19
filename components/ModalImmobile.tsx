"use client";
import React, { useState } from "react";
import { creaImmobile, aggiornaImmobile, eliminaImmobile, type ImmobileInput } from "../hooks/useClienteCRUD";
import { IcoHome, IcoCheck, IcoTrash } from "./IconLib";
import { CAT, PASTEL } from "../lib/modaleColors";
import ModalShell, { Sezione, FieldRow, Field, TextareaField, BtnSecondary, BtnPrimary } from "./ModalShell";

const TIPI = [
  { val: 'villa', label: 'Villa' },
  { val: 'casa', label: 'Casa' },
  { val: 'appartamento', label: 'Appartamento' },
  { val: 'ufficio', label: 'Ufficio' },
  { val: 'negozio', label: 'Negozio' },
  { val: 'capannone', label: 'Capannone' },
  { val: 'altro', label: 'Altro' },
];

interface Props {
  aziendaId: string;
  clienteId: string;
  immobile?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalImmobile({ aziendaId, clienteId, immobile, onClose, onSaved }: Props) {
  const isEdit = !!immobile?.id;
  const cat = CAT.immobile;

  const [f, setF] = useState<any>({
    nome: immobile?.nome || '',
    tipo: immobile?.tipo || 'casa',
    indirizzo: immobile?.indirizzo || '',
    citta: immobile?.citta || '',
    cap: immobile?.cap || '',
    provincia: immobile?.provincia || '',
    mq_totali: immobile?.mq_totali || '',
    num_piani: immobile?.num_piani || 1,
    num_vani_totali: immobile?.num_vani_totali || 0,
    anno_costruzione: immobile?.anno_costruzione || '',
    note: immobile?.note || '',
    primario: !!immobile?.primario,
  });
  const [salvando, setSalvando] = useState(false);
  const [confermaDelete, setConfermaDelete] = useState(false);

  const upd = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.nome.trim()) { alert('Nome immobile obbligatorio'); return; }
    setSalvando(true);
    const payload: ImmobileInput = {
      azienda_id: aziendaId, cliente_id: clienteId,
      nome: f.nome.trim(), tipo: f.tipo,
      indirizzo: f.indirizzo.trim() || null,
      citta: f.citta.trim() || null,
      cap: f.cap.trim() || null,
      provincia: f.provincia.trim().toUpperCase() || null,
      mq_totali: f.mq_totali ? Number(f.mq_totali) : null,
      num_piani: Number(f.num_piani) || 1,
      num_vani_totali: Number(f.num_vani_totali) || 0,
      anno_costruzione: f.anno_costruzione ? Number(f.anno_costruzione) : null,
      note: f.note.trim() || null,
      primario: f.primario,
    };
    const res = isEdit ? await aggiornaImmobile(immobile.id, payload) : await creaImmobile(payload);
    setSalvando(false);
    if (res.error) { alert('Errore: ' + res.error.message); return; }
    onSaved?.();
    onClose();
  }

  async function elimina() {
    if (!isEdit) return;
    setSalvando(true);
    const res = await eliminaImmobile(immobile.id);
    setSalvando(false);
    if (res.error) { alert(res.error.message); return; }
    onSaved?.();
    onClose();
  }

  return (
    <ModalShell
      cat={cat} Ico={IcoHome}
      kicker="IMMOBILE" title={isEdit ? 'Modifica immobile' : 'Nuovo immobile'}
      onClose={onClose}
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={salvando}>Annulla</BtnSecondary>
          <BtnPrimary onClick={save} disabled={salvando} cat={cat}>
            <IcoCheck size={16} color="#fff" />
            <span>{salvando ? 'Salvataggio...' : (isEdit ? 'AGGIORNA' : 'CREA IMMOBILE')}</span>
          </BtnPrimary>
        </>
      }
    >
      <Sezione titolo="IDENTITÀ" accent={cat.solid}>
        <Field label="Nome immobile *" val={f.nome} onChange={(v: any) => upd('nome', v)} placeholder="Es. Villa Centro Cosenza" />
        <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 5, marginTop: 6 }}>TIPO</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {TIPI.map(t => (
            <button key={t.val} onClick={() => upd('tipo', t.val)} style={{
              background: f.tipo === t.val ? cat.bg : '#fff',
              color: f.tipo === t.val ? cat.text : '#0F1F33',
              border: `1.5px solid ${f.tipo === t.val ? cat.solid : '#E5EAF0'}`,
              borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{t.label}</button>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="INDIRIZZO">
        <Field label="Via e numero" val={f.indirizzo} onChange={(v: any) => upd('indirizzo', v)} placeholder="Via Roma 12" />
        <FieldRow>
          <Field label="CAP" val={f.cap} onChange={(v: any) => upd('cap', v)} placeholder="87100" />
          <Field label="Città" val={f.citta} onChange={(v: any) => upd('citta', v)} placeholder="Cosenza" />
          <Field label="Prov" val={f.provincia} onChange={(v: any) => upd('provincia', v)} placeholder="CS" />
        </FieldRow>
      </Sezione>

      <Sezione titolo="CARATTERISTICHE">
        <FieldRow>
          <Field label="MQ totali" val={f.mq_totali} onChange={(v: any) => upd('mq_totali', v)} placeholder="180" type="number" />
          <Field label="N. piani" val={f.num_piani} onChange={(v: any) => upd('num_piani', v)} placeholder="2" type="number" />
          <Field label="N. vani" val={f.num_vani_totali} onChange={(v: any) => upd('num_vani_totali', v)} placeholder="6" type="number" />
        </FieldRow>
        <Field label="Anno costruzione" val={f.anno_costruzione} onChange={(v: any) => upd('anno_costruzione', v)} placeholder="1995" type="number" />
      </Sezione>

      <Sezione titolo="NOTE">
        <TextareaField label="Note operative" val={f.note} onChange={(v: any) => upd('note', v)} placeholder="Vincoli, accessibilità, materiali preferiti..." rows={3} />
        <div onClick={() => upd('primario', !f.primario)} style={{
          marginTop: 6, padding: '11px 13px',
          background: f.primario ? PASTEL.amber.bg : '#F8FAFA',
          border: `1.5px solid ${f.primario ? PASTEL.amber.solid : '#E5EAF0'}`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: f.primario ? PASTEL.amber.solid : 'transparent',
            border: `2px solid ${f.primario ? PASTEL.amber.solid : '#CBD5E1'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{f.primario && <IcoCheck size={13} color="#fff" />}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: f.primario ? PASTEL.amber.text : '#0F1F33' }}>Immobile primario</div>
        </div>
      </Sezione>

      {isEdit && (
        <div style={{ padding: 14, background: PASTEL.red.bg, borderRadius: 14, borderLeft: `4px solid ${PASTEL.red.solid}` }}>
          {!confermaDelete ? (
            <button onClick={() => setConfermaDelete(true)} style={{ width: '100%', padding: 12, background: '#fff', color: PASTEL.red.solid, border: `1.5px solid ${PASTEL.red.solid}`, borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
              <IcoTrash size={14} color={PASTEL.red.solid} />ELIMINA IMMOBILE
            </button>
          ) : (
            <>
              <div style={{ fontSize: 11, color: PASTEL.red.text, marginBottom: 10, fontWeight: 700 }}>Confermi? Verranno persi anche gli infissi installati su questo immobile.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfermaDelete(false)} disabled={salvando} style={{ flex: 1, padding: '10px 0', background: '#fff', color: '#5C6B7A', border: '1px solid #E5EAF0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
                <button onClick={elimina} disabled={salvando} style={{ flex: 1, padding: '10px 0', background: PASTEL.red.solid, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{salvando ? '...' : 'CONFERMA'}</button>
              </div>
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
}