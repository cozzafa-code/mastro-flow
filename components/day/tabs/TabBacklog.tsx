"use client";

import { useState, useMemo, useRef } from "react";
import { useBacklog, type BacklogItem, type BacklogOrigine } from "@/hooks/useBacklog";
import { BacklogQuickAdd } from "@/components/day/BacklogQuickAdd";

type Filtro = "tutto" | "mail" | "vocali" | "idee" | "roadmap";

const ORIGINE_ICON: Record<BacklogOrigine, JSX.Element> = {
  mail: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h20v16H2zM22 6l-10 7L2 6"/></svg>,
  vocale: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM5 12a7 7 0 0014 0M12 19v3"/></svg>,
  idea: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"/></svg>,
  roadmap: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h7l2 3h9v10H3z"/></svg>,
  evento_workflow: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  manuale: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
};

const ORIGINE_BG: Record<BacklogOrigine, string> = {
  mail: "linear-gradient(145deg, rgba(133,183,235,0.22), rgba(55,138,221,0.12))",
  vocale: "linear-gradient(145deg, rgba(250,199,117,0.22), rgba(239,159,39,0.12))",
  idea: "linear-gradient(145deg, rgba(175,169,236,0.22), rgba(127,119,221,0.12))",
  roadmap: "linear-gradient(145deg, rgba(93,202,165,0.22), rgba(29,158,117,0.12))",
  evento_workflow: "linear-gradient(145deg, rgba(40,160,160,0.22), rgba(30,128,128,0.12))",
  manuale: "linear-gradient(145deg, rgba(200,228,228,0.22), rgba(150,180,180,0.12))",
};

const ORIGINE_FG: Record<BacklogOrigine, string> = {
  mail: "#378ADD", vocale: "#EF9F27", idea: "#7F77DD",
  roadmap: "#1D9E75", evento_workflow: "#1E8080", manuale: "#5A7878",
};

