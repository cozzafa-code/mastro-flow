"use client";
// components/ModalImmobile.tsx - Modal creazione/modifica immobile

import React, { useState } from "react";
import { creaImmobile, aggiornaImmobile, eliminaImmobile, type ImmobileInput } from "../hooks/useClienteCRUD";
import { IcoHome, IcoClose, IcoCheck, IcoTrash } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL_DEEP = "#0F6E56";
const RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

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

  function update(field: string, val: any) {
    setF((prev: any) => ({ ...prev, [field]: val }));
  }

  async function save() {
    if (!f.nome.trim()) { alert('Nome immobile obbligatorio'); return; }
    setSalvando(true);

    const payload: ImmobileInput = {
      azienda_id: aziendaId,
      cliente_id: clienteId,
      nome: f.nome.trim(),
      tipo: f.tipo,
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9970, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '95vh', display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoHome size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>IMMOBILE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{isEdit ? 'Modifica immobile' : 'Nuovo immobile'}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClose size={18} color="#fff" />
          </button>
        </div>

        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const }}>
          <Sezione titolo="IDENTITÀ">
            <Field label="Nome immobile *" val={f.nome} onChange={(v: any) => update('nome', v)} placeholder="Es. Villa Centro Cosenza" />
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 5, marginTop: 6 }}>TIPO</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {TIPI.map(t => (
                <button key={t.val} onClick={() => update('tipo', t.val)} style={{
                  background: f.tipo === t.val ? TEAL_DEEP : '#fff',
                  color: f.tipo === t.val ? '#fff' : TEXT,
                  border: `1.5px solid ${f.tipo === t.val ? TEAL_DEEP : '#E5EAF0'}`,
                  borderRadius: 6, padding: '6px 11px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                }}>{t.label}</button>
              ))}
            </div>
          </Sezione>

          <Sezione titolo="INDIRIZZO">
            <Field label="Via e numero" val={f.indirizzo} onChange={(v: any) => update('indirizzo', v)} placeholder="Via Roma 12" />
            <Row>
              <Field label="CAP" val={f.cap} onChange={(v: any) => update('cap', v)} placeholder="87100" />
              <Field label="Città" val={f.citta} onChange={(v: any) => update('citta', v)} placeholder="Cosenza" />
              <Field label="Prov" val={f.provincia} onChange={(v: any) => update('provincia', v)} placeholder="CS" />
            </Row>
          </Sezione>

          <Sezione titolo="CARATTERISTICHE">
            <Row>
              <Field label="MQ totali" val={f.mq_totali} onChange={(v: any) => update('mq_totali', v)} placeholder="180" type="number" />
              <Field label="N. piani" val={f.num_piani} onChange={(v: any) => update('num_piani', v)} placeholder="2" type="number" />
              <Field label="N. vani" val={f.num_vani_totali} onChange={(v: any) => update('num_vani_totali', v)} placeholder="6" type="number" />
            </Row>
            <Field label="Anno costruzione" val={f.anno_costruzione} onChange={(v: any) => update('anno_costruzione', v)} placeholder="1995" type="number" />
          </Sezione>

          <Sezione titolo="NOTE">
            <textarea value={f.note} onChange={e => update('note', e.target.value)} placeholder="Note operative (vincoli, accessibilità, materiali preferiti...)"
              rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 7, fontFamily: 'inherit', boxSizing: 'border-box' as const, resize: 'vertical' as const }} />
            <div onClick={() => update('primario', !f.primario)} style={{
              marginTop: 10, padding: '10px 12px',
              background: f.primario ? '#FEF3C7' : '#F8FAFA',
              border: `1.5px solid ${f.primario ? '#D97706' : '#E5EAF0'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: f.primario ? '#D97706' : 'transparent',
                border: `2px solid ${f.primario ? '#D97706' : '#E5EAF0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{f.primario && <IcoCheck size={12} color="#fff" />}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: f.primario ? '#92400E' : TEXT }}>Immobile primario</div>
            </div>
          </Sezione>

          {isEdit && (
            <div style={{ marginTop: 10, padding: 12, background: '#FEE2E2', borderRadius: 10, borderLeft: `4px solid ${RED}` }}>
              {!confermaDelete ? (
                <button onClick={() => setConfermaDelete(true)} style={{ width: '100%', padding: '11px 12px', background: '#fff', color: RED, border: `1.5px solid ${RED}`, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IcoTrash size={14} color={RED} />ELIMINA IMMOBILE
                </button>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: '#991B1B', marginBottom: 10, fontWeight: 700 }}>Confermi? Verranno persi anche gli infissi installati su questo immobile.</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfermaDelete(false)} disabled={salvando} style={{ flex: 1, padding: '8px 0', background: '#fff', color: MUTED, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Annulla</button>
                    <button onClick={elimina} disabled={salvando} style={{ flex: 1, padding: '8px 0', background: RED, color: '#fff', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer' }}>{salvando ? '...' : 'CONFERMA'}</button>
                  </div>
                </>
              )}
            </div>
          )}
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
            {salvando ? 'Salvataggio...' : (isEdit ? 'AGGIORNA' : 'CREA IMMOBILE')}
          </button>
        </div>
      </div>
    </div>
  );
}

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
