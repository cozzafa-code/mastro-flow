// hooks/useBoxDocciaWizard.ts
// Hook che apre il widget Box Doccia in iframe modale, inietta config Supabase,
// gestisce callback di salvataggio verso vani.boxdoccia_config + boxdoccia_misure.
'use client';

import { useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BoxDocciaConfig {
  fornitore_id: string;
  fornitore_nome?: string;
  serie_id: string;
  serie_nome?: string;
  modello_id: string;
  codice_articolo_fornitore: string | null;
  configurazione: string;
  tipo_apertura: string | null;
  profili: any;
  cristallo: any;
  piatto: any;
  scarico: string;
  bom_componenti: any[];
}

interface BoxDocciaMisure {
  parete_sx: { alto: number | null; medio: number | null; basso: number | null };
  parete_dx: { alto: number | null; medio: number | null; basso: number | null };
  top: { sx: number | null; centro: number | null; dx: number | null };
  diagonali: { d1: number | null; d2: number | null };
  piatto: { w: number | null; d: number | null };
  pavimento: { inclinazione_gradi: number; verso_scarico: string };
  ostacoli: any[];
  foto_cantiere: string[];
  note_libere: string;
  fuori_squadro_calcolato?: any;
}

interface UseBoxDocciaWizardOpts {
  vanoId: string;
  aziendaId: string;
  onSaved?: (data: { config: BoxDocciaConfig; misure: BoxDocciaMisure }) => void;
}

export function useBoxDocciaWizard({ vanoId, aziendaId, onSaved }: UseBoxDocciaWizardOpts) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const supabase = createClient();

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const win = iframe.contentWindow as any;

    win.MASTRO_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    win.MASTRO_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    win.MASTRO_AZIENDA_ID = aziendaId;

    // Callback salvataggio
    win.MastroBoxDocciaOnSave = async (payload: { config: BoxDocciaConfig; misure: BoxDocciaMisure }) => {
      setSaving(true);
      setError(null);
      try {
        const { error } = await supabase
          .from('vani')
          .update({
            boxdoccia_config: payload.config,
            boxdoccia_misure: payload.misure,
          })
          .eq('id', vanoId);
        if (error) throw error;
        onSaved?.(payload);
        setOpen(false);
      } catch (e: any) {
        setError(e.message || 'Errore salvataggio');
        throw e;
      } finally {
        setSaving(false);
      }
    };

    // Bridge canvas: lascia che il widget originale gestisca i suoi tab 3D/Pianta/Disegna/Foto
    win.MastroBoxDocciaCanvasInit = (tabName: string, state: any) => {
      // Il widget originale ha già i propri handler interni.
      // Qui possiamo eventualmente passare misure precompilate ai canvas.
      win.dispatchEvent(new CustomEvent('mastro-bd-tab', { detail: { tabName, state } }));
    };

    // Auto-apri il wizard al caricamento iframe
    if (typeof win.MastroBoxDoccia?.open === 'function') {
      win.MastroBoxDoccia.open();
    }
  }, [vanoId, aziendaId, onSaved, supabase]);

  return {
    open,
    setOpen,
    saving,
    error,
    iframeRef,
    handleIframeLoad,
  };
}
