'use client';

// ============================================================
// MASTRO — Primitive: FirmaBannerLegale
// Mostra il testo legale corretto in base al tipo di firma
// ============================================================

import type { CSSProperties } from 'react';
import { MC, MR } from '@/constants/design-system';
import { TIPO_FIRMA_BANNER, type TipoFirma } from '@/lib/firma-legale-types';

interface Props {
  tipo: TipoFirma;
}

export default function FirmaBannerLegale({ tipo }: Props) {
  const text = TIPO_FIRMA_BANNER[tipo];
  const style: CSSProperties = {
    background: '#FFF9F0',
    border: `1px solid #FCE9C8`,
    borderRadius: MR.md,
    padding: '10px 14px',
    fontSize: 11,
    color: '#92400E',
    lineHeight: 1.5,
  };
  return <div style={style}>{text}</div>;
}
