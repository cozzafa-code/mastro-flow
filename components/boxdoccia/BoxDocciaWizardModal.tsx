// components/boxdoccia/BoxDocciaWizardModal.tsx
// Modal full-screen che ospita l'iframe del widget Box Doccia
'use client';

import { useBoxDocciaWizard } from '@/hooks/useBoxDocciaWizard';
import { useEffect } from 'react';

interface BoxDocciaWizardModalProps {
  vanoId: string;
  aziendaId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (data: any) => void;
}

export default function BoxDocciaWizardModal({
  vanoId, aziendaId, open, onClose, onSaved,
}: BoxDocciaWizardModalProps) {
  const { saving, error, iframeRef, handleIframeLoad } = useBoxDocciaWizard({
    vanoId,
    aziendaId,
    onSaved: (data) => {
      onSaved?.(data);
      onClose();
    },
  });

  // ESC per chiudere
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1F1F]">
      {/* Toolbar superiore con close + indicatore saving */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#0D1F1F] border-b border-teal-900/40 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-teal-400 font-semibold text-sm">MASTRO · Box Doccia</span>
          {saving && <span className="text-xs text-teal-300 animate-pulse">Salvataggio...</span>}
        </div>
        <button
          onClick={onClose}
          disabled={saving}
          className="text-slate-300 hover:text-white px-3 py-1 rounded-lg hover:bg-white/10 disabled:opacity-50 text-sm"
        >
          Chiudi (ESC)
        </button>
      </div>

      {error && (
        <div className="absolute top-12 left-0 right-0 bg-red-600/90 text-white px-4 py-2 text-sm z-10">
          ⚠ {error}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="/widgets/boxdoccia/index.html"
        onLoad={handleIframeLoad}
        className="w-full h-full pt-12 border-0"
        title="MASTRO Box Doccia Wizard"
        allow="camera; clipboard-write"
      />
    </div>
  );
}
