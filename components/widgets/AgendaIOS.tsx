"use client";
import React, { useMemo } from "react";

/* ────────────────────────────────────────────────────────────
   AGENDA IOS · 3 size (S / M / L)
   Stile iOS Home: card autonoma, no chrome WCard, light theme
   coerente con la home MASTRO (sfondo crema, pastelli, teal).
   Il size L ha scroll interno sugli appuntamenti del giorno.
   ──────────────────────────────────────────────────────────── */

const TEAL = "#2BA89A";
const TEAL_LIGHT = "#E0F1EE";
const TEAL_LIGHT_2 = "#F0F9F7";
const INK = "#1A1A1A";
const MUTED = "#888888";
const SOFT = "#555555";
const PEACH = "#FFE5DC";
const PEACH_INK = "#C44D2B";
const MINT = "#DFF5EA";
const MINT_INK = "#2A8E5C";
const LILAC = "#EBE8FA";
const LILAC_INK = "#5C4FB5";

/* ── helpers ─────────────────────────────────────────────── */

const todayISO = () => new Date().toISOString().slice(0, 10);

const pick = (obj: any, ...keys: string[]) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

const hhmm = (s?: string) => {
  if (!s) return "";
  const t = String(s);
  if (t.length >= 5 && t.includes(":")) return t.slice(0, 5);
  return t;
};

const tipoBadge = (tipo?: string) => {
  const k = String(tipo || "").toLowerCase();
  if (k.includes("sopral") || k.includes("rilievo")) {
    return { label: "SOPR", bg: TEAL, fg: "#FFFFFF", bar: TEAL };
  }
  if (k.includes("rilievo")) {
    return { label: "RIL", bg: PEACH, fg: PEACH_INK, bar: "#F0997B" };
  }
  if (k.includes("montag") || k.includes("posa")) {
    return { label: "MONT", bg: MINT, fg: MINT_INK, bar: "#5DCAA5" };
  }
  if (k.includes("ordin")) {
    return { label: "ORD", bg: LILAC, fg: LILAC_INK, bar: "#AFA9EC" };
  }
  if (k.includes("call") || k.includes("telef") || k.includes("chiam")) {
    return { label: "CALL", bg: LILAC, fg: LILAC_INK, bar: "#AFA9EC" };
  }
  if (k.includes("problema") || k.includes("urgent")) {
    return { label: "URG", bg: PEACH, fg: PEACH_INK, bar: "#F0997B" };
  }
  return { label: "APP", bg: TEAL_LIGHT, fg: TEAL, bar: TEAL };
};

interface NormEvent {
  id: string;
  giorno: string;       // YYYY-MM-DD
  ora: string;          // HH:MM
  oraFine: string;
  durataMin: number;
  titolo: string;
  cliente: string;
  luogo: string;
  tipo: string;
  badge: ReturnType<typeof tipoBadge>;
  telefono: string;
  note: string;
  raw: any;
}

const normalize = (events: any[]): NormEvent[] => {
  if (!Array.isArray(events)) return [];
  return events
    .filter((e) => {
      const done = e?.completato || e?.annullato || e?.stato === "completato" || e?.stato === "annullato";
      return !done;
    })
    .map((e: any, i: number) => {
      const giorno = pick(e, "giorno", "data", "date") || (e?.start_time || "").slice(0, 10) || "";
      const oraInizioRaw = pick(e, "ora_inizio", "ora", "time") || (e?.start_time || "").slice(11, 16) || "";
      const oraFineRaw = pick(e, "ora_fine") || (e?.end_time || "").slice(11, 16) || "";
      const tipo = String(pick(e, "tipo", "event_type", "type") || "").toLowerCase();
      const titolo = pick(e, "titolo", "title", "text") || "Appuntamento";
      const cliente = pick(e, "cliente", "client_name", "persona") || "";
      const luogo = pick(e, "luogo", "indirizzo", "address") || "";
      const telefono = pick(e, "telefono", "phone") || "";
      const note = pick(e, "note", "notes") || "";
      const ora = hhmm(oraInizioRaw);
      const oraFine = hhmm(oraFineRaw);
      let durataMin = 0;
      if (ora && oraFine) {
        const [h1, m1] = ora.split(":").map(Number);
        const [h2, m2] = oraFine.split(":").map(Number);
        durataMin = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (durataMin < 0) durataMin = 0;
      }
      return {
        id: e.id || `ev-${i}`,
        giorno,
        ora,
        oraFine,
        durataMin,
        titolo: String(titolo),
        cliente: String(cliente),
        luogo: String(luogo),
        tipo,
        badge: tipoBadge(tipo),
        telefono: String(telefono),
        note: String(note),
        raw: e,
      };
    })
    .sort((a, b) => {
      const ka = a.giorno + " " + (a.ora || "99:99");
      const kb = b.giorno + " " + (b.ora || "99:99");
      return ka.localeCompare(kb);
    });
};

