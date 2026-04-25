"use client";

export function TabBacklog() {
  return (
    <div style={{
      flex: 1, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14,
      background: "#F4F6F5",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(145deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
        boxShadow: "0 8px 22px rgba(127,119,221,0.4)",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v14H4zM4 10h16M9 4v4M15 4v4"/></svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>
        Backlog
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "#5A7878",
        textAlign: "center", maxWidth: 280, lineHeight: 1.5,
      }}>
        Mail, vocali, idee e task non pianificati. Trascina qualunque cosa nel Day per dargli un orario.
      </div>
      <div style={{
        marginTop: 6,
        padding: "6px 12px", borderRadius: 99,
        background: "rgba(127,119,221,0.14)",
        color: "#3C3489",
        fontSize: 10, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
      }}>
        Modulo 2 · in arrivo
      </div>
    </div>
  );
}
