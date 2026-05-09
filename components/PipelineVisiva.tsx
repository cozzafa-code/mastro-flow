// ════════════════════════════════════════════════════════════
// PIPELINE VISIVA · 8 step CLIENTE→COLLAUDO basata su commesse.fase
// Unica fonte di verità: useFasePipeline (DB)
// ════════════════════════════════════════════════════════════
"use client";
import { useFasePipeline } from "@/hooks/useFasePipeline";

const STEPS = [
  { id: 1, codice: "cliente",   label: "CLIENTE",  color: "#1E3A5F" },
  { id: 2, codice: "misure",    label: "MISURE",   color: "#0EA5E9" },
  { id: 3, codice: "preventivo", label: "PREV.",   color: "#28A0A0" },
  { id: 4, codice: "firma",     label: "FIRMA",    color: "#10B981" },
  { id: 5, codice: "ordine",    label: "ORD.",     color: "#F59E0B" },
  { id: 6, codice: "produzione", label: "PROD.",   color: "#8B5CF6" },
  { id: 7, codice: "montaggio", label: "MONT.",    color: "#3B82F6" },
  { id: 8, codice: "collaudo",  label: "COLL.",    color: "#065F46" },
];

export default function PipelineVisiva({ commessa_id }: { commessa_id: string }) {
  const { fase, loading } = useFasePipeline(commessa_id);

  if (loading) {
    return (
      <div style={{ padding: 14, fontSize: 11, color: "#94A3B8" }}>
        Caricamento pipeline…
      </div>
    );
  }

  const currentIdx = fase?.fase_pipeline_index ?? 1;

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0",
      padding: "12px 10px", margin: "0 12px",
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: "#94A3B8",
        letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4,
      }}>
        Pipeline
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0,
      }}>
        {STEPS.map((s, i) => {
          const done = s.id < currentIdx;
          const current = s.id === currentIdx;
          const future = s.id > currentIdx;
          
          return (
            <>
              <div key={s.id} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                flex: "0 0 auto", minWidth: 0,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: done ? "#10B981" : current ? s.color : "#E2E8F0",
                  color: done || current ? "#fff" : "#94A3B8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: done ? 12 : 11, fontWeight: 900,
                  border: current ? `2px solid ${s.color}` : "none",
                  boxShadow: current ? `0 0 0 3px ${s.color}20` : "none",
                  flexShrink: 0,
                }}>
                  {done ? "✓" : s.id}
                </div>
                <div style={{
                  fontSize: 8.5, fontWeight: 700,
                  color: done || current ? "#0F1B2D" : "#94A3B8",
                  letterSpacing: 0.3, whiteSpace: "nowrap",
                }}>
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div key={`bar-${i}`} style={{
                  flex: 1, height: 2,
                  background: done ? "#10B981" : "#E2E8F0",
                  margin: "0 1px", marginBottom: 14,
                }} />
              )}
            </>
          );
        })}
      </div>
    </div>
  );
}
