"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "./MiniAppCard";
import { IconCal, IconNav, IconPhone, IconArrow, IconClock, IconWhatsapp } from "./shared/icons";
import {
  pick, todayISO, hhmm, minutiFinoA, formatCountdown,
  callTel, openUrl, mapsLnk, sendWa, templateConferma, stopProp,
} from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   TIMELINE OGGI · mini-app
   Hero = prossimo appuntamento di oggi con countdown live
   Lista = altri appuntamenti del giorno, scrollabile
   Empty = "Nessun impegno oggi" + CTA Aggiungi
   Differenza con AgendaIOSWidgetL: focus solo su OGGI, niente settimana
   ──────────────────────────────────────────────────────────── */

interface NormEvento {
  id: string;
  ora: string;
  oraFine: string;
  durataMin: number;
  titolo: string;
  cliente: string;
  luogo: string;
  tipo: string;
  badge: { label: string; bg: string; fg: string; bar: string };
  telefono: string;
  cm_id: string | null;
  raw: any;
}

const tipoBadge = (tipo?: string) => {
  const k = String(tipo || "").toLowerCase();
  if (k.includes("sopral")) return { label: "SOPR", bg: TOKENS.tealLight, fg: TOKENS.teal, bar: TOKENS.teal };
  if (k.includes("rilievo")) return { label: "RIL",  bg: TOKENS.peach, fg: TOKENS.peachInk, bar: TOKENS.peachBar };
  if (k.includes("montag") || k.includes("posa")) return { label: "MONT", bg: TOKENS.mint, fg: TOKENS.mintInk, bar: TOKENS.mintBar };
  if (k.includes("ordin")) return { label: "ORD",  bg: TOKENS.lilac, fg: TOKENS.lilacInk, bar: TOKENS.lilacBar };
  if (k.includes("call") || k.includes("telef") || k.includes("chiam")) return { label: "CALL", bg: TOKENS.lilac, fg: TOKENS.lilacInk, bar: TOKENS.lilacBar };
  if (k.includes("firm")) return { label: "FIRMA", bg: TOKENS.amber, fg: TOKENS.amberInk, bar: TOKENS.amberBar };
  if (k.includes("consegna")) return { label: "CONS", bg: TOKENS.sky, fg: TOKENS.skyInk, bar: TOKENS.skyBar };
  return { label: "EV", bg: TOKENS.tealLight, fg: TOKENS.teal, bar: TOKENS.teal };
};

const normalize = (events: any[]): NormEvento[] => {
  if (!Array.isArray(events)) return [];
  const td = todayISO();
  return events
    .filter((e) => {
      const giorno = pick(e, "giorno", "data", "date") || (e?.start_time || "").slice(0, 10) || "";
      if (giorno !== td) return false;
      const done = e?.completato || e?.annullato || e?.stato === "completato" || e?.stato === "annullato";
      return !done;
    })
    .map((e: any, i: number) => {
      const giorno = pick(e, "giorno", "data", "date") || (e?.start_time || "").slice(0, 10) || "";
      const oraInizio = hhmm(pick(e, "ora_inizio", "ora", "time") || (e?.start_time || "").slice(11, 16));
      const oraFine = hhmm(pick(e, "ora_fine") || (e?.end_time || "").slice(11, 16));
      const tipo = String(pick(e, "tipo", "event_type", "type") || "").toLowerCase();
      let durataMin = 0;
      if (oraInizio && oraFine) {
        const [h1, m1] = oraInizio.split(":").map(Number);
        const [h2, m2] = oraFine.split(":").map(Number);
        durataMin = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
      }
      return {
        id: e?.id || `e-${i}`,
        ora: oraInizio,
        oraFine,
        durataMin,
        titolo: String(pick(e, "titolo", "title", "text") || "Appuntamento"),
        cliente: String(pick(e, "cliente", "client_name", "persona") || ""),
        luogo: String(pick(e, "luogo", "indirizzo", "address") || ""),
        tipo,
        badge: tipoBadge(tipo),
        telefono: String(pick(e, "telefono", "phone") || ""),
        cm_id: pick(e, "cm_id", "commessa_id", "cantiere_id") || null,
        raw: e,
      };
    })
    .sort((a, b) => (a.ora || "99:99").localeCompare(b.ora || "99:99"));
};

