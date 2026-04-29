// components/settings-mobile/MastroWinMobile.tsx
// Shell del modulo MASTRO WIN: 4 tab (Calcolo, Articoli, Cremonesi, Dim/Portate).

'use client';

import { useState } from 'react';
import { useMastroWin } from '@/hooks/useMastroWin';
import type { WinTab } from '@/lib/types/mastro-win';
import CalcoloLive from './mastro-win/CalcoloLive';
import CrudArticoli from './mastro-win/CrudArticoli';
import CrudCremonesi from './mastro-win/CrudCremonesi';
import CrudDimensioniPortate from './mastro-win/CrudDimensioniPortate';

interface Props {
  azienda_id: string;
  onBack?: () => void;
}

const TABS: { key: WinTab; label: string; icon: string }[] = [
  { key: 'calcolo', label: 'Calcolo', icon: '⚙' },
  { key: 'articoli', label: 'Articoli', icon: '◉' },
  { key: 'cremonesi', label: 'Cremonesi', icon: '⌐' },
  { key: 'dimensioni', label: 'Dim/Portate', icon: '⊞' },
];

export default function MastroWinMobile({ azienda_id, onBack }: Props) {
  const [tab, setTab] = useState<WinTab>('calcolo');
  const win = useMastroWin(azienda_id);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#EEF8F8', color: '#0D1F1F' }}
    >
      {/* HEADER */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: '#0D1F1F',
          borderColor: '#28A0A0',
          color: '#EEF8F8',
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="text-2xl leading-none"
            style={{ color: '#28A0A0' }}
            aria-label="Indietro"
          >
            ‹
          </button>
        )}
        <div className="flex-1">
          <div className="text-xs opacity-70 tracking-wider">MASTRO</div>
          <div className="text-lg font-bold tracking-tight">WIN</div>
        </div>
        <div
          className="text-[10px] px-2 py-1 rounded font-mono"
          style={{ background: '#28A0A0', color: '#0D1F1F' }}
        >
          {win.articoli.length} art · {win.cremonesi.length} crem
        </div>
      </div>

      {/* TAB BAR */}
      <div
        className="flex border-b"
        style={{ background: '#FFFFFF', borderColor: '#C8E4E4' }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-3 text-xs font-medium relative transition-all"
              style={{
                color: active ? '#28A0A0' : '#0D1F1F',
                opacity: active ? 1 : 0.55,
              }}
            >
              <div className="text-base">{t.icon}</div>
              <div>{t.label}</div>
              {active && (
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px]"
                  style={{ background: '#28A0A0' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'calcolo' && (
          <CalcoloLive
            articoli={win.articoli}
            cremonesi={win.cremonesi}
            azienda_id={azienda_id}
          />
        )}
        {tab === 'articoli' && (
          <CrudArticoli
            articoli={win.articoli}
            loading={win.loadingArticoli}
            onSave={win.saveArticolo}
            onDelete={win.deleteArticolo}
          />
        )}
        {tab === 'cremonesi' && (
          <CrudCremonesi
            cremonesi={win.cremonesi}
            loading={win.loadingCremonesi}
            onSave={win.saveCremonese}
            onDelete={win.deleteCremonese}
          />
        )}
        {tab === 'dimensioni' && (
          <CrudDimensioniPortate
            catalogo={win.catalogo}
            dimensioni={win.dimensioni}
            portate={win.portate}
            loading={win.loadingCatalogo}
            onReloadDP={win.reloadDimensioniPortate}
            onSaveCatalogo={win.saveCatalogo}
            onDeleteCatalogo={win.deleteCatalogo}
            onSaveDimensione={win.saveDimensione}
            onDeleteDimensione={win.deleteDimensione}
            onSavePortata={win.savePortata}
            onDeletePortata={win.deletePortata}
          />
        )}
      </div>
    </div>
  );
}
