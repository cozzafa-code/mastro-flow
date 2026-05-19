"use client";

export type AgendaVista = "giorno" | "settimana" | "timeline" | "mappa" | "personale" | "ai";

interface Props {
  vista: AgendaVista;
  setVista: (v: AgendaVista) => void;
  rangeDa: string;
  rangeA: string;
}

const VISTE: { v: AgendaVista; lbl: string; ico: JSX.Element }[] = [
  { v: "giorno",    lbl: "Giorno",    ico: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg> },
  { v: "settimana", lbl: "Settimana", ico: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M9 5v16M15 5v16"/></svg> },
  { v: "timeline",  lbl: "Timeline",  ico: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg> },
];

const VISTE_EXTRA: { v: AgendaVista; lbl: string }[] = [
  { v: "mappa", lbl: "Mappa" },
  { v: "personale", lbl: "Agenda" },
  { v: "ai", lbl: "AI" },
];

function fmtRange(da: string, a: string): string {
  const dDa = new Date(da + "T00:00:00");
  const dA = new Date(a + "T00:00:00");
  const sameMonth = dDa.getMonth() === dA.getMonth();
  if (sameMonth) {
    return `${dDa.getDate()} - ${dA.getDate()} ${dA.toLocaleDateString("it-IT", { month: "short", year: "numeric" })}`;
  }
  return `${dDa.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} - ${dA.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}`;
}

export function CalendarHeader({ vista, setVista, rangeDa, rangeA }: Props) {
  return (
    <div style={{
      position: "relative",
      padding: "16px 18px 14px",
      color: "#fff",
      background: "linear-gradient(135deg, #2EBFA2 0%, #1E8080 50%, #155555 100%)",
      boxShadow: "0 4px 14px rgba(30,128,128,0.3)",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)",
        pointerEvents: "none",
      }}/>

      <div style={{ position: "relative" }}>
        <div style={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
          opacity: 0.88, marginBottom: 2,
        }}>Calendario operativo</div>
        <div style={{
          fontSize: 22, fontWeight: 900, letterSpacing: -0.5,
          textShadow: "0 2px 5px rgba(0,0,0,0.18)",
        }}>Calendario</div>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.92, marginTop: 2 }}>
          {fmtRange(rangeDa, rangeA)}
        </div>

        {/* toggle 3 viste principali */}
        <div style={{
          marginTop: 12,
          display: "inline-flex", padding: 3, borderRadius: 10,
          background: "rgba(0,0,0,0.20)",
        }}>
          {VISTE.map((v) => {
            const active = vista === v.v;
            return (
              <button key={v.v} type="button" onClick={() => setVista(v.v)}
                style={{
                  padding: "6px 11px", borderRadius: 7, border: 0, cursor: "pointer",
                  background: active ? "#fff" : "transparent",
                  color: active ? "#04342C" : "#fff",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 900, letterSpacing: 0.3,
                  boxShadow: active ? "0 2px 6px rgba(0,0,0,0.18)" : undefined,
                  fontFamily: "inherit",
                }}>
                {v.ico}
                {v.lbl}
              </button>
            );
          })}
        </div>

        {/* viste extra */}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          {VISTE_EXTRA.map((v) => {
            const active = vista === v.v;
            return (
              <button key={v.v} type="button" onClick={() => setVista(v.v)}
                style={{
                  padding: "5px 10px", borderRadius: 99, border: 0, cursor: "pointer",
                  background: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
                  color: active ? "#04342C" : "#fff",
                  fontSize: 10, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
                  fontFamily: "inherit",
                  backdropFilter: active ? undefined : "blur(8px)",
                }}>{v.lbl}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
