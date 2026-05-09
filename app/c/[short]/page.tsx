import { notFound } from 'next/navigation';
import { codiciClient } from '@/lib/codici/client';
import CodiceViewer from '@/components/codici/CodiceViewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CodicePage({
  params,
}: {
  params: { short: string };
}) {
  const short = params.short.toUpperCase();

  const { data: codice, error } = await codiciClient
    .from('codici')
    .select('id, short, tipo, stato, payload, azienda_id, expires_at')
    .eq('short', short)
    .maybeSingle();

  if (error || !codice) notFound();

  if (codice.expires_at && new Date(codice.expires_at) < new Date()) {
    return <ScadutoView short={short} />;
  }

  return <CodiceViewer initialCodice={codice} short={short} />;
}

function ScadutoView({ short }: { short: string }) {
  return (
    <div className="min-h-screen bg-[#0D1F1F] flex items-center justify-center p-6">
      <div className="bg-[#EEF8F8] rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⏱️</div>
        <h1 className="text-2xl font-bold text-[#0D1F1F] mb-2">
          Codice scaduto
        </h1>
        <p className="text-[#0D1F1F]/70 mb-1">{short}</p>
        <p className="text-sm text-[#0D1F1F]/60 mt-4">
          Richiedi un nuovo codice al titolare
        </p>
      </div>
    </div>
  );
}