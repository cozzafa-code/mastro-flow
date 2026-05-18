// ======================================================================
// MASTRO ERP - Vano Detail / StatoMisurePanel
// Estratto da components/VanoDetailPanel.tsx (refactor S6)
// ======================================================================

import React from "react";
import { STATO_MISURE } from "@/lib/vano-detail/constants";

interface StatoMisurePanelProps {
  vano: any;
  theme: { bg: string; card: string; bdr: string; text: string; sub: string };
  onSelectStato: (statoId: string) => void;
  onClose: () => void;
}

export default function StatoMisurePanel({
  vano,
  theme,
  onSelectStato,
  onClose,
}: StatoMisurePanelProps) {
  return (

        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-end" }} onClick={() => onClose()}>
          <div style={{ width: "100%", background: theme.card, borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxWidth: 480, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.bdr, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, marginBottom: 4 }}>Stato misure — {vano.nome}</div>
            <div style={{ fontSize: 11, color: theme.sub, marginBottom: 16 }}>Imposta lo stato di validazione delle misure di questo vano</div>
            {STATO_MISURE.map(sm => {
              const isActive = (vano.statoMisure || "provvisorie") === sm.id;
              return (
                <div key={sm.id} onClick={() => {
                  onSelectStato(sm.id);
                  onClose();
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `2px solid ${isActive ? sm.color : theme.bdr}`, background: isActive ? sm.bg : theme.bg, marginBottom: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{sm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? sm.color : theme.text }}>{sm.label}</div>
                    <div style={{ fontSize: 10, color: theme.sub }}>{sm.desc}</div>
                  </div>
                  {isActive && <span style={{ fontSize: 16, color: sm.color }}>●</span>}
                </div>
              );
            })}
          </div>
        </div>
      
  );
}
