"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type DocStato = "caricato" | "mancante" | "da_firmare";

export type DocItem = {
  key: string;
  titolo: string;
  sub: string;
  count: number;
  stato: DocStato;
  badge: string;
  badgeBg: string;
  badgeFg: string;
  iconKey: string;
  iconBg: string;
  iconColor: string;
  data: string | null;
};

export type DocumentiData = {
  items: DocItem[];
  firmeMancanti: number;
  giorniAttesa: number;
  totaleDocs: number;
  loading: boolean;
};

const EMPTY: DocumentiData = {
  items: [],
  firmeMancanti: 0,
  giorniAttesa: 0,
  totaleDocs: 0,
  loading: true,
};

// Tipologie documenti standard
const TIPI: Array<{ key: string; cat: string[]; titolo: string; sub: string; icon: string; bg: string; col: string }> = [
  { key: "preventivo", cat: ["preventivo"], titolo: "Preventivo", sub: "Preventivo n.", icon: "doc", bg: "#E8E5FF", col: "#5B47E0" },
  { key: "contratto", cat: ["contratto"], titolo: "Contratto", sub: "Contratto di fornitura e posa", icon: "firma", bg: "#FBDDE7", col: "#E31E60" },
  { key: "capitolato", cat: ["capitolato"], titolo: "Capitolato", sub: "Capitolato tecnico descrittivo", icon: "book", bg: "#D6F5CE", col: "#1FAA1F" },
  { key: "foto", cat: ["foto"], titolo: "Foto cantiere", sub: "Documentazione fotografica", icon: "img", bg: "#FFE5D0", col: "#FF7A14" },
  { key: "verbale", cat: ["verbale", "sopralluogo"], titolo: "Verbale sopralluogo", sub: "Verbale sopralluogo tecnico", icon: "clip", bg: "#D9EAFB", col: "#0E6FE8" },
  { key: "allegati", cat: ["allegato", "altro"], titolo: "Allegati vari", sub: "Altri documenti e allegati", icon: "paper", bg: "#F1F5F9", col: "#64748B" },
];

export function useDocumenti(commessa: any) {
  const [data, setData] = useState<DocumentiData>(EMPTY);
  const commessaId = commessa?.id || null;

  useEffect(() => {
    if (!commessaId) {
      setData({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [allegati, foto] = await Promise.all([
          supabase.from("allegati_commessa").select("id, tipo, categoria, nome, file_url, created_at, stato").eq("commessa_id", commessaId),
          supabase.from("ops_foto").select("id, created_at", { count: "exact" }).eq("commessa_id", commessaId),
        ]);

        if (cancelled) return;
        const rows = (allegati.data || []) as Array<{ id: string; tipo: string; categoria: string; nome: string; file_url: string; created_at: string; stato: string }>;

        const items: DocItem[] = TIPI.map((t) => {
          let docs: typeof rows = [];
          if (t.key === "foto") {
            // foto: usa count da ops_foto
            const n = foto.count ?? 0;
            const lastFoto = (foto.data || [])[0]?.created_at || null;
            return {
              key: t.key,
              titolo: t.titolo,
              sub: n > 0 ? `${n} ${n === 1 ? "foto caricata" : "foto caricate"}` : "Nessuna foto",
              count: n,
              stato: n > 0 ? "caricato" : "mancante",
              badge: n > 0 ? `${n} FOTO` : "MANCANTE",
              badgeBg: n > 0 ? "#D9EAFB" : "#FFDFDF",
              badgeFg: n > 0 ? "#0E6FE8" : "#EE3535",
              iconKey: t.icon,
              iconBg: t.bg,
              iconColor: t.col,
              data: lastFoto,
            };
          }

          // documento generico
          docs = rows.filter((r) => {
            const tag = String(r.tipo || r.categoria || "").toLowerCase();
            return t.cat.some((c) => tag.includes(c));
          });

          const n = docs.length;
          const last = docs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];

          // Caso speciale preventivo: se commessa.fase è preventivo/conferma e no firma → "DA FIRMARE"
          if (t.key === "preventivo") {
            const f = String(commessa?.fase || "").toLowerCase();
            const noFirma = !commessa?.firma_cliente;
            if (n > 0 && noFirma && (f === "preventivo" || f === "conferma")) {
              return {
                key: t.key,
                titolo: t.titolo,
                sub: `Preventivo n. ${last?.nome || "PV"}`,
                count: n,
                stato: "da_firmare",
                badge: "DA FIRMARE",
                badgeBg: "#FFDFDF",
                badgeFg: "#EE3535",
                iconKey: t.icon,
                iconBg: t.bg,
                iconColor: t.col,
                data: last?.created_at || null,
              };
            }
          }

          // Caso speciale contratto: se manca firma → DA FIRMARE
          if (t.key === "contratto" && n > 0 && !commessa?.firma_cliente) {
            return {
              key: t.key,
              titolo: t.titolo,
              sub: t.sub,
              count: n,
              stato: "da_firmare",
              badge: "DA FIRMARE",
              badgeBg: "#FFDFDF",
              badgeFg: "#EE3535",
              iconKey: t.icon,
              iconBg: t.bg,
              iconColor: t.col,
              data: last?.created_at || null,
            };
          }

          // Allegati: badge con count
          if (t.key === "allegati") {
            return {
              key: t.key,
              titolo: t.titolo,
              sub: n > 0 ? `${n} ${n === 1 ? "file caricato" : "file caricati"}` : "Nessun allegato",
              count: n,
              stato: n > 0 ? "caricato" : "mancante",
              badge: n > 0 ? `${n} ${n === 1 ? "FILE" : "FILE"}` : "VUOTO",
              badgeBg: "#F1F5F9",
              badgeFg: "#64748B",
              iconKey: t.icon,
              iconBg: t.bg,
              iconColor: t.col,
              data: last?.created_at || null,
            };
          }

          return {
            key: t.key,
            titolo: t.titolo,
            sub: t.sub,
            count: n,
            stato: n > 0 ? "caricato" : "mancante",
            badge: n > 0 ? "CARICATO" : "MANCANTE",
            badgeBg: n > 0 ? "#D6F5CE" : "#FFDFDF",
            badgeFg: n > 0 ? "#1FAA1F" : "#EE3535",
            iconKey: t.icon,
            iconBg: t.bg,
            iconColor: t.col,
            data: last?.created_at || null,
          };
        });

        // Conta firme mancanti
        const firmeMancanti = items.filter((i) => i.stato === "da_firmare").length + (commessa?.firma_cliente ? 0 : 1);
        const start = commessa?.fase_start || commessa?.preventivo_inviato_at || commessa?.created_at;
        const giorniAttesa = start ? Math.floor((Date.now() - new Date(start).getTime()) / 86400000) : 0;
        const totaleDocs = items.filter((i) => i.stato === "caricato").reduce((s, i) => s + i.count, 0);

        setData({
          items,
          firmeMancanti: Math.max(0, firmeMancanti),
          giorniAttesa,
          totaleDocs,
          loading: false,
        });
      } catch {
        if (!cancelled) setData((s) => ({ ...s, loading: false }));
      }
    };

    load();

    const channel = supabase
      .channel(`docs-${commessaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "allegati_commessa", filter: `commessa_id=eq.${commessaId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "ops_foto", filter: `commessa_id=eq.${commessaId}` }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [commessaId, commessa?.firma_cliente, commessa?.fase]);

  return data;
}

export function fmtDataDoc(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const m = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"][d.getMonth()];
  return `${d.getDate()} ${m} ${d.getFullYear()}`;
}
