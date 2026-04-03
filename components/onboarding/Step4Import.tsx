'use client';
import { useState } from 'react';
import { OnboardingData } from './types';

interface Props { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void; onNext: () => void; onSkip: () => void; }

const CSV_EXAMPLE = `nome,telefono,email,citta
Mario Rossi,333 1234567,mario@example.com,Milano
Anna Bianchi,347 9876543,anna@example.com,Roma`;

export default function Step4Import({ data, onChange, onNext, onSkip }: Props) {
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFile = (file: File) => {
    onChange({ importCsv: file });
    const reader = new FileReader();
    reader.onload = e => {
      const lines = (e.target?.result as string).split('\n').slice(0, 4);
      setPreview(lines.map(l => l.split(',')));
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{ border: '2px dashed #E5E3DC', borderRadius: 10, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', background: '#F2F1EC' }}
        onClick={() => document.getElementById('csv-input')?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        {data.importCsv ? (
          <div style={{ fontSize: 14, color: '#1A9E73', fontWeight: 600 }}>✓ {data.importCsv.name}</div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1C', marginBottom: 4 }}>Trascina il CSV clienti qui</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>oppure clicca per selezionare</div>
          </>
        )}
        <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {preview.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: '#F2F1EC', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
            ANTEPRIMA ({preview.length - 1} clienti rilevati)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F2F1EC', background: i === 0 ? '#F2F1EC' : '#fff' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '6px 12px', color: i === 0 ? '#6B7280' : '#1A1A1C', fontWeight: i === 0 ? 600 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details style={{ fontSize: 12, color: '#6B7280' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Formato CSV richiesto</summary>
        <pre style={{ marginTop: 8, background: '#F2F1EC', padding: 10, borderRadius: 6, fontSize: 11, overflowX: 'auto' }}>{CSV_EXAMPLE}</pre>
      </details>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSkip} style={{ ...btnSecondary, flex: 1 }}>Salta per ora</button>
        <button onClick={onNext} style={{ ...btnPrimary, flex: 2 }}>
          {data.importCsv ? 'Importa e continua →' : 'Continua →'}
        </button>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: '13px 0', background: '#28A0A0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { ...btnPrimary, background: '#F2F1EC', color: '#6B7280', border: '1px solid #E5E3DC' };
