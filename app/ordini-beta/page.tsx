"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import OrdiniModuleRoot from "@/components/ordini/OrdiniModuleRoot";

export default function OrdiniBetaPage() {
  const router = useRouter();
  const [aziendaId, setAziendaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const user = sess?.session?.user;
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: op, error: opErr } = await supabase
          .from("operatori")
          .select("azienda_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (opErr) throw opErr;
        if (!op?.azienda_id) {
          setError("Nessuna azienda associata a questo utente");
          setLoading(false);
          return;
        }
        setAziendaId(op.azienda_id);
        setLoading(false);
      } catch (e: any) {
        console.error("[ordini-beta]", e);
        setError(e?.message || "Errore caricamento sessione");
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#8B9BB0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 14,
      }}>
        Caricamento…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#8B9BB0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Errore</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{error}</div>
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#1A2A47",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Torna alla Home
        </button>
      </div>
    );
  }

  if (!aziendaId) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#8B9BB0" }}>
      <OrdiniModuleRoot
        aziendaId={aziendaId}
        onClose={() => router.push("/")}
        onApriCommessa={(cmId: string) => {
          console.log("[ordini-beta] apri commessa", cmId);
        }}
      />
    </div>
  );
}
