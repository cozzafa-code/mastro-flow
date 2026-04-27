// lib/pdf-mobile-safe.ts
// Helper condiviso per il salvataggio PDF mobile-safe.
// Su mobile, doc.save() causa crash del WebView quando l'utente chiude il PDF
// (memoria rilasciata, app uccisa, richiede re-login). Il fix: blob + window.open.
//
// Uso: import { savePdfMobileSafe } from "./pdf-mobile-safe";
//      savePdfMobileSafe(doc, "preventivo_S0001.pdf");

import type jsPDF from "jspdf";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "").toLowerCase();
  if (/android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua)) return true;
  if (typeof window !== "undefined" && window.innerWidth <= 900) return true;
  return false;
}

/**
 * Salva un PDF in modo mobile-safe.
 * Su mobile: genera Blob → window.open in nuovo tab (app principale resta viva).
 * Su desktop: doc.save() standard.
 *
 * Fallback: se window.open è bloccato dal browser, usa anchor download.
 */
export function savePdfMobileSafe(doc: jsPDF, filename: string): void {
  if (isMobileDevice()) {
    try {
      const blob = doc.output("blob") as Blob;
      const url = URL.createObjectURL(blob);
      const newTab = window.open(url, "_blank");
      if (!newTab) {
        // Popup bloccato → fallback anchor download
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Cleanup URL dopo 60 secondi
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 60000);
      return;
    } catch (e) {
      console.error("[PDF mobile blob fail, fallback to save]", e);
      // Fall through a doc.save standard
    }
  }
  doc.save(filename);
}
