// app/pannelli/page.tsx
"use client";
import dynamic from "next/dynamic";

const CatalogoPannelli = dynamic(() => import("@/components/CatalogoPannelli"), { ssr: false });

export default function PannelliPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{
        background: "#1A1A1C", color: "#fff", padding: "10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>← MASTRO</a>
        <div style={{ fontSize: 14, fontWeight: 800 }}>📦 Catalogo Pannelli</div>
        <div style={{ width: 80 }} />
      </div>
      <CatalogoPannelli />
    </div>
  );
}
