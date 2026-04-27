'use client';

// ============================================================
// MASTRO — Primitive: FirmaCardCommessa
// Card riepilogo dati documento da firmare
// ============================================================

import type { CSSProperties } from 'react';
import { MC, MR, MS, MF, sectionLabel } from '@/constants/design-system';
import { TIPO_FIRMA_LABEL, type TipoFirma } from '@/lib/firma-legale-types';

interface Props {
  cmCode: string;
  cliente: string;
  importo?: number;
  descrizione?: string;
  tipo?: TipoFirma;
}

export default function FirmaCardCommessa({ cmCode, cliente, importo, descrizione, tipo }: Props) {
  return (
    <div style={S.card}>
      <div style={S.label}>
        {tipo ? TIPO_FIRMA_LABEL[tipo] : 'Commessa'}
      </div>
      <div style={S.cmCode}>{cmCode}</div>
      <div style={S.cliente}>{cliente}</div>
      {importo != null && importo > 0 && (
        <div style={S.importoBox}>
          <span style={S.importoLabel}>Importo</span>
          <span style={S.importoValue}>
            € {importo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
      {descrizione && <div style={S.desc}>{descrizione}</div>}
    </div>
  );
}

const S = {
  card: {
    background: MC.card,
    borderRadius: MR.lg,
    padding: 20,
    marginBottom: 20,
    boxShadow: MS.card,
    border: `1px solid ${MC.border}`,
  } as CSSProperties,
  label: { ...sectionLabel, marginBottom: 4 } as CSSProperties,
  cmCode: {
    fontSize: 20,
    fontWeight: 800,
    color: MC.text,
    marginBottom: 4,
    fontFamily: MF.mono,
  } as CSSProperties,
  cliente: {
    fontSize: 14,
    color: MC.textSoft,
    marginBottom: 12,
  } as CSSProperties,
  importoBox: {
    background: MC.tealBg,
    borderRadius: MR.md,
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,
  importoLabel: {
    fontSize: 12,
    color: MC.muted,
    fontWeight: 600,
  } as CSSProperties,
  importoValue: {
    fontSize: 18,
    fontWeight: 800,
    color: MC.tealDark,
    fontFamily: MF.mono,
  } as CSSProperties,
  desc: {
    marginTop: 12,
    fontSize: 12,
    color: MC.muted,
    lineHeight: 1.6,
  } as CSSProperties,
};
