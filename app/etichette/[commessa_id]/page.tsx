// app/etichette/[commessa_id]/page.tsx
import { codiciClient } from '@/lib/codici/client';
import EtichetteClient from './EtichetteClient';

export const dynamic = 'force-dynamic';

export default async function EtichettePage({
  params,
  searchParams,
}: {
  params: { commessa_id: string };
  searchParams: { tipi?: string };
}) {
  const commessaId = params.commessa_id;

  // Filtri opzionali: ?tipi=vano,pezzo_cnc
  const tipiFilter = searchParams.tipi
    ? searchParams.tipi.split(',').map(t => t.trim())
    : ['vano', 'pezzo_cnc', 'collo', 'commessa'];

  // Carica tutti i codici di questa commessa
  // (qui assumiamo payload.commessa_id contiene il riferimento)
  const { data: codici } = await codiciClient
    .from('codici')
    .select('short, tipo, payload, stato')
    .in('tipo', tipiFilter)
    .or(`entita_id.eq.${commessaId},payload->>commessa_id.eq.${commessaId}`)
    .order('tipo', { ascending: true });

  return (
    <EtichetteClient
      commessaId={commessaId}
      codici={codici || []}
    />
  );
}
