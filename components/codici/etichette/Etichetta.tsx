// components/codici/etichette/Etichetta.tsx
'use client';

import { useEffect, useRef } from 'react';
import { code128SVG } from '@/lib/codici/svg-generator';

type Props = {
  short: string;
  tipo: string;          // "vano", "pezzo_cnc", ...
  titolo: string;        // es. "Vano 3 - Soggiorno"
  sottotitolo?: string;  // es. "1200 × 1500 mm"
  commessa?: string;
  cliente?: string;
  baseUrl?: string;      // default: window.location.origin
  qrSize?: number;       // px, default 90
};

export default function Etichetta({
  short, tipo, titolo, sottotitolo, commessa, cliente,
  baseUrl, qrSize = 90,
}: Props) {
  const qrRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);

  const url = `${baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')}/c/${short}`;
  // Code128: rimuovi trattino per compatibilità CNC
  const code128Text = short.replace('-', '');

  useEffect(() => {
    // QR via libreria runtime (lazy import)
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(
        document.createElement('canvas'),
        url,
        { width: qrSize, margin: 0, errorCorrectionLevel: 'M' },
        (err, canvas) => {
          if (!err && qrRef.current) {
            qrRef.current.innerHTML = '';
            qrRef.current.appendChild(canvas);
          }
        }
      );
    });

    // Code128 inline SVG
    if (barcodeRef.current) {
      barcodeRef.current.innerHTML = code128SVG(code128Text, 220, 50);
    }
  }, [url, code128Text, qrSize]);

  return (
    <div style={ETI_STYLE.box} className="etichetta">
      <div style={ETI_STYLE.left}>
        <div ref={qrRef} style={{ width: qrSize, height: qrSize }} />
      </div>
      <div style={ETI_STYLE.right}>
        <div style={ETI_STYLE.tipo}>{tipo.toUpperCase().replace('_', ' ')}</div>
        <div style={ETI_STYLE.titolo}>{titolo}</div>
        {sottotitolo && <div style={ETI_STYLE.sub}>{sottotitolo}</div>}
        {commessa && <div style={ETI_STYLE.meta}>Commessa: {commessa}</div>}
        {cliente && <div style={ETI_STYLE.meta}>Cliente: {cliente}</div>}

        <div ref={barcodeRef} style={ETI_STYLE.barcode} />
        <div style={ETI_STYLE.shortText}>{short}</div>
      </div>
    </div>
  );
}

const ETI_STYLE = {
  box: {
    width: '70mm', height: '37mm',
    padding: '2mm', boxSizing: 'border-box' as const,
    border: '0.5pt solid #000',
    display: 'flex', gap: '2mm',
    background: 'white', color: 'black',
    fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
    pageBreakInside: 'avoid' as const,
  },
  left: {
    flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  right: {
    flex: 1, display: 'flex', flexDirection: 'column' as const,
    minWidth: 0, overflow: 'hidden',
  },
  tipo: {
    fontSize: 7, fontWeight: 700,
    letterSpacing: 1, color: '#28A0A0',
    textTransform: 'uppercase' as const,
  },
  titolo: {
    fontSize: 10, fontWeight: 800,
    lineHeight: 1.1, marginTop: 1,
    overflow: 'hidden', textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  sub: { fontSize: 7, color: '#444', marginTop: 1 },
  meta: { fontSize: 6, color: '#666', marginTop: 0.5 },
  barcode: {
    marginTop: 'auto',
    height: '6mm',
    display: 'flex', alignItems: 'center',
  },
  shortText: {
    fontSize: 7, fontFamily: 'monospace',
    fontWeight: 700, textAlign: 'center' as const,
    letterSpacing: 1,
  },
};
