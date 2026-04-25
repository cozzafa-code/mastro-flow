"use client";

/**
 * MASTRO DAY · Focus ambient
 *
 * Catena eventi:
 *   1. Bottone 🎯 Focus su card task ORA dispatcha "mastro:focus_start"
 *      detail: { task_id, titolo, durata_min: 25 (default) }
 *   2. DayFocus mostra picker durata 25/50/90 (D60)
 *   3. Conferma · setIsFocus(true) · barra ambra fissa in alto (D61)
 *   4. Notification.requestPermission · resta silente (D62)
 *   5. Tap sulla barra · dispatcha "mastro:open_day" · DayProvider apre sheet (D63)
 *   6. Stop · logga evento focus_completato con durata effettiva (D64)
 *      Trigger SQL aggiorna stat day_deep_minuti_oggi (D65)
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const DURATE = [25, 50, 90];

interface FocusStartDetail {
  task_id: string | null;
  titolo: string;
  durata_min?: number;
  cm_id?: string | null;
}

interface ActiveFocus {
  task_id: string | null;
  titolo: string;
  durata_min: number;
  started_at: number; // Date.now ms
  cm_id?: string | null;
}

const STORAGE_KEY = "mastro_active_focus";

function fmtTime(ms: number): string {
  const tot = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(tot / 60);
  const s = tot % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DayFocus() {
  // Picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDetail, setPendingDetail] = useState<FocusStartDetail | null>(null);
  const [chosenDur, setChosenDur] = useState<number>(25);

  // Sessione attiva
  const [active, setActive] = useState<ActiveFocus | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carico sessione persistente al mount (es. refresh pagina)
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) {
        const parsed: ActiveFocus = JSON.parse(raw);
        const elapsed = (Date.now() - parsed.started_at) / 60000;
        // se la sessione e' ancora valida (non scaduta da > 60min)
        if (elapsed < parsed.durata_min + 60) {
          setActive(parsed);
        } else {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {}
  }, []);

  // Tick countdown
  useEffect(() => {
    if (!active) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [active]);

  // ============ D59 · listener mastro:focus_start ============
  useEffect(() => {
    const onStart = (e: any) => {
      if (active) return; // gia' in sessione, ignoro
      const d: FocusStartDetail = e?.detail ?? {};
      if (!d.titolo) return;
      setPendingDetail(d);
      setChosenDur(d.durata_min ?? 25);
      setPickerOpen(true);
    };
    window.addEventListener("mastro:focus_start", onStart);
    return () => window.removeEventListener("mastro:focus_start", onStart);
  }, [active]);

  // ============ D62 · richiedi permesso notifiche e bloccale durante sessione ============
  const requestNotifPermission = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch {}
  }, []);

  // Conferma picker · avvio sessione
  const confirmStart = useCallback(() => {
    if (!pendingDetail) return;
    const session: ActiveFocus = {
      task_id: pendingDetail.task_id ?? null,
      titolo: pendingDetail.titolo,
      durata_min: chosenDur,
      started_at: Date.now(),
      cm_id: pendingDetail.cm_id ?? null,
    };
    setActive(session);
    setPickerOpen(false);
    setPendingDetail(null);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
    requestNotifPermission();
  }, [pendingDetail, chosenDur, requestNotifPermission]);

  // Stop sessione
  const stop = useCallback(async (auto = false) => {
    if (!active) return;
    const durSec = Math.floor((Date.now() - active.started_at) / 1000);

    // ============ D64 + D65 · log evento focus_completato ============
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (user) {
        const opRes = await supabase
          .from("operatori")
          .select("azienda_id")
          .eq("user_id", user.id)
          .maybeSingle();
        const azienda_id = opRes.data?.azienda_id;
        if (azienda_id) {
          await supabase.from("day_eventi").insert({
            azienda_id,
            user_id: user.id,
            tipo: "focus_completato",
            modulo_origine: "ops",
            direzione: "uscita",
            cm_id: active.cm_id ?? null,
            task_id: active.task_id ?? null,
            payload: {
              durata_richiesta_min: active.durata_min,
              durata_effettiva_sec: durSec,
              auto: auto,
            },
            durata_sec: durSec,
            titolo_breve: `Focus ${Math.round(durSec / 60)} min · ${active.titolo}`,
          });
        }
      }
    } catch (e) {
      console.warn("[DayFocus] log focus_completato fallito", e);
    }

    setActive(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    // notifica fine focus
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("MASTRO Focus completato", {
          body: `${Math.round(durSec / 60)} min di deep work · ${active.titolo}`,
          icon: "/icon-192.png",
          silent: false,
        });
      }
    } catch {}
  }, [active]);

  // Auto-stop allo scadere
  useEffect(() => {
    if (!active) return;
    const elapsedMin = (now - active.started_at) / 60000;
    if (elapsedMin >= active.durata_min) {
      stop(true);
    }
  }, [now, active, stop]);

  // ============ D63 · Tap barra riapre Day ============
  const reopenDay = () => {
    window.dispatchEvent(new CustomEvent("mastro:open_day"));
  };

  // ============ RENDER ============
  return (
    <>
      {/* PICKER MODAL · D60 */}
      {pickerOpen && pendingDetail && (
        <div
          onClick={() => setPickerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 10010,
            background: "rgba(13,31,31,0.6)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 380,
              background: "#F4F6F5",
              borderRadius: 22,
              padding: "20px 18px 18px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fcpop 0.25s cubic-bezier(.2,.8,.2,1)",
            }}>
            <style>{`@keyframes fcpop { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: "linear-gradient(145deg, #FAC775, #EF9F27)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(239,159,39,0.4)",
                color: "#fff",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>
                  Focus mode
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#5A7878",
                  marginTop: 2, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {pendingDetail.titolo}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 8 }}>
              Quanto deep work?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {DURATE.map((d) => {
                const active = chosenDur === d;
                return (
                  <button key={d} type="button" onClick={() => setChosenDur(d)}
                    style={{
                      padding: "14px 8px", borderRadius: 13, border: 0, cursor: "pointer",
                      background: active
                        ? "linear-gradient(145deg, #FAC775, #EF9F27)"
                        : "#fff",
                      color: active ? "#fff" : "#854F0B",
                      boxShadow: active
                        ? "0 6px 16px rgba(239,159,39,0.4), inset 0 -3px 0 rgba(0,0,0,0.08)"
                        : "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
                      fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}>
                    <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{d}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>min</span>
                  </button>
                );
              })}
            </div>

            <div style={{
              marginBottom: 14, padding: "9px 12px", borderRadius: 11,
              background: "rgba(239,159,39,0.10)",
              border: "1px dashed rgba(239,159,39,0.3)",
              fontSize: 10.5, fontWeight: 700, color: "#854F0B",
              display: "flex", alignItems: "flex-start", gap: 7,
              lineHeight: 1.4,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <span>Le notifiche browser saranno silenziate. La barra in alto resta visibile in tutto MASTRO.</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
              <button type="button" onClick={() => setPickerOpen(false)}
                style={{
                  padding: "13px 8px", borderRadius: 13, border: 0, cursor: "pointer",
                  fontSize: 13, fontWeight: 900, color: "#5A7878",
                  background: "#fff",
                  boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
                  fontFamily: "inherit",
                }}>Annulla</button>
              <button type="button" onClick={confirmStart}
                style={{
                  padding: "13px 8px", borderRadius: 13, border: 0, cursor: "pointer",
                  fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: 0.3,
                  background: "linear-gradient(145deg, #FAC775, #EF9F27)",
                  boxShadow: "0 6px 16px rgba(239,159,39,0.4), inset 0 -3px 0 rgba(0,0,0,0.08)",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Inizia Focus · {chosenDur} min
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA FISSA AMBIENT · D61 + D63 */}
      {active && (
        <div
          onClick={reopenDay}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000,
            padding: "8px 14px",
            background: "linear-gradient(135deg, #FAC775 0%, #EF9F27 50%, #C97F0E 100%)",
            color: "#fff",
            display: "flex", alignItems: "center", gap: 10,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(239,159,39,0.4)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: "rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 900, letterSpacing: -0.1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}>
              Focus · {active.titolo}
            </div>
            <div style={{
              fontSize: 9.5, fontWeight: 700, opacity: 0.9, letterSpacing: 0.2,
              marginTop: 1,
            }}>
              {fmtTime(active.durata_min * 60_000 - (now - active.started_at))} rimanenti · sessione {active.durata_min}min
            </div>
          </div>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); stop(false); }}
            style={{
              padding: "5px 12px", borderRadius: 8, border: 0, cursor: "pointer",
              background: "rgba(0,0,0,0.20)", color: "#fff",
              fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3,
              fontFamily: "inherit",
              flexShrink: 0,
            }}>
            stop
          </button>
        </div>
      )}
    </>
  );
}
