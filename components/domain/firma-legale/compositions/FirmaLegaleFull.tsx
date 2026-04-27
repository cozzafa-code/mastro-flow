'use client';

// ============================================================
// MASTRO — FirmaLegaleFull
// Composition: layout completo pagina pubblica firma
// Replica esattamente il pattern di app/firma/[token]/page.tsx
// ma usando primitives + design system MASTRO
// ============================================================

import { useRef, useState, type CSSProperties } from 'react';
import { useFirma } from '@/hooks/useFirma';
import { MC, MF, MR, MS } from '@/constants/design-system';
import CanvasFirma, { type CanvasFirmaHandle } from './primitives/CanvasFirma';
import FirmaCardCommessa from './primitives/FirmaCardCommessa';
import FirmaBannerLegale from './primitives/FirmaBannerLegale';
import type { TipoFirma } from '@/lib/firma-legale-types';

interface Props {
  token: string;
  // Tipo override (se non viene dal token)
  tipoDefault?: TipoFirma;
  onFirmato?: () => void;
}

export default function FirmaLegaleFull({ token, tipoDefault = 'preventivo', onFirmato }: Props) {
  const { stato, data, error, submitting, inviaFirma } = useFirma(token);
  const canvasRef = useRef<CanvasFirmaHandle>(null);
  const [hasContent, setHasContent] = useState(false);

  if (stato === 'loading') {
    return (
      <div style={S.center}>
        <Spinner />
        <div style={S.subtle}>Caricamento…</div>
      </div>
    );
  }

  if (stato === 'errore') {
    return (
      <div style={S.center}>
        <div style={S.errorIcon}>⚠️</div>
        <div style={S.errorTitle}>Link non valido</div>
        <div style={S.subtle}>{error}</div>
      </div>
    );
  }

  if (stato === 'firmato') {
    return (
      <div style={S.center}>
        <div style={S.okIcon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={MC.success} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={S.okTitle}>Firma registrata!</div>
        <div style={S.subtle}>
          La firma è stata acquisita con successo. Puoi chiudere questa pagina.
        </div>
      </div>
    );
  }

  const tipo: TipoFirma = (data?.tipo as TipoFirma) ?? tipoDefault;

  const onConferma = async () => {
    const c = canvasRef.current;
    if (!c || c.isEmpty()) {
      alert('Per favore firma prima di confermare');
      return;
    }
    const dataUrl = c.toDataURL();
    const ok = await inviaFirma(dataUrl);
    if (ok) onFirmato?.();
  };

  return (
    <div style={S.root}>
      {/* Topbar MASTRO */}
      <div style={S.topbar}>
        <div style={S.logo}>
          <span style={S.logoText}>M</span>
        </div>
        <div>
          <div style={S.brand}>MASTRO</div>
          <div style={S.brandSub}>Firma documento</div>
        </div>
      </div>

      <div style={S.body}>
        <FirmaCardCommessa
          cmCode={data?.cmCode ?? ''}
          cliente={data?.cliente ?? ''}
          importo={data?.importo}
          descrizione={data?.descrizione}
          tipo={tipo}
        />

        <div style={S.helperText}>
          Firma nel riquadro qui sotto per confermare il documento:
        </div>

        <CanvasFirma
          ref={canvasRef}
          height={180}
          onChange={setHasContent}
        />

        <div style={S.cancellaBtn} onClick={() => canvasRef.current?.clear()}>
          Cancella e rifai
        </div>

        <div style={S.bannerWrap}>
          <FirmaBannerLegale tipo={tipo} />
        </div>

        <button
          onClick={onConferma}
          disabled={submitting}
          style={{
            ...S.confermaBtn,
            background: submitting ? MC.borderStrong : MC.teal,
            cursor: submitting ? 'default' : 'pointer',
            boxShadow: `0 4px 16px ${MC.teal}40`,
          }}
        >
          {submitting ? 'Invio in corso…' : 'Conferma e firma'}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes mastroSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 40, height: 40,
        border: `3px solid ${MC.teal}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'mastroSpin 0.8s linear infinite',
        margin: '0 auto 12px',
      }} />
    </>
  );
}

const S = {
  root: {
    minHeight: '100vh',
    background: MC.bg,
    paddingBottom: 40,
    fontFamily: MF.ui,
  } as CSSProperties,
  topbar: {
    background: MC.topbar,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as CSSProperties,
  logo: {
    width: 32, height: 32, borderRadius: 8,
    background: MC.teal,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as CSSProperties,
  logoText: { fontSize: 16, fontWeight: 900, color: '#fff' } as CSSProperties,
  brand: { fontSize: 14, fontWeight: 700, color: '#fff' } as CSSProperties,
  brandSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)' } as CSSProperties,

  body: { padding: '20px 16px' } as CSSProperties,
  helperText: {
    fontSize: 13, color: MC.textSoft,
    marginBottom: 12, fontWeight: 500,
  } as CSSProperties,
  cancellaBtn: {
    textAlign: 'center' as const,
    margin: '12px 0 20px',
    fontSize: 12,
    color: MC.mutedSoft,
    cursor: 'pointer',
  } as CSSProperties,
  bannerWrap: { marginBottom: 20 } as CSSProperties,
  confermaBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    fontFamily: 'inherit',
  } as CSSProperties,

  center: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    background: MC.bg, padding: 24, textAlign: 'center' as const,
    fontFamily: MF.ui,
  } as CSSProperties,
  subtle: { fontSize: 14, color: MC.muted, lineHeight: 1.6 } as CSSProperties,
  errorIcon: { fontSize: 48, marginBottom: 16 } as CSSProperties,
  errorTitle: { fontSize: 18, fontWeight: 700, color: MC.text, marginBottom: 8 } as CSSProperties,
  okIcon: {
    width: 72, height: 72, borderRadius: '50%',
    background: MC.successSoft,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  } as CSSProperties,
  okTitle: { fontSize: 22, fontWeight: 800, color: MC.text, marginBottom: 8 } as CSSProperties,
};
