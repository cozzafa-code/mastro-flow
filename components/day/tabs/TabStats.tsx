"use client";

export function TabStats() {
  return (
    <div style={{
      flex: 1, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14,
      background: "#F4F6F5",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(145deg, #6BD9B0 0%, #1D9E75 55%, #0F8060 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
        boxShadow: "0 8px 22px rgba(29,158,117,0.4)",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 18V10M11 18V6M16 18V13M21 18V8"/></svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>
        Stats & Pattern
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "#5A7878",
        textAlign: "center", maxWidth: 280, lineHeight: 1.5,
      }}>
        La tua giornata, settimana, mese in numeri. Ore deep, energia per fascia oraria, top commesse, pattern automatici dopo 3 mesi.
      </div>
      <div style={{
        marginTop: 6,
        padding: "6px 12px", borderRadius: 99,
        background: "rgba(29,158,117,0.14)",
        color: "#04342C",
        fontSize: 10, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
      }}>
        Modulo 4 · in arrivo
      </div>
    </div>
  );
}
