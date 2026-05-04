// components/boxdoccia/BoxDocciaSummaryCard.tsx
// Card che mostra il riepilogo configurazione box doccia di un vano + bottone per aprire il wizard.
// Da inserire nel VanoDetailPanel quando il tipo vano = 'box_doccia' o categoria simile.
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import BoxDocciaWizardModal from './BoxDocciaWizardModal';

interface BoxDocciaSummaryCardProps {
  vanoId: string;
  aziendaId: string;
}

export default function BoxDocciaSummaryCard({ vanoId, aziendaId }: BoxDocciaSummaryCardProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [misure, setMisure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vani')
      .select('boxdoccia_config, boxdoccia_misure')
      .eq('id', vanoId)
      .single();
    setConfig(data?.boxdoccia_config || null);
    setMisure(data?.boxdoccia_misure || null);
    setLoading(false);
  }, [vanoId, supabase]);

  useEffect(() => { reload(); }, [reload]);

  const fs = misure?.fuori_squadro_calcolato;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-teal-600 text-lg">▣</span>
            <h3 className="font-semibold text-slate-900">Box Doccia</h3>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
          >
            {config ? 'Modifica configurazione' : 'Configura'}
          </button>
        </header>

        {loading ? (
          <div className="p-6 text-slate-400 text-sm">Caricamento...</div>
        ) : !config ? (
          <div className="p-6 text-center">
            <p className="text-slate-500 text-sm mb-1">Nessuna configurazione box doccia.</p>
            <p className="text-slate-400 text-xs">Tocca "Configura" per avviare il wizard a 9 step.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Riga 1: identificativo */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Fornitore" value={config.fornitore_nome || '—'} />
              <Item label="Serie" value={config.serie_nome || '—'} />
              <Item label="Modello" value={`${config.codice_articolo_fornitore || ''} ${config.serie_nome || ''}`.trim() || '—'} mono />
              <Item label="Configurazione" value={(config.configurazione || '').replace(/_/g, ' ').toLowerCase()} />
            </div>

            {/* Riga 2: cristallo + apertura */}
            <div className="grid grid-cols-3 gap-3 text-sm pt-3 border-t border-slate-100">
              <Item
                label="Cristallo"
                value={config.cristallo ? `${config.cristallo.spessore_mm}mm` : '—'}
              />
              <Item label="Apertura" value={(config.tipo_apertura || '').replace(/_/g, ' ').toLowerCase() || '—'} />
              <Item label="Scarico" value={config.scarico || '—'} />
            </div>

            {/* Trattamenti */}
            {config.cristallo?.trattamenti?.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-slate-500 block mb-1">Trattamenti</span>
                <div className="flex flex-wrap gap-1">
                  {config.cristallo.trattamenti.map((t: string) => (
                    <span key={t} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{t.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Misure */}
            {misure?.piatto?.w && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Piatto</span>
                <p className="text-sm font-medium text-slate-900">{misure.piatto.w} × {misure.piatto.d} cm</p>
              </div>
            )}

            {/* Fuori squadro */}
            {fs && (
              <div className={`p-3 rounded-lg flex items-center justify-between ${fs.richiede_compensatori ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <div>
                  <span className="text-xs text-slate-500">Fuori squadro max</span>
                  <p className={`text-sm font-semibold ${fs.richiede_compensatori ? 'text-amber-800' : 'text-green-800'}`}>
                    {fs.max_fuori_squadro_mm}mm
                  </p>
                </div>
                <span className="text-xs">
                  {fs.richiede_compensatori ? '⚠ compensatori' : '✓ ok'}
                </span>
              </div>
            )}

            {/* BOM count */}
            {config.bom_componenti?.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Distinta materiali</span>
                <p className="text-sm font-medium text-slate-900">{config.bom_componenti.length} componenti</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BoxDocciaWizardModal
        vanoId={vanoId}
        aziendaId={aziendaId}
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => reload()}
      />
    </>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-xs text-slate-500 block">{label}</span>
      <p className={`text-sm text-slate-900 ${mono ? 'font-mono' : 'font-medium'} truncate`}>{value}</p>
    </div>
  );
}
