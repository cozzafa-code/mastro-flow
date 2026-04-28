// components/mobile/team/TeamPlanningMobile.tsx
// FASE 5A - Vista calendario settimanale: operatori x giorni con blocchi montaggi
"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import type { Operator } from "@/lib/types/team";
import {
  listaMontaggiFinestra, pianificaMontaggio,
  type MontaggioPianificato, type CommessaPerAvvio,
  listaCommesseAttive,
} from "@/lib/team-actions";
import { TOKENS, MiniAppCard } from "@/components/widgets/MiniAppCard";
import {
  IconArrow, IconPlus, IconClose, IconFile, IconUser,
} from "@/components/widgets/shared/icons";

interface Props {
  operators: Operator[];
  onOpenCommessa?: (id: string) => void;
  onPlanned?: () => void;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=dom, 1=lun
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_LABEL = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function statoChip(stato: string | null, motivo_pausa: string | null) {
  if (motivo_pausa) return { bg: TOKENS.amber, fg: TOKENS.amberInk, label: "Pausa" };
  if (stato === "in_corso")   return { bg: TOKENS.mint, fg: TOKENS.mintInk, label: "In corso" };
  if (stato === "completato") return { bg: TOKENS.tealLight, fg: TOKENS.tealInk, label: "Completato" };
  if (stato === "programmato")return { bg: TOKENS.sky, fg: TOKENS.skyInk, label: "Programmato" };
  return { bg: TOKENS.hairlineSoft, fg: TOKENS.muted, label: stato || "—" };
}

export default function TeamPlanningMobile({ operators, onOpenCommessa, onPlanned }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [montaggi, setMontaggi] = useState<MontaggioPianificato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSheet, setShowSheet] = useState<{ op: Operator; date: string } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const da = fmtDate(days[0]);
  const a = fmtDate(days[6]);

