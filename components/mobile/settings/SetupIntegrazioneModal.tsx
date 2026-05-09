// components/mobile/settings/SetupIntegrazioneModal.tsx
// Modal universale setup integrazioni MASTRO
// Salva config in user_integrazioni (servizio + stato + config jsonb)

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const C = {
  navy: '#1E3A5F',
  navyDark: '#0F1B2D',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

export const INTEGRAZIONI_CONFIG = {
  fatture_in_cloud: {
    titolo: 'Fatture in Cloud',
    icona: '📄',
    descrizione: 'Push automatico fatture al SDI',
    docUrl: 'https://api-v2.fattureincloud.it/oauth/authorize',
    fields: [
      { key: 'company_id', label: 'Company ID', placeholder: 'es. 1234567', type: 'text', required: true },
      { key: 'access_token', label: 'Access Token', placeholder: 'ya29.A0Af...', type: 'password', required: true,
        helpText: 'Genera token OAuth da app Fatture in Cloud' },
    ],
  },
  enea: {
    titolo: 'Bonus ENEA',
    icona: '🌿',
    descrizione: 'Pratica detrazione 50/65% automatica',
    docUrl: 'https://detrazionifiscali.enea.it',
    fields: [
      { key: 'enea_user', label: 'Username ENEA', placeholder: 'username', type: 'text', required: true },
      { key: 'enea_token', label: 'Token API ENEA', placeholder: 'eyJhbGc...', type: 'password', required: true,
        helpText: 'Token rilasciato dal portale ENEA' },
      { key: 'enea_codice_fiscale', label: 'CF Tecnico Asseveratore', placeholder: 'RSSMRA80A01H501Z', type: 'text', required: true },
    ],
  },
  cnc_emmegi: {
    titolo: 'CNC Emmegi Centro 2',
    icona: '⚙️',
    descrizione: 'Programmi taglio diretti dalla commessa',
    docUrl: null,
    fields: [
      { key: 'endpoint_url', label: 'URL macchina CNC', placeholder: 'http://192.168.1.50:8080/api', type: 'text', required: true,
        helpText: 'IP locale o URL del controller' },
      { key: 'api_token', label: 'Token (opzionale)', placeholder: 'token se richiesto', type: 'password', required: false },
      { key: 'formato', label: 'Formato programma', type: 'select', required: true,
        options: [
          { value: 'enea-xml', label: 'ENEA-XML (standard industria)' },
          { value: 'gcode', label: 'ISO G-Code (universale)' },
          { value: 'emm-native', label: 'EMM nativo Emmegi' },
        ]},
      { key: 'postazione_default', label: 'Postazione default', placeholder: 'CENTRO2-01', type: 'text', required: false },
    ],
  },
  finanziamento_soisy: {
    titolo: 'Soisy Finanziamento',
    icona: '💰',
    descrizione: 'Link finanziamento al cliente al checkout',
    docUrl: 'https://www.soisy.it/dev',
    fields: [
      { key: 'shop_id', label: 'Shop ID Soisy', placeholder: 'es. 12345', type: 'text', required: true },
      { key: 'api_key', label: 'API Key Soisy', placeholder: 'sk_live_...', type: 'password', required: true,
        helpText: 'Chiave production dal pannello Soisy' },
    ],
  },
};

interface Props {
  tipo: keyof typeof INTEGRAZIONI_CONFIG;
  aziendaId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SetupIntegrazioneModal({ tipo, aziendaId, userId, onClose, onSaved }: Props) {
  const config = INTEGRAZIONI_CONFIG[tipo];
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('user_integrazioni')
        .select('id, config')
        .eq('azienda_id', aziendaId)
        .eq('servizio', tipo)
        .maybeSingle();
      if (data) {
        setExistingId(data.id);
        setValues(data.config || {});
      }
    })();
  }, [tipo, aziendaId]);

  function setField(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }));
  }

  async function handleSave() {
    setError('');
    setLoading(true);
    try {
      for (const f of config.fields) {
        if (f.required && !values[f.key]?.trim()) {
          throw new Error(`Campo "${f.label}" obbligatorio`);
        }
      }

      const payload: any = {
        user_id: userId,
        azienda_id: aziendaId,
        servizio: tipo,
        stato: 'attiva',
        config: values,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingId) {
        result = await supabase.from('user_integrazioni').update(payload).eq('id', existingId);
      } else {
        result = await supabase.from('user_integrazioni').insert(payload);
      }

      if (result.error) throw result.error;
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Errore salvataggio');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisattiva() {
    if (!existingId) return;
    if (!confirm('Disattivare questa integrazione?')) return;
    setLoading(true);
    try {
      await supabase.from('user_integrazioni').update({ stato: 'disattiva' }).eq('id', existingId);
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,27,45,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: C.cream, width: '100%', maxWidth: 520,
        maxHeight: '92vh', overflowY: 'auto',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: '22px 18px 36px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 30 }}>{config.icona}</p>
            <h2 style={{ margin: '4px 0 0', color: C.navy, fontSize: 20, fontWeight: 700 }}>
              {config.titolo}
            </h2>
            <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: 12 }}>
              {config.descrizione}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            fontSize: 24, color: C.textMuted, cursor: 'pointer',
            width: 32, height: 32,
          }}>×</button>
        </div>

        {existingId && (
          <div style={{
            background: C.greenBg, color: C.greenText,
            padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14,
          }}>
            ✅ Integrazione configurata. Modifica e salva per aggiornare.
          </div>
        )}

        {config.fields.map(field => (
          <div key={field.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>
              {field.label}{field.required && <span style={{ color: C.red }}> *</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={values[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
                style={inputStyle}
              >
                <option value="">— Seleziona —</option>
                {(field as any).options?.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'password' ? 'password' : 'text'}
                value={values[field.key] || ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            )}
            {(field as any).helpText && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>
                ℹ️ {(field as any).helpText}
              </p>
            )}
          </div>
        ))}

        {config.docUrl && (
          <a href={config.docUrl} target="_blank" rel="noreferrer" style={{
            display: 'block', marginBottom: 14, fontSize: 12,
            color: C.navy, textDecoration: 'underline',
          }}>
            📚 Apri documentazione {config.titolo}
          </a>
        )}

        {error && (
          <div style={{ padding: 10, background: '#FFE5E5', color: C.red, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSave} disabled={loading} style={{ ...btnPrimary, width: '100%', marginTop: 8 }}>
          {loading ? 'Salvataggio...' : existingId ? 'AGGIORNA' : 'ATTIVA INTEGRAZIONE'}
        </button>

        {existingId && (
          <button onClick={handleDisattiva} style={{
            width: '100%', marginTop: 8,
            background: 'transparent', color: C.red,
            border: 'none', padding: 10,
            fontSize: 12, cursor: 'pointer',
          }}>
            Disattiva integrazione
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle: any = {
  width: '100%', padding: '12px 14px',
  border: `1px solid ${C.borderWarm}`, borderRadius: 10,
  fontSize: 14, background: C.white, color: C.navy,
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const btnPrimary: any = {
  background: C.navy, color: C.cream,
  border: 'none', borderRadius: 10,
  padding: '12px 18px', fontWeight: 700, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit',
};
