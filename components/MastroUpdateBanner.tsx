"use client";

/* ═══════════════════════════════════════════════════════════
   MASTRO · Update Notifier
   Rileva quando il service worker ha installato una nuova
   versione e mostra un banner "Aggiorna" non invasivo.
   Risolve il problema "PWA cache stantia per ore/giorni".
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";

export function useUpdateNotifier() {
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let mounted = true;

    // Recupera registration esistente
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || !mounted) return;
      setRegistration(reg);

      // Caso 1: c'è già un SW in waiting (nuova versione pronta, in attesa di skipWaiting)
      if (reg.waiting) {
        setUpdateReady(true);
      }

      // Caso 2: nuovo SW si sta installando -> aspetta che diventi installed/waiting
      if (reg.installing) {
        reg.installing.addEventListener("statechange", function () {
          if (this.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      }

      // Caso 3: viene rilevato un updatefound dopo il mount
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", function () {
          if (this.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    });

    // Caso 4: il SW corrente è stato sostituito (ricarico la pagina)
    const onControllerChange = () => {
      // Solo se l'utente ha cliccato "aggiorna" (gestito da applyUpdate)
      if ((window as any).__mastroUpdating) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Caso 5: ricezione messaggio da SW (notifica attivazione)
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SW_ACTIVATED") {
        // Nuova versione attiva — reload solo se l'utente l'ha richiesto
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Polling per nuove versioni ogni 60 secondi
    const checkInterval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) reg.update().catch(() => {});
      });
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) {
      // Nessun SW in waiting - prova reload diretto
      (window as any).__mastroUpdating = true;
      window.location.reload();
      return;
    }
    // Marca che stiamo aggiornando, così controllerchange triggera reload
    (window as any).__mastroUpdating = true;
    // Invia messaggio al SW in waiting per attivarsi
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }, [registration]);

  return { updateReady, applyUpdate };
}

/* ─── Componente banner ─── */
export function MastroUpdateBanner() {
  const { updateReady, applyUpdate } = useUpdateNotifier();
  const [dismissed, setDismissed] = useState(false);

  if (!updateReady || dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: "linear-gradient(135deg, #28A0A0 0%, #0F766E 100%)",
        color: "#fff",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        // Safe area per iOS
        paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
        animation: "mastroUpdateSlide 0.3s ease-out",
      }}
    >
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
        Nuova versione disponibile
        <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 400, marginTop: 2 }}>
          Tocca per aggiornare e usare le ultime modifiche.
        </div>
      </div>
      <button
        onClick={applyUpdate}
        style={{
          background: "#fff",
          color: "#0F766E",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        Aggiorna
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Chiudi"
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          width: 32,
          height: 32,
          padding: 0,
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes mastroUpdateSlide {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