  const fetchMontaggi = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const list = await listaMontaggiFinestra({ da, a });
      setMontaggi(list);
    } catch (e: any) {
      setError(e?.message || "Errore");
    } finally {
      setLoading(false);
    }
  }, [da, a]);

  useEffect(() => { fetchMontaggi(); }, [fetchMontaggi]);

  // Index montaggi per (operatore_id, giorno)
  const grid = useMemo(() => {
    const map: Record<string, MontaggioPianificato[]> = {};
    montaggi.forEach(m => {
      // Considera operatore singolo + tutti quelli in squadra
      const opIds = new Set<string>();
      if (m.operatore_id) opIds.add(m.operatore_id);
      (m.squadra || []).forEach(id => opIds.add(id));
      opIds.forEach(opId => {
        const key = `${opId}|${m.data_montaggio}`;
        if (!map[key]) map[key] = [];
        map[key].push(m);
      });
    });
    return map;
  }, [montaggi]);

  const today = new Date();

  const goPrev = () => setWeekStart(prev => addDays(prev, -7));
  const goNext = () => setWeekStart(prev => addDays(prev, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date()));

  const weekRange = `${days[0].getDate()} ${days[0].toLocaleDateString("it-IT", { month: "short" })} - ${days[6].getDate()} ${days[6].toLocaleDateString("it-IT", { month: "short" })}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header settimana */}
      <div style={{
        background: "#FFF", borderRadius: 16, padding: "10px 12px",
        border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <button onClick={goPrev} style={navBtn}>←</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, cursor: "pointer" }} onClick={goToday}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TOKENS.ink }}>{weekRange}</div>
          <div style={{ fontSize: 10, color: TOKENS.muted, marginTop: 2 }}>tap per oggi</div>
        </div>
        <button onClick={goNext} style={navBtn}>→</button>
      </div>

      {/* Grid scrollabile */}
      {loading && <div style={{ padding: 24, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>Caricamento pianificazione...</div>}
      {error && (
        <div style={{ background: TOKENS.red, color: TOKENS.redInk, padding: 14, borderRadius: 12, fontSize: 12 }}>
          Errore: {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{
          background: "#FFF", borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}>
          {/* Scrollable container */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
            <div style={{ minWidth: 700 }}>
              {/* HEADER giorni */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "120px repeat(7, 1fr)",
                background: TOKENS.hairlineSoft,
                borderBottom: `1px solid ${TOKENS.hairline}`,
              }}>
                <div style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.4 }}>OPERATORE</div>
                {days.map((d, i) => {
                  const isToday = isSameDay(d, today);
                  return (
                    <div key={i} style={{
                      padding: "10px 6px", textAlign: "center" as any,
                      borderLeft: `1px solid ${TOKENS.hairline}`,
                      background: isToday ? TOKENS.tealLight : "transparent",
                    }}>
                      <div style={{ fontSize: 10, color: isToday ? TOKENS.tealInk : TOKENS.muted, fontWeight: 600, letterSpacing: 0.3 }}>{DAY_LABEL[i]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? TOKENS.tealInk : TOKENS.ink, marginTop: 2 }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHE operatori */}
              {operators.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>Nessun operatore</div>
              )}
              {operators.map((op, opIdx) => (
                <div key={op.id} style={{
                  display: "grid",
                  gridTemplateColumns: "120px repeat(7, 1fr)",
                  borderBottom: opIdx === operators.length - 1 ? "none" : `1px solid ${TOKENS.hairline}`,
                  minHeight: 56,
                }}>
                  {/* Avatar + nome */}
                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, background: TOKENS.hairlineSoft }}>
                    <Avatar name={op.name} url={op.avatar_url} size={28} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{op.name}</div>
                  </div>
                  {days.map((d, i) => {
                    const dStr = fmtDate(d);
                    const cellMontaggi = grid[`${op.id}|${dStr}`] || [];
                    const isToday = isSameDay(d, today);
                    return (
                      <div key={i} style={{
                        borderLeft: `1px solid ${TOKENS.hairline}`,
                        padding: 4, minHeight: 56,
                        background: isToday ? "rgba(43,168,154,0.04)" : "transparent",
                        display: "flex", flexDirection: "column" as any, gap: 3,
                        position: "relative" as any,
                      }}>
                        {cellMontaggi.length === 0 ? (
                          <div onClick={() => setShowSheet({ op, date: dStr })} style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", borderRadius: 6,
                            color: "rgba(0,0,0,0.15)", fontSize: 18,
                          }}>+</div>
                        ) : cellMontaggi.map(m => {
                          const chip = statoChip(m.stato, m.motivo_pausa);
                          const inSquadra = m.operatore_id !== op.id;
                          return (
                            <div key={m.id}
                                 onClick={() => m.commessa_id && onOpenCommessa?.(m.commessa_id)}
                                 style={{
                                   background: chip.bg, borderRadius: 6,
                                   padding: "5px 6px",
                                   cursor: m.commessa_id ? "pointer" : "default",
                                   borderLeft: inSquadra ? `3px solid ${chip.fg}40` : `3px solid ${chip.fg}`,
                                 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: chip.fg, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                                {m.commessa_code || "—"}
                              </div>
                              <div style={{ fontSize: 9, color: chip.fg, opacity: 0.85, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                                {m.cliente || ""}{m.ora_inizio ? ` ${m.ora_inizio.slice(0,5)}` : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        background: "#FFF", borderRadius: 12, padding: "10px 12px",
        border: "1px solid rgba(0,0,0,0.04)",
        display: "flex", flexWrap: "wrap" as any, gap: 10, fontSize: 10, color: TOKENS.muted,
      }}>
        <Lg c={TOKENS.mintBar}  l="In corso" />
        <Lg c={TOKENS.amberBar} l="In pausa" />
        <Lg c={TOKENS.skyBar}   l="Programmato" />
        <Lg c={TOKENS.tealInk}  l="Completato" />
        <span style={{ marginLeft: "auto" as any, fontSize: 10 }}>tap su cella vuota per pianificare</span>
      </div>

      {showSheet && (
        <PianificaSheet
          op={showSheet.op}
          date={showSheet.date}
          onClose={() => setShowSheet(null)}
          onPlanned={() => {
            setShowSheet(null);
            fetchMontaggi();
            onPlanned?.();
          }}
        />
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, border: "none",
  background: TOKENS.hairlineSoft, color: TOKENS.ink, cursor: "pointer",
  fontSize: 16, fontWeight: 700, fontFamily: "inherit",
};

function Avatar({ name, url, size = 28 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{init}</div>;
}

function Lg({ c, l }: { c: string; l: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
    </span>
  );
}

// ====== Sheet pianificazione ======
function PianificaSheet({ op, date, onClose, onPlanned }: {
  op: Operator;
  date: string;
  onClose: () => void;
  onPlanned: () => void;
}) {
  const [commesse, setCommesse] = useState<CommessaPerAvvio[]>([]);
  const [search, setSearch] = useState("");
  const [oraInizio, setOraInizio] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listaCommesseAttive().then(list => { if (alive) setCommesse(list); }).catch(e => alive && setError(e?.message || "errore"));
    return () => { alive = false; };
  }, []);

  const filtered = commesse.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.code || "").toLowerCase().includes(s) ||
           (c.cliente || "").toLowerCase().includes(s) ||
           (c.cognome || "").toLowerCase().includes(s) ||
           (c.indirizzo || "").toLowerCase().includes(s);
  });

  const handleSelect = async (c: CommessaPerAvvio) => {
    try {
      setBusy(true);
      await pianificaMontaggio({
        operatore_id: op.id,
        commessa_id: c.id,
        data_montaggio: date,
        ora_inizio: oraInizio,
        squadra: [op.id],
      });
      onPlanned();
    } catch (e: any) {
      setError(e?.message || "errore");
    } finally {
      setBusy(false);
    }
  };

  const dataLabel = new Date(date + "T00:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#F4F1EA", width: "100%", maxWidth: 480,
        maxHeight: "85vh", overflowY: "auto",
        borderRadius: "20px 20px 0 0",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)",
          padding: "16px 18px", color: "#FFF",
          display: "flex", alignItems: "center", gap: 12,
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Pianifica montaggio</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, textTransform: "capitalize" as any }}>{op.name} · {dataLabel}</div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <IconClose size={20} color="#FFF" />
          </div>
        </div>

        <div style={{ padding: 14 }}>
          {/* Ora inizio */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: TOKENS.muted, marginBottom: 6, paddingLeft: 4, fontWeight: 600 }}>ORA INIZIO</div>
            <input type="time" value={oraInizio} onChange={e => setOraInizio(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 12, border: `1px solid ${TOKENS.hairline}`,
                background: "#FFF", fontSize: 14, fontFamily: "inherit",
                outline: "none", boxSizing: "border-box" as any,
              }} />
          </div>

          <div style={{ fontSize: 11, color: TOKENS.muted, marginBottom: 6, paddingLeft: 4, fontWeight: 600 }}>SCEGLI COMMESSA</div>
          <input type="text" placeholder="Cerca codice / cliente / indirizzo..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: 12, border: `1px solid ${TOKENS.hairline}`,
              background: "#FFF", fontSize: 13, fontFamily: "inherit",
              outline: "none", marginBottom: 10, boxSizing: "border-box" as any,
            }} />

          {error && <div style={{ padding: 10, background: TOKENS.red, color: TOKENS.redInk, borderRadius: 10, fontSize: 12, marginBottom: 10 }}>{error}</div>}

          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center" as any, color: TOKENS.muted, fontSize: 13 }}>
              {commesse.length === 0 ? "Caricamento..." : "Nessun risultato"}
            </div>
          )}

          {filtered.map(c => (
            <div key={c.id} onClick={() => !busy && handleSelect(c)} style={{
              background: "#FFF", borderRadius: 14, padding: 12,
              marginBottom: 8, cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
              border: `1px solid ${TOKENS.hairline}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconFile size={14} color={TOKENS.teal} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink }}>
                  {c.code || "—"} {c.cliente && `· ${c.cliente}${c.cognome ? " " + c.cognome : ""}`}
                </div>
                {c.indirizzo && (
                  <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                    {c.indirizzo}
                  </div>
                )}
              </div>
              {c.fase && (
                <div style={{
                  fontSize: 9, fontWeight: 700,
                  background: TOKENS.tealLight, color: TOKENS.tealInk,
                  padding: "3px 7px", borderRadius: 6,
                  textTransform: "uppercase" as any, letterSpacing: 0.3, flexShrink: 0,
                }}>{c.fase}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
