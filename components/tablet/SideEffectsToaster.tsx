"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";
import { useMastroSideEffects, SideEffect } from "./store/mastro-tablet-store";
import { useDashboard } from "./dashboard-context";

const TINTS = {
  violet: TT.violet, blue: TT.blue, green: TT.green, pink: TT.pink, teal: TT.teal,
} as const;

interface ToastItem extends SideEffect {
  id: string;
  ts: number;
}

const TIPO_DEF: Record<SideEffect["tipo"], { icon: IconName; tint: keyof typeof TINTS; label: string }> = {
  preventivo: { icon: "preventivo",  tint: "violet", label: "Preventivo creato" },
  produzione: { icon: "produzione",  tint: "blue",   label: "Produzione avviata" },
  montaggio:  { icon: "montaggi",    tint: "green",  label: "Montaggio pianificato" },
  fattura:    { icon: "contabilita", tint: "pink",   label: "Fattura emessa" },
  pagamento:  { icon: "check",       tint: "green",  label: "Pagamento registrato" },
};

export default function SideEffectsToaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const { openCommessa, openEntity } = useDashboard();

  const onSideEffect = React.useCallback((e: SideEffect) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const item: ToastItem = { ...e, id, ts: Date.now() };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useMastroSideEffects(onSideEffect);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 10,
      zIndex: 1100,
      pointerEvents: "none",
    }}>
      {toasts.map((t) => <ToastCard key={t.id} toast={t} onOpenEntity={(tipo, id) => {
        if (tipo === "preventivo" || tipo === "produzione" || tipo === "montaggio" || tipo === "pagamento") {
          openCommessa(t.commessaId);
        } else if (tipo === "fattura") {
          openEntity("fattura", id);
        }
      }} onDismiss={() => setToasts((prev) => prev.filter((tt) => tt.id !== t.id))} />)}
    </div>
  );
}

function ToastCard({ toast, onOpenEntity, onDismiss }: { toast: ToastItem; onOpenEntity: (tipo: SideEffect["tipo"], id: string) => void; onDismiss: () => void }) {
  const def = TIPO_DEF[toast.tipo];
  const ramp = TINTS[def.tint];

  return (
    <div style={{
      pointerEvents: "auto",
      width: 320,
      padding: "12px 14px",
      background: TT.surface,
      borderRadius: 12,
      border: `1px solid ${ramp[200]}`,
      boxShadow: TT.shadowXl,
      display: "flex", alignItems: "flex-start", gap: 11,
      animation: "mastroSlideIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
      borderLeft: `4px solid ${ramp[500]}`,
    }}>
      <style>{`
        @keyframes mastroSlideIn {
          from { opacity: 0; transform: translateX(80px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 2px 8px ${ramp[300]}`,
      }}>
        <Icon name={def.icon} size={17} color="#fff" strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>
          {def.label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px", marginBottom: 6 }}>
          {toast.msg}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { onOpenEntity(toast.tipo, toast.entityId); onDismiss(); }} style={{
            padding: "4px 10px",
            background: ramp[500], color: "#fff",
            border: "none", borderRadius: 6,
            fontSize: 10, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}>
            Apri
          </button>
          <button onClick={onDismiss} style={{
            padding: "4px 10px",
            background: TT.bgSoft, color: TT.text2,
            border: `1px solid ${TT.border}`, borderRadius: 6,
            fontSize: 10, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}>
            Chiudi
          </button>
        </div>
      </div>
      <button onClick={onDismiss} style={{
        width: 22, height: 22, borderRadius: 5,
        background: "transparent", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
      }}>
        <Icon name="x" size={12} color={TT.text3} strokeWidth={2.4} />
      </button>
    </div>
  );
}
