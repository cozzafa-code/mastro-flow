"use client";
import React, { useState, Component } from "react";
import WidgetPicker from "./WidgetPicker";
import { useWidgetConfig, DEFAULT_WIDGETS } from "@/hooks/useWidgetConfig";
import { WIDGET_BY_ID } from "./widgetCatalog";
import { renderWidgetBody } from "./widgetRenderers";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const BORDER = "rgba(40,160,160,0.08)";

interface Props {
  data: any;                    // { tasks, cantieri, fattureDB, team, msgs, problemi, events }
  aziendaId?: string;
  onNav?: {
    goto?: (tab: string) => void;
    openCM?: (c: any) => void;
    openProblema?: (p: any) => void;
    openTask?: (t: any) => void;
    openEvent?: (e: any) => void;
    openMsg?: (m: any) => void;
  };
}

// Error Boundary: se qualcosa nel widget crasha, isoliamo
class WidgetErrorBoundary extends Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.warn("[HomeWidgetsDynamic]", err); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function WidgetCard({ title, subtitle, iconPath, children, onRemove }: any) {
  return (
    <div style={{
      background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
      borderRadius: 18, padding: "14px 16px", marginBottom: 12,
      boxShadow: "0 6px 20px rgba(31,120,120,0.1), inset 0 1px 1px rgba(255,255,255,0.8)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(145deg, #DDEFEF, #BDE0E0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 1.5px 1.5px 3px rgba(26,122,122,0.12), inset -1.5px -1.5px 3px rgba(255,255,255,0.95)",
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A7A7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {iconPath}
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: DARK, letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: SUB, marginTop: 3 }}>{subtitle}</div>
          </div>
        </div>
        {onRemove && (
          <button onClick={onRemove} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 700, color: "#8FA8A8",
            padding: "4px 8px",
          }}>Rimuovi</button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function HomeWidgetsDynamic({ data, aziendaId, onNav }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { widgets, addWidget, removeWidget, trackEvent } = useWidgetConfig(aziendaId);

  const FIXED = ["oggi_devi_fare", "squadra", "produzione"];
  const dynamicWidgets = (widgets || DEFAULT_WIDGETS).filter(w => !FIXED.includes(w));

  const nav = {
    goto: (id: string) => { onNav?.goto?.(id); trackEvent?.("widget_click", id); },
    openCM: (c: any) => onNav?.openCM?.(c),
    openProblema: (p: any) => onNav?.openProblema?.(p),
    openTask: (t: any) => onNav?.openTask?.(t),
    openEvent: (e: any) => onNav?.openEvent?.(e),
    openMsg: (m: any) => onNav?.openMsg?.(m),
  };

  return (
    <>
      {dynamicWidgets.map(wid => {
        const meta = WIDGET_BY_ID[wid];
        if (!meta) return null;
        return (
          <WidgetErrorBoundary key={wid}>
            <WidgetCard
              title={meta.label}
              subtitle={meta.description}
              iconPath={meta.iconPath}
              onRemove={() => removeWidget(wid)}
            >
              {renderWidgetBody(wid, data, nav)}
            </WidgetCard>
          </WidgetErrorBoundary>
        );
      })}

      <div onClick={() => setShowPicker(true)} style={{
        background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
        border: "1.5px dashed rgba(40,160,160,0.35)",
        borderRadius: 18, padding: "16px", marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(31,120,120,0.08)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: "linear-gradient(145deg, #5FD0D0, #28A0A0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(40,160,160,0.3)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: TEAL_DARK, letterSpacing: "0.2px" }}>
          Personalizza dashboard
        </span>
      </div>

      {showPicker && (
        <WidgetPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          activeIds={widgets || DEFAULT_WIDGETS}
          onToggle={(id) => {
            const active = (widgets || DEFAULT_WIDGETS).includes(id);
            if (active) removeWidget(id); else addWidget(id);
          }}
        />
      )}
    </>
  );
}
