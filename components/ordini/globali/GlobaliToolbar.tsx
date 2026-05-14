"use client";

export type GroupingKey = "stato" | "fornitore" | "commessa" | "data";
export type CardStyle = "A" | "B" | "C";

interface Props {
  raggruppa: GroupingKey;
  onRaggruppa: (k: GroupingKey) => void;
  cardStyle: CardStyle;
  onCardStyle: (s: CardStyle) => void;
  nFiltriAttivi: number;
  onOpenFiltri: () => void;
}

const TABS: { key: GroupingKey; label: string }[] = [
  { key: "stato", label: "Stato" },
  { key: "fornitore", label: "Fornit." },
  { key: "commessa", label: "Commessa" },
  { key: "data", label: "Data" },
];

const STYLES: { key: CardStyle; icon: JSX.Element }[] = [
  {
    key: "A",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="8" height="8" />
        <rect x="13" y="3" width="8" height="8" />
        <rect x="3" y="13" width="8" height="8" />
        <rect x="13" y="13" width="8" height="8" />
      </svg>
    ),
  },
];

export default function GlobaliToolbar(p: Props) {
  return (
    <div style={{
      margin: "11px 14px 0", background: "#fff", borderRadius: 13,
      padding: 7, display: "flex", alignItems: "center", gap: 6,
      boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
    }}>
      <div onClick={p.onOpenFiltri} title="Filtri avanzati" style={{
        width: 30, height: 30, borderRadius: 7, background: "#F4F6FA",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#5A6478", flexShrink: 0, cursor: "pointer", position: "relative"
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {p.nFiltriAttivi > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4, width: 14, height: 14,
            background: "#28A0A0", color: "#fff", borderRadius: "50%",
            fontSize: 8, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center",
            border: "1.5px solid #fff"
          }}>{p.nFiltriAttivi}</div>
        )}
      </div>

      <div style={{ width: 1, height: 18, background: "#E0E5EE", flexShrink: 0 }} />

      <div style={{
        display: "flex", gap: 1, flex: 1, minWidth: 0,
        background: "#F4F6FA", borderRadius: 7, padding: 2, overflow: "hidden"
      }}>
        {TABS.map((t) => {
          const act = p.raggruppa === t.key;
          return (
            <div key={t.key} onClick={() => p.onRaggruppa(t.key)} style={{
              flex: 1, padding: "6px 4px", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.4px", textAlign: "center",
              color: act ? "#1A2A47" : "#5A6478", borderRadius: 5,
              textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
              background: act ? "#fff" : "transparent",
              boxShadow: act ? "0 1px 2px rgba(0,0,0,0.08)" : undefined
            }}>{t.label}</div>
          );
        })}
      </div>

      <div style={{ width: 1, height: 18, background: "#E0E5EE", flexShrink: 0 }} />

      <div onClick={() => p.onCardStyle(p.cardStyle === "A" ? "B" : p.cardStyle === "B" ? "C" : "A")} title="Stile card" style={{
        width: 30, height: 30, borderRadius: 7, background: "#F4F6FA",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#5A6478", flexShrink: 0, cursor: "pointer"
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          {p.cardStyle === "A" && (
            <>
              <rect x="3" y="3" width="8" height="8" />
              <rect x="13" y="3" width="8" height="8" />
              <rect x="3" y="13" width="8" height="8" />
              <rect x="13" y="13" width="8" height="8" />
            </>
          )}
          {p.cardStyle === "B" && (
            <>
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <line x1="7" y1="12" x2="10" y2="12" />
              <line x1="14" y1="12" x2="17" y2="12" />
            </>
          )}
          {p.cardStyle === "C" && (
            <>
              <rect x="3" y="3" width="18" height="8" rx="1" />
              <line x1="3" y1="15" x2="9" y2="15" />
              <line x1="3" y1="19" x2="9" y2="19" />
              <line x1="13" y1="15" x2="21" y2="15" />
              <line x1="13" y1="19" x2="21" y2="19" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
