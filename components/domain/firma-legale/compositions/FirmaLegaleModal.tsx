'use client';

// ============================================================
// MASTRO — FirmaLegaleModal
// Per uso INTERNO: misuratore/posatore in cantiere fa firmare
// il cliente sul tablet senza generare un link esterno.
// Usa direttamente token già creato dall'azienda.
// ============================================================

import { useRef, useState, type CSSProperties } from 'react';
import { useFirma } from '@/hooks/useFirma';
import { MC, MF, MR, MS, MP } from '@/constants/design-system';
import CanvasFirma, { type CanvasFirmaHandle } from '../primitives/CanvasFirma';
import FirmaCardCommessa from '../primitives/FirmaCardCommessa';
import FirmaBannerLegale from '../primitives/FirmaBannerLegale';
import { TIPO_FIRMA_LABEL, type TipoFirma } from '@/lib/firma-legale-types';

interface Props {
  open: boolean;
  token: string;
  tipoDefault?: TipoFirma;
  onCancel: () => void;
  onFirmato?: () => void;
}

export default function FirmaLegaleModal({
  open, token, tipoDefault = 'rilievo', onCancel, onFirmato,
}: Props) {
  const { stato, data, error, submitting, inviaFirma } = useFirma(open ? token : undefined);
  const canvasRef = useRef<CanvasFirmaHandle>(null);
  const [hasContent, setHasContent] = useState(false);

  if (!open) return null;

  const tipo: TipoFirma = (data?.tipo as TipoFirma) ?? tipoDefault;

  const onConferma = async () => {
    const c = canvasRef.current;
    if (!c || c.isEmpty()) {
      alert('Il cliente deve firmare prima di confermare');
      return;
    }
    const dataUrl = c.toDataURL();
    const ok = await inviaFirma(dataUrl);
    if (ok) onFirmato?.();
  };

  return (
    <div style={S.backdrop} onClick={onCancel}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>
        <div style={S.handle} />
        <div style={S.header}>
          <div style={S.headerTitle}>
            {TIPO_FIRMA_LABEL[tipo]}
          </div>
          <div style={S.headerSub}>Firma del cliente</div>
        </div>

        {stato === 'loading' && (
          <div style={S.centerBox}>Caricamento documento…</div>
        )}

        {stato === 'errore' && (
          <div style={{ ...S.centerBox, color: MC.danger }}>
            ⚠ {error}
          </div>
        )}

        {stato === 'firmato' && (
          <div style={S.centerBox}>
            <div style={S.okBig}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: MC.text }}>
              Firma registrata
            </div>
            <button onClick={onCancel} style={S.closeBtn}>Chiudi</button>
          </div>
        )}

        {stato === 'pronto' && (
          <>
            <div style={S.body}>
              <FirmaCardCommessa
                cmCode={data?.cmCode ?? ''}
                cliente={data?.cliente ?? ''}
                importo={data?.importo}
                descrizione={data?.descrizione}
                tipo={tipo}
              />

              <div style={S.helperText}>
                Far firmare il cliente nel riquadro qui sotto:
              </div>

              <CanvasFirma
                ref={canvasRef}
                height={200}
                onChange={setHasContent}
              />

              <div style={S.cancellaBtn} onClick={() => canvasRef.current?.clear()}>
                Cancella e rifai
              </div>

              <FirmaBannerLegale tipo={tipo} />
            </div>

            <div style={S.actions}>
              <button onClick={onCancel} style={S.btnCancel} disabled={submitting}>
                Annulla
              </button>
              <button
                onClick={onConferma}
                disabled={submitting}
                style={{
                  ...S.btnConferma,
                  background: submitting ? MC.borderStrong : MC.tealDark,
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Invio…' : 'Conferma firma'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed' as const, inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,0.40)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    fontFamily: MF.ui,
  } as CSSProperties,
  sheet: {
    width: '100%', maxWidth: 640,
    background: MC.card, color: MC.text,
    borderRadius: `${MR['2xl']}px ${MR['2xl']}px 0 0`,
    boxShadow: MS.modal,
    display: 'flex', flexDirection: 'column' as const,
    maxHeight: '95vh',
  } as CSSProperties,
  handle: {
    width: 40, height: 4, borderRadius: MR.full,
    background: MC.borderStrong, alignSelf: 'center' as const,
    marginTop: MP.s2,
  } as CSSProperties,
  header: {
    padding: '16px 20px 8px',
    borderBottom: `1px solid ${MC.borderSoft}`,
  } as CSSProperties,
  headerTitle: { fontSize: 18, fontWeight: 700, color: MC.text } as CSSProperties,
  headerSub: { fontSize: 12, color: MC.muted, marginTop: 2 } as CSSProperties,

  body: {
    padding: 20, overflowY: 'auto' as const, flex: 1,
  } as CSSProperties,
  helperText: {
    fontSize: 13, color: MC.textSoft, marginBottom: 12,
    fontWeight: 500,
  } as CSSProperties,
  cancellaBtn: {
    textAlign: 'center' as const,
    margin: '12px 0 16px',
    fontSize: 12, color: MC.mutedSoft,
    cursor: 'pointer',
  } as CSSProperties,

  centerBox: {
    padding: '60px 24px',
    textAlign: 'center' as const,
    color: MC.muted,
  } as CSSProperties,
  okBig: { fontSize: 64, color: MC.success, marginBottom: 12 } as CSSProperties,
  closeBtn: {
    marginTop: 20, padding: '10px 24px',
    background: MC.tealDark, color: '#fff',
    border: 'none', borderRadius: MR.md,
    fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  } as CSSProperties,

  actions: {
    display: 'grid', gridTemplateColumns: '1fr 2fr', gap: MP.s3,
    padding: 20, borderTop: `1px solid ${MC.borderSoft}`,
  } as CSSProperties,
  btnCancel: {
    padding: '14px 0', fontSize: 15, fontWeight: 600,
    background: MC.card, color: MC.textSoft,
    border: `1px solid ${MC.border}`, borderRadius: MR.lg,
    cursor: 'pointer', fontFamily: 'inherit',
  } as CSSProperties,
  btnConferma: {
    padding: '14px 0', fontSize: 15, fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: MR.lg,
    fontFamily: 'inherit', boxShadow: MS.button,
  } as CSSProperties,
};
