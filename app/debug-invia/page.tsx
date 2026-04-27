"use client";

// MASTRO ERP - PAGINA DIAGNOSTICA /debug-invia
// Test stand-alone del flusso INVIA preventivo.
// Mostra a schermo OGNI step con esito e tempi.
// Non richiede auth, non richiede dati reali, non tocca DB.
//
// Scopo: capire DOVE il flusso INVIA fallisce sul telefono di Fabio.
// Lui apre /debug-invia, preme i 3 bottoni, mi manda screenshot.

import React, { useState, useRef } from "react";

type LogEntry = {
  ts: number;
  level: "info" | "ok" | "warn" | "error";
  msg: string;
  data?: any;
};

export default function DebugInviaPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);

  const log = (level: LogEntry["level"], msg: string, data?: any) => {
    const entry: LogEntry = { ts: Date.now() - startRef.current, level, msg, data };
    setLogs(prev => [...prev, entry]);
    console.log("[DEBUG-INVIA]", level, msg, data);
  };

  const reset = () => setLogs([]);

  // ── TEST 1: Capacità del browser ──────────────────────────
  const testCapacita = () => {
    reset();
    startRef.current = Date.now();
    log("info", "TEST 1: Capacità browser PWA");
    log("info", "User Agent: " + navigator.userAgent);
    log("info", "Standalone PWA: " + ((window.navigator as any).standalone === true ? "SI" : "NO"));
    log("info", "Display mode: " + (window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser"));

    if (typeof navigator.share === "function") {
      log("ok", "navigator.share: DISPONIBILE");
    } else {
      log("error", "navigator.share: NON DISPONIBILE - questo è un grosso problema");
    }

    if (typeof (navigator as any).canShare === "function") {
      log("ok", "navigator.canShare: DISPONIBILE");
      try {
        const fakeFile = new File(["test"], "test.pdf", { type: "application/pdf" });
        const canSh = (navigator as any).canShare({ files: [fakeFile] });
        log(canSh ? "ok" : "error", "canShare con File PDF: " + (canSh ? "SI" : "NO"));
      } catch(e: any) {
        log("error", "canShare crash: " + e.message);
      }
    } else {
      log("warn", "navigator.canShare: NON DISPONIBILE (browser vecchio)");
    }

    log("ok", "Test 1 completato");
  };

  // ── TEST 2: Crea link DB e mostra esito ───────────────────
  const testLinkDb = async () => {
    reset();
    startRef.current = Date.now();
    log("info", "TEST 2: Creazione link in DB Supabase");

    const fakeSnapshot = {
      cliente: "TEST DEBUG",
      totale: 1000,
      vani: [{ nome: "Test", tipo: "finestra", misure: "1200x1500", prezzo: 1000 }],
      azienda: { ragione: "Walter Cozza Test", telefono: "1234567890" },
    };

    log("info", "Chiamo POST /api/preventivo-link...");
    try {
      const t0 = Date.now();
      const r = await fetch("/api/preventivo-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cm_id: "debug-test-" + Date.now(),
          cm_code: "DEBUG-001",
          snapshot: fakeSnapshot,
          azienda_id: "debug",
        }),
      });
      const dt = Date.now() - t0;
      log("info", "Risposta in " + dt + "ms - status " + r.status);

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        log("error", "API errore HTTP " + r.status + ": " + txt.slice(0, 200));
        return;
      }

      const data = await r.json();
      log("ok", "API risposta JSON OK");
      log("info", "Token URL ricevuto: " + (data.url || "MANCANTE!"));

      if (!data.url) {
        log("error", "Risposta non contiene .url - API rotta?");
        return;
      }

      const fullLink = window.location.origin + data.url;
      log("ok", "Link pubblico: " + fullLink);
      log("info", "Test 2 completato. Tocca il link per provarlo (apre nuova tab).");
    } catch(e: any) {
      log("error", "Fetch fail: " + (e?.message || e));
      log("error", "Stack: " + (e?.stack || "n/a").slice(0, 300));
    }
  };

  // ── TEST 3: navigator.share con un PDF finto ──────────────
  const testShare = async () => {
    reset();
    startRef.current = Date.now();
    log("info", "TEST 3: navigator.share con PDF dummy");

    if (typeof navigator.share !== "function") {
      log("error", "STOP: navigator.share non disponibile su questo browser");
      return;
    }

    log("info", "Genero PDF dummy come Blob...");
    const pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (TEST DEBUG MASTRO) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000110 00000 n\n0000000180 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n270\n%%EOF";
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    log("ok", "PDF blob creato: " + blob.size + " bytes");

    const file = new File([blob], "test_debug.pdf", { type: "application/pdf" });
    log("ok", "File object creato: " + file.name + " (" + file.size + " bytes)");

    if ((navigator as any).canShare) {
      try {
        const can = (navigator as any).canShare({ files: [file] });
        log(can ? "ok" : "error", "canShare({files:[pdf]}): " + (can ? "SI" : "NO"));
        if (!can) {
          log("warn", "Senza canShare, lo share probabilmente fallirà");
        }
      } catch(e: any) {
        log("error", "canShare crash: " + e.message);
      }
    }

    log("info", "Tento navigator.share...");
    try {
      await (navigator as any).share({
        files: [file],
        text: "TEST DEBUG MASTRO\nQuesto è un test diagnostico.\nLink finto: https://example.com/test",
        title: "Test Debug MASTRO",
      });
      log("ok", "navigator.share COMPLETATO senza errore");
      log("ok", "→ Devi aver visto il foglio condivisione iOS");
    } catch(e: any) {
      if (e?.name === "AbortError") {
        log("warn", "Share annullato dall'utente (hai chiuso il foglio)");
      } else {
        log("error", "Share fallito: " + e.name + " - " + e.message);
        log("error", "Stack: " + (e?.stack || "n/a").slice(0, 300));
      }
    }
  };

  // ── TEST 4: Flusso completo (link DB + PDF dummy + share) ─
  const testCompleto = async () => {
    reset();
    startRef.current = Date.now();
    log("info", "TEST 4: Flusso completo (come bottone INVIA reale)");

    // Step 1: link DB
    log("info", "STEP 1/3 - Creo link in DB...");
    let linkPubblico = "";
    try {
      const r = await fetch("/api/preventivo-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cm_id: "debug-completo-" + Date.now(),
          cm_code: "DEBUG-FULL-001",
          snapshot: { cliente: "Debug", totale: 0, vani: [] },
          azienda_id: "debug",
        }),
      });
      if (r.ok) {
        const d = await r.json();
        linkPubblico = window.location.origin + d.url;
        log("ok", "1/3 OK link: " + linkPubblico);
      } else {
        log("error", "1/3 FAIL HTTP " + r.status);
        return;
      }
    } catch(e: any) {
      log("error", "1/3 FAIL fetch: " + e.message);
      return;
    }

    // Step 2: PDF
    log("info", "STEP 2/3 - Genero PDF...");
    const pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (TEST FLUSSO COMPLETO) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000110 00000 n\n0000000180 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n270\n%%EOF";
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const file = new File([blob], "preventivo_debug.pdf", { type: "application/pdf" });
    log("ok", "2/3 OK pdf " + blob.size + " bytes");

    // Step 3: share
    log("info", "STEP 3/3 - navigator.share...");
    if (typeof navigator.share !== "function") {
      log("error", "3/3 FAIL navigator.share NON DISPONIBILE");
      return;
    }
    try {
      const messaggio = "Ciao Cliente, ecco il preventivo DEBUG-FULL-001.\n\nClicca per accettare:\n" + linkPubblico;
      await (navigator as any).share({
        files: [file],
        text: messaggio,
        title: "Preventivo DEBUG-FULL-001",
      });
      log("ok", "3/3 OK share completato");
      log("ok", "✓✓✓ FLUSSO COMPLETO RIUSCITO ✓✓✓");
      log("info", "Se hai visto WhatsApp + PDF + messaggio, allora il bug NON è nel flusso");
      log("info", "Il bug è nel codice del bottone INVIA reale di MASTRO");
    } catch(e: any) {
      if (e?.name === "AbortError") {
        log("warn", "3/3 Share annullato dall'utente");
      } else {
        log("error", "3/3 FAIL share: " + e.name + " - " + e.message);
      }
    }
  };

  // ── UI ────────────────────────────────────────────────────
  const lvlColor = (l: LogEntry["level"]) => {
    if (l === "ok") return "#0a7";
    if (l === "warn") return "#d80";
    if (l === "error") return "#d22";
    return "#444";
  };
  const lvlIcon = (l: LogEntry["level"]) => {
    if (l === "ok") return "✓";
    if (l === "warn") return "⚠";
    if (l === "error") return "✗";
    return "·";
  };

  const btn: React.CSSProperties = {
    width: "100%", padding: 16, marginBottom: 10, borderRadius: 12,
    border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
    cursor: "pointer", fontFamily: "system-ui",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      padding: "20px 16px",
      paddingTop: "max(20px, env(safe-area-inset-top))",
      paddingBottom: "max(20px, env(safe-area-inset-bottom))",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: 14,
      color: "#222",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#0D1F1F" }}>
          🔧 MASTRO Debug INVIA
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#666" }}>
          Test diagnostico flusso INVIA preventivo. Premi i bottoni in ordine, fai screenshot dei risultati.
        </p>

        <button onClick={testCapacita} style={{ ...btn, background: "#0D1F1F" }}>
          1️⃣ TEST CAPACITÀ BROWSER
        </button>

        <button onClick={testLinkDb} style={{ ...btn, background: "#28A0A0" }}>
          2️⃣ TEST CREAZIONE LINK DB
        </button>

        <button onClick={testShare} style={{ ...btn, background: "#D08008" }}>
          3️⃣ TEST navigator.share
        </button>

        <button onClick={testCompleto} style={{ ...btn, background: "#25d366", marginBottom: 20 }}>
          4️⃣ TEST FLUSSO COMPLETO
        </button>

        <div style={{
          background: "#0D1F1F",
          color: "#EEF8F8",
          padding: 12,
          borderRadius: 10,
          minHeight: 200,
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 11,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap" as const,
          wordBreak: "break-word" as const,
        }}>
          {logs.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: 20 }}>
              Nessun log. Premi un bottone per iniziare.
            </div>
          ) : logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ color: "#888" }}>[{(l.ts / 1000).toFixed(2)}s]</span>{" "}
              <span style={{ color: lvlColor(l.level), fontWeight: 700 }}>{lvlIcon(l.level)}</span>{" "}
              <span style={{ color: l.level === "error" ? "#fbb" : l.level === "ok" ? "#bfb" : "#ddd" }}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>

        <button onClick={reset} style={{
          ...btn, background: "#666", marginTop: 12, fontSize: 12, padding: 10,
        }}>
          PULISCI LOG
        </button>

        <div style={{ marginTop: 20, padding: 12, background: "#fff", borderRadius: 8, fontSize: 11, color: "#666", lineHeight: 1.6 }}>
          <b>Come usare:</b><br/>
          1. Premi <b>TEST CAPACITÀ</b> → screenshot del log<br/>
          2. Premi <b>TEST CREAZIONE LINK</b> → screenshot<br/>
          3. Premi <b>TEST navigator.share</b> → se appare foglio condivisione iOS, chiudilo, fai screenshot<br/>
          4. Premi <b>TEST FLUSSO COMPLETO</b> → screenshot finale<br/>
          <br/>
          Mandami i 4 screenshot.
        </div>
      </div>
    </div>
  );
}
