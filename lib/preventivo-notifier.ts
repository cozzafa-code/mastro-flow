"use client";

/* ════════════════════════════════════════════════════════════
   MASTRO · Preventivo Notifier v5
   - Polling 20s su risposte cliente
   - Quando arriva risposta accettato: AVANZA FASE auto
   - Suono + browser notification + email
   - Messaggi action-oriented ("Manda conferma d'ordine" vs "ha accettato")
   ════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from "react";

export interface PreventivoNotifyItem {
  token: string;
  cm_id: string;
  cm_code: string;
  snapshot: any;
  risposta: "accettato" | "modifiche" | "chiamare";
  risposta_nota: string | null;
  risposta_at: string;
  visualizzato_at: string | null;
  letture_count: number;
  notify_titolare_inviata: boolean;
}

interface UseNotifierOptions {
  azienda_id: string | null | undefined;
  pollIntervalMs?: number;
  enableSound?: boolean;
  enableBrowserNotif?: boolean;
  enableEmail?: boolean;
  email?: string;
  onNuovaRisposta?: (item: PreventivoNotifyItem) => void;
  onAccettato?: (item: PreventivoNotifyItem) => void;  // callback quando arriva ACCETTATO
  onModifiche?: (item: PreventivoNotifyItem) => void;  // v18: cliente chiede modifiche
  onChiamare?: (item: PreventivoNotifyItem) => void;   // v18: cliente vuole essere contattato
}

function playDing() {
  try {
    const AudioCtx: typeof AudioContext =
      (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) as any;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.13);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    setTimeout(() => { try { ctx.close(); } catch {} }, 800);
  } catch {}
}

function vibrate() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 60, 100, 60, 200]);
    }
  } catch {}
}

async function showBrowserNotification(item: PreventivoNotifyItem) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const cliente = item.snapshot?.cliente || "Cliente";
    const titles: Record<string, string> = {
      accettato: "✓ Preventivo accettato — Manda conferma d'ordine",
      modifiche: "⚠ Cliente chiede modifiche al preventivo",
      chiamare: "📞 Cliente chiede di essere chiamato",
    };
    const n = new Notification(titles[item.risposta] || "Risposta cliente", {
      body: `${cliente} · ${item.cm_code}${item.risposta_nota ? "\n\"" + item.risposta_nota.slice(0, 100) + "\"" : ""}`,
      icon: "/icon-192.png",
      tag: `preventivo-${item.token}`,
      requireInteraction: item.risposta === "accettato",
    });
    n.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent("mastro:open-cm", { detail: { cm_id: item.cm_id } }));
      n.close();
    };
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const p = await Notification.requestPermission();
    return p === "granted";
  } catch {
    return false;
  }
}

export function usePreventivoNotifier(opts: UseNotifierOptions) {
  const {
    azienda_id,
    pollIntervalMs = 20000,
    enableSound = true,
    enableBrowserNotif = true,
    enableEmail = true,
    email,
    onNuovaRisposta,
    onAccettato,
    onModifiche,
    onChiamare,
  } = opts;

  const [pending, setPending] = useState<PreventivoNotifyItem[]>([]);
  const [latest, setLatest] = useState<PreventivoNotifyItem | null>(null);
  const seenTokens = useRef<Set<string>>(new Set());
  const initialDone = useRef(false);

  const ack = useCallback(async (token: string) => {
    try {
      await fetch("/api/preventivo-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ack_titolare: true }),
      });
      setPending((prev) => prev.filter((p) => p.token !== token));
      if (latest?.token === token) setLatest(null);
    } catch {}
  }, [latest]);

  const ackAll = useCallback(async () => {
    const tokens = pending.map((p) => p.token);
    await Promise.all(tokens.map((t) =>
      fetch("/api/preventivo-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, ack_titolare: true }),
      }).catch(() => {})
    ));
    setPending([]);
    setLatest(null);
  }, [pending]);

  useEffect(() => {
    if (!azienda_id) return;
    let alive = true;

    const poll = async () => {
      try {
        const r = await fetch(`/api/preventivo-link?unread=1&azienda_id=${encodeURIComponent(azienda_id)}`);
        if (!r.ok) return;
        const d = await r.json();
        const items: PreventivoNotifyItem[] = d.items || [];
        if (!alive) return;

        if (!initialDone.current) {
          items.forEach((it) => seenTokens.current.add(it.token));
          setPending(items);
          initialDone.current = true;
          return;
        }

        const nuovi = items.filter((it) => !seenTokens.current.has(it.token));

        if (nuovi.length > 0) {
          nuovi.forEach((it) => seenTokens.current.add(it.token));
          setPending(items);
          const top = nuovi[0];
          setLatest(top);

          if (enableSound) {
            playDing();
            vibrate();
          }
          if (enableBrowserNotif) {
            for (const n of nuovi) await showBrowserNotification(n);
          }
          if (enableEmail && email) {
            for (const n of nuovi) {
              fetch("/api/notify-conferma-cliente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  cm_code: n.cm_code,
                  cliente: n.snapshot?.cliente,
                  risposta: n.risposta,
                  risposta_nota: n.risposta_nota,
                  link_titolare: typeof window !== "undefined" ? window.location.origin + "/dashboard?cm=" + n.cm_id : "",
                }),
              }).catch(() => {});
            }
          }

          if (onNuovaRisposta) for (const n of nuovi) onNuovaRisposta(n);

          // Auto-advance fase quando ACCETTATO
          if (onAccettato) {
            for (const n of nuovi) {
              if (n.risposta === "accettato") onAccettato(n);
            }
          }
          // v18: callback per MODIFICHE
          if (onModifiche) {
            for (const n of nuovi) {
              if (n.risposta === "modifiche") onModifiche(n);
            }
          }
          // v18: callback per CHIAMARE
          if (onChiamare) {
            for (const n of nuovi) {
              if (n.risposta === "chiamare") onChiamare(n);
            }
          }

          for (const n of nuovi) {
            try {
              window.dispatchEvent(new CustomEvent("mastro:nuova-risposta-cliente", { detail: n }));
              if (n.risposta === "accettato") {
                window.dispatchEvent(new CustomEvent("mastro:cliente-ha-accettato", { detail: n }));
              }
            } catch {}
          }
        } else {
          setPending(items);
        }
      } catch {}
    };

    poll();
    const iv = setInterval(poll, pollIntervalMs);

    return () => { alive = false; clearInterval(iv); };
  }, [azienda_id, pollIntervalMs, enableSound, enableBrowserNotif, enableEmail, email, onNuovaRisposta, onAccettato]);

  return { pending, latest, ack, ackAll };
}
