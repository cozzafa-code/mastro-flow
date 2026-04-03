'use client';
import { OnboardingData } from './types';

const RUOLI = ['montatore', 'tecnico_misure', 'magazziniere', 'commerciale', 'amministrativo'];

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onNext: () => void; }

export default function Step3Team({ data, onChange, onNext }: Props) {
  const addOperatore = () => {
    onChange({ operatori: [...data.operatori, { nome: '', ruolo: 'montatore', email: '' }] });
  };

  const updateOp = (i: number, field: string, val: string) => {
    const ops = [...data.operatori];
    ops[i] = { ...ops[i], [field]: val };
    onChange({ operatori: ops });
  };

  const removeOp = (i: number) => {
    onChange({ operatori: data.operatori.filter((_, idx) => idx !== i) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['solo', 'team'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onChange({ teamMode: mode })}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: `2px solid ${data.teamMode === mode ? '#28A0A0' : '#E5E3DC'}`,
              background: data.teamMode === mode ? '#FEF3C7' : '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#1A1A1C',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {mode === 'solo' ? '👤 Solo io' : '👥 Ho un team'}
          </button>
        ))}
      </div>

      {data.teamMode === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.operatori.map((op, i) => (
            <div key={i} style={{ background: '#F2F1EC', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={op.nome}
                  onChange={e => updateOp(i, 'nome', e.target.value)}
                  placeholder="Nome operatore"
                  style={{ ...inputStyle, flex: 2 }}
                />
                <select
                  value={op.ruolo}
                  onChange={e => updateOp(i, 'ruolo', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {RUOLI.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {data.operatori.length > 1 && (
                  <button onClick={() => removeOp(i)} style={{ background: 'none', border: 'none', color: '#DC4444', cursor: 'pointer', fontSize: 18 }}>✕</button>
                )}
              </div>
              <input
                value={op.email}
                onChange={e => updateOp(i, 'email', e.target.value)}
                placeholder="Email (opzionale)"
                type="email"
                style={inputStyle}
              />
            </div>
          ))}
          <button
            onClick={addOperatore}
            style={{ background: 'none', border: '1px dashed #E5E3DC', borderRadius: 8, padding: '10px 0', color: '#6B7280', cursor: 'pointer', fontSize: 13 }}
          >
            + Aggiungi operatore
          </button>
        </div>
      )}

      <button onClick={onNext} style={btnPrimary}>Continua →</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '9px 12px', border: '1px solid #E5E3DC', borderRadius: 8, fontSize: 14, fontFamily: 'Inter, sans-serif', background: '#fff', color: '#1A1A1C', outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { width: '100%', padding: '13px 0', background: '#28A0A0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer' };
