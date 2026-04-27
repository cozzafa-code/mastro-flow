// lib/pdf-mobile-safe.ts
// PDF VIEWER IN-APP — versione v7 mobile-safe
//
// Problema risolto: su mobile, doc.save() o window.open(blob) causano la chiusura
// del WebView MASTRO e richiedono re-login.
//
// Soluzione: modal IN-APP con iframe del Blob URL + bottoni Scarica / Condividi / Chiudi.
// L'utente vede il PDF dentro MASTRO, non esce mai dall'app.
//
// API:
//   import { savePdfMobileSafe } from "./pdf-mobile-safe";
//   savePdfMobileSafe(doc, "preventivo_S0001.pdf");
//
//   // Su desktop: download diretto (comportamento standard)
//   // Su mobile: apre modal in-app con iframe + bottoni

import type jsPDF from "jspdf";

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "").toLowerCase();
  if (/android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua)) return true;
  if (typeof window !== "undefined" && window.innerWidth <= 900) return true;
  return false;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = String(navigator.userAgent || "");
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

/**
 * Apre il PDF in un modal IN-APP con iframe.
 * L'utente vede il PDF dentro MASTRO (non esce mai dall'app).
 * Bottoni: Scarica, Condividi, Chiudi.
 */
function showPdfInAppModal(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;

  const url = URL.createObjectURL(blob);

  // Container modal
  const overlay = document.createElement("div");
  overlay.id = "mastro-pdf-modal-" + Date.now();
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:99999",
    "background:rgba(13,31,31,0.95)",
    "display:flex",
    "flex-direction:column",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  ].join(";");

  // Toolbar in alto
  const toolbar = document.createElement("div");
  toolbar.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:8px",
    "padding:12px 14px",
    "background:#0D1F1F",
    "color:#fff",
    "border-bottom:1px solid rgba(255,255,255,0.1)",
    "flex-shrink:0",
  ].join(";");

  // Titolo
  const title = document.createElement("div");
  title.style.cssText = "flex:1;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
  title.textContent = filename;
  toolbar.appendChild(title);

  // Bottone Scarica (anchor con download)
  const btnDownload = document.createElement("a");
  btnDownload.href = url;
  btnDownload.download = filename;
  btnDownload.style.cssText = [
    "display:inline-flex",
    "align-items:center",
    "justify-content:center",
    "background:#28A0A0",
    "color:#fff",
    "padding:8px 14px",
    "border-radius:8px",
    "font-size:12px",
    "font-weight:700",
    "text-decoration:none",
    "cursor:pointer",
    "min-height:36px",
    "min-width:36px",
  ].join(";");
  btnDownload.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Scarica';
  toolbar.appendChild(btnDownload);

  // Bottone Condividi (Web Share API se disponibile)
  if (typeof navigator !== "undefined" && (navigator as any).share && (navigator as any).canShare) {
    const file = new File([blob], filename, { type: "application/pdf" });
    if ((navigator as any).canShare({ files: [file] })) {
      const btnShare = document.createElement("button");
      btnShare.style.cssText = [
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "background:rgba(255,255,255,0.1)",
        "color:#fff",
        "padding:8px 12px",
        "border-radius:8px",
        "font-size:12px",
        "font-weight:600",
        "border:1px solid rgba(255,255,255,0.2)",
        "cursor:pointer",
        "min-height:36px",
        "min-width:36px",
        "font-family:inherit",
      ].join(";");
      btnShare.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>';
      btnShare.title = "Condividi";
      btnShare.onclick = async () => {
        try {
          await (navigator as any).share({ files: [file], title: filename });
        } catch (e) { /* utente ha annullato */ }
      };
      toolbar.appendChild(btnShare);
    }
  }

  // Bottone Chiudi
  const btnClose = document.createElement("button");
  btnClose.setAttribute("aria-label", "Chiudi");
  btnClose.style.cssText = [
    "display:inline-flex",
    "align-items:center",
    "justify-content:center",
    "background:rgba(255,255,255,0.1)",
    "color:#fff",
    "padding:0",
    "width:36px",
    "height:36px",
    "border-radius:8px",
    "border:1px solid rgba(255,255,255,0.2)",
    "cursor:pointer",
    "font-size:18px",
    "font-weight:600",
    "font-family:inherit",
    "flex-shrink:0",
  ].join(";");
  btnClose.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  toolbar.appendChild(btnClose);

  // Body con iframe per il PDF
  const body = document.createElement("div");
  body.style.cssText = "flex:1;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;";

  // Su iOS, iframe con PDF non funziona bene → mostro pulsante "Apri PDF"
  // Su Android, iframe funziona OK
  if (isIOS()) {
    const iosCard = document.createElement("div");
    iosCard.style.cssText = "padding:32px;text-align:center;color:#0D1F1F;max-width:340px;";
    iosCard.innerHTML = (
      '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' +
      '<div style="font-size:18px;font-weight:700;margin-bottom:8px">PDF pronto</div>' +
      '<div style="font-size:13px;color:#6A8484;margin-bottom:18px;line-height:1.5">Tocca <b>Scarica</b> in alto per salvare il PDF. Lo trovi nei tuoi Download. MASTRO non si chiude.</div>'
    );
    body.appendChild(iosCard);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.cssText = "width:100%;height:100%;border:none;background:#fff;";
    iframe.setAttribute("title", filename);
    body.appendChild(iframe);
  }

  // Compose
  overlay.appendChild(toolbar);
  overlay.appendChild(body);

  // Cleanup function
  const cleanup = () => {
    try { URL.revokeObjectURL(url); } catch {}
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener("keydown", onEsc);
  };

  // Listener chiusura
  btnClose.onclick = cleanup;
  const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") cleanup(); };
  document.addEventListener("keydown", onEsc);

  // Fix scroll body locked dietro modal
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const origCleanup = cleanup;
  (overlay as any)._cleanup = () => {
    document.body.style.overflow = prevOverflow;
    origCleanup();
  };
  btnClose.onclick = (overlay as any)._cleanup;

  // Append to body
  document.body.appendChild(overlay);
}

/**
 * Salva un PDF in modo mobile-safe.
 * - Mobile: modal IN-APP con iframe + bottoni Scarica/Condividi/Chiudi → mai uscire dall'app
 * - Desktop: doc.save() standard (download diretto)
 */
export function savePdfMobileSafe(doc: jsPDF, filename: string): void {
  if (isMobileDevice()) {
    try {
      const blob = doc.output("blob") as Blob;
      showPdfInAppModal(blob, filename);
      return;
    } catch (e) {
      console.error("[PDF mobile fail, fallback to save]", e);
    }
  }
  doc.save(filename);
}
