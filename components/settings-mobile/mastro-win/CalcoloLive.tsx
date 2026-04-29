// components/settings-mobile/mastro-win/CalcoloLive.tsx
// Tab CALCOLO LIVE: input HBB/LBB/peso/tipo/materiale → chiama il motore → mostra distinta.

'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  selezionaFerramenta,
  type MastroWinInput,
  type MastroWinOutput,
  type TipoApertura,
} from '@/lib/mastro-win-engine';
import type {
  FerramentaArticolo,
  FerramentaCremonese,
} from '@/lib/types/mastro-win';

interface Props {
  articoli: FerramentaArticolo[];
  cremonesi: FerramentaCremonese[];
  azienda_id: string;
}

const TIPI: { v: TipoApertura; l: string }[] = [
  { v: 'anta_battente', l: 'Anta battente' },
  { v: 'anta_ribalta', l: 'Anta-ribalta (DK)' },
  { v: 'anta_anta', l: 'Anta-anta' },
  { v: 'anta_anta_ribalta', l: 'Anta-anta + ribalta' },
  { v: 'vasistas', l: 'Vasistas' },
  { v: 'fissa', l: 'Fissa' },
];

export default function CalcoloLive({ articoli, cremonesi, azienda_id }: Props) {
  const [HBB, setHBB] = useState(1400);
  const [LBB, setLBB] = useState(800);
  const [peso, setPeso] = useState(40);
  const [tipo, setTipo] = useState<TipoApertura>('anta_ribalta');
  const [mat, setMat] = useState<'PVC' | 'ALLUMINIO' | 'LEGNO'>('PVC');
  const [fornitore, setFornitore] = useState<string>('');
  const [calcolando, setCalcolando] = useState(false);
  const [risultato, setRisultato] = useState<MastroWinOutput | null>(null);

  const fornitoriDisp = useMemo(() => {
    const set = new Set<string>();
    articoli.forEach((a) => set.add(a.fornitore));
    cremonesi.forEach((c) => set.add(c.fornitore));
    return Array.from(set).sort();
  }, [articoli, cremonesi]);

  async function calcola() {
    setCalcolando(true);
    setRisultato(null);
    const input: MastroWinInput = {
      HBB,
      LBB,
      peso_anta_kg: peso,
      tipo_apertura: tipo,
      materiale_telaio: mat,
      azienda_id,
      ...(fornitore && { fornitore }),
    };
    try {
      const out = await selezionaFerramenta(input, supabase);
      setRisultato(out);
    } catch (e) {
      setRisultato({
        ok: false,
        distinta: [],
        meta: {},
        prezzo_totale: 0,
        warnings: [],
        errors: [
          {
            codice: 'TIPO_NON_SUPPORTATO',
            messaggio: 'Errore esecuzione motore.',
            dettaglio: String(e),
          },
        ],
        trace: [],
      });
    }
    setCalcolando(false);
  }

  return (
    <div className="p-4 space-y-4">
      {/* CARD INPUT */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: '#FFFFFF',
          border: '1px solid #C8E4E4',
          boxShadow: '0 2px 6px rgba(40,160,160,0.08)',
        }}
      >
        <div className="text-xs font-semibold tracking-wider opacity-60">
          INPUT ANTA
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="HBB (mm)" value={HBB} onChange={setHBB} />
          <NumberField label="LBB (mm)" value={LBB} onChange={setLBB} />
          <NumberField label="Peso (kg)" value={peso} onChange={setPeso} />
          <SelectField
            label="Materiale"
            value={mat}
            onChange={(v) => setMat(v as typeof mat)}
            options={[
              { v: 'PVC', l: 'PVC' },
              { v: 'ALLUMINIO', l: 'Alluminio' },
              { v: 'LEGNO', l: 'Legno' },
            ]}
          />
        </div>

        <SelectField
          label="Tipo apertura"
          value={tipo}
          onChange={(v) => setTipo(v as TipoApertura)}
          options={TIPI.map((t) => ({ v: t.v, l: t.l }))}
        />

        <SelectField
          label="Fornitore"
          value={fornitore}
          onChange={setFornitore}
          options={[
            { v: '', l: 'Auto (più economico)' },
            ...fornitoriDisp.map((f) => ({ v: f, l: f })),
          ]}
        />

        <button
          onClick={calcola}
          disabled={calcolando}
          className="w-full py-3 rounded-lg font-bold text-sm tracking-wider transition-all"
          style={{
            background: '#28A0A0',
            color: '#0D1F1F',
            boxShadow: '0 3px 0 0 #1F7575',
            opacity: calcolando ? 0.6 : 1,
          }}
        >
          {calcolando ? 'CALCOLO...' : 'CALCOLA FERRAMENTA'}
        </button>
      </div>

      {/* CARD RISULTATO */}
      {risultato && <RisultatoCard r={risultato} />}
    </div>
  );
}

