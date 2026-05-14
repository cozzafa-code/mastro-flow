"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface OrdineData {
  ordine: any;
  fornitore: any;
  commessa: any;
}

export default function PortaleFornitorePage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const [data, setData] = useState<OrdineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [azione, setAzione] = useState<"idle" | "loading" | "done">("idle");
  const [note, setNote] = useState("");
  const [showRifiuta, setShowRifiuta] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: res, error } = await supabase.rpc("portale_ordine_via_token", { p_token: token });
      if (error || !res?.ok) {
        setErr(res?.error || error?.message || "errore");
        setLoading(false);
        return;
      }
      setData(res as any);
      setLoading(false);
    })();
  }, [token]);

  async function agisci(azione: string, noteParam?: string) {
    if (!confirm(`Confermi: ${azione.toUpperCase()}?`)) return;
    setAzione("loading");
    const { data: res, error } = await supabase.rpc("portale_aggiorna_stato_ordine", {
      p_token: token,
      p_azione: azione,
      p_note: noteParam || note || null,
    });
    if (error || !res?.ok) {
      alert("Errore: " + (res?.error || error?.message));
      setAzione("idle");
      return;
    }
    setAzione("done");
    // reload
    setTimeout(() => window.location.reload(), 1500);
  }

  if (loading) {
    return (
      <div style={pageBg}>
        <div style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>Caricamento ordine...</div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div style={pageBg}>
        <div style={{
          background: "#fff", borderRadius: 14, padding: 32, maxWidth: 400,
          textAlign: "center", fontFamily: "sans-serif"
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A2A47" }}>Link non valido</div>
          <div style={{ fontSize: 12, color: "#5A6478", marginTop: 8, lineHeight: 1.4 }}>
            Il link è scaduto, revocato o non corretto. Contatta chi ti ha inviato l'ordine.
          </div>
        </div>
      </div>
    );
  }

  const o = data.ordine;
  const righe = (o.righe || []) as any[];
  const stato = o.stato || "bozza";
  const isClosed = ["arrivato", "verificato", "annullato"].includes(stato);

  return (
    <div style={{
      minHeight: "100vh", background: "#EEF8F8",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      paddingBottom: 40
    }}>
      {/* Header brand */}
      <div style={{
        background: "linear-gradient(180deg,#1A2A47 0%,#243558 100%)",
        color: "#fff", padding: "40px 20px 24px", textAlign: "center"
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "2px",
          color: "#E8B05C", textTransform: "uppercase", marginBottom: 6
        }}>fliwoX · MASTRO Suite</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>
          Ordine {o.numero}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
          per {data.fornitore?.nome || o.fornitore}
        </div>
      </div>

      {/* Stato attuale */}
      <div style={{
        margin: "16px 20px", padding: 14,
        background: "#fff", borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.7px",
            color: "#5A6478", textTransform: "uppercase"
          }}>Stato corrente</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A2A47", marginTop: 4 }}>
            {labelStato(stato)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1A2A47", letterSpacing: "-0.3px" }}>
            EUR {formatNum(o.totale_euro || 0)}
          </div>
          <div style={{ fontSize: 10, color: "#8893A8", marginTop: 2 }}>{righe.length} righe</div>
        </div>
      </div>

      {/* Righe ordine */}
      <div style={{
        margin: "16px 20px", padding: "14px 16px",
        background: "#fff", borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.7px",
          color: "#5A6478", textTransform: "uppercase", marginBottom: 10
        }}>Articoli ({righe.length})</div>

        {righe.length === 0 ? (
          <div style={{ fontSize: 12, color: "#8893A8" }}>Nessuna riga</div>
        ) : (
          righe.map((r, i) => (
            <div key={i} style={{
              padding: "8px 0", borderBottom: i < righe.length - 1 ? "1px solid #F0F2F6" : "none",
              display: "flex", justifyContent: "space-between", gap: 10
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2A47", lineHeight: 1.3 }}>
                  {r.descrizione || r.desc || "—"}
                </div>
                {(r.codice_articolo || r.codice) && (
                  <div style={{
                    fontSize: 10, color: "#8893A8", marginTop: 2,
                    fontFamily: "SF Mono, Menlo, monospace"
                  }}>{r.codice_articolo || r.codice}</div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1A2A47" }}>
                  {r.qta_ordinata || r.qta || 0} {r.unita_misura || "pz"}
                </div>
                <div style={{ fontSize: 10, color: "#5A6478", marginTop: 2 }}>
                  EUR {formatNum(r.costo_unitario || 0)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottoni azione */}
      {!isClosed && azione === "idle" && (
        <div style={{ margin: "20px 20px 0" }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.7px",
            color: "#1A2A47", textTransform: "uppercase", marginBottom: 10
          }}>Aggiorna stato</div>

          {stato === "inviato" && (
            <>
              <ActionBtn label="CONFERMO L'ORDINE" colore="#28A0A0" onClick={() => agisci("conferma")} icona="check" />
              <ActionBtn label="NON POSSO EVADERLO" colore="#C44545" onClick={() => setShowRifiuta(true)} icona="x" />
            </>
          )}

          {stato === "confermato" && (
            <ActionBtn label="MERCE SPEDITA" colore="#E8B05C" onClick={() => agisci("spedito")} icona="truck" />
          )}

          {stato === "in_transito" && (
            <ActionBtn label="CONSEGNATO AL CLIENTE" colore="#1F5A3F" onClick={() => agisci("arrivato")} icona="check" />
          )}
        </div>
      )}

      {/* Rifiuta con note */}
      {showRifiuta && (
        <div style={{ margin: "16px 20px", padding: 14, background: "#F5DADA", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A33333", marginBottom: 8 }}>
            Motivo del rifiuto:
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="es. articolo non disponibile, prezzo errato..."
            rows={3}
            style={{
              width: "100%", padding: 10, fontSize: 12, fontFamily: "inherit",
              border: "1px solid #E0E5EE", borderRadius: 8, resize: "vertical"
            }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setShowRifiuta(false)} style={{
              flex: 1, padding: 10, background: "#fff", color: "#5A6478",
              border: "1px solid #E0E5EE", borderRadius: 8, fontWeight: 700, cursor: "pointer"
            }}>Annulla</button>
            <button onClick={() => agisci("rifiuta", note)} style={{
              flex: 1, padding: 10, background: "#C44545", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer"
            }}>Conferma rifiuto</button>
          </div>
        </div>
      )}

      {azione === "loading" && (
        <div style={{ margin: "16px 20px", padding: 14, background: "#FBF0DC", borderRadius: 10, textAlign: "center", color: "#8B6926", fontWeight: 700, fontSize: 13 }}>
          Aggiornamento in corso...
        </div>
      )}

      {azione === "done" && (
        <div style={{ margin: "16px 20px", padding: 14, background: "#D8EBDF", borderRadius: 10, textAlign: "center", color: "#1F5A3F", fontWeight: 700, fontSize: 13 }}>
          ✓ Aggiornato con successo
        </div>
      )}

      {isClosed && (
        <div style={{
          margin: "20px 20px", padding: 16, background: "#fff",
          borderRadius: 12, textAlign: "center", color: "#5A6478",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>Ordine chiuso</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Nessuna azione disponibile</div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 30, padding: "20px 20px", textAlign: "center",
        fontSize: 10, color: "#8893A8", lineHeight: 1.5
      }}>
        Powered by <strong style={{ color: "#1A2A47" }}>fliwoX</strong> · MASTRO Suite<br />
        Portale sicuro - link valido 90 giorni
      </div>
    </div>
  );
}

const pageBg: any = {
  minHeight: "100vh", background: "#8B9BB0",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20
};

function ActionBtn({ label, colore, onClick, icona }: any) {
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px", background: colore, color: "#fff",
      borderRadius: 12, fontSize: 14, fontWeight: 800,
      letterSpacing: "0.5px", textTransform: "uppercase",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      marginBottom: 10, cursor: "pointer",
      boxShadow: "0 3px 10px rgba(0,0,0,0.15)"
    }}>{label}</div>
  );
}

function labelStato(s: string): string {
  const m: Record<string, string> = {
    bozza: "Bozza",
    inviato: "In attesa di conferma",
    confermato: "Confermato dal fornitore",
    in_transito: "In transito",
    arrivato: "Consegnato",
    verificato: "Verificato e chiuso",
    annullato: "Annullato",
  };
  return m[s] || s;
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
