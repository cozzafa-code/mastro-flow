// ════════════════════════════════════════════════════════════
// RDP FORNITORE · COMPONENTE INLINE
// ════════════════════════════════════════════════════════════
// Workflow showroom completo:
// 1. Richiedi prezzo a fornitore (genera testo email/WhatsApp)
// 2. Carica PDF risposta fornitore
// 3. AI legge PDF → estrae voci e costo
// 4. Calcola margine reale vs prezzo cliente

"use client";
import { useState, useEffect, useRef } from "react";
import {
  creaRDP, listRDPByCommessa, caricaPDFRisposta,
  salvaRisultatoAI, eliminaRDP,
  type RDPRow,
} from "@/lib/rdp-supabase";
import { leggiPDFFornitore, generaTestoRichiestaFornitore } from "@/lib/rdp-pdf-reader";

type Props = {
  azienda_id: string;
  azienda_nome: string;
  commessa_id: string;
  cliente_nome: string;
  citta: string;
  vani: Array<{ tipo: string; larghezza_mm: number; altezza_mm: number; note?: string }>;
  prezzo_vendita_eur: number;
  onMargineCalcolato?: (margine_pct: number, costo_totale: number) => void;
};

const FORNITORI_PRESET = [
  { nome: "Schüco", sistemi: ["AWS 75 BS.SI", "AWS 90 BS.SI+", "FWS 50.SI"] },
  { nome: "Aluplast", sistemi: ["Ideal 7000", "Ideal 8000", "Ideal 4000"] },
  { nome: "Internorm", sistemi: ["KF 410", "HF 410", "KV 440"] },
  { nome: "Reynaers", sistemi: ["MasterLine 8", "SlimLine 38"] },
  { nome: "Albertini", sistemi: ["Domus 88", "Linear 92"] },
  { nome: "Altro", sistemi: [] },
];

