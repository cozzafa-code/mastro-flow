'use client';

import { useEffect, useState } from 'react';
import { detectDevice, getGeoPosition } from '@/lib/codici/device';
import { risolviNextAction, registraEvento } from '@/lib/codici/client';
import type { NextAction, Ruolo, Codice } from '@/lib/codici/types';
import VanoView from './views/VanoView';
import PezzoCncView from './views/PezzoCncView';
import ColloView from './views/ColloView';
import CommessaView from './views/CommessaView';
import GenericoView from './views/GenericoView';
import LoadingView from './views/LoadingView';

type Props = {
  initialCodice: Partial<Codice>;
  short: string;
};

export default function CodiceViewer({ initialCodice, short }: Props) {
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [ruolo, setRuolo] = useState<Ruolo>('anonimo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const device = detectDevice();
      const geo = await getGeoPosition();

      const ruoloSalvato = typeof window !== 'undefined'
        ? (localStorage.getItem('mastro_ruolo') as Ruolo | null)
        : null;
      const ruoloEffettivo: Ruolo = ruoloSalvato ?? 'anonimo';
      if (cancelled) return;
      setRuolo(ruoloEffettivo);

      const [, action] = await Promise.all([
        registraEvento({
          short,
          tipo_evento: 'scan',
          ruolo: ruoloEffettivo,
          device,
          geo: geo ?? undefined,
        }).catch(() => null),
        risolviNextAction(short, ruoloEffettivo, geo ?? undefined),
      ]);

      if (cancelled) return;
      setNextAction(action);
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [short]);

  if (loading || !nextAction) return <LoadingView short={short} />;

  const tipo = nextAction.tipo;
  const props = { nextAction, ruolo, short };

  switch (tipo) {
    case 'vano': return <VanoView {...props} />;
    case 'pezzo_cnc': return <PezzoCncView {...props} />;
    case 'collo': return <ColloView {...props} />;
    case 'commessa': return <CommessaView {...props} />;
    default: return <GenericoView {...props} />;
  }
}
