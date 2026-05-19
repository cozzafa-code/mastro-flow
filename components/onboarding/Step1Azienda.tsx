'use client';
import { OnboardingData } from './types';

const SETTORI = [
  { value: 'serramenti', label: '🪟 Serramentista', desc: 'Finestre, porte, infissi' },
  { value: 'tendaggi', label: '🪟 Tendaggi & Pergole', desc: 'Zanzariere, tende, pergole' },
  { value: 'fabbro', label: '🔧 Fabbro', desc: 'Cancelli, recinzioni, ferro' },
  { value: 'multi', label: '🏢 Multi-settore', desc: 'Più categorie' },
];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export default function Step1Azienda({ data, onChange, onNext }: Props) {
  const valid = data.nomeAzienda.trim().length >= 2 && !!data.settore;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label style={labelStyle}>Nome azienda *</label>
        <input
          autoFocus
          value={data.nomeAzienda}
          onChange={e => onChange({ nomeAzienda: e.target.value })}
          placeholder="Es. Serramenti Rossi SRL"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Città / Zona operativa</label>
        <input
          value={data.citta}
          onChange={e => onChange({ citta: e.target.value })}
          placeholder="Es. Milano, Brindisi, Roma..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Settore principale *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
          {SETTORI.map(s => (
            <div
              key={s.value}
              onClick={() => onChange({ settore: s.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `2px solid ${data.settore === s.value ? '#28A0A0' : '#E5E3DC'}`,
                background: data.settore === s.value ? '#FEF3C7' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1C', marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        style={{
          ...btnStyle,
          opacity: valid ? 1 : 0.4,
          cursor: valid ? 'pointer' : 'not-allowed',
        }}
      >
        Continua →
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E3DC',
  borderRadius: 8,
  fontSize: 15,
  fontFamily: 'Inter, sans-serif',
  background: '#F2F1EC',
  color: '#1A1A1C',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 0',
  background: '#28A0A0',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
};
