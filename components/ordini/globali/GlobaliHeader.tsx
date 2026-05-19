"use client";

interface Props {
  totale: number;
  inTransito: number;
  inRitardo: number;
  valoreAperto: number;
  query: string;
  onQuery: (v: string) => void;
  onClose: () => void;
  onOpenStats: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
}

export default function GlobaliHeader(p: Props) {
  return (
    <>
      <div style={{
        position: "sticky", top: 0,
        background: "linear-gradient(180deg, #1A2A47 0%, #243558 100%)",
        color: "#fff", padding: "12px 14px", zIndex: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
          <div onClick={p.onClose} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 17, color: "#fff", flexShrink: 0, cursor: "pointer"
          }}>✕</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: "#E8B05C", textTransform: "uppercase", lineHeight: 1
            }}>Centro Ordini</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 3, lineHeight: 1 }}>
              {p.totale} ordini
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <HeaderAction onClick={p.onOpenStats} title="Statistiche" bg="rgba(232,176,92,0.25)" color="#E8B05C">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </HeaderAction>
            <HeaderAction onClick={p.onOpenScanner} title="Scanner QR" bg="#28A0A0" color="#fff" boxShadow="0 2px 6px rgba(40,160,160,0.4)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm15 0h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2-2h-2v2h2v-2zm4 0h-2v2h2v-2zm-4 4h2v-2h-2v2z" />
              </svg>
            </HeaderAction>
            <HeaderAction onClick={p.onOpenSettings} title="Impostazioni">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </HeaderAction>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.55)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            placeholder="Cerca ordine, fornitore, prodotto, commessa..."
            style={{
              width: "100%", padding: "10px 12px 10px 36px",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: 10, color: "#fff", fontSize: 13,
              fontFamily: "inherit", fontWeight: 500
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, margin: "12px 14px 0" }}>
        <KpiTile num={p.totale} lbl="Totali" />
        <KpiTile num={p.inTransito} lbl="Transito" variant="warn" />
        <KpiTile num={p.inRitardo} lbl="Ritardo" variant="bad" />
        <KpiTile num={`EUR ${formatK(p.valoreAperto)}`} lbl="Aperto" variant="ok" />
      </div>
    </>
  );
}

function HeaderAction({ children, onClick, title, bg = "rgba(255,255,255,0.1)", color = "#fff", boxShadow }: any) {
  return (
    <div onClick={onClick} title={title} style={{
      width: 34, height: 34, borderRadius: 9, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, cursor: "pointer", boxShadow: boxShadow || undefined
    }}>
      <div style={{ width: 14, height: 14 }}>{children}</div>
    </div>
  );
}

function KpiTile({ num, lbl, variant }: { num: number | string; lbl: string; variant?: "warn" | "bad" | "ok" }) {
  const colors = {
    warn: { bg: "#FBF0DC", fg: "#8B6926" },
    bad: { bg: "#F5DADA", fg: "#A33333" },
    ok: { bg: "#D8EBDF", fg: "#1F5A3F" },
  };
  const c = variant ? colors[variant] : { bg: "#fff", fg: "#1A2A47" };
  return (
    <div style={{
      background: c.bg, padding: "9px 6px", borderRadius: 9,
      textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
    }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{num}</div>
      <div style={{
        fontSize: 8, fontWeight: 700, letterSpacing: "0.5px",
        color: "#5A6478", textTransform: "uppercase", marginTop: 3
      }}>{lbl}</div>
    </div>
  );
}

function formatK(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
}
