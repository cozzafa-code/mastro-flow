"use client";

interface Props {
  annoCorrente: number;
  annoConfronto: number;
  onChangeAnnoCorrente: (a: number) => void;
  onChangeAnnoConfronto: (a: number) => void;
  anniDisponibili: number[];
  onClose: () => void;
  onExport: () => void;
}

export default function StatsHeader(p: Props) {
  return (
    <div style={{
      position: "sticky", top: 0,
      background: "linear-gradient(180deg,#1A2A47 0%,#243558 100%)",
      color: "#fff", padding: "12px 14px 14px", zIndex: 60,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
        <div onClick={p.onClose} style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 17, color: "#fff", flexShrink: 0, cursor: "pointer"
        }}>✕</div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
            color: "#E8B05C", textTransform: "uppercase", lineHeight: 1
          }}>Statistiche Ordini</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 3, lineHeight: 1 }}>
            Confronto multi-anno
          </div>
        </div>
        <div onClick={p.onExport} style={{
          width: 34, height: 34, borderRadius: 9,
          background: "rgba(255,255,255,0.1)", display: "flex",
          alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer"
        }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
        <YearBtn anno={p.annoCorrente} act onChange={(a) => p.onChangeAnnoCorrente(a)} disponibili={p.anniDisponibili} />
        <span style={{
          color: "rgba(255,255,255,0.5)", fontSize: 11,
          fontWeight: 700, letterSpacing: "1px"
        }}>VS</span>
        <YearBtn anno={p.annoConfronto} compare onChange={(a) => p.onChangeAnnoConfronto(a)} disponibili={p.anniDisponibili} />
      </div>
    </div>
  );
}

function YearBtn({ anno, act, compare, onChange, disponibili }: any) {
  const handleClick = () => {
    const idx = disponibili.indexOf(anno);
    const next = disponibili[(idx + 1) % disponibili.length];
    onChange(next);
  };
  const bg = act ? "#E8B05C" : compare ? "rgba(40,160,160,0.2)" : "rgba(255,255,255,0.1)";
  const color = act ? "#1A2A47" : compare ? "#28A0A0" : "rgba(255,255,255,0.65)";
  const border = act ? "#E8B05C" : compare ? "rgba(40,160,160,0.4)" : "transparent";
  return (
    <div onClick={handleClick} style={{
      padding: "7px 14px", background: bg, borderRadius: 8,
      color, fontSize: 13, fontWeight: 800, letterSpacing: "0.5px",
      cursor: "pointer", border: `1.5px solid ${border}`,
      boxShadow: act ? "0 2px 6px rgba(232,176,92,0.35)" : "none"
    }}>{anno}</div>
  );
}
