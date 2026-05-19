"use client";
import { useEffect } from "react";

/**
 * DayNavListener
 * Ascolta gli eventi mastro:nav sparati dal Day v3 (DaySheet).
 * Naviga via URL invece di toccare lo state di MastroERP (evita TDZ).
 */
export default function DayNavListener() {
  useEffect(() => {
    const handler = (e: any) => {
      const { tab, cm_id } = e?.detail || {};
      if (!tab) return;

      // Mappa: modulo Day -> tab MastroERP
      const tabMap: Record<string, string> = {
        preventivo: "commesse",
        misure: "commesse",
        foto: "commesse",
        commessa: "commesse",
        mail: "messaggi",
        messaggi: "messaggi",
      };
      const targetTab = tabMap[tab] || tab;

      // Costruisco URL con query
      const params = new URLSearchParams();
      if (cm_id) params.set("openCommessa", cm_id);
      if (tab === "preventivo") params.set("apri", "preventivo");
      params.set("tab", targetTab);

      // Stesso path /m con nuovi query
      const newUrl = "/m?" + params.toString();
      console.log("[DayNavListener] navigo a:", newUrl);
      window.location.href = newUrl;
    };

    window.addEventListener("mastro:nav", handler);
    return () => window.removeEventListener("mastro:nav", handler);
  }, []);

  return null;
}
