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
function WCard({ title, subtitle, iconPath, children, onRemove, onHeaderClick, dragging, dragHover }: any) {
  const [menu, setMenu] = useState(false);
  return (
    <div style={{
      background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
      borderRadius: 18, padding: "14px 16px", marginBottom: 12,
      boxShadow: dragging
        ? "0 18px 40px rgba(31,120,120,0.35), 0 0 0 2px " + TEAL
        : "0 6px 20px rgba(31,120,120,0.1)",
      border: dragHover ? "2px dashed " + TEAL : "1px solid rgba(200,228,228,0.5)",
      opacity: dragging ? 0.95 : 1,
      transform: dragging ? "scale(1.04) rotate(-0.5deg)" : "scale(1)",
      transition: dragging ? "none" : "transform 0.25s cubic-bezier(.2,.9,.3,1.2), box-shadow 0.2s",
      position: "relative" as any,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div
          onClick={(e) => { e.stopPropagation(); if (!dragging) onHeaderClick?.(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}
        >
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
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: DARK, letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: SUB, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>
          </div>
        </div>
        {onRemove && (
          <div style={{ position: "relative" as any, flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenu(m => !m); }}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
              aria-label="Menu widget"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8FA8A8">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
            {menu && (
              <>
                <div
                  onClick={(e) => { e.stopPropagation(); setMenu(false); }}
                  style={{ position: "fixed", inset: 0, zIndex: 998 }}
                />
                <div style={{
                  position: "absolute" as any, top: 36, right: 0, zIndex: 999,
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: 6,
                  minWidth: 150,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 0 0 1px rgba(200,228,228,0.6)",
                  overflow: "hidden",
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenu(false); onRemove(); }}
                    style={{
                      width: "100%", textAlign: "left" as any,
                      padding: "10px 12px", borderRadius: 8,
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 13, fontWeight: 700, color: "#DC4444",
                      fontFamily: "inherit",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/>
                    </svg>
                    Elimina widget
                  </button>
                </div>
              </>
            )}
          </div>
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

  const FIXED: string[] = [];
  const dynamicWidgets = widgets || DEFAULT_WIDGETS;

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
    if (tid && tid !== dragId && tid !== hoverId) {
      // Swap immediato (stile iOS): animazione fluida
      doReorder(dragId, tid);
      setHoverId(tid);
      if ("vibrate" in navigator) navigator.vibrate(10);
    }
    e.preventDefault();
  };

  const onTouchEnd = () => {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
    setDragId(null);
    setHoverId(null);
  };

  // Widget id → tab di destinazione al click sulla testata
  const WIDGET_TARGET: Record<string, string> = {
    oggi_devi_fare: "agenda",
    squadra: "team",
    produzione: "commesse",
    lavori_in_corso: "commesse",
    preventivi_scadenza: "commesse",
    preventivi_da_inviare: "commesse",
    rilievi_da_confermare: "commesse",
    commesse_ritardo: "commesse",
    prossime_consegne: "commesse",
    pipeline_commesse: "commesse",
    ordini_attesa: "ordini",
    ordini_settimana: "ordini",
    fatture_incassare: "contabilita",
    fatture_scadute: "contabilita",
    spese_mese: "contabilita",
    fatturato_mese: "contabilita",
    pagamenti_arrivo: "contabilita",
    margine_medio: "contabilita",
    clienti_insolventi: "contabilita",
    iva_versare: "contabilita",
    top_clienti: "contabilita",
    eventi_oggi: "agenda",
    prossimi_7gg: "agenda",
    scadenze_importanti: "agenda",
    appuntamenti_clienti: "agenda",
    sopralluoghi: "agenda",
    messaggi_non_letti: "messaggi",
    note_recenti: "messaggi",
    recensioni: "messaggi",
    contatti_recenti: "clienti",
    chi_libero: "team",
    montaggi_settimana: "team",
    task_team: "team",
    presenze_mese: "team",
    squadra_top: "team",
    stato_produzione: "commesse",
    materiali_arrivo: "ordini",
    scorte_basse: "ordini",
    commesse_bloccate: "commesse",
    conversione_preventivi: "commesse",
    tempo_medio_chiusura: "commesse",
    clienti_nuovi: "clienti",
    confronto_mese: "contabilita",
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
            onContextMenu={(e) => e.preventDefault()}
            style={{
              touchAction: dragId ? "none" : "pan-y",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              WebkitTapHighlightColor: "transparent",
            } as any}
          >
            <WidgetEB>
              <WCard
                title={meta.label}
                subtitle={meta.description}
                iconPath={meta.iconPath}
                onRemove={() => removeWidget(wid)}
                onHeaderClick={() => {
                  const tgt = WIDGET_TARGET[wid];
                  if (tgt) { ctx?.setTab?.(tgt); trackEvent?.("widget_header_click", wid); }
                }}
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
