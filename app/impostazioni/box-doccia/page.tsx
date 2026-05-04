// app/impostazioni/box-doccia/page.tsx
'use client';

import { useState } from 'react';
import FornitoriPanel from '@/components/boxdoccia-catalogo/FornitoriPanel';
import SerieModelliPanel from '@/components/boxdoccia-catalogo/SerieModelliPanel';
import FinituriPanel from '@/components/boxdoccia-catalogo/FinituriPanel';
import CristalliPanel from '@/components/boxdoccia-catalogo/CristalliPanel';
import ComponentiPanel from '@/components/boxdoccia-catalogo/ComponentiPanel';

type Tab = 'fornitori' | 'serie' | 'finiture' | 'cristalli' | 'componenti';

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'fornitori', label: 'Fornitori', desc: 'Aziende produttrici' },
  { id: 'serie', label: 'Serie & Modelli', desc: 'Linee prodotto e configurazioni' },
  { id: 'finiture', label: 'Finiture', desc: 'Colori e trattamenti profili' },
  { id: 'cristalli', label: 'Cristalli', desc: 'Vetri base, decori, trattamenti' },
  { id: 'componenti', label: 'Componenti', desc: 'Guarnizioni, profili, ricambi' },
];

export default function CatalogoBoxDocciaPage() {
  const [tab, setTab] = useState<Tab>('fornitori');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <a href="/impostazioni" className="text-slate-400 hover:text-slate-600">‹ Impostazioni</a>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogo Box Doccia</h1>
          <p className="text-slate-500 text-sm mt-1">Gestione fornitori, serie, modelli, finiture, cristalli e componenti</p>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'fornitori' && <FornitoriPanel />}
        {tab === 'serie' && <SerieModelliPanel />}
        {tab === 'finiture' && <FinituriPanel />}
        {tab === 'cristalli' && <CristalliPanel />}
        {tab === 'componenti' && <ComponentiPanel />}
      </main>
    </div>
  );
}
