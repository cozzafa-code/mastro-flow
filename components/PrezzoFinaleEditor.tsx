// ════════════════════════════════════════════════════════════
// PREZZO FINALE EDITOR · sconto/maggiorazione live
// ════════════════════════════════════════════════════════════
// Permette al serramentista di applicare sconto o maggiorazione
// con visualizzazione live del margine reale.
// NON tocca firma_tokens, preventivo_tokens, snapshot.

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  commessa_id: string;
  prezzo_base_eur: number;       // prezzo prima sconto/maggiorazione
  costo_reale_eur: number;       // costo fornitore + posa (per margine)
  initial_sconto_eur?: number;
  initial_sconto_motivo?: string;
  onUpdate?: (prezzo_finale: number, margine_pct: number) => void;
};

const MOTIVI_PRESET = [
  "Cliente abituale",
  "Volume importante",
  "Pagamento anticipato",
  "Posa difficile",
  "Trasferta lunga",
  "Lavorazione urgente",
  "Personalizzato",
];

const SOGLIA_MARGINE_OK = 25;     // sopra 25% → verde
const SOGLIA_MARGINE_WARN = 15;   // 15-25% → ambra
                                   // sotto 15% → rosso (alert visivo, non blocca)

export default function PrezzoFinaleEditor({
  commessa_id,
  prezzo_base_eur,
  costo_reale_eur,
  initial_sconto_eur = 0,
  initial_sconto_motivo = "",
  onUpdate,
}: Props) {
  const [tipo, setTipo] = useState<"sconto" | "maggior">(initial_sconto_eur < 0 ? "sconto" : initial_sconto_eur > 0 ? "maggior" : "sconto");
  const [modo, setModo] = useState<"eur" | "pct">("eur");
  const [valore, setValore] = useState<number>(Math.abs(initial_sconto_eur));
  const [motivo, setMotivo] = useState<string>(initial_sconto_motivo);
  const [motivoCustom, setMotivoCustom] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // ─── CALCOLI ─────────────────────────────────
  const segno = tipo === "sconto" ? -1 : 1;
  const variazione_eur = modo === "eur"
    ? valore * segno
    : (prezzo_base_eur * valore / 100) * segno;
  const prezzo_finale = Math.max(0, prezzo_base_eur + variazione_eur);
  const variazione_pct = prezzo_base_eur > 0 ? (variazione_eur / prezzo_base_eur) * 100 : 0;
  const margine_eur = prezzo_finale - costo_reale_eur;
  const margine_pct = prezzo_finale > 0 ? (margine_eur / prezzo_finale) * 100 : 0;

  const stato_margine: "ok" | "warn" | "bad" =
    margine_pct >= SOGLIA_MARGINE_OK ? "ok" :
    margine_pct >= SOGLIA_MARGINE_WARN ? "warn" : "bad";

  // ─── SALVA ───────────────────────────────────
  async function salva() {
    setSaving(true);
    const motivo_finale = motivo === "Personalizzato" ? motivoCustom : motivo;
    const { error } = await supabase
      .from("commesse")
      .update({
        sconto_eur: variazione_eur,
        sconto_pct: variazione_pct,
        sconto_motivo: motivo_finale || null,
        prezzo_finale_eur: prezzo_finale,
        margine_atteso_pct: margine_pct,
        sconto_modificato_at: new Date().toISOString(),
      })
      .eq("id", commessa_id);
    if (error) {
      console.error("[PrezzoFinaleEditor] save error", error);
    } else {
      setSavedAt(new Date());
      onUpdate?.(prezzo_finale, margine_pct);
    }
    setSaving(false);
  }

  const fmt = (n: number) => new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const fmt_pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14 }}>

      {/* TIPO: sconto vs maggiorazione */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setTipo("sconto")}
          style={{
            flex: 1, padding: "9px 10px", borderRadius: 9,
            background: tipo === "sconto" ? "#1E3A5F" : "#fff",
            color: tipo === "sconto" ? "#fff" : "#475569",
            border: tipo === "sconto" ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
            fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          Sconto al cliente
        </button>
        <button
          onClick={() => setTipo("maggior")}
          style={{
            flex: 1, padding: "9px 10px", borderRadius: 9,
            background: tipo === "maggior" ? "#1E3A5F" : "#fff",
            color: tipo === "maggior" ? "#fff" : "#475569",
            border: tipo === "maggior" ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
            fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          Maggiorazione
        </button>
      </div>

      {/* MODO: euro vs percentuale */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setModo("eur")}
          style={{
            padding: "7px 14px", borderRadius: 7,
            background: modo === "eur" ? "#0F1B2D" : "#F1F5F9",
            color: modo === "eur" ? "#fff" : "#475569",
            border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >€</button>
        <button
          onClick={() => setModo("pct")}
          style={{
            padding: "7px 14px", borderRadius: 7,
            background: modo === "pct" ? "#0F1B2D" : "#F1F5F9",
            color: modo === "pct" ? "#fff" : "#475569",
            border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >%</button>
        <input
          type="number"
          value={valore || ""}
          onChange={(e) => setValore(parseFloat(e.target.value) || 0)}
          placeholder={modo === "eur" ? "100" : "10"}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1.5px solid #CBD5E1", fontSize: 14, fontWeight: 700,
            color: "#0F1B2D", textAlign: "right",
            fontVariantNumeric: "tabular-nums", outline: "none",
          }}
        />
      </div>

      {/* MOTIVO */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 6px" }}>
        Motivo
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
        {MOTIVI_PRESET.map(m => (
          <button
            key={m}
            onClick={() => setMotivo(m)}
            style={{
              padding: "6px 10px", borderRadius: 7,
              background: motivo === m ? "#1E3A5F" : "#fff",
              color: motivo === m ? "#fff" : "#475569",
              border: motivo === m ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
              fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {motivo === "Personalizzato" && (
        <input
          type="text"
          value={motivoCustom}
          onChange={(e) => setMotivoCustom(e.target.value)}
          placeholder="Scrivi il motivo..."
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1.5px solid #CBD5E1", fontSize: 12,
            color: "#0F1B2D", outline: "none", marginBottom: 10,
          }}
        />
      )}

      {/* RIEPILOGO LIVE */}
      <div style={{
        background: "#0F1B2D", color: "#fff", borderRadius: 11, padding: 13, marginTop: 8,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
          <span>Prezzo base</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>€ {fmt(prezzo_base_eur)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", fontSize: 11.5, color: tipo === "sconto" ? "#86EFAC" : "#FCA5A5", fontWeight: 700 }}>
          <span>{tipo === "sconto" ? "Sconto" : "Maggiorazione"}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{variazione_eur >= 0 ? "+" : ""}€ {fmt(variazione_eur)} ({fmt_pct(variazione_pct)})</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0 4px", fontSize: 15, fontWeight: 900, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 6 }}>
          <span>Prezzo finale</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 22, letterSpacing: -0.5 }}>€ {fmt(prezzo_finale)}</span>
        </div>

        {/* MARGINE LIVE */}
        <div style={{
          marginTop: 11, padding: "11px 12px",
          background: stato_margine === "ok" ? "rgba(16,185,129,0.18)" : stato_margine === "warn" ? "rgba(245,158,11,0.20)" : "rgba(239,68,68,0.22)",
          borderRadius: 9,
          border: stato_margine === "bad" ? "1px solid rgba(252,165,165,0.5)" : "none",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800,
            color: stato_margine === "ok" ? "#86EFAC" : stato_margine === "warn" ? "#FCD34D" : "#FCA5A5",
            letterSpacing: 0.6, textTransform: "uppercase",
          }}>
            Margine reale {stato_margine === "ok" ? "· sano" : stato_margine === "warn" ? "· attenzione" : "· sotto soglia"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums", letterSpacing: -0.4, marginTop: 2 }}>
            € {fmt(margine_eur)} <span style={{ fontSize: 14, opacity: 0.8 }}>({fmt_pct(margine_pct)})</span>
          </div>
          {stato_margine === "bad" && (
            <div style={{ fontSize: 10, color: "#FECACA", marginTop: 4, fontWeight: 600, lineHeight: 1.4 }}>
              ⚠ Sotto {SOGLIA_MARGINE_WARN}% perdi soldi. Considera maggiorazione o tagli su altri costi.
            </div>
          )}
        </div>
      </div>

      {/* SAVE */}
      <button
        onClick={salva}
        disabled={saving}
        style={{
          width: "100%", marginTop: 12, padding: 12, borderRadius: 10,
          background: saving ? "#CBD5E1" : "#065F46",
          color: "#fff", border: "none", fontSize: 12, fontWeight: 800,
          letterSpacing: 0.4, textTransform: "uppercase",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Salvo..." : savedAt ? "✓ Salvato · aggiorna" : "Applica e salva"}
      </button>
      {savedAt && (
        <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 6, textAlign: "center", fontWeight: 600 }}>
          Salvato alle {savedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}
