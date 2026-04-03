'use client';
// Step2Brand.tsx
import { OnboardingData } from './types';

const COLORI = ['#28A0A0', '#3B7FE0', '#1A9E73', '#DC4444', '#7C3AED', '#1A1A1C'];

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onNext: () => void; onSkip: () => void; }

export default function Step2Brand({ data, onChange, onNext, onSkip }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label style={labelStyle}>Logo azienda (opzionale)</label>
        <div
          style={{
            border: '2px dashed #E5E3DC',
            borderRadius: 10,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: '#F2F1EC',
          }}
          onClick={() => document.getElementById('logo-input')?.click()}
        >
          {data.logo ? (
            <div style={{ fontSize: 14, color: '#1A9E73', fontWeight: 600 }}>
              ✓ {data.logo.name}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                Clicca per caricare il logo (PNG, JPG)
              </div>
            </>
          )}
          <input
            id="logo-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => onChange({ logo: e.target.files?.[0] ?? null })}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Colore brand</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {COLORI.map(c => (
            <div
              key={c}
              onClick={() => onChange({ coloreAccent: c })}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                border: data.coloreAccent === c ? '3px solid #1A1A1C' : '3px solid transparent',
                transition: 'border 0.15s',
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
          Verrà usato nell'interfaccia e nei PDF
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSkip} style={{ ...btnSecondary, flex: 1 }}>Salta</button>
        <button onClick={onNext} style={{ ...btnPrimary, flex: 2 }}>Continua →</button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: '13px 0', background: '#28A0A0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: '#F2F1EC', color: '#6B7280', border: '1px solid #E5E3DC' };