// ---------- subcomponenti ----------
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-3 py-2 rounded-md text-base font-mono"
        style={{ background: '#EEF8F8', border: '1px solid #C8E4E4' }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md text-sm"
        style={{ background: '#EEF8F8', border: '1px solid #C8E4E4' }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function RisultatoCard({ r }: { r: MastroWinOutput }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${r.ok ? '#28A0A0' : '#D14545'}`,
        boxShadow: '0 2px 6px rgba(40,160,160,0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wider opacity-60">
          {r.ok ? '✓ DISTINTA CALCOLATA' : '✗ ERRORE CALCOLO'}
        </div>
        {r.ok && (
          <div
            className="text-lg font-bold font-mono"
            style={{ color: '#28A0A0' }}
          >
            € {r.prezzo_totale.toFixed(2)}
          </div>
        )}
      </div>

      {/* META riepilogo */}
      {r.ok && (
        <div className="space-y-1 text-xs">
          {r.meta.cremonese && (
            <div>
              <b>Cremonese:</b> {r.meta.cremonese.codice} · h_man{' '}
              {r.meta.cremonese.altezza_maniglia_mm}mm · {r.meta.cremonese.n_chiusure_centrali} chiusure
            </div>
          )}
          {r.meta.cerniere && (
            <div>
              <b>Cerniere:</b> {r.meta.cerniere.codice} × {r.meta.cerniere.n_pezzi} (portata{' '}
              {r.meta.cerniere.portata_totale_kg}kg)
            </div>
          )}
          {r.meta.forbice && (
            <div>
              <b>Forbice:</b> {r.meta.forbice.codice} · {r.meta.forbice.lunghezza_mm}mm
            </div>
          )}
          {r.meta.maniglia && (
            <div>
              <b>Maniglia:</b> {r.meta.maniglia.codice} @ {r.meta.maniglia.posizione_mm}mm
            </div>
          )}
        </div>
      )}

      {/* DISTINTA */}
      {r.distinta.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] tracking-wider opacity-60 pt-2 border-t" style={{ borderColor: '#C8E4E4' }}>
            BOM ({r.distinta.length} righe)
          </div>
          {r.distinta.map((rr, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-xs py-1"
            >
              <div className="flex-1 truncate">
                <div className="font-mono">{rr.codice}</div>
                <div className="opacity-60 text-[10px]">{rr.descrizione}</div>
              </div>
              <div className="text-right font-mono pl-2">
                <div>×{rr.quantita}</div>
                <div className="opacity-60 text-[10px]">€ {rr.prezzo_riga.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WARNINGS */}
      {r.warnings.length > 0 && (
        <div className="pt-2 border-t" style={{ borderColor: '#C8E4E4' }}>
          {r.warnings.map((w, i) => (
            <div
              key={i}
              className="text-xs py-1"
              style={{ color: w.severita === 'warning' ? '#B87800' : '#0D1F1F' }}
            >
              ⚠ {w.messaggio}
            </div>
          ))}
        </div>
      )}

      {/* ERRORS */}
      {r.errors.length > 0 && (
        <div className="pt-2 border-t" style={{ borderColor: '#C8E4E4' }}>
          {r.errors.map((e, i) => (
            <div key={i} className="text-xs py-1" style={{ color: '#D14545' }}>
              ✗ {e.messaggio}
              {e.dettaglio && (
                <div className="opacity-60 text-[10px] font-mono">{e.dettaglio}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