function fmtRel(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h/24)}g fa`;
}

function FakeWaveform({ n = 24 }: { n?: number }) {
  const heights = useMemo(() => Array.from({ length: n }, () => 4 + Math.random() * 14), [n]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 2, height: h, borderRadius: 99,
          background: i < n / 3 ? "#EF9F27" : "rgba(239,159,39,0.35)",
        }} />
      ))}
    </div>
  );
}

// B19 · indicatore energia 1-4 puntini
function EnergiaDots({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const v = Math.max(1, Math.min(4, value));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4].map((n) => {
        const active = n <= v;
        return (
          <button key={n} type="button"
            onClick={(e) => { e.stopPropagation(); onChange?.(n); }}
            disabled={!onChange}
            aria-label={`Energia ${n}`}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              border: 0, padding: 0, cursor: onChange ? "pointer" : "default",
              background: active
                ? "linear-gradient(145deg, #FAC775, #EF9F27)"
                : "rgba(200,228,228,0.6)",
              boxShadow: active ? "0 1px 3px rgba(239,159,39,0.4)" : undefined,
            }}/>
        );
      })}
    </div>
  );
}

export function TabBacklog() {
  const { loading, items, counts, marcaVisto, pianificaQuick, setEnergia, setTags, promuoviATask, archivia, elimina, aggiungi } = useBacklog();
  const [filtro, setFiltro] = useState<Filtro>("tutto");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);

  // B17 · stato menu long-press
  const [menuItem, setMenuItem] = useState<BacklogItem | null>(null);

  const filteredItems = useMemo(() => {
    if (filtro === "tutto") return items;
    if (filtro === "mail") return items.filter((i) => i.origine === "mail");
    if (filtro === "vocali") return items.filter((i) => i.origine === "vocale");
    if (filtro === "idee") return items.filter((i) => i.origine === "idea");
    if (filtro === "roadmap") return items.filter((i) => i.origine === "roadmap");
    return items;
  }, [items, filtro]);

  const nuovi = filteredItems.filter((i) => !i.visto);
  const pianifica = filteredItems.filter((i) => i.visto && i.origine !== "idea" && i.origine !== "roadmap");
  const idee = filteredItems.filter((i) => i.visto && (i.origine === "idea" || i.origine === "roadmap"));

  const FILTRI: { v: Filtro; lbl: string; n: number }[] = [
    { v: "tutto", lbl: "Tutto", n: counts.tutto },
    { v: "mail", lbl: "Mail", n: counts.mail },
    { v: "vocali", lbl: "Vocali", n: counts.vocali },
    { v: "idee", lbl: "Idee", n: counts.idee },
    { v: "roadmap", lbl: "Roadmap", n: counts.roadmap },
  ];

  const handleOpen = (item: BacklogItem) => {
    setOpenItemId(item.id);
    if (!item.visto) marcaVisto(item.id);
  };

  const handleLongPress = (item: BacklogItem) => {
    setMenuItem(item);
    if (!item.visto) marcaVisto(item.id);
  };

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      display: "flex", flexDirection: "column",
      background: "#F4F6F5",
    }}>
      {/* B1 · Header viola */}
      <div style={{
        position: "relative",
        padding: "16px 18px 14px",
        color: "#fff",
        background: "linear-gradient(135deg, #B5B0EE 0%, #7F77DD 50%, #6961CB 100%)",
        boxShadow: "0 4px 14px rgba(127,119,221,0.25)",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)",
          pointerEvents: "none",
        }}/>

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9 }}>
              Backlog
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginTop: 2, textShadow: "0 2px 5px rgba(0,0,0,0.18)" }}>
              {counts.tutto} {counts.tutto === 1 ? "cosa" : "cose"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.92, marginTop: 2 }}>
              {counts.nuovi} nuovi · {counts.pianifica} da pianificare
            </div>
          </div>

          <button type="button" aria-label="Aggiungi item"
            style={{
              width: 38, height: 38, borderRadius: 12, border: 0, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.22)", backdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              color: "#fff",
            }}
            onClick={() => setOpenAdd(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        <div style={{
          position: "relative", marginTop: 14,
          display: "flex", gap: 6, overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {FILTRI.map((f) => {
            const active = filtro === f.v;
            return (
              <button key={f.v} type="button" onClick={() => setFiltro(f.v)}
                style={{
                  flexShrink: 0,
                  padding: "6px 11px", borderRadius: 99, border: 0, cursor: "pointer",
                  background: active ? "#fff" : "rgba(255,255,255,0.18)",
                  color: active ? "#3C3489" : "#fff",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 900, letterSpacing: 0.2,
                  boxShadow: active ? "0 4px 12px rgba(0,0,0,0.15)" : "inset 0 1px 1px rgba(255,255,255,0.2)",
                  fontFamily: "inherit",
                  backdropFilter: active ? undefined : "blur(10px)",
                }}>
                <span>{f.lbl}</span>
                <span style={{
                  padding: "1px 6px", borderRadius: 99,
                  fontSize: 9, fontWeight: 900,
                  background: active ? "rgba(127,119,221,0.18)" : "rgba(255,255,255,0.22)",
                  color: active ? "#3C3489" : "#fff",
                }}>{f.n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* B9 · NUOVI */}
        {nuovi.length > 0 && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              marginBottom: 8, padding: "0 2px",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "linear-gradient(145deg, #FF6464, #DC4444)",
                boxShadow: "0 0 8px rgba(220,68,68,0.7)",
                animation: "blkBlink 2s ease-in-out infinite",
              }}/>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>
                NUOVI
              </div>
              <div style={{
                marginLeft: 6, padding: "2px 8px", borderRadius: 99,
                background: "linear-gradient(145deg, #FF6464, #DC4444)",
                color: "#fff", fontSize: 10, fontWeight: 900,
                boxShadow: "0 2px 6px rgba(220,68,68,0.4)",
              }}>{nuovi.length}</div>
            </div>
            <style>{`@keyframes blkBlink { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nuovi.map((it) => (
                <BacklogCard key={it.id} item={it}
                  isNuovo
                  expanded={openItemId === it.id}
                  onTap={() => handleOpen(it)}
                  onLongPress={() => handleLongPress(it)}
                  onSetEnergia={(v) => setEnergia(it.id, v)}
                />
              ))}
            </div>
          </div>
        )}

        {/* B16 · PIANIFICA · sezione completa */}
        {pianifica.length > 0 && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              marginBottom: 8, padding: "0 2px",
              fontSize: 12, fontWeight: 900, color: "#3C3489", letterSpacing: 0.2, textTransform: "uppercase",
            }}>
              <div style={{ width: 3, height: 13, borderRadius: 2, background: "linear-gradient(180deg, #B5B0EE, #7F77DD)" }}/>
              Pianifica · {pianifica.length}
              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "#7F77DD", letterSpacing: 0.5, textTransform: "none" }}>
                tieni premuto per opzioni
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pianifica.map((it) => (
                <BacklogCard key={it.id} item={it}
                  expanded={openItemId === it.id}
                  onTap={() => handleOpen(it)}
                  onLongPress={() => handleLongPress(it)}
                  onSetEnergia={(v) => setEnergia(it.id, v)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{
            padding: 28, textAlign: "center", borderRadius: 14,
            background: "rgba(255,255,255,0.7)",
            border: "1px dashed rgba(127,119,221,0.3)",
            marginTop: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#5A7878" }}>Backlog vuoto</div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: "#8FA8A8" }}>
              Mail, vocali ed eventi non visti finiscono qui
            </div>
          </div>
        )}

        {loading && (
          <div style={{
            padding: 24, textAlign: "center", borderRadius: 14,
            fontSize: 12, fontWeight: 700, color: "#5A7878",
            background: "rgba(255,255,255,0.6)",
          }}>Caricamento backlog...</div>
        )}
      </div>

      {/* B22 · Modal aggiungi idea/roadmap */}
      <BacklogQuickAdd
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreate={async (input) => aggiungi(input)}
      />

      {/* B17 · MENU long-press · bottom sheet */}
      {menuItem && (
        <div onClick={() => setMenuItem(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 10005,
            background: "rgba(13,31,31,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 460,
              background: "#F4F6F5",
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              padding: "10px 16px 22px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
              animation: "menuUp 0.22s cubic-bezier(.2,.8,.2,1)",
            }}>
            <style>{`@keyframes menuUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

            <div style={{ margin: "0 auto 12px", height: 4, width: 40, background: "#C8E4E4", borderRadius: 99 }}/>

            <div style={{
              padding: "4px 4px 14px",
              borderBottom: "1px solid rgba(200,228,228,0.5)",
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{menuItem.titolo}</div>
              <div style={{
                marginTop: 4, fontSize: 9.5, fontWeight: 700,
                color: ORIGINE_FG[menuItem.origine], letterSpacing: 0.4, textTransform: "uppercase",
              }}>{menuItem.origine.replace("_", " ")}</div>
            </div>

            {/* Energia */}
            <div style={{
              padding: "10px 12px", borderRadius: 11,
              background: "#fff", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid rgba(200,228,228,0.5)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#5A7878", letterSpacing: 0.3, textTransform: "uppercase" }}>
                Energia stimata
              </div>
              <EnergiaDots value={menuItem.energia_stimata ?? 2}
                onChange={(v) => { setEnergia(menuItem.id, v); setMenuItem({ ...menuItem, energia_stimata: v }); }}/>
            </div>

            {/* Pianifica */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 8 }}>
              <MenuButton
                label="Oggi" tone="viola"
                ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>}
                onClick={async () => { await pianificaQuick(menuItem.id, "oggi"); setMenuItem(null); }}
              />
              <MenuButton
                label="Domani" tone="viola"
                ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>}
                onClick={async () => { await pianificaQuick(menuItem.id, "domani"); setMenuItem(null); }}
              />
              <MenuButton
                label="Settimana" tone="viola"
                ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
                onClick={async () => { await pianificaQuick(menuItem.id, "settimana"); setMenuItem(null); }}
              />
            </div>

            {/* Archivia */}
            <button type="button"
              onClick={async () => { await archivia(menuItem.id); setMenuItem(null); }}
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 11, border: 0, cursor: "pointer",
                background: "#fff", color: "#5A7878",
                fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
                marginBottom: 6,
                fontFamily: "inherit",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
              Archivia
            </button>

            {/* Elimina */}
            <button type="button"
              onClick={async () => {
                if (confirm(`Elimino "${menuItem.titolo}"?`)) {
                  await elimina(menuItem.id);
                  setMenuItem(null);
                }
              }}
              style={{
                width: "100%", padding: "11px 14px",
                borderRadius: 11, border: 0, cursor: "pointer",
                background: "rgba(220,68,68,0.08)", color: "#B91C1C",
                fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "inset 0 0 0 1px rgba(220,68,68,0.2)",
                fontFamily: "inherit",
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ label, ico, onClick, tone }: {
  label: string; ico: JSX.Element; onClick: () => void; tone: "viola";
}) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: "12px 6px", borderRadius: 11, border: 0, cursor: "pointer",
        background: "linear-gradient(145deg, #B5B0EE, #7F77DD)",
        color: "#fff",
        fontSize: 11, fontWeight: 900, letterSpacing: 0.2,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        boxShadow: "0 4px 12px rgba(127,119,221,0.4), inset 0 -2px 0 rgba(0,0,0,0.08)",
        fontFamily: "inherit",
      }}>
      {ico}
      <span>{label}</span>
    </button>
  );
}

function BacklogCard({
  item, isNuovo = false, expanded = false, onTap, onLongPress, onSetEnergia,
}: {
  item: BacklogItem;
  isNuovo?: boolean;
  expanded?: boolean;
  onTap: () => void;
  onLongPress?: () => void;
  onSetEnergia?: (v: number) => void;
}) {
  const ico = ORIGINE_ICON[item.origine];
  const bg = ORIGINE_BG[item.origine];
  const fg = ORIGINE_FG[item.origine];

  // long press logic
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef<boolean>(false);

  const startPress = () => {
    fired.current = false;
    pressTimer.current = setTimeout(() => {
      fired.current = true;
      onLongPress?.();
    }, 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };
  const handleClick = () => {
    if (fired.current) return; // long-press ha gia' agito
    onTap();
  };

  // B14 · card mail
  if (item.origine === "mail") {
    const mittente = (item.payload?.mittente as string) ?? "Mittente sconosciuto";
    return (
      <button type="button"
        onClick={handleClick}
        onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
        onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
        onContextMenu={(e) => { e.preventDefault(); onLongPress?.(); }}
        style={{
          position: "relative",
          width: "100%", padding: "11px 12px",
          background: "#fff", borderRadius: 13, border: 0, cursor: "pointer",
          textAlign: "left",
          boxShadow: isNuovo
            ? "0 3px 10px rgba(220,68,68,0.12), inset 0 0 0 1px rgba(220,68,68,0.18)"
            : "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
          fontFamily: "inherit",
          userSelect: "none",
        }}>
        {isNuovo && (
          <div style={{
            position: "absolute", top: 14, right: 12,
            width: 8, height: 8, borderRadius: "50%",
            background: "linear-gradient(145deg, #FF6464, #DC4444)",
            boxShadow: "0 0 6px rgba(220,68,68,0.7)",
          }}/>
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: bg, color: fg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>{ico}</div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: isNuovo ? 16 : 0 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{item.titolo}</div>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: fg, letterSpacing: 0.1, marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{mittente} · {fmtRel(item.created_at)}</div>
            {item.descrizione && (
              <div style={{
                marginTop: 4, fontSize: 10.5, fontWeight: 600, color: "#5A7878",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: expanded ? 6 : 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>{item.descrizione}</div>
            )}
            {/* B19 · energia in card */}
            {!isNuovo && (
              <div style={{ marginTop: 6 }}>
                <EnergiaDots value={item.energia_stimata ?? 2} onChange={onSetEnergia}/>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  // B15 · card vocale
  if (item.origine === "vocale") {
    const durata = (item.payload?.durata as string) ?? item.titolo.match(/(\d+:\d+)/)?.[1] ?? "0:00";
    return (
      <button type="button"
        onClick={handleClick}
        onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
        onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
        onContextMenu={(e) => { e.preventDefault(); onLongPress?.(); }}
        style={{
          position: "relative",
          width: "100%", padding: "11px 12px",
          background: "#fff", borderRadius: 13, border: 0, cursor: "pointer",
          textAlign: "left",
          boxShadow: isNuovo
            ? "0 3px 10px rgba(220,68,68,0.12), inset 0 0 0 1px rgba(220,68,68,0.18)"
            : "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
          fontFamily: "inherit",
          userSelect: "none",
        }}>
        {isNuovo && (
          <div style={{
            position: "absolute", top: 14, right: 12,
            width: 8, height: 8, borderRadius: "50%",
            background: "linear-gradient(145deg, #FF6464, #DC4444)",
            boxShadow: "0 0 6px rgba(220,68,68,0.7)",
          }}/>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(145deg, #FAC775, #EF9F27)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 3px 8px rgba(239,159,39,0.4)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>
              {item.titolo}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
              <FakeWaveform n={20} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#EF9F27", letterSpacing: 0.3 }}>
                {durata}
              </span>
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#854F0B", letterSpacing: 0.2 }}>{fmtRel(item.created_at)}</span>
              {!isNuovo && <EnergiaDots value={item.energia_stimata ?? 2} onChange={onSetEnergia}/>}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // generica
  return (
    <button type="button"
      onClick={handleClick}
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(); }}
      style={{
        position: "relative",
        width: "100%", padding: "11px 12px",
        background: "#fff", borderRadius: 13, border: 0, cursor: "pointer",
        textAlign: "left",
        boxShadow: isNuovo
          ? "0 3px 10px rgba(220,68,68,0.12), inset 0 0 0 1px rgba(220,68,68,0.18)"
          : "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
        fontFamily: "inherit",
        userSelect: "none",
      }}>
      {isNuovo && (
        <div style={{
          position: "absolute", top: 14, right: 12,
          width: 8, height: 8, borderRadius: "50%",
          background: "linear-gradient(145deg, #FF6464, #DC4444)",
          boxShadow: "0 0 6px rgba(220,68,68,0.7)",
        }}/>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: bg, color: fg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>{ico}</div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: isNuovo ? 16 : 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>
            {item.titolo}
          </div>
          {item.descrizione && (
            <div style={{
              marginTop: 3, fontSize: 10.5, fontWeight: 600, color: "#5A7878", lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: expanded ? 6 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>{item.descrizione}</div>
          )}
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: fg, letterSpacing: 0.3, textTransform: "uppercase" }}>
              {item.origine.replace("_", " ")} · {fmtRel(item.created_at)}
            </span>
            {!isNuovo && <EnergiaDots value={item.energia_stimata ?? 2} onChange={onSetEnergia}/>}
          </div>
        </div>
      </div>
    </button>
  );
}


function IdeaCard({
  item, onTap, onLongPress, onPromuovi, onSetTags,
}: {
  item: BacklogItem;
  onTap: () => void;
  onLongPress: () => void;
  onPromuovi: () => Promise<void>;
  onSetTags: (tags: string[]) => Promise<void> | void;
}) {
  const tags = item.tags ?? [];
  const isRoadmap = item.origine === "roadmap";
  const accent = isRoadmap ? "#1D9E75" : "#7F77DD";

  // long-press
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef<boolean>(false);
  const startPress = () => {
    fired.current = false;
    pressTimer.current = setTimeout(() => { fired.current = true; onLongPress(); }, 500);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const handleClick = () => { if (!fired.current) onTap(); };

  return (
    <div
      onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
      onTouchStart={startPress} onTouchEnd={cancelPress} onTouchCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(); }}
      onClick={handleClick}
      style={{
        position: "relative",
        padding: "12px 13px",
        background: "#fff", borderRadius: 13, cursor: "pointer",
        boxShadow: `0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px ${accent}33`,
        borderLeft: `3px solid ${accent}`,
        userSelect: "none",
      }}>

      <div style={{
        position: "absolute", top: 10, right: 10,
        padding: "2px 7px", borderRadius: 4,
        background: isRoadmap ? "rgba(29,158,117,0.14)" : "rgba(127,119,221,0.14)",
        color: accent,
        fontSize: 8.5, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase",
      }}>
        {isRoadmap ? "Roadmap" : "Idea"}
      </div>

      <div style={{
        fontSize: 12, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1,
        paddingRight: 60,
      }}>
        {item.titolo}
      </div>

      {item.descrizione && (
        <div style={{
          marginTop: 4, fontSize: 10.5, fontWeight: 600, color: "#5A7878", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{item.descrizione}</div>
      )}

      {tags.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tags.map((t) => (
            <span key={t} style={{
              padding: "2px 7px", borderRadius: 4,
              background: `${accent}18`, color: accent,
              fontSize: 9.5, fontWeight: 900, letterSpacing: 0.2,
            }}>#{t}</span>
          ))}
        </div>
      )}

      <button type="button"
        onClick={(e) => { e.stopPropagation(); onPromuovi(); }}
        style={{
          marginTop: 10,
          padding: "6px 10px", borderRadius: 8, border: 0, cursor: "pointer",
          background: `${accent}14`,
          color: accent,
          fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: `inset 0 0 0 1px ${accent}33`,
          fontFamily: "inherit",
        }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        Promuovi a task
      </button>
    </div>
  );
}