export default function RDPFornitoreInline({
  azienda_id, azienda_nome, commessa_id, cliente_nome, citta, vani,
  prezzo_vendita_eur, onMargineCalcolato,
}: Props) {
  const [rdpList, setRdpList] = useState<RDPRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [fornitoreNome, setFornitoreNome] = useState("Schüco");
  const [sistemaScelto, setSistemaScelto] = useState("");
  const [textGen, setTextGen] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ─── carica RDP all'avvio ────────────────────────────────
  useEffect(() => {
    refresh();
  }, [commessa_id]);

  async function refresh() {
    setLoading(true);
    const list = await listRDPByCommessa(commessa_id);
    setRdpList(list);
    setLoading(false);
  }

  // ─── crea nuova RDP ──────────────────────────────────────
  async function handleNuovaRDP() {
    const newRdp = await creaRDP({
      azienda_id, commessa_id,
      fornitore_nome: fornitoreNome,
      sistema_richiesto: sistemaScelto || undefined,
      num_vani: vani.length,
    });
    if (newRdp) {
      const testo = generaTestoRichiestaFornitore({
        azienda_nome, cliente_nome, citta, vani,
        sistema_richiesto: sistemaScelto || undefined,
      });
      setTextGen(testo);
      await refresh();
    }
  }

  // ─── upload PDF + lettura AI ─────────────────────────────
  async function handleUploadPDF(rdp_id: string, file: File) {
    setLoading(true);
    // 1. upload
    const { pdf_url, ok } = await caricaPDFRisposta(rdp_id, file, prezzo_vendita_eur);
    if (!ok || !pdf_url) {
      alert("Upload PDF fallito");
      setLoading(false);
      return;
    }
    await refresh();

    // 2. lettura AI
    const aiResult = await leggiPDFFornitore(pdf_url);
    if (!aiResult) {
      alert("AI non è riuscita a leggere il PDF. Inserisci i costi manualmente.");
      setLoading(false);
      return;
    }

    // 3. salva risultato + calcola margine
    await salvaRisultatoAI(rdp_id, {
      voci_estratte: aiResult.voci,
      costo_fornitore_eur: aiResult.costo_fornitore_eur,
      costo_posa_eur: aiResult.costo_posa_stimato_eur,
      prezzo_vendita_eur,
      ai_confidence: aiResult.confidence,
    });

    const costo_totale = aiResult.costo_fornitore_eur + aiResult.costo_posa_stimato_eur;
    const margine_pct = prezzo_vendita_eur > 0 ? ((prezzo_vendita_eur - costo_totale) / prezzo_vendita_eur) * 100 : 0;
    onMargineCalcolato?.(margine_pct, costo_totale);

    await refresh();
    setLoading(false);
  }

  // ─── copia testo per email/whatsapp ──────────────────────
  async function copiaTesto(testo: string) {
    try {
      await navigator.clipboard.writeText(testo);
      alert("Testo copiato. Ora incollalo in email o WhatsApp del fornitore.");
    } catch {
      alert("Copia non riuscita. Seleziona manualmente il testo.");
    }
  }

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) : "—";

  const fornitoreObj = FORNITORI_PRESET.find(f => f.nome === fornitoreNome);

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase" }}>
            Acquisto fornitore · showroom
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.2, marginTop: 2 }}>
            Richieste prezzo · {rdpList.length}
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(s => !s)}
          style={{
            padding: "8px 12px", borderRadius: 8,
            background: showNewForm ? "#fff" : "#1E3A5F",
            color: showNewForm ? "#475569" : "#fff",
            border: showNewForm ? "1px solid #CBD5E1" : "none",
            fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          {showNewForm ? "Chiudi" : "+ Nuova richiesta"}
        </button>
      </div>

      {/* FORM nuova RDP */}
      {showNewForm && (
        <div style={{ background: "#F8FAFC", border: "1px solid #1E3A5F", borderRadius: 11, padding: 12, marginBottom: 11 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 8 }}>
            Nuova richiesta a fornitore
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Fornitore</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
            {FORNITORI_PRESET.map(f => (
              <button
                key={f.nome}
                onClick={() => { setFornitoreNome(f.nome); setSistemaScelto(""); }}
                style={{
                  padding: "6px 11px", borderRadius: 7,
                  background: fornitoreNome === f.nome ? "#1E3A5F" : "#fff",
                  color: fornitoreNome === f.nome ? "#fff" : "#475569",
                  border: fornitoreNome === f.nome ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >
                {f.nome}
              </button>
            ))}
          </div>

          {fornitoreObj && fornitoreObj.sistemi.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", marginBottom: 5 }}>Sistema (opzionale)</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
                {fornitoreObj.sistemi.map(s => (
                  <button
                    key={s}
                    onClick={() => setSistemaScelto(s === sistemaScelto ? "" : s)}
                    style={{
                      padding: "5px 9px", borderRadius: 6,
                      background: sistemaScelto === s ? "#0F1B2D" : "#fff",
                      color: sistemaScelto === s ? "#fff" : "#475569",
                      border: sistemaScelto === s ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleNuovaRDP}
            style={{
              width: "100%", padding: 10, borderRadius: 9,
              background: "#1E3A5F", color: "#fff", border: "none",
              fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
            }}
          >
            Crea richiesta
          </button>

          {textGen && (
            <div style={{ marginTop: 11, padding: 11, background: "#0F1B2D", color: "#cbe0f5", borderRadius: 9, fontFamily: "monospace", fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {textGen}
              <button
                onClick={() => copiaTesto(textGen)}
                style={{
                  width: "100%", marginTop: 9, padding: 8, borderRadius: 7,
                  background: "#065F46", color: "#fff", border: "none",
                  fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: 0.4, textTransform: "uppercase",
                }}
              >
                Copia testo per email / WhatsApp
              </button>
            </div>
          )}
        </div>
      )}

      {/* LISTA RDP */}
      {rdpList.length === 0 && !showNewForm && (
        <div style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: 18, fontWeight: 600 }}>
          Nessuna richiesta. Tap "+ Nuova richiesta" per iniziare.
        </div>
      )}

      {rdpList.map(rdp => (
        <div key={rdp.id} style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 11,
          padding: 12, marginBottom: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "#5B21B6", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, flexShrink: 0,
            }}>
              {rdp.fornitore_nome.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.2 }}>
                {rdp.fornitore_nome} {rdp.sistema_richiesto ? `· ${rdp.sistema_richiesto}` : ""}
              </div>
              <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 1, fontWeight: 600 }}>
                {rdp.num_vani ?? "—"} vani · inviata {new Date(rdp.inviata_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
              </div>
            </div>
            <span style={{
              fontSize: 8.5, fontWeight: 800, padding: "3px 7px", borderRadius: 5,
              background: rdp.stato === "letta" ? "#D1FAE5" : rdp.stato === "ricevuta" ? "#DBEAFE" : "#FEF3C7",
              color: rdp.stato === "letta" ? "#065F46" : rdp.stato === "ricevuta" ? "#1E40AF" : "#92400E",
              letterSpacing: 0.4, textTransform: "uppercase",
            }}>
              {rdp.stato}
            </span>
          </div>

          {/* PDF caricato */}
          {rdp.pdf_url && (
            <div style={{
              padding: "8px 11px", background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: 8, display: "flex", alignItems: "center", gap: 9, marginBottom: 8,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: "#1E40AF",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
              }}>
                P
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1E40AF", letterSpacing: -0.1 }}>
                  {rdp.pdf_nome ?? "PDF caricato"}
                </div>
                <div style={{ fontSize: 9, color: "#1E5FA8", marginTop: 1, fontWeight: 600 }}>
                  {rdp.pdf_size_kb ? `${rdp.pdf_size_kb} KB` : ""}
                  {rdp.ai_confidence != null ? ` · AI ${Math.round(rdp.ai_confidence * 100)}%` : ""}
                </div>
              </div>
              <a href={rdp.pdf_url} target="_blank" rel="noreferrer" style={{
                fontSize: 9.5, fontWeight: 800, color: "#1E40AF", textDecoration: "none",
                padding: "5px 9px", border: "1px solid #BFDBFE", borderRadius: 6,
              }}>
                Apri
              </a>
            </div>
          )}

          {/* CONFRONTO COSTI */}
          {rdp.stato === "letta" && rdp.costo_totale_eur != null && (
            <div style={{
              background: "#0F1B2D", color: "#fff",
              borderRadius: 9, padding: "10px 11px", marginBottom: 8,
            }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
                Confronto fornitore vs cliente
              </div>
              <Row label={`Costo ${rdp.fornitore_nome}`} value={`€ ${fmt(rdp.costo_fornitore_eur)}`} />
              <Row label="+ Posa stimata" value={`€ ${fmt(rdp.costo_posa_eur)}`} />
              <Row label="Costo totale" value={`€ ${fmt(rdp.costo_totale_eur)}`} />
              <Row label="Vendi al cliente" value={`€ ${fmt(rdp.prezzo_vendita_eur)}`} />
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                color: "#6EE7B7", paddingTop: 7,
                borderTop: "1px solid rgba(255,255,255,0.15)",
                marginTop: 5, fontSize: 12, fontWeight: 800,
              }}>
                <span>Margine reale</span>
                <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: -0.2 }}>
                  € {fmt(rdp.margine_eur)} · {rdp.margine_pct?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* AZIONI */}
          <div style={{ display: "flex", gap: 6 }}>
            {rdp.stato === "inviata" && (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  ref={(el) => { fileInputRefs.current[rdp.id] = el; }}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadPDF(rdp.id, f);
                  }}
                />
                <button
                  onClick={() => fileInputRefs.current[rdp.id]?.click()}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "8px 11px", borderRadius: 7,
                    background: "#1E3A5F", color: "#fff", border: "none",
                    fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
                  }}
                >
                  {loading ? "Caricamento..." : "Carica PDF risposta"}
                </button>
              </>
            )}
            <button
              onClick={async () => {
                if (confirm(`Elimina richiesta a ${rdp.fornitore_nome}?`)) {
                  await eliminaRDP(rdp.id);
                  await refresh();
                }
              }}
              style={{
                padding: "8px 11px", borderRadius: 7,
                background: "#fff", color: "#991B1B", border: "1px solid #FCA5A5",
                fontSize: 10, fontWeight: 700, cursor: "pointer",
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10.5, color: "rgba(255,255,255,0.82)", fontVariantNumeric: "tabular-nums" }}>
      <span>{label}</span>
      <b style={{ color: "#fff", fontWeight: 700 }}>{value}</b>
    </div>
  );
}
