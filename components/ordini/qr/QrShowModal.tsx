"use client";

import { useEffect, useState } from "react";
import { generaTokenOrdine } from "./qr-helpers";

interface Props {
  ordineId: string;
  numero?: string;
  fornitore?: string;
  onClose: () => void;
}

export default function QrShowModal({ ordineId, numero, fornitore, onClose }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await generaTokenOrdine(ordineId);
      if (res.ok && res.token && res.url) {
        setToken(res.token);
        setUrl(res.url);
      } else {
        setErr(res.error || "Errore generazione token");
      }
      setLoading(false);
    })();
  }, [ordineId]);

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiato!");
    } catch {
      prompt("Copia il link:", url);
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 18, padding: 24,
        maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#1A2A47", color: "#28A0A0",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm15 0h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2-2h-2v2h2v-2zm4 0h-2v2h2v-2zm-4 4h2v-2h-2v2z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1px", color: "#E8B05C", textTransform: "uppercase" }}>
              QR Ordine
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A2A47", marginTop: 2 }}>
              {numero || "—"}
            </div>
            {fornitore && (
              <div style={{ fontSize: 11, color: "#5A6478", marginTop: 1 }}>{fornitore}</div>
            )}
          </div>
          <div onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "#F4F6FA", color: "#5A6478",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, cursor: "pointer"
          }}>✕</div>
        </div>

        {loading && (
          <div style={{ padding: 40, textAlign: "center", color: "#5A6478", fontSize: 12 }}>
            Generazione QR...
          </div>
        )}

        {err && (
          <div style={{ padding: 16, background: "#F5DADA", borderRadius: 10, color: "#A33333", fontSize: 12, fontWeight: 700 }}>
            {err}
          </div>
        )}

        {url && token && (
          <>
            <div style={{
              padding: 20, background: "#fff",
              border: "2px solid #1A2A47", borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "8px 0 16px"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`}
                alt="QR ordine"
                style={{ width: 240, height: 240, display: "block" }}
              />
            </div>

            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.6px",
              color: "#5A6478", textTransform: "uppercase", marginBottom: 4
            }}>Link portale fornitore</div>
            <div style={{
              padding: "10px 12px", background: "#F4F6FA",
              borderRadius: 8, fontSize: 11, color: "#1A2A47",
              fontFamily: "SF Mono, Menlo, monospace",
              wordBreak: "break-all", marginBottom: 12
            }}>{url}</div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyUrl} style={{
                flex: 1, padding: 11, background: "#1A2A47", color: "#fff",
                border: "none", borderRadius: 9, fontSize: 12, fontWeight: 800,
                letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer"
              }}>Copia link</button>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: 11, background: "#28A0A0", color: "#fff",
                borderRadius: 9, fontSize: 12, fontWeight: 800,
                letterSpacing: "0.5px", textTransform: "uppercase",
                textAlign: "center", textDecoration: "none", cursor: "pointer"
              }}>Apri</a>
            </div>

            <div style={{
              marginTop: 14, padding: 10, background: "#FBF0DC",
              borderRadius: 8, fontSize: 10, color: "#8B6926", lineHeight: 1.4
            }}>
              Il fornitore puo scansionare questo QR per confermare, dichiarare spedito o segnalare problemi senza dover registrarsi.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
