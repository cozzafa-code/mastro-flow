'use client';
import { useState, useEffect } from 'react';

interface DatiFiscali {
  nome: string;
  piva: string;
  cf: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  iban: string;
  pec: string;
  codice_sdi: string;
  regime_fiscale: string;
  telefono: string;
  email: string;
}

const REGIMI = [
  { value: 'RF01', label: 'RF01 — Ordinario' },
  { value: 'RF19', label: 'RF19 — Forfettario' },
  { value: 'RF02', label: 'RF02 — Contribuenti minimi' },
];

export default function SettingsDatiFiscali() {
  const [dati, setDati] = useState<Partial<DatiFiscali>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/azienda/profilo', {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()).then(d => setDati(d ?? {}));
  }, []);

  const salva = async () => {
    setSaving(true);
    try {
      await fetch('/api/azienda/profilo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(dati),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const upd = (k: keyof DatiFiscali) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDati(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Ragione Sociale *" value={dati.nome ?? ''} onChange={upd('nome')} full />
        <Field label="P.IVA *" value={dati.piva ?? ''} onChange={upd('piva')} placeholder="IT12345678901" />
        <Field label="Codice Fiscale" value={dati.cf ?? ''} onChange={upd('cf')} />
        <Field label="Telefono" value={dati.telefono ?? ''} onChange={upd('telefono')} />
        <Field label="Email" value={dati.email ?? ''} onChange={upd('email')} />
        <Field label="Indirizzo" value={dati.indirizzo ?? ''} onChange={upd('indirizzo')} />
        <Field label="CAP" value={dati.cap ?? ''} onChange={upd('cap')} />
        <Field label="Comune" value={dati.comune ?? ''} onChange={upd('comune')} />
        <Field label="Provincia" value={dati.provincia ?? ''} onChange={upd('provincia')} placeholder="BR" />
      </div>

      <div style={{ borderTop: '1px solid #E5E3DC', paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>
          Dati Fatturazione Elettronica (SDI)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Codice SDI" value={dati.codice_sdi ?? ''} onChange={upd('codice_sdi')} placeholder="es. XXXXXXX" />
          <Field label="PEC" value={dati.pec ?? ''} onChange={upd('pec')} placeholder="azienda@pec.it" />
          <Field label="IBAN" value={dati.iban ?? ''} onChange={upd('iban')} placeholder="IT60X0542811101000000123456" />
          <div>
            <label style={labelStyle}>Regime Fiscale</label>
            <select value={dati.regime_fiscale ?? 'RF19'} onChange={upd('regime_fiscale')} style={inputStyle}>
              {REGIMI.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={salva} disabled={saving} style={{
        padding: '13px 0', background: saved ? '#1A9E73' : '#D08008',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', transition: 'background 0.2s',
      }}>
        {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva dati fiscali'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full }: { label: string; value: string; onChange: any; placeholder?: string; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E5E3DC', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', background: '#F2F1EC', color: '#1A1A1C', outline: 'none', boxSizing: 'border-box' };

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') ?? '' : '';
}
