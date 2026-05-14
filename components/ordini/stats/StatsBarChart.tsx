"use client";

interface MeseDati { mese: number; spesa: number; }

interface Props {
  annoCorrente: number;
  annoConfronto: number;
  datiCorrente: MeseDati[];
  datiConfronto: MeseDati[];
}

const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export default function StatsBarChart(p: Props) {
  // Trova mese massimo presente in entrambi
  const maxSpesa = Math.max(
    ...p.datiCorrente.map((m) => m.spesa),
    ...p.datiConfronto.map((m) => m.spesa),
    1
  );

  const corrMap = new Map(p.datiCorrente.map((m) => [m.mese, m.spesa]));
  const confMap = new Map(p.datiConfronto.map((m) => [m.mese, m.spesa]));

  // Mostra ultimi 6 mesi (o tutti se anno completo)
  const mesi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div style={{
      margin: "12px 14px 0", background: "#fff", borderRadius: 13,
      padding: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.7px", color: "#1A2A47", textTransform: "uppercase" }}>
          Spesa per mese
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 9.5, fontWeight: 700, color: "#5A6478" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1A2A47" }} />
            {p.annoCorrente}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#E8B05C" }} />
            {p.annoConfronto}
          </span>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-around",
        gap: 4, height: 130, padding: "0 4px", borderBottom: "1px solid #E0E5EE"
      }}>
        {mesi.map((m) => {
          const c1 = corrMap.get(m) || 0;
          const c2 = confMap.get(m) || 0;
          const h1 = (c1 / maxSpesa) * 100;
          const h2 = (c2 / maxSpesa) * 100;
          return (
            <div key={m} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", height: "100%", justifyContent: "flex-end"
            }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "calc(100% - 12px)" }}>
                {c1 > 0 && (
                  <div style={{
                    width: 10, background: "#1A2A47", borderRadius: "3px 3px 0 0",
                    height: `${h1}%`, position: "relative"
                  }} />
                )}
                {c2 > 0 && (
                  <div style={{
                    width: 10, background: "#E8B05C", borderRadius: "3px 3px 0 0",
                    height: `${h2}%`
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: "#5A6478",
                letterSpacing: "0.3px", marginTop: 4
              }}>{MESI[m - 1]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