const minutiAdesso = (ev: NormEvent | undefined) => {
  if (!ev) return null;
  const td = todayISO();
  if (ev.giorno !== td || !ev.ora) return null;
  const now = new Date();
  const [h, m] = ev.ora.split(":").map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return null;
  return Math.round(diffMs / 60000);
};

const formatCountdown = (min: number | null) => {
  if (min === null) return "";
  if (min < 60) return `tra ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `tra ${h}h` : `tra ${h}h ${m}m`;
};

const useDataSplit = (events: NormEvent[]) => {
  return useMemo(() => {
    const td = todayISO();
    const oggi = events.filter((e) => e.giorno === td);
    const upcoming = events.filter((e) => e.giorno >= td);
    const prossimo = upcoming[0];
    return { oggi, upcoming, prossimo };
  }, [events]);
};

/* ── shared bits ─────────────────────────────────────────── */

const IconCal = ({ size = 12, color = TEAL }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconPin = ({ size = 9, color = MUTED }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s-8-7.5-8-13a8 8 0 1 1 16 0c0 5.5-8 13-8 13Z" />
    <circle cx="12" cy="9" r="3" />
  </svg>
);

const IconNav = ({ size = 9, color = "#FFFFFF" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l18-8-8 18-2-8z" />
  </svg>
);

const IconPhone = ({ size = 9, color = INK }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const stop = (e: React.MouseEvent | React.TouchEvent) => {
  e.stopPropagation();
};

/* ── SIZE S (1×1 ish) ─────────────────────────────────────── */

interface AgendaProps {
  data?: { events?: any[] };
  nav?: {
    goto?: (id: string) => void;
    openEvent?: (e?: any) => void;
  };
  onOpen?: () => void;
}

export function AgendaIOSWidgetS({ data, nav, onOpen }: AgendaProps) {
  const events = useMemo(() => normalize(data?.events || []), [data?.events]);
  const { oggi, prossimo } = useDataSplit(events);
  const td = todayISO();
  const isToday = prossimo?.giorno === td;
  const cd = isToday ? minutiAdesso(prossimo) : null;
  const cdText = cd !== null ? formatCountdown(cd) : (prossimo ? prossimo.ora : "");

  const open = () => {
    if (onOpen) onOpen();
    else nav?.goto?.("agenda");
  };

  return (
    <div
      onClick={open}
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        padding: 12,
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 22,
            height: 22,
            background: TEAL_LIGHT,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconCal size={11} color={TEAL} />
        </div>
        {prossimo && cd !== null && (
          <div
            style={{
              background: PEACH,
              color: PEACH_INK,
              fontSize: 8,
              padding: "2px 6px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            {cdText}
          </div>
        )}
        {prossimo && cd === null && (
          <div
            style={{
              background: TEAL_LIGHT,
              color: TEAL,
              fontSize: 8,
              padding: "2px 6px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            {oggi.length} oggi
          </div>
        )}
      </div>

      {prossimo ? (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: "0.4px" }}>
            {isToday ? "PROSSIMO" : "PROSSIMO"}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.15,
              marginTop: 2,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
            }}
          >
            {prossimo.cliente || prossimo.titolo}
          </div>
          <div style={{ fontSize: 10, color: TEAL, fontWeight: 600, marginTop: 2 }}>
            {prossimo.ora || "—"}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: "0.4px" }}>OGGI</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginTop: 2 }}>Niente</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>impegni</div>
        </div>
      )}
    </div>
  );
}

/* ── SIZE M (2×1) ─────────────────────────────────────────── */

export function AgendaIOSWidgetM({ data, nav, onOpen }: AgendaProps) {
  const events = useMemo(() => normalize(data?.events || []), [data?.events]);
  const { prossimo } = useDataSplit(events);
  const td = todayISO();
  const isToday = prossimo?.giorno === td;
  const cd = isToday ? minutiAdesso(prossimo) : null;

  const open = () => {
    if (onOpen) onOpen();
    else nav?.goto?.("agenda");
  };

  const goNav = (e: React.MouseEvent) => {
    stop(e);
    if (!prossimo) return;
    if (prossimo.raw?.lat && prossimo.raw?.lon) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${prossimo.raw.lat},${prossimo.raw.lon}`, "_blank");
    } else if (prossimo.luogo) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prossimo.luogo)}`, "_blank");
    }
  };

  const goTel = (e: React.MouseEvent) => {
    stop(e);
    if (prossimo?.telefono) window.location.href = `tel:${prossimo.telefono.replace(/\s/g, "")}`;
  };

  return (
    <div
      onClick={open}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        padding: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 24,
            height: 24,
            background: TEAL_LIGHT,
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconCal size={12} color={TEAL} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: INK, letterSpacing: "0.2px" }}>Agenda</div>
        {prossimo && cd !== null && (
          <div
            style={{
              marginLeft: "auto",
              background: PEACH,
              color: PEACH_INK,
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            {formatCountdown(cd)}
          </div>
        )}
      </div>

      {prossimo ? (
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", paddingTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, letterSpacing: "0.4px" }}>
              {isToday ? "OGGI" : "PROSSIMO"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: INK, lineHeight: 1, marginTop: 4 }}>
              {prossimo.ora || "—"}
            </div>
            {prossimo.durataMin > 0 && (
              <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{prossimo.durataMin} min</div>
            )}
          </div>
          <div style={{ width: 3, background: prossimo.badge.bar, borderRadius: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {prossimo.cliente || prossimo.titolo}
            </div>
            {prossimo.luogo && (
              <div style={{ fontSize: 10, color: MUTED, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <IconPin />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {prossimo.luogo}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
              <button
                onClick={goNav}
                disabled={!prossimo.luogo && !prossimo.raw?.lat}
                style={{
                  background: TEAL,
                  border: "none",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  opacity: !prossimo.luogo && !prossimo.raw?.lat ? 0.5 : 1,
                }}
              >
                <IconNav />
                Vai
              </button>
              <button
                onClick={goTel}
                disabled={!prossimo.telefono}
                style={{
                  background: "#fff",
                  border: "1px solid #E5E5E0",
                  color: INK,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  opacity: !prossimo.telefono ? 0.5 : 1,
                }}
              >
                <IconPhone />
                Chiama
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" as const, padding: "8px 0", color: MUTED, fontSize: 12 }}>
          Nessun appuntamento in agenda
        </div>
      )}
    </div>
  );
}

/* ── SIZE L (2×2) ─────────────────────────────────────────── */

export function AgendaIOSWidgetL({ data, nav, onOpen }: AgendaProps) {
  const events = useMemo(() => normalize(data?.events || []), [data?.events]);
  const { oggi, prossimo } = useDataSplit(events);
  const td = todayISO();
  const isToday = prossimo?.giorno === td;
  const cd = isToday ? minutiAdesso(prossimo) : null;
  const dotsList = oggi.slice(0, 8);

  const altri = useMemo(() => {
    if (!prossimo) return oggi;
    return oggi.filter((e) => e.id !== prossimo.id);
  }, [oggi, prossimo]);

  const open = () => {
    if (onOpen) onOpen();
    else nav?.goto?.("agenda");
  };

  const goNav = (e: React.MouseEvent) => {
    stop(e);
    if (!prossimo) return;
    if (prossimo.raw?.lat && prossimo.raw?.lon) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${prossimo.raw.lat},${prossimo.raw.lon}`, "_blank");
    } else if (prossimo.luogo) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prossimo.luogo)}`, "_blank");
    }
  };

  const goTel = (e: React.MouseEvent) => {
    stop(e);
    if (prossimo?.telefono) window.location.href = `tel:${prossimo.telefono.replace(/\s/g, "")}`;
  };

  const giornoLabel = (() => {
    const d = new Date();
    const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "short" };
    return d.toLocaleDateString("it-IT", opts).replace(/^(.)/, (m) => m.toUpperCase());
  })();

  return (
    <div
      onClick={open}
      style={{
        background: "#FFFFFF",
        borderRadius: 22,
        padding: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.04)",
        cursor: "pointer",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div
          style={{
            width: 26,
            height: 26,
            background: TEAL_LIGHT,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconCal size={13} color={TEAL} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Agenda</div>
          <div style={{ fontSize: 10, color: MUTED }}>
            {giornoLabel} · {oggi.length} {oggi.length === 1 ? "appuntamento" : "appuntamenti"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {dotsList.map((e) => (
            <div
              key={e.id}
              style={{ width: 6, height: 6, borderRadius: 50, background: e.badge.bar }}
            />
          ))}
        </div>
      </div>

      {/* prossimo card */}
      {prossimo && (
        <div
          style={{
            background: `linear-gradient(135deg, ${TEAL_LIGHT} 0%, ${TEAL_LIGHT_2} 100%)`,
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 50,
                    background: TEAL,
                  }}
                />
                <div style={{ fontSize: 9, fontWeight: 700, color: TEAL, letterSpacing: "0.4px" }}>
                  {cd !== null
                    ? `PROSSIMO · ${formatCountdown(cd).toUpperCase()}`
                    : isToday
                      ? `PROSSIMO · ${prossimo.ora || ""}`
                      : `PROSSIMO · ${prossimo.giorno} ${prossimo.ora || ""}`}
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: INK,
                  marginTop: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {prossimo.cliente || prossimo.titolo}
              </div>
              <div style={{ fontSize: 10, color: SOFT, marginTop: 2 }}>
                {prossimo.ora}
                {prossimo.luogo ? ` · ${prossimo.luogo}` : ""}
              </div>
            </div>
            <div
              style={{
                background: prossimo.badge.bg,
                color: prossimo.badge.fg,
                fontSize: 9,
                padding: "3px 7px",
                borderRadius: 6,
                fontWeight: 700,
                marginLeft: 8,
                flexShrink: 0,
              }}
            >
              {prossimo.badge.label}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            <button
              onClick={goNav}
              disabled={!prossimo.luogo && !prossimo.raw?.lat}
              style={{
                background: TEAL,
                border: "none",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                padding: 6,
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: !prossimo.luogo && !prossimo.raw?.lat ? 0.5 : 1,
              }}
            >
              Vai →
            </button>
            <button
              onClick={goTel}
              disabled={!prossimo.telefono}
              style={{
                background: "#fff",
                border: "1px solid #D5E8E4",
                color: TEAL,
                fontSize: 10,
                fontWeight: 600,
                padding: 6,
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: !prossimo.telefono ? 0.5 : 1,
              }}
            >
              Chiama
            </button>
            <button
              onClick={(e) => {
                stop(e);
                nav?.openEvent?.(prossimo.raw);
              }}
              style={{
                background: "#fff",
                border: "1px solid #D5E8E4",
                color: TEAL,
                fontSize: 10,
                fontWeight: 600,
                padding: 6,
                borderRadius: 7,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Apri
            </button>
          </div>
        </div>
      )}

      {/* lista altri appuntamenti — SCROLL INTERNO */}
      <div
        onTouchStart={stop as any}
        onTouchMove={stop as any}
        style={{
          maxHeight: 200,
          overflowY: "auto" as const,
          overflowX: "hidden" as const,
          WebkitOverflowScrolling: "touch" as any,
          touchAction: "pan-y" as any,
          margin: "0 -2px",
          padding: "0 2px",
        }}
      >
        {altri.length === 0 && !prossimo && (
          <div style={{ textAlign: "center" as const, padding: "20px 0", color: MUTED, fontSize: 12 }}>
            Nessun impegno oggi
          </div>
        )}
        {altri.length === 0 && prossimo && (
          <div style={{ textAlign: "center" as const, padding: "12px 0", color: MUTED, fontSize: 11 }}>
            Nessun altro impegno oggi
          </div>
        )}
        {altri.map((e, i) => (
          <div
            key={e.id}
            onClick={(ev) => {
              stop(ev);
              nav?.openEvent?.(e.raw);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderTop: i === 0 ? "none" : "1px solid #F0F0EB",
              cursor: "pointer",
            }}
          >
            <div style={{ width: 36, textAlign: "right" as const }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: MUTED }}>{e.ora || "—"}</div>
            </div>
            <div style={{ width: 3, height: 26, background: e.badge.bar, borderRadius: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {e.cliente || e.titolo}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: MUTED,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {e.luogo || e.titolo}
              </div>
            </div>
            <div
              style={{
                background: e.badge.bg,
                color: e.badge.fg,
                fontSize: 8,
                padding: "2px 5px",
                borderRadius: 5,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {e.badge.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── router export ─────────────────────────────────────────── */

export type AgendaIOSSize = "S" | "M" | "L";

export function AgendaIOSWidget({
  size,
  ...props
}: AgendaProps & { size: AgendaIOSSize }) {
  if (size === "S") return <AgendaIOSWidgetS {...props} />;
  if (size === "M") return <AgendaIOSWidgetM {...props} />;
  return <AgendaIOSWidgetL {...props} />;
}

export default AgendaIOSWidget;
