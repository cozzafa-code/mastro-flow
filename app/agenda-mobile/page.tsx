// app/agenda-mobile/page.tsx
"use client";
import dynamic from "next/dynamic";

// Caricamento client-side, no SSR (component usa window/navigator)
const AgendaMobile = dynamic(() => import("../../components/mobile/agenda/AgendaMobile"), { ssr: false });

export default function AgendaMobilePage() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#F8FAFA", minHeight: "100vh", position: "relative" }}>
      <AgendaMobile
        onOpenCommessa={(cmId, code) => {
          if (typeof window !== "undefined") {
            window.alert(`Apri commessa ${code || cmId || "?"} — collega router quando integriamo`);
          }
        }}
      />
    </div>
  );
}
