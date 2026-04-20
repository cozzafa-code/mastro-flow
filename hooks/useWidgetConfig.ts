"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   useWidgetConfig v2 — safe, fail-gracefully, no app crash
   Se Supabase fallisce o non è configurato, l'hook ritorna comunque
   widgets di default. La home non crasha MAI a causa di questo hook.
   ═══════════════════════════════════════════════════════════════ */

export const DEFAULT_WIDGETS = ["oggi_devi_fare", "squadra", "produzione"];

let cachedClient: any = null;

async function getSb(): Promise<any> {
  if (cachedClient) return cachedClient;
  if (typeof window === "undefined") return null;

  // 1) Try: client già presente su window
  const w = window as any;
  if (w.__supabase) { cachedClient = w.__supabase; return cachedClient; }

  // 2) Create from env
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    const mod = await import("@supabase/supabase-js");
    cachedClient = mod.createClient(url, anon);
    w.__supabase = cachedClient;
    return cachedClient;
  } catch (e) {
    console.warn("[widgetConfig] supabase init failed", e);
    return null;
  }
}

export function useWidgetConfig(aziendaId?: string) {
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const sbRef = useRef<any>(null);

  // Load config
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sb = await getSb();
        if (!sb || !mounted) return;
        sbRef.current = sb;

        const { data: auth } = await sb.auth.getUser();
        if (!auth?.user) return;
        userIdRef.current = auth.user.id;

        const { data } = await sb
          .from("home_widget_config")
          .select("widgets")
          .eq("user_id", auth.user.id)
          .maybeSingle();

        if (mounted && data?.widgets && Array.isArray(data.widgets)) {
          setWidgets(data.widgets);
        }
      } catch (e) {
        console.warn("[widgetConfig] load failed", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persist = useCallback(async (next: string[]) => {
    const sb = sbRef.current;
    const uid = userIdRef.current;
    if (!sb || !uid || !aziendaId) return;
    try {
      await sb.from("home_widget_config")
        .upsert({ user_id: uid, azienda_id: aziendaId, widgets: next }, { onConflict: "user_id" });
    } catch (e) {
      console.warn("[widgetConfig] save failed", e);
    }
  }, [aziendaId]);

  const trackEvent = useCallback(async (eventType: string, widgetId: string, meta: any = {}) => {
    const sb = sbRef.current;
    const uid = userIdRef.current;
    if (!sb || !uid || !aziendaId) return;
    try {
      await sb.from("widget_analytics").insert({
        user_id: uid, azienda_id: aziendaId,
        event_type: eventType, widget_id: widgetId, meta,
      });
    } catch (e) {
      // silent: non bloccare UI per un evento analytics
    }
  }, [aziendaId]);

  const addWidget = useCallback((id: string) => {
    setWidgets(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persist(next);
      trackEvent("widget_added", id);
      return next;
    });
  }, [persist, trackEvent]);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const next = prev.filter(w => w !== id);
      persist(next);
      trackEvent("widget_removed", id);
      return next;
    });
  }, [persist, trackEvent]);

  return { widgets, loading, addWidget, removeWidget, trackEvent };
}
