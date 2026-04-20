"use client";
import React, { useState, useRef, Component } from "react";
import WidgetPicker from "./WidgetPicker";
import { useWidgetConfig, DEFAULT_WIDGETS } from "@/hooks/useWidgetConfig";
import { WIDGET_BY_ID } from "./widgetCatalog";
import { renderWidgetBody } from "./widgetRenderers";
import { useMastro } from "./MastroContext";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const LONG_PRESS_MS = 450;

// ─── Error boundary ─────────────────────────────────────────────
class WidgetEB extends Component<any, { hasError: boolean }> {
  constructor(p: any) { super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: any) { console.warn("[widget]", e); }
  render() { return this.state.hasError ? null : this.props.children; }
}

// ─── Card ───────────────────────────────────────────────────────
function WCard({ title, subtitle, iconPath, children, onRemove, dragging, dragHover }: any) {
  return (
    <div style={{
      background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
      borderRadius: 18, padding: "14px 16px", marginBottom: 12,
      boxShadow: dragging
        ? "0 14px 32px rgba(31,120,120,0.3), 0 0 0 2px " + TEAL
        : "0 6px 20px rgba(31,120,120,0.1)",
      border: dragHover ? "2px dashed " + TEAL : "1px solid rgba(200,228,228,0.5)",
      opacity: dragging ? 0.95 : 1,
      transform: dragging ? "scale(1.02)" : "scale(1)",
      transition: "transform 0.15s, box-shadow 0.15s",
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
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              background: "rgba(220,68,68,0.08)", border: "none", cursor: "pointer",
              width: 28, height: 28, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Rimuovi widget"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC4444" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────
export default function HomeWidgetsDynamic() {
  const [showPicker, setShowPicker] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const lpTimer = useRef<any>(null);
  const startYRef = useRef<number>(0);

  const ctx: any = useMastro();
  const aziendaId = ctx?.aziendaInfo?.id || ctx?.azienda_id;
  const { widgets, addWidget, removeWidget, reorderWidgets, trackEvent } = useWidgetConfig(aziendaId);

  const d7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const data = {
    tasks: ctx?.tasks || [],
    cantieri: ctx?.cantieri || [],
    fattureDB: ctx?.fattureDB || [],
    team: ctx?.team || ctx?.operatori || ctx?.operatoriDB || [],
    msgs: ctx?.msgs || ctx?.messaggi || [],
    problemi: ctx?.problemi || [],
    events: ctx?.events || [],
    ordiniFornDB: ctx?.ordiniFornDB || ctx?.ordini || [],
    spese: ctx?.spese || ctx?.speseDB || [],
    _d7: d7,
  };

  const FIXED = ["oggi_devi_fare", "squadra", "produzione"];
  const dynamicWidgets = (widgets || DEFAULT_WIDGETS).filter(w => !FIXED.includes(w));

  const nav = {
    goto: (id: string) => { ctx?.setTab?.(id); trackEvent?.("widget_click", id); },
    openCM: (c: any) => { ctx?.setSelectedCM?.(c); ctx?.setTab?.("commesse"); },
    openProblema: () => ctx?.setShowProblemiView?.(true),
    openTask: () => ctx?.setTab?.("agenda"),
    openEvent: () => ctx?.setTab?.("agenda"),
    openMsg: () => ctx?.setTab?.("messaggi"),
  };

  const doReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const current = widgets || DEFAULT_WIDGETS;
    const fromIdx = current.indexOf(fromId);
    const toIdx = current.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...current];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, fromId);
    reorderWidgets?.(next);
  };

  const onTouchStart = (e: React.TouchEvent, wid: string) => {
    startYRef.current = e.touches[0].clientY;
    if (lpTimer.current) clearTimeout(lpTimer.current);
    lpTimer.current = setTimeout(() => {
      setDragId(wid);
      if ("vibrate" in navigator) navigator.vibrate(30);
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dy = Math.abs(e.touches[0].clientY - startYRef.current);
    if (!dragId && dy > 8 && lpTimer.current) {
      clearTimeout(lpTimer.current);
      lpTimer.current = null;
    }
    if (!dragId) return;
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    const card = (el as HTMLElement | null)?.closest("[data-widget-id]") as HTMLElement | null;
    const tid = card?.dataset?.widgetId || null;
    if (tid && tid !== hoverId) setHoverId(tid);
    e.preventDefault();
  };

  const onTouchEnd = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
    if (dragId && hoverId && dragId !== hoverId) doReorder(dragId, hoverId);
    setDragId(null);
    setHoverId(null);
  };

  return (
    <div>
      {dynamicWidgets.map(wid => {
        const meta = WIDGET_BY_ID[wid];
        if (!meta) return null;
        const isDrag = dragId === wid;
        const isHover = hoverId === wid && dragId !== null && dragId !== wid;
        return (
          <div
            key={wid}
            data-widget-id={wid}
            onTouchStart={(e) => onTouchStart(e, wid)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: dragId ? "none" : "pan-y" }}
          >
            <WidgetEB>
              <WCard
                title={meta.label}
                subtitle={meta.description}
                iconPath={meta.iconPath}
                onRemove={() => removeWidget(wid)}
                dragging={isDrag}
                dragHover={isHover}
              >
                {renderWidgetBody(wid, data, nav)}
              </WCard>
            </WidgetEB>
          </div>
        );
      })}

      {dynamicWidgets.length > 0 && (
        <div style={{
          textAlign: "center", fontSize: 11, color: SUB,
          marginTop: -4, marginBottom: 12, fontStyle: "italic",
        }}>Tieni premuto su un widget per spostarlo</div>
      )}

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
    </div>
  );
}
