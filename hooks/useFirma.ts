'use client';

// ============================================================
// MASTRO — useFirma
// Wrapper attorno a /api/firma per leggere token e firmare
// Pattern identico a quello usato in app/firma/[token]/page.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import type { FirmaTokenPublic } from '@/lib/firma-legale-types';

type Stato = 'loading' | 'pronto' | 'firmato' | 'errore';

export function useFirma(token: string | undefined) {
  const [stato, setStato] = useState<Stato>('loading');
  const [data, setData] = useState<FirmaTokenPublic | null>(null);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Carica token
  useEffect(() => {
    if (!token) return;
    fetch('/api/firma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leggi', token }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) {
          setError(res.error);
          setStato('errore');
          return;
        }
        if (res.firmato) {
          setStato('firmato');
          return;
        }
        setData(res);
        setStato('pronto');
      })
      .catch(() => {
        setError('Errore di connessione');
        setStato('errore');
      });
  }, [token]);

  // Invia firma
  const inviaFirma = useCallback(
    async (firmaDataUrl: string) => {
      if (!token) return false;
      setSubmitting(true);
      try {
        const res = await fetch('/api/firma', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'firma',
            token,
            data: { firmaData: firmaDataUrl },
          }),
        });
        const body = await res.json();
        if (body.ok) {
          setStato('firmato');
          return true;
        }
        setError(body.error || 'Errore invio firma');
        return false;
      } catch {
        setError('Errore di connessione');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [token],
  );

  return { stato, data, error, submitting, inviaFirma };
}
