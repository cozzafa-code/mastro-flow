// app/firma/completata/page.tsx
// Landing page cliente dopo firma certificata completata.
// Mostra conferma + ringraziamento + link download PDF firmato.

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function FirmaCompletataPage() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <FirmaCompletataContent />
    </Suspense>
  );
}

function FirmaCompletataContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [stato, setStato] = useState<"loading" | "firmata" | "in_corso" | "errore">("loading");
  const [info, setInfo] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setStato("errore"); return; }
    (async () => {
      // Fai fino a 10 tentativi con 2s di attesa — il webhook potrebbe non essere ancora arrivato
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase
          .from("firma_tokens")
          .select("stato, pdf_firmato_url, cliente, cm_code, tipo, firmato_il")
          .eq("token", token)
          .maybeSingle();

        if (!data) {
          if (i === 9) setStato("errore");
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (data.stato === "firmata") {
          setInfo(data);
          setPdfUrl(data.pdf_firmato_url);
          setStato("firmata");
          return;
        }

        if (data.stato === "annullata" || data.stato === "errore") {
          setStato("errore");
          setInfo(data);
          return;
        }

        // In corso: aspetta e riprova
        if (i === 9) {
          setStato("in_corso");
          setInfo(data);
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    })();
  }, [token]);

  const T = {
    darkBg: "#0D1F1F",
    teal: "#28A0A0",
    lightBg: "#EEF8F8",
    border: "#C8E4E4",
    textDark: "#0D1F1F",
    textSub: "#6A8484",
    ok: "#16A34A",
    danger: "#DC2626",
  };

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: T.lightBg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 14,
    border: `1px solid ${T.border}`,
    padding: 28,
    maxWidth: 480,
    width: "100%",
    boxShadow: "0 4px 20px rgba(13, 31, 31, 0.08)",
  };

  // ───── RENDER: loading ─────
  if (stato === "loading") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6 }}>
            Verifica firma
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.textDark, marginBottom: 12 }}>
            Attendi qualche secondo…
          </div>
          <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
            Stiamo ricevendo conferma dal provider della firma certificata. Non chiudere la pagina.
          </div>
          <div style={{ marginTop: 20, height: 4, background: T.lightBg, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: T.teal, width: "40%",
              animation: "slide 1.5s ease-in-out infinite",
            }} />
          </div>
          <style>{`@keyframes slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(300%);} }`}</style>
        </div>
      </div>
    );
  }

  // ───── RENDER: firmata ─────
  if (stato === "firmata") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          {/* Badge */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: T.teal,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: "#fff", fontSize: 32, fontWeight: 800,
          }}>✓</div>

          <div style={{
            fontSize: 11, fontWeight: 700, color: T.teal, textAlign: "center",
            textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 6,
          }}>
            Firma completata
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800, color: T.textDark, textAlign: "center",
            marginBottom: 14, letterSpacing: "-0.3px",
          }}>
            Grazie {info?.cliente?.split(" ")[0] || ""}!
          </div>
          <div style={{
            fontSize: 13, color: T.textSub, textAlign: "center",
            lineHeight: 1.55, marginBottom: 20,
          }}>
            Il documento <strong style={{ color: T.textDark }}>
              {tipoDocLabel(info?.tipo)}
            </strong>{info?.cm_code ? ` n. ${info.cm_code}` : ""} è stato firmato correttamente.
            Riceverai una copia via email entro pochi minuti.
          </div>

          {info?.firmato_il && (
            <div style={{
              fontSize: 11, color: T.textSub, textAlign: "center", marginBottom: 20,
              background: T.lightBg, padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${T.border}`,
            }}>
              Firmato il {new Date(info.firmato_il).toLocaleString("it-IT", {
                day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          )}

          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "14px 18px", borderRadius: 10,
                background: T.teal, color: "#fff", textAlign: "center",
                fontSize: 13, fontWeight: 800, textDecoration: "none",
                marginBottom: 10,
              }}
            >
              Scarica PDF firmato
            </a>
          )}

          <div style={{ fontSize: 10, color: T.textSub, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
            Firma certificata eIDAS · Validità legale · Conservazione a norma 10 anni
          </div>
        </div>
      </div>
    );
  }

  // ───── RENDER: in corso (webhook non ancora arrivato) ─────
  if (stato === "in_corso") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: "#F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: "#fff", fontSize: 30,
          }}>⏳</div>

          <div style={{ fontSize: 18, fontWeight: 800, color: T.textDark, textAlign: "center", marginBottom: 12 }}>
            Firma in elaborazione
          </div>
          <div style={{ fontSize: 12, color: T.textSub, textAlign: "center", lineHeight: 1.6, marginBottom: 16 }}>
            Il provider sta finalizzando il tuo documento. Questa operazione può richiedere qualche minuto.
            Ti invieremo una email quando tutto sarà pronto.
          </div>
          <div
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 18px", borderRadius: 10,
              background: "#fff", border: `1px solid ${T.border}`,
              color: T.teal, textAlign: "center", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
            }}
          >
            Aggiorna pagina
          </div>
        </div>
      </div>
    );
  }

  // ───── RENDER: errore ─────
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: T.danger,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", color: "#fff", fontSize: 32, fontWeight: 800,
        }}>!</div>

        <div style={{ fontSize: 18, fontWeight: 800, color: T.textDark, textAlign: "center", marginBottom: 12 }}>
          Qualcosa è andato storto
        </div>
        <div style={{ fontSize: 12, color: T.textSub, textAlign: "center", lineHeight: 1.6 }}>
          Non siamo riusciti a verificare la firma. Contatta chi ti ha inviato il documento per ricevere un nuovo link.
        </div>
      </div>
    </div>
  );
}

function FullScreenLoading() {
  return (
    <div style={{
      minHeight: "100vh", background: "#EEF8F8",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#6A8484", fontSize: 13,
    }}>
      Caricamento…
    </div>
  );
}

function tipoDocLabel(tipo?: string): string {
  if (tipo === "conferma_ordine") return "Conferma d'ordine";
  if (tipo === "scheda_tecnica") return "Scheda tecnica";
  return "Documento";
}