interface Props {
  events?: any[];
  onNavigate?: (tab: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onNuovoEvento?: () => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function TimelineOggiMini({
  events = [],
  onNavigate,
  onApriCommessa,
  onNuovoEvento,
  editMode = false,
  onRemove,
}: Props) {

  const items = useMemo(() => normalize(events), [events]);
  const td = todayISO();

  // "next" = il primo non passato + countdown
  const next = useMemo(() => {
    if (items.length === 0) return null;
    for (const it of items) {
      const cd = minutiFinoA(td, it.ora);
      if (cd !== null) return { ev: it, countdown: cd };
    }
    return { ev: items[0], countdown: null };
  }, [items, td]);

  const altri = useMemo(() => {
    if (!next) return items;
    return items.filter((e) => e.id !== next.ev.id);
  }, [items, next]);

  const giornoLabel = (() => {
    const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };
    return new Date().toLocaleDateString("it-IT", opts).replace(/^(.)/, (m) => m.toUpperCase());
  })();

  return (
    <MiniAppCard
      icon={<IconCal size={14} color={TOKENS.teal} />}
      title="Timeline di oggi"
      subtitle={`${giornoLabel} · ${items.length} ${items.length === 1 ? "impegno" : "impegni"}`}
      badge={next?.countdown != null && next.countdown < 60 ? {
        label: `tra ${formatCountdown(next.countdown)}`,
        bg: TOKENS.peach,
        fg: TOKENS.peachInk,
      } : null}
      heroVariant={items.length === 0 ? "teal" : "teal"}
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("agenda")}
      openLabel="apri"
      isEmpty={items.length === 0}
      empty={{
        title: "Nessun impegno oggi",
        cta: onNuovoEvento ? { label: "+ Aggiungi appuntamento", onClick: onNuovoEvento } :
             onNavigate ? { label: "Apri agenda", onClick: () => onNavigate("agenda") } : undefined,
      }}
      hero={next ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <MiniLivePulse color={TOKENS.teal} />
            <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.tealInk, letterSpacing: 0.4 }}>
              {next.countdown != null
                ? `PROSSIMO · TRA ${formatCountdown(next.countdown).toUpperCase()}`
                : "GIÀ INIZIATO · ARRIVI IN RITARDO"}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <MiniBadge {...next.ev.badge} size="sm" />
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.2, marginBottom: 3 }}>
            {next.ev.cliente || next.ev.titolo}
          </div>
          <div style={{ fontSize: 11, color: TOKENS.inkSoft, marginBottom: 8 }}>
            {next.ev.ora}
            {next.ev.oraFine ? `–${next.ev.oraFine}` : ""}
            {next.ev.luogo ? ` · ${next.ev.luogo}` : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            <button
              onClick={(e) => {
                stopProp(e);
                if (next.ev.luogo) openUrl(mapsLnk(next.ev.luogo));
              }}
              disabled={!next.ev.luogo}
              style={{
                background: TOKENS.teal,
                border: "none",
                color: TOKENS.white,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: next.ev.luogo ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: next.ev.luogo ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconNav size={11} color="#fff" />Vai</button>
            <button
              onClick={(e) => { stopProp(e); callTel(next.ev.telefono); }}
              disabled={!next.ev.telefono}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: next.ev.telefono ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: next.ev.telefono ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconPhone size={11} color={TOKENS.ink} />Chiama</button>
            <button
              onClick={(e) => {
                stopProp(e);
                const msg = templateConferma(next.ev.cliente || "Cliente", next.ev.titolo, next.ev.ora);
                sendWa(next.ev.telefono, msg);
              }}
              disabled={!next.ev.telefono}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: next.ev.telefono ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: next.ev.telefono ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconWhatsapp size={11} color={TOKENS.ink} />Confer.</button>
          </div>
        </div>
      ) : null}
    >
      {altri.map((ev, i) => (
        <MiniListRow
          key={ev.id}
          isFirst={i === 0}
          leading={
            <div style={{ width: 38, textAlign: "right" as const }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.muted }}>{ev.ora || "—"}</div>
              {ev.durataMin > 0 && (
                <div style={{ fontSize: 8, color: TOKENS.muted, opacity: 0.7 }}>{ev.durataMin}m</div>
              )}
            </div>
          }
          bar={ev.badge.bar}
          title={ev.cliente || ev.titolo}
          subtitle={ev.luogo || ev.titolo}
          trailing={<MiniBadge {...ev.badge} size="sm" />}
          onClick={() => ev.cm_id ? onApriCommessa?.(ev.cm_id) : onNavigate?.("agenda")}
        />
      ))}
    </MiniAppCard>
  );
}
