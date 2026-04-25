"use client";

export function TabTu() {
  return (
    <div style={{
      flex: 1, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14,
      background: "#F4F6F5",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(145deg, #85B7EB 0%, #378ADD 55%, #2369B5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
        boxShadow: "0 8px 22px rgba(55,138,221,0.4)",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>
        Profilo & Settings
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "#5A7878",
        textAlign: "center", maxWidth: 280, lineHeight: 1.5,
      }}>
        Profilo, azienda, abbonamento, notifiche, integrazioni, sicurezza. Tutto quello che ti riguarda.
      </div>
      <div style={{
        marginTop: 6,
        padding: "6px 12px", borderRadius: 99,
        background: "rgba(55,138,221,0.14)",
        color: "#042C53",
        fontSize: 10, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
      }}>
        Modulo 3 · in arrivo
      </div>
    </div>
  );
}
