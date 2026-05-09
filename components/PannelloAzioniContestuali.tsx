// ════════════════════════════════════════════════════════════
// PANNELLO AZIONI CONTESTUALI · CMDetailPanel
// Mostra azioni configurate per la fase corrente + bottoni che eseguono
// ════════════════════════════════════════════════════════════
"use client";
import { useState } from "react";
import { usePipelineActions, type AzioneEseguibile } from "@/hooks/usePipelineActions";
import { apriDocumentoStampa } from "@/lib/documento-generator";

type Props = {
  commessa_id: string;
  azienda_id: string;
  cliente?: string;
  cliente_indirizzo?: string;
  totale?: number;
  commessa_code?: string;
};

export default function PannelloAzioniContestuali({
  commessa_id, azienda_id, cliente, cliente_indirizzo, totale, commessa_code,
}: Props) {
  const { fase, azioni, log, loading, executing, esegui, eseguiTutte } = usePipelineActions(commessa_id, azienda_id);
  const [showLog, setShowLog] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  if (loading) {
    return <div style={{ padding: 16, color: "#94A3B8", fontSize: 12 }}>Caricamento azioni…</div>;
  }

  if (!fase) {
    return (
      <div style={{
        padding: 16, background: "#FEF3C7", border: "1px solid #FBBF24",
        borderRadius: 10, fontSize: 12, color: "#78350F",
      }}>
        ⚠️ Pipeline non configurata per questa azienda. Vai in Impostazioni → Pipeline fasi.
      </div>
    );
  }

  if (azioni.length === 0) {
    return (
      <div style={{
        padding: 16, background: "#F8FAFC", border: "1px solid #E2E8F0",
        borderRadius: 10, fontSize: 12, color: "#64748B",
      }}>
        Nessuna azione configurata per la fase <b style={{ color: fase.colore }}>{fase.nome}</b>.
        Vai in Impostazioni → Pipeline fasi per configurare.
      </div>
    );
  }

  // Raggruppa azioni per categoria
  const groups: Record<string, AzioneEseguibile[]> = {};
  azioni.forEach(a => {
    const k = a.categoria;
    if (!groups[k]) groups[k] = [];
    groups[k].push(a);
  });

  const categoriaOrdine: Array<keyof typeof groups> = ["interno", "documento", "evento", "messaggio"];
  const categoriaLabel: Record<string, string> = {
    interno: "Azioni sistema",
    documento: "Documenti",
    evento: "Eventi agenda",
    messaggio: "Messaggi cliente",
  };

  async function handleEsegui(a: AzioneEseguibile) {
    const r = await esegui(a.codice);
    if (!r) { setLastResult({ esito: "errore", msg: "Errore RPC" }); return; }
    setLastResult(r);

    // Se l'azione è un documento da generare, apre stampa
    if (r.esito === "successo" && r.tipo === "documento_da_generare" && r.template) {
      apriDocumentoStampa({
        template_codice: r.template,
        azienda_id,
        commessa_id,
        variabili: {
          cliente: cliente ?? "",
          commessa_code: commessa_code ?? "",
          data: new Date().toLocaleDateString("it-IT"),
          totale: totale?.toFixed(2) ?? "0.00",
          imponibile: totale ? (totale / 1.10).toFixed(2) : "0.00",
          iva: totale ? (totale - totale / 1.10).toFixed(2) : "0.00",
          indirizzo: cliente_indirizzo ?? "",
        },
      });
    }

    // Se è un messaggio whatsapp, apre wa.me
    if (r.esito === "successo" && r.tipo === "messaggio_da_inviare" && r.template) {
      const testo = encodeURIComponent(`Ciao ${cliente}, ti scrivo da MASTRO`);
      window.open(`https://wa.me/?text=${testo}`, "_blank");
    }
  }

  async function handleEseguiTutte() {
    if (!confirm(`Eseguire tutte le ${azioni.length} azioni della fase "${fase.nome}"?`)) return;
    const r = await eseguiTutte();
    if (r) setLastResult({ esito: "successo", msg: `${r.azioni_eseguite} azioni eseguite` });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Header fase */}
      <div style={{
        background: `${fase.colore}10`, border: `1.5px solid ${fase.colore}`,
        borderRadius: 12, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, background: fase.colore,
          color: "#fff", fontWeight: 900, fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {fase.ordine}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#64748B", letterSpacing: 1, textTransform: "uppercase" }}>
            Fase corrente
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.3 }}>
            {fase.nome}
          </div>
          {fase.descrizione && (
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 1, lineHeight: 1.3 }}>
              {fase.descrizione}
            </div>
          )}
        </div>
        <button onClick={handleEseguiTutte} disabled={executing === "__all__"} style={{
          padding: "9px 14px", background: fase.colore, color: "#fff", border: "none",
          borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: executing === "__all__" ? "wait" : "pointer",
          letterSpacing: 0.4, textTransform: "uppercase",
          boxShadow: `0 2px 0 0 ${fase.colore}`,
        }}>
          {executing === "__all__" ? "⏳" : "⚡ Tutte"}
        </button>
      </div>

      {/* Risultato ultima esecuzione */}
      {lastResult && (
        <div style={{
          padding: 11, borderRadius: 9,
          background: lastResult.esito === "successo" ? "#ECFDF5" : "#FEF2F2",
          border: `1px solid ${lastResult.esito === "successo" ? "#86EFAC" : "#FCA5A5"}`,
          color: lastResult.esito === "successo" ? "#065F46" : "#7F1D1D",
          fontSize: 11.5, fontWeight: 600, lineHeight: 1.4,
        }}>
          {lastResult.esito === "successo" ? "✓ " : "✗ "}
          {lastResult.msg ?? lastResult.errore ?? "Eseguito"}
          <button onClick={() => setLastResult(null)} style={{
            float: "right", background: "transparent", border: "none", color: "inherit",
            fontSize: 14, cursor: "pointer", marginLeft: 8,
          }}>×</button>
        </div>
      )}

      {/* Gruppi azioni */}
      {categoriaOrdine.map(cat => {
        const items = groups[cat as string];
        if (!items || items.length === 0) return null;
        return (
          <div key={cat as string}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#94A3B8",
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 7,
            }}>
              {categoriaLabel[cat as string]} · {items.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {items.map(a => {
                const lastLog = log.find(l => l.azione_codice === a.codice);
                const isExecuting = executing === a.codice;
                const isDone = lastLog?.esito === "successo";

                return (
                  <button
                    key={a.codice}
                    onClick={() => handleEsegui(a)}
                    disabled={isExecuting}
                    style={{
                      padding: "11px 13px", background: "#fff",
                      border: `1.5px solid ${isDone ? "#86EFAC" : isExecuting ? a.colore : "#E2E8F0"}`,
                      borderRadius: 10, cursor: isExecuting ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: 11,
                      textAlign: "left",
                      transition: "border .15s",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isDone ? "#10B981" : a.colore,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, flexShrink: 0,
                    }}>
                      {isExecuting ? "⏳" : isDone ? "✓" : (a.icona ? a.icona.charAt(0).toUpperCase() : "›")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12.5, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {a.nome}
                        {a.obbligatorio_per_legge && (
                          <span style={{
                            background: "#FEE2E2", color: "#991B1B",
                            padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
                          }}>OBBLIG.</span>
                        )}
                        {isDone && (
                          <span style={{
                            background: "#D1FAE5", color: "#065F46",
                            padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 800,
                          }}>FATTO</span>
                        )}
                      </div>
                      {a.descrizione && (
                        <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, lineHeight: 1.3 }}>
                          {a.descrizione}
                        </div>
                      )}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: 16 }}>›</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Storico esecuzioni */}
      {log.length > 0 && (
        <div>
          <button onClick={() => setShowLog(!showLog)} style={{
            width: "100%", padding: "10px 12px", background: "#F8FAFC",
            border: "1px solid #E2E8F0", borderRadius: 9,
            fontSize: 11, fontWeight: 700, color: "#64748B", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>📋 Storico azioni eseguite ({log.length})</span>
            <span>{showLog ? "▴" : "▾"}</span>
          </button>
          {showLog && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {log.slice(0, 20).map((l, i) => (
                <div key={i} style={{
                  background: "#fff", border: "1px solid #F1F5F9", borderRadius: 8,
                  padding: "7px 10px", display: "flex", alignItems: "center", gap: 8, fontSize: 10.5,
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: l.esito === "successo" ? "#10B981" : l.esito === "errore" ? "#EF4444" : "#94A3B8",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900, flexShrink: 0,
                  }}>
                    {l.esito === "successo" ? "✓" : l.esito === "errore" ? "✗" : "·"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#0F1B2D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.azione_nome}
                    </div>
                    <div style={{ fontSize: 9, color: "#94A3B8" }}>
                      {l.fase_codice} · {new Date(l.eseguita_at).toLocaleString("it-IT")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
