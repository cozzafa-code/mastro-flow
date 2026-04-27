'use client';

// ============================================================
// MASTRO — Demo FirmaLegale
// Mostra Full + Modal con token finto per validare il Lego.
// La pagina pubblica reale resta in /firma/[token]
// ============================================================

import { useState, type CSSProperties } from 'react';
import { MC, MF, MR, MS, MP } from '@/constants/design-system';
import { MastroTopbar } from '@/components/domain/timer-lavoro/_ui';
import FirmaLegaleFull from '@/components/domain/firma-legale/compositions/FirmaLegaleFull';
import FirmaLegaleModal from '@/components/domain/firma-legale/compositions/FirmaLegaleModal';
import { TIPO_FIRMA_LABEL, type TipoFirma } from '@/lib/firma-legale-types';

type Modo = 'full' | 'modal';

const TIPI: TipoFirma[] = [
  'preventivo', 'rilievo', 'collaudo', 'ddt', 'pos', 'intervento', 'privacy', 'altro',
];

export default function DemoFirmaLegalePage() {
  const [modo, setModo] = useState<Modo>('full');
  const [tipo, setTipo] = useState<TipoFirma>('preventivo');
  const [showModal, setShowModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('test');

  const switcher = (
    <>
      {(['full', 'modal'] as Modo[]).map(m => (
        <button
          key={m}
          onClick={() => setModo(m)}
          style={{
            ...S.pill,
            background: modo === m ? MC.teal : 'transparent',
            color: modo === m ? MC.topbar : '#fff',
          }}
        >{m.toUpperCase()}</button>
      ))}
    </>
  );

  return (
    <div style={S.page}>
      <MastroTopbar breadcrumb="Demo · Firma Legale" right={switcher} />

      <div style={S.controls}>
        <div style={S.row}>
          <label style={S.label}>Token di test</label>
          <input
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="Incolla un token firma_tokens reale o usa 'test'"
            style={S.input}
          />
        </div>
        <div style={S.row}>
          <label style={S.label}>Tipo firma (default se token generico)</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as TipoFirma)}
            style={S.select}
          >
            {TIPI.map(t => <option key={t} value={t}>{TIPO_FIRMA_LABEL[t]}</option>)}
          </select>
        </div>
        <div style={S.hint}>
          La modalità <strong>Full</strong> riproduce la pagina pubblica <code>/firma/[token]</code>.<br />
          La modalità <strong>Modal</strong> è per uso interno (misuratore/posatore in cantiere).
        </div>
      </div>

      {modo === 'full' && (
        <div style={S.frameWrap}>
          <div style={S.mobileFrame}>
            <FirmaLegaleFull token={tokenInput} tipoDefault={tipo} />
          </div>
        </div>
      )}

      {modo === 'modal' && (
        <div style={S.modalDemo}>
          <button onClick={() => setShowModal(true)} style={S.openModalBtn}>
            ▶  Apri modal firma
          </button>
          <FirmaLegaleModal
            open={showModal}
            token={tokenInput}
            tipoDefault={tipo}
            onCancel={() => setShowModal(false)}
            onFirmato={() => {
              setTimeout(() => setShowModal(false), 1500);
            }}
          />
        </div>
      )}
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: MC.bg, fontFamily: MF.ui, margin: 0 } as CSSProperties,
  pill: {
    padding: '7px 18px', fontSize: 13, fontWeight: 600,
    borderRadius: MR.md, border: `1px solid ${MC.teal}`,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
  } as CSSProperties,

  controls: {
    maxWidth: 640, margin: `${MP.s5}px auto 0`,
    background: MC.card, border: `1px solid ${MC.border}`,
    borderRadius: MR.lg, padding: 20, boxShadow: MS.card,
  } as CSSProperties,
  row: { marginBottom: MP.s3 } as CSSProperties,
  label: { fontSize: 11, fontWeight: 700, color: MC.muted, textTransform: 'uppercase' as const, letterSpacing: 1, display: 'block', marginBottom: 6 } as CSSProperties,
  input: {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: MC.card, color: MC.text,
    border: `1px solid ${MC.border}`, borderRadius: MR.md,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: MF.ui, boxShadow: MS.button,
  } as CSSProperties,
  select: {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: MC.card, color: MC.text,
    border: `1px solid ${MC.border}`, borderRadius: MR.md,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: MF.ui, boxShadow: MS.button,
  } as CSSProperties,
  hint: {
    fontSize: 12, color: MC.muted, marginTop: 8, lineHeight: 1.5,
  } as CSSProperties,

  frameWrap: {
    display: 'flex', justifyContent: 'center',
    padding: MP.s6,
  } as CSSProperties,
  mobileFrame: {
    width: 380, minHeight: 760,
    borderRadius: 28, overflow: 'hidden' as const,
    boxShadow: MS.modal, background: MC.bg,
    border: `1px solid ${MC.border}`,
  } as CSSProperties,

  modalDemo: {
    maxWidth: 640, margin: `${MP.s6}px auto`,
    padding: 40, textAlign: 'center' as const,
    background: MC.card, borderRadius: MR.lg, border: `1px solid ${MC.border}`,
  } as CSSProperties,
  openModalBtn: {
    padding: '16px 40px', fontSize: 16, fontWeight: 700,
    background: MC.tealDark, color: '#fff',
    border: 'none', borderRadius: MR.lg,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: MS.buttonPrimary,
  } as CSSProperties,
};
