"use client";

export type DayTab = "day" | "backlog" | "tu" | "stats";

interface Props {
  active: DayTab;
  onChange: (t: DayTab) => void;
  badgeBacklog: number;
}

export function DayTabbar({ active, onChange, badgeBacklog }: Props) {
  const tabs: { id: DayTab; lbl: string; ico: JSX.Element; tone: string }[] = [
    {
      id: "day", lbl: "Day", tone: "teal",
      ico: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2"/>
          <path d="M3 10h18M8 3v4M16 3v4"/>
        </svg>
      ),
    },
    {
      id: "backlog", lbl: "Backlog", tone: "viola",
      ico: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16v14H4zM4 10h16M9 4v4"/>
        </svg>
      ),
    },
    {
      id: "tu", lbl: "Tu", tone: "blu",
      ico: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
    {
      id: "stats", lbl: "Stats", tone: "verde",
      ico: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M6 18V10M11 18V6M16 18V13M21 18V8"/>
        </svg>
      ),
    },
  ];

  const TONE_BG: Record<string,string> = {
    teal:  "linear-gradient(145deg, #3ABDBD, #1E8080)",
    viola: "linear-gradient(145deg, rgba(175,169,236,0.22), rgba(127,119,221,0.12))",
    blu:   "linear-gradient(145deg, rgba(133,183,235,0.22), rgba(55,138,221,0.12))",
    verde: "linear-gradient(145deg, rgba(93,202,165,0.22), rgba(29,158,117,0.12))",
  };
  const TONE_FG: Record<string,string> = {
    teal: "#fff", viola: "#7F77DD", blu: "#378ADD", verde: "#1D9E75",
  };
  const TONE_TXT_ACTIVE: Record<string,string> = {
    teal: "#1E8080", viola: "#7F77DD", blu: "#378ADD", verde: "#1D9E75",
  };

  return (
    <div style={{
      flexShrink: 0,
      display: "grid", gridTemplateColumns: "repeat(4,1fr)",
      padding: "8px 6px 14px",
      background: "#fff",
      borderTop: "1px solid rgba(200,228,228,0.4)",
      boxShadow: "0 -4px 12px rgba(13,31,31,0.04)",
    }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        const isBacklog = t.id === "backlog";
        return (
          <button key={t.id} type="button"
            onClick={() => onChange(t.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "6px 4px", borderRadius: 12, cursor: "pointer",
              border: 0, background: "transparent",
              position: "relative",
              fontFamily: "inherit",
            }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isActive
                ? TONE_BG[t.tone]
                : (t.tone === "teal" ? "rgba(40,160,160,0.10)" : TONE_BG[t.tone]),
              color: isActive
                ? TONE_FG[t.tone]
                : (t.tone === "teal" ? "#1E8080" : TONE_FG[t.tone]),
              boxShadow: isActive
                ? `0 3px 8px ${
                    t.tone === "teal" ? "rgba(40,160,160,0.4)" :
                    t.tone === "viola" ? "rgba(127,119,221,0.4)" :
                    t.tone === "blu" ? "rgba(55,138,221,0.4)" :
                    "rgba(29,158,117,0.4)"}`
                : undefined,
            }}>
              {t.ico}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: 0.3,
              color: isActive ? TONE_TXT_ACTIVE[t.tone] : "#5A7878",
            }}>{t.lbl}</div>
            {isBacklog && badgeBacklog > 0 && (
              <span style={{
                position: "absolute", top: 2, right: "26%",
                minWidth: 16, height: 16, padding: "0 4px",
                borderRadius: 99,
                background: "linear-gradient(145deg, #FF6464, #DC4444)",
                color: "#fff",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff",
                boxShadow: "0 2px 4px rgba(220,68,68,0.4)",
              }}>{badgeBacklog}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
