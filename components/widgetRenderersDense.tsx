"use client";
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — widgetRenderersDense.tsx
// Widget "app dentro app" — esaustivi, azionabili, connessi.
// 4 widget killer: Agenda, Oggi da fare, Fatture, Squadra.
//
// Differenza da widgetRenderers.tsx (originale):
//  - Non un mini-sommario di 3 righe, ma pannello operativo denso
//  - Toggle viste, filtri, azioni inline (chiama, sollecita, crea)
//  - Auto-contenuti: l'utente non deve andare al pannello grande
// ═══════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";

// ─── Tema fliwoX ────────────────────────────────────────────
const TH = {
  ink: "#0D1F1F",
  sub: "#5A7878",
  subLight: "#8FA8A8",
  teal: "#28A0A0",
  tealDark: "#1A7A7A",
  tealBright: "#5FD0D0",
  tealPale: "#EEF8F8",
  border: "rgba(40,160,160,0.08)",
  borderSolid: "#C8E4E4",
  red: "#E24B4A",
  redPale: "rgba(226,75,74,0.1)",
  amber: "#F5A030",
  amberDeep: "#C97716",
  amberPale: "rgba(245,160,48,0.1)",
  green: "#8BC443",
  greenDeep: "#1A9E73",
  greenPale: "rgba(26,158,115,0.1)",
  purple: "#7B6BA5",
};

// ─── Helpers ────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
const isoDateOnly = (d: Date) => d.toISOString().slice(0, 10);
const pick = (o: any, ...k: string[]) => {
  for (const key of k) if (o?.[key] != null && o?.[key] !== "") return o[key];
  return null;
};
const clienteOf = (c: any) =>
  [pick(c, "cliente", "cliente_nome"), pick(c, "cognome")].filter(Boolean).join(" ") || "—";
const valoreOf = (c: any): number =>
  Number(pick(c, "totale_finale", "totale_preventivo", "euro", "totale")) || 0;
const eur = (n: number): string => {
  if (!n || n <= 0) return "€0";
  if (n >= 10000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n).toLocaleString("it-IT")}`;
};
const telClean = (t: string): string => (t || "").replace(/[^\d+]/g, "");
const waLink = (tel: string, msg: string) => {
  const n = telClean(tel).replace(/^\+/, "");
  if (!n) return "#";
  return `https://wa.me/${n.startsWith("39") ? n : "39" + n}?text=${encodeURIComponent(msg)}`;
};

// Formatta data "Oggi", "Domani", "Ven 25 Apr"
const fmtRelDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Oggi";
  if (diff === 1) return "Domani";
  if (diff === -1) return "Ieri";
  if (diff > 1 && diff < 7) {
    return d.toLocaleDateString("it-IT", { weekday: "long" });
  }
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", weekday: "short" });
};

// ═══════════════════════════════════════════════════════════
// WIDGET: AGENDA (app dentro app)
// Viste: Oggi / Settimana / Mese
// Azioni: Crea evento inline, Naviga, Chiama, Dettaglio
// ═══════════════════════════════════════════════════════════
interface AgendaProps {
  data: {
    events?: any[];
    tasks?: any[];
    cantieri?: any[];
  };
  nav: any;
}

export function WidgetAgendaDense({ data, nav }: AgendaProps) {
  const [view, setView] = useState<"oggi" | "settimana" | "mese">("oggi");
  const events = data.events || [];
  const tasks = data.tasks || [];

  // Range date in base a view
  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (view === "oggi") {
      return { startDate: now, endDate: now, label: "OGGI" };
    }
    if (view === "settimana") {
      const end = new Date(now);
      end.setDate(end.getDate() + 6);
      return { startDate: now, endDate: end, label: "PROSSIMI 7 GG" };
    }
    const end = new Date(now);
    end.setDate(end.getDate() + 29);
    return { startDate: now, endDate: end, label: "PROSSIMI 30 GG" };
  }, [view]);

  const inRange = (iso: string): boolean => {
    if (!iso) return false;
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d >= startDate && d <= endDate;
  };

  // Unisci events + tasks + rilievi del periodo, ordina per data+ora
  const items = useMemo(() => {
    const list: any[] = [];

    events.forEach((e: any) => {
      const d = pick(e, "date", "data", "data_inizio");
      if (!inRange(d)) return;
      list.push({
        kind: "event",
        id: e.id,
        date: d,
        time: pick(e, "time", "ora") || "",
        title: pick(e, "text", "titolo", "descrizione") || "Evento",
        subtitle: pick(e, "cm", "commessa_code", "persona", "addr") || "",
        tipo: pick(e, "tipo") || "evento",
        color: pick(e, "color") || TH.teal,
        raw: e,
      });
    });

    tasks.forEach((t: any) => {
      if (t.done) return;
      const d = pick(t, "date", "data_scadenza", "scadenza");
      if (!inRange(d)) return;
      list.push({
        kind: "task",
        id: t.id,
        date: d,
        time: pick(t, "time", "ora") || "",
        title: pick(t, "text", "descrizione", "titolo") || "Task",
        subtitle: pick(t, "persona", "assegnato", "cm") || "",
        priority: pick(t, "priority", "priorita") || "media",
        raw: t,
      });
    });

    list.sort((a, b) => {
      const ad = `${a.date} ${a.time || "00:00"}`;
      const bd = `${b.date} ${b.time || "00:00"}`;
      return ad.localeCompare(bd);
    });

    return list;
  }, [events, tasks, view, startDate, endDate]);

  // Conflitti: 2+ eventi stessa ora stesso giorno
  const conflicts = useMemo(() => {
    const byTime = new Map<string, number>();
    items.forEach((i) => {
      if (i.time) {
        const k = `${i.date}_${i.time}`;
        byTime.set(k, (byTime.get(k) || 0) + 1);
      }
    });
    return Array.from(byTime.values()).filter((n) => n > 1).length;
  }, [items]);

  // Conta per giorno
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => map.set(i.date, (map.get(i.date) || 0) + 1));
    return map;
  }, [items]);

  const goToCommessa = (ev: any) => {
    const cmId = pick(ev.raw, "cm_id", "commessa_id", "cm");
    if (!cmId) {
      nav?.openEvent?.();
      return;
    }
    const cm = data.cantieri?.find((c: any) => c.id === cmId || c.code === cmId);
    if (cm) nav?.openCM?.(cm);
    else nav?.openEvent?.();
  };

  return (
    <div>
      {/* Toggle viste */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: TH.tealPale,
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        {(["oggi", "settimana", "mese"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1,
              padding: "7px 4px",
              borderRadius: 7,
              border: "none",
              background: view === v ? "#fff" : "transparent",
              color: view === v ? TH.tealDark : TH.sub,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: view === v ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              fontFamily: "inherit",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* KPI header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <KpiBox label={label.slice(0, 12)} value={items.length.toString()} color={TH.teal} />
        <KpiBox
          label="IMPEGNI"
          value={byDay.size.toString() + (byDay.size === 1 ? " GG" : " GG")}
          color={TH.greenDeep}
        />
        <KpiBox
          label="CONFLITTI"
          value={conflicts.toString()}
          color={conflicts > 0 ? TH.red : TH.subLight}
        />
      </div>

      {/* Lista eventi */}
      {items.length === 0 ? (
        <EmptyState msg={`Niente in programma ${view === "oggi" ? "oggi" : "nel periodo"}`} />
      ) : (
        <div style={{ maxHeight: view === "oggi" ? 280 : 320, overflowY: "auto" as any }}>
          {items.slice(0, 15).map((it, idx) => (
            <AgendaRow
              key={`${it.kind}-${it.id}-${idx}`}
              item={it}
              showDate={view !== "oggi"}
              onTap={() => goToCommessa(it)}
            />
          ))}
          {items.length > 15 && (
            <div
              onClick={() => nav?.goto?.("agenda")}
              style={{
                padding: "10px 2px",
                fontSize: 11,
                fontWeight: 700,
                color: TH.tealDark,
                textAlign: "center" as any,
                cursor: "pointer",
                borderTop: `1px dashed ${TH.border}`,
              }}
            >
              + altri {items.length - 15} in agenda →
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <PrimaryButton onClick={() => { nav?.openEvent?.(); }}>+ Nuovo evento</PrimaryButton>
        <GhostButton onClick={() => nav?.goto?.("agenda")}>Apri agenda →</GhostButton>
      </div>
    </div>
  );
}

// Sotto-componente riga agenda
const AgendaRow = ({ item, showDate, onTap }: any) => {
  const isTask = item.kind === "task";
  const barColor = isTask
    ? item.priority === "alta"
      ? TH.red
      : item.priority === "bassa"
      ? TH.subLight
      : TH.amber
    : item.color || TH.teal;

  return (
    <div
      onClick={onTap}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 2px",
        borderBottom: `1px solid ${TH.border}`,
        cursor: "pointer",
      }}
    >
      {/* Barra colore tipo */}
      <div
        style={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 2,
          background: barColor,
          flexShrink: 0,
          minHeight: 28,
        }}
      />
      {/* Ora */}
      <div
        style={{
          width: 44,
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 800,
          color: TH.ink,
          fontVariantNumeric: "tabular-nums" as any,
        }}
      >
        {item.time || "—"}
      </div>
      {/* Titolo + sottotitolo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TH.ink,
            whiteSpace: "nowrap" as any,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: TH.sub,
            marginTop: 1,
            whiteSpace: "nowrap" as any,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {showDate && <span style={{ fontWeight: 700 }}>{fmtRelDate(item.date)}</span>}
          {showDate && item.subtitle && " · "}
          {item.subtitle}
        </div>
      </div>
      {/* Badge tipo */}
      {isTask && (
        <span
          style={{
            fontSize: 8,
            fontWeight: 900,
            padding: "2px 6px",
            borderRadius: 4,
            background: barColor,
            color: "#fff",
            letterSpacing: "0.3px",
          }}
        >
          TASK
        </span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// WIDGET: OGGI DA FARE (app dentro app)
// Task + eventi + rilievi + scadenze del giorno, ordinati
// Azioni: Completa, Sposta a domani, Apri
// ═══════════════════════════════════════════════════════════
interface OggiProps {
  data: {
    tasks?: any[];
    events?: any[];
    cantieri?: any[];
  };
  nav: any;
  onToggleTask?: (id: string) => void;
  onPostponeTask?: (id: string) => void;
}

export function WidgetOggiDense({ data, nav, onToggleTask, onPostponeTask }: OggiProps) {
  const [filter, setFilter] = useState<"tutto" | "task" | "eventi" | "lavoro">("tutto");
  const tasks = data.tasks || [];
  const events = data.events || [];
  const cantieri = data.cantieri || [];
  const today = todayISO();

  const items = useMemo(() => {
    const list: any[] = [];

    // Task oggi
    if (filter === "tutto" || filter === "task") {
      tasks.forEach((t: any) => {
        if (t.done) return;
        const d = pick(t, "date", "data_scadenza", "scadenza");
        if (d !== today) return;
        list.push({
          kind: "task",
          id: t.id,
          time: pick(t, "time", "ora") || "",
          title: pick(t, "text", "descrizione", "titolo") || "Task",
          subtitle: pick(t, "persona", "cm") || "",
          priority: pick(t, "priority", "priorita") || "media",
          raw: t,
        });
      });
    }

    // Eventi oggi
    if (filter === "tutto" || filter === "eventi") {
      events.forEach((e: any) => {
        const d = pick(e, "date", "data", "data_inizio");
        if (d !== today) return;
        list.push({
          kind: "event",
          id: e.id,
          time: pick(e, "time", "ora") || "",
          title: pick(e, "text", "titolo") || "Evento",
          subtitle: pick(e, "cm", "persona", "addr") || "",
          tipo: pick(e, "tipo") || "evento",
          raw: e,
        });
      });
    }

    // Rilievi/sopralluoghi oggi (da cantieri con rilievo pianificato oggi)
    if (filter === "tutto" || filter === "lavoro") {
      cantieri.forEach((c: any) => {
        const rilievi = c.rilievi || [];
        rilievi.forEach((r: any) => {
          const d = pick(r, "data");
          if (d !== today) return;
          const stato = pick(r, "stato");
          if (stato === "completato" || stato === "confermato") return;
          list.push({
            kind: "rilievo",
            id: r.id,
            time: pick(r, "ora") || "",
            title: `Rilievo ${clienteOf(c)}`,
            subtitle: `${pick(c, "indirizzo") || ""} · ${pick(r, "rilevatore") || ""}`,
            cmId: c.id,
            raw: { cm: c, rilievo: r },
          });
        });
      });
    }

    list.sort((a, b) => (a.time || "24:00").localeCompare(b.time || "24:00"));
    return list;
  }, [tasks, events, cantieri, filter, today]);

  const countsByKind = useMemo(() => {
    const all = [
      ...tasks.filter((t: any) => !t.done && pick(t, "date", "data_scadenza", "scadenza") === today),
      ...events.filter((e: any) => pick(e, "date", "data", "data_inizio") === today),
    ];
    const rilieviOggi = cantieri.reduce((acc: number, c: any) => {
      return acc + ((c.rilievi || []).filter((r: any) => {
        const s = pick(r, "stato");
        return pick(r, "data") === today && s !== "completato" && s !== "confermato";
      }).length);
    }, 0);
    return {
      total: all.length + rilieviOggi,
      task: tasks.filter((t: any) => !t.done && pick(t, "date", "data_scadenza", "scadenza") === today).length,
      eventi: events.filter((e: any) => pick(e, "date", "data", "data_inizio") === today).length,
      lavoro: rilieviOggi,
    };
  }, [tasks, events, cantieri, today]);

  return (
    <div>
      {/* Filtri */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: TH.tealPale,
          borderRadius: 10,
          marginBottom: 10,
          overflowX: "auto" as any,
        }}
      >
        {([
          ["tutto", `Tutto · ${countsByKind.total}`],
          ["task", `Task · ${countsByKind.task}`],
          ["eventi", `Eventi · ${countsByKind.eventi}`],
          ["lavoro", `Lavoro · ${countsByKind.lavoro}`],
        ] as Array<[any, string]>).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              flex: "1 0 auto",
              padding: "7px 10px",
              borderRadius: 7,
              border: "none",
              background: filter === k ? "#fff" : "transparent",
              color: filter === k ? TH.tealDark : TH.sub,
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: filter === k ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
              letterSpacing: "0.2px",
              whiteSpace: "nowrap" as any,
              fontFamily: "inherit",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div>
          <EmptyState msg="Giornata libera ✨" />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton onClick={() => nav?.openTask?.()}>+ Task veloce</PrimaryButton>
            <GhostButton onClick={() => nav?.openEvent?.()}>+ Evento</GhostButton>
          </div>
        </div>
      ) : (
        <>
          <div style={{ maxHeight: 320, overflowY: "auto" as any }}>
            {items.map((it, idx) => (
              <OggiRow
                key={`${it.kind}-${it.id}-${idx}`}
                item={it}
                onComplete={() => {
                  if (it.kind === "task") onToggleTask?.(it.id);
                }}
                onPostpone={() => {
                  if (it.kind === "task") onPostponeTask?.(it.id);
                }}
                onOpen={() => {
                  if (it.kind === "rilievo") {
                    const cm = cantieri.find((c: any) => c.id === it.cmId);
                    if (cm) nav?.openCM?.(cm);
                  } else if (it.kind === "task") {
                    nav?.openTask?.();
                  } else {
                    nav?.openEvent?.();
                  }
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton onClick={() => nav?.openTask?.()}>+ Task veloce</PrimaryButton>
            <GhostButton onClick={() => nav?.goto?.("agenda")}>Vai ad agenda →</GhostButton>
          </div>
        </>
      )}
    </div>
  );
}

const OggiRow = ({ item, onComplete, onOpen, onPostpone }: any) => {
  const isTask = item.kind === "task";
  const priColor =
    item.priority === "alta" ? TH.red : item.priority === "bassa" ? TH.subLight : TH.amber;
  const kindLabel = item.kind === "event" ? "EVENTO" : item.kind === "rilievo" ? "RILIEVO" : "TASK";
  const kindColor = item.kind === "event" ? TH.teal : item.kind === "rilievo" ? TH.purple : priColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 2px",
        borderBottom: `1px solid ${TH.border}`,
      }}
    >
      {/* Checkbox task */}
      {isTask && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.();
          }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            border: `2px solid ${TH.borderSolid}`,
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 2,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      )}
      {!isTask && (
        <div
          style={{
            width: 3,
            alignSelf: "stretch",
            borderRadius: 2,
            background: kindColor,
            flexShrink: 0,
            marginTop: 4,
            minHeight: 30,
          }}
        />
      )}
      {/* Contenuto */}
      <div
        onClick={onOpen}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          {item.time && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: TH.sub,
                fontVariantNumeric: "tabular-nums" as any,
              }}
            >
              {item.time}
            </span>
          )}
          <span
            style={{
              fontSize: 8,
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: 4,
              background: kindColor,
              color: "#fff",
              letterSpacing: "0.3px",
            }}
          >
            {kindLabel}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TH.ink,
            whiteSpace: "nowrap" as any,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </div>
        {item.subtitle && (
          <div
            style={{
              fontSize: 10,
              color: TH.sub,
              marginTop: 1,
              whiteSpace: "nowrap" as any,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.subtitle}
          </div>
        )}
      </div>
      {/* Postpone (solo task) */}
      {isTask && onPostpone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPostpone?.();
          }}
          title="Sposta a domani"
          style={{
            border: "none",
            background: TH.tealPale,
            color: TH.tealDark,
            width: 28,
            height: 28,
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 900,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          →
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// WIDGET: FATTURE (app dentro app)
// Tab: Scadute / In scadenza / Regolari
// Azioni: Sollecita WhatsApp, Marca incassata, Crea veloce
// ═══════════════════════════════════════════════════════════
interface FattureProps {
  data: {
    fattureDB?: any[];
    cantieri?: any[];
  };
  nav: any;
  onMarkPagata?: (id: string) => void;
}

export function WidgetFattureDense({ data, nav, onMarkPagata }: FattureProps) {
  const [tab, setTab] = useState<"scadute" | "scadenza" | "tutte">("scadute");
  const fatture = data.fattureDB || [];
  const cantieri = data.cantieri || [];
  const today = todayISO();

  const { scadute, inScadenza, regolari, totScadute, totScadenza, totRegolari } = useMemo(() => {
    const d7 = new Date();
    d7.setDate(d7.getDate() + 7);
    const d7ISO = isoDateOnly(d7);

    const scadute: any[] = [];
    const inScadenza: any[] = [];
    const regolari: any[] = [];

    fatture.forEach((f: any) => {
      if (f.pagata) return;
      const dataScad = pick(f, "scadenza", "dataScadenza", "data_scadenza");
      const importo = Number(pick(f, "importo", "totale")) || 0;
      if (!dataScad) {
        regolari.push({ ...f, importo });
        return;
      }
      if (dataScad < today) scadute.push({ ...f, importo, dataScad });
      else if (dataScad <= d7ISO) inScadenza.push({ ...f, importo, dataScad });
      else regolari.push({ ...f, importo, dataScad });
    });

    // Ordina scadute per giorni di ritardo decrescente
    scadute.sort((a, b) => (a.dataScad || "").localeCompare(b.dataScad || ""));
    inScadenza.sort((a, b) => (a.dataScad || "").localeCompare(b.dataScad || ""));

    return {
      scadute,
      inScadenza,
      regolari,
      totScadute: scadute.reduce((s, f) => s + f.importo, 0),
      totScadenza: inScadenza.reduce((s, f) => s + f.importo, 0),
      totRegolari: regolari.reduce((s, f) => s + f.importo, 0),
    };
  }, [fatture, today]);

  const totGenerale = totScadute + totScadenza + totRegolari;

  const currentList =
    tab === "scadute" ? scadute : tab === "scadenza" ? inScadenza : [...scadute, ...inScadenza, ...regolari];

  const findCantiere = (f: any) => {
    const cmId = pick(f, "cmId", "commessa_id", "cm");
    return cantieri.find((c: any) => c.id === cmId);
  };

  return (
    <div>
      {/* Totale grande */}
      <div
        style={{
          background: "linear-gradient(145deg, #FFFFFF, #F5FBFB)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 10,
          border: `1px solid ${TH.borderSolid}`,
          boxShadow: "0 2px 8px rgba(31,120,120,0.08)",
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 900, color: TH.sub, letterSpacing: "1px" }}>
          DA INCASSARE
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: TH.ink,
            letterSpacing: "-0.5px",
            marginTop: 2,
            fontVariantNumeric: "tabular-nums" as any,
          }}
        >
          {eur(totGenerale)}
        </div>
        <div style={{ fontSize: 11, color: TH.sub, marginTop: 3, fontWeight: 600 }}>
          {fatture.filter((f: any) => !f.pagata).length} fatture attive ·{" "}
          {scadute.length > 0 && (
            <span style={{ color: TH.red, fontWeight: 800 }}>
              {scadute.length} scadute
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: TH.tealPale,
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        {([
          ["scadute", `Scadute ${scadute.length}`, TH.red],
          ["scadenza", `7gg ${inScadenza.length}`, TH.amber],
          ["tutte", `Tutte ${scadute.length + inScadenza.length + regolari.length}`, TH.teal],
        ] as Array<[any, string, string]>).map(([k, lbl, col]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              flex: 1,
              padding: "7px 4px",
              borderRadius: 7,
              border: "none",
              background: tab === k ? "#fff" : "transparent",
              color: tab === k ? col : TH.sub,
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: tab === k ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
              letterSpacing: "0.2px",
              fontFamily: "inherit",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      {currentList.length === 0 ? (
        <EmptyState
          msg={
            tab === "scadute"
              ? "Nessuna fattura scaduta 🎉"
              : tab === "scadenza"
              ? "Nessuna fattura in scadenza"
              : "Nessuna fattura"
          }
        />
      ) : (
        <div style={{ maxHeight: 280, overflowY: "auto" as any }}>
          {currentList.slice(0, 8).map((f: any, i: number) => {
            const cm = findCantiere(f);
            const gg =
              f.dataScad
                ? Math.floor((new Date(f.dataScad).getTime() - new Date(today).getTime()) / 86400000)
                : null;
            const isScaduta = gg !== null && gg < 0;
            const cliente = cm ? clienteOf(cm) : pick(f, "cliente", "descrizione") || "—";
            const tel = cm ? pick(cm, "telefono") : null;

            return (
              <div
                key={f.id || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 2px",
                  borderBottom: `1px solid ${TH.border}`,
                }}
              >
                <div
                  style={{
                    width: 3,
                    alignSelf: "stretch",
                    background: isScaduta ? TH.red : gg !== null && gg <= 7 ? TH.amber : TH.green,
                    borderRadius: 2,
                    minHeight: 34,
                    flexShrink: 0,
                  }}
                />
                <div
                  onClick={() => (cm ? nav?.openCM?.(cm) : nav?.goto?.("contabilita"))}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: TH.ink,
                      whiteSpace: "nowrap" as any,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cliente}
                  </div>
                  <div style={{ fontSize: 10, color: TH.sub, marginTop: 1 }}>
                    {f.numero && `N. ${f.numero} · `}
                    {isScaduta && (
                      <span style={{ color: TH.red, fontWeight: 800 }}>
                        {Math.abs(gg!)}gg ritardo
                      </span>
                    )}
                    {!isScaduta && gg !== null && gg <= 7 && (
                      <span style={{ color: TH.amberDeep, fontWeight: 800 }}>
                        scade in {gg}gg
                      </span>
                    )}
                    {!isScaduta && (gg === null || gg > 7) && f.dataScad && (
                      <span>scadenza {fmtRelDate(f.dataScad)}</span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: TH.ink,
                    fontVariantNumeric: "tabular-nums" as any,
                    flexShrink: 0,
                  }}
                >
                  {eur(f.importo)}
                </div>
                {tel && (
                  <a
                    href={waLink(
                      tel,
                      `Ciao ${cliente}, le scrivo per ricordarti della fattura ${f.numero ? "n. " + f.numero : ""} di ${eur(f.importo)} in scadenza. Grazie!`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Sollecita via WhatsApp"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "linear-gradient(145deg, #8BC443, #1A9E73)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(26,158,115,0.3)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                      <path d="M20.5 3.5a11.84 11.84 0 00-16.74.06 11.66 11.66 0 00-1.84 14.4L1 23l5.27-1.37a11.95 11.95 0 005.68 1.44 11.83 11.83 0 008.55-3.47 11.75 11.75 0 000-16.1zm-8.55 18.14a9.76 9.76 0 01-4.94-1.34l-.35-.2-3.6.94.97-3.49-.23-.36a9.76 9.76 0 1117.93-5.36 9.66 9.66 0 01-9.78 9.81zm5.37-7.3l-2-.59a.83.83 0 00-.83.2l-.5.6c-.2.25-.4.28-.72.12a8.16 8.16 0 01-2.42-1.5 8.77 8.77 0 01-1.7-2.1c-.17-.32-.02-.48.15-.64l.5-.6a.71.71 0 00.13-.87l-.84-1.96c-.22-.53-.49-.45-.68-.45h-.58a1.1 1.1 0 00-.8.38 3.37 3.37 0 00-1.06 2.5 5.83 5.83 0 001.23 3.1 13.43 13.43 0 005.23 4.6c3.05 1.25 3.05.82 3.6.77a3 3 0 002-1.41 2.48 2.48 0 00.17-1.41c-.08-.14-.3-.2-.58-.38z" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
          {currentList.length > 8 && (
            <div
              onClick={() => nav?.goto?.("contabilita")}
              style={{
                padding: "10px 2px",
                fontSize: 11,
                fontWeight: 700,
                color: TH.tealDark,
                textAlign: "center" as any,
                cursor: "pointer",
                borderTop: `1px dashed ${TH.border}`,
              }}
            >
              + altre {currentList.length - 8} in contabilità →
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <PrimaryButton onClick={() => nav?.goto?.("contabilita")}>Apri contabilità →</PrimaryButton>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WIDGET: SQUADRA (app dentro app)
// Operatori + stato live + azioni (chiama, WhatsApp, scheda)
// ═══════════════════════════════════════════════════════════
interface SquadraProps {
  data: {
    team?: any[];
    cantieri?: any[];
    tasks?: any[];
  };
  nav: any;
}

export function WidgetSquadraDense({ data, nav }: SquadraProps) {
  const [filter, setFilter] = useState<"tutti" | "cantiere" | "libero">("tutti");
  const team = data.team || [];
  const cantieri = data.cantieri || [];
  const tasks = data.tasks || [];
  const today = todayISO();

  const operatori = useMemo(() => {
    return team.map((op: any) => {
      // Trova cantiere assegnato oggi
      const assegnato = cantieri.find((c: any) => {
        const ev = (c.eventi || []).find((e: any) => e.operatoreId === op.id && pick(e, "date", "data") === today);
        return !!ev;
      });

      // Task aperti oggi
      const taskAperti = tasks.filter(
        (t: any) => !t.done && (pick(t, "persona", "assegnato") === op.nome || t.personaId === op.id)
      );
      const taskOggi = taskAperti.filter(
        (t: any) => pick(t, "date", "data_scadenza", "scadenza") === today
      );

      const stato = assegnato ? "cantiere" : op.stato === "ferie" ? "ferie" : op.stato === "malato" ? "malato" : "libero";

      return {
        ...op,
        stato,
        assegnato,
        taskAperti: taskAperti.length,
        taskOggi: taskOggi.length,
      };
    });
  }, [team, cantieri, tasks, today]);

  const counts = useMemo(
    () => ({
      tutti: operatori.length,
      cantiere: operatori.filter((o: any) => o.stato === "cantiere").length,
      libero: operatori.filter((o: any) => o.stato === "libero").length,
      assente: operatori.filter((o: any) => o.stato === "ferie" || o.stato === "malato").length,
    }),
    [operatori]
  );

  const currentList =
    filter === "cantiere"
      ? operatori.filter((o: any) => o.stato === "cantiere")
      : filter === "libero"
      ? operatori.filter((o: any) => o.stato === "libero")
      : operatori;

  const statoPill = (stato: string) => {
    if (stato === "cantiere") return { bg: TH.greenPale, fg: TH.greenDeep, label: "In cantiere" };
    if (stato === "libero") return { bg: TH.tealPale, fg: TH.tealDark, label: "Libero" };
    if (stato === "ferie") return { bg: "rgba(123,107,165,0.15)", fg: TH.purple, label: "Ferie" };
    if (stato === "malato") return { bg: TH.amberPale, fg: TH.amberDeep, label: "Malato" };
    return { bg: TH.tealPale, fg: TH.sub, label: stato };
  };

  const initials = (nome: string) =>
    nome.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      {/* KPI header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <KpiBox label="IN CANTIERE" value={counts.cantiere.toString()} color={TH.greenDeep} />
        <KpiBox label="LIBERI" value={counts.libero.toString()} color={TH.teal} />
        <KpiBox label="ASSENTI" value={counts.assente.toString()} color={TH.subLight} />
      </div>

      {/* Filtri */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: TH.tealPale,
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        {([
          ["tutti", `Tutti ${counts.tutti}`],
          ["cantiere", `In cantiere ${counts.cantiere}`],
          ["libero", `Liberi ${counts.libero}`],
        ] as Array<[any, string]>).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              flex: 1,
              padding: "7px 4px",
              borderRadius: 7,
              border: "none",
              background: filter === k ? "#fff" : "transparent",
              color: filter === k ? TH.tealDark : TH.sub,
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: filter === k ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
              letterSpacing: "0.2px",
              fontFamily: "inherit",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista operatori */}
      {currentList.length === 0 ? (
        <EmptyState msg="Nessun operatore in questa categoria" />
      ) : (
        <div style={{ maxHeight: 280, overflowY: "auto" as any }}>
          {currentList.map((op: any) => {
            const pill = statoPill(op.stato);
            return (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 2px",
                  borderBottom: `1px solid ${TH.border}`,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background:
                      op.colore ||
                      "linear-gradient(145deg, #5FD0D0, #1A7A7A)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(13,31,31,0.15)",
                  }}
                >
                  {initials(op.nome || "?")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: TH.ink,
                      whiteSpace: "nowrap" as any,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {op.nome}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: pill.bg,
                        color: pill.fg,
                        letterSpacing: "0.3px",
                        textTransform: "uppercase" as any,
                      }}
                    >
                      {pill.label}
                    </span>
                    {op.stato === "cantiere" && op.assegnato && (
                      <span
                        style={{
                          fontSize: 10,
                          color: TH.sub,
                          fontWeight: 600,
                          whiteSpace: "nowrap" as any,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        → {clienteOf(op.assegnato)}
                      </span>
                    )}
                    {op.taskOggi > 0 && (
                      <span style={{ fontSize: 9, color: TH.amberDeep, fontWeight: 700 }}>
                        · {op.taskOggi} task
                      </span>
                    )}
                  </div>
                </div>
                {/* Azioni rapide */}
                {op.telefono && (
                  <>
                    <a
                      href={`tel:${telClean(op.telefono)}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Chiama"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: TH.tealPale,
                        color: TH.tealDark,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        textDecoration: "none",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.tealDark} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </a>
                    <a
                      href={waLink(op.telefono, `Ciao ${op.nome}, `)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="WhatsApp"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "linear-gradient(145deg, #8BC443, #1A9E73)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        textDecoration: "none",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                        <path d="M20.5 3.5a11.84 11.84 0 00-16.74.06 11.66 11.66 0 00-1.84 14.4L1 23l5.27-1.37a11.95 11.95 0 005.68 1.44 11.83 11.83 0 008.55-3.47 11.75 11.75 0 000-16.1z" />
                      </svg>
                    </a>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <PrimaryButton onClick={() => nav?.goto?.("team")}>Apri team →</PrimaryButton>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sotto-componenti condivisi
// ═══════════════════════════════════════════════════════════
const KpiBox = ({ label, value, color }: any) => (
  <div
    style={{
      padding: "8px 6px",
      borderRadius: 10,
      background: "linear-gradient(155deg, #FFFFFF, #F5FBFB)",
      border: `1px solid ${TH.borderSolid}`,
      textAlign: "center" as any,
    }}
  >
    <div style={{ fontSize: 8, fontWeight: 900, color: TH.sub, letterSpacing: "0.5px" }}>
      {label}
    </div>
    <div
      style={{
        fontSize: 16,
        fontWeight: 900,
        color,
        marginTop: 2,
        letterSpacing: "-0.3px",
        fontVariantNumeric: "tabular-nums" as any,
      }}
    >
      {value}
    </div>
  </div>
);

const EmptyState = ({ msg }: { msg: string }) => (
  <div
    style={{
      padding: "24px 12px",
      textAlign: "center" as any,
      fontSize: 12,
      color: TH.sub,
      fontWeight: 600,
      background: TH.tealPale,
      borderRadius: 10,
    }}
  >
    {msg}
  </div>
);

const PrimaryButton = ({ children, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "9px 12px",
      borderRadius: 10,
      border: "none",
      background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
      color: "#fff",
      fontSize: 11,
      fontWeight: 900,
      cursor: "pointer",
      letterSpacing: "0.3px",
      boxShadow: "0 4px 10px rgba(31,120,120,0.3)",
      fontFamily: "inherit",
    }}
  >
    {children}
  </button>
);

const GhostButton = ({ children, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "9px 12px",
      borderRadius: 10,
      border: `1px solid ${TH.borderSolid}`,
      background: "#fff",
      color: TH.tealDark,
      fontSize: 11,
      fontWeight: 800,
      cursor: "pointer",
      letterSpacing: "0.3px",
      fontFamily: "inherit",
    }}
  >
    {children}
  </button>
);

// ═══════════════════════════════════════════════════════════
// ROUTER: mappa id widget → renderer denso (se disponibile)
// ═══════════════════════════════════════════════════════════
export const DENSE_WIDGETS: Record<string, React.ComponentType<any>> = {
  eventi_oggi: WidgetAgendaDense,
  prossimi_7gg: WidgetAgendaDense,
  scadenze_importanti: WidgetAgendaDense,
  oggi_devi_fare: WidgetOggiDense,
  fatture_incassare: WidgetFattureDense,
  fatture_scadute: WidgetFattureDense,
  squadra: WidgetSquadraDense,
  chi_libero: WidgetSquadraDense,
};

export function renderDenseWidget(id: string, data: any, nav: any, actions?: any): React.ReactNode | null {
  const Cmp = DENSE_WIDGETS[id];
  if (!Cmp) return null;
  return <Cmp data={data} nav={nav} {...(actions || {})} />;
}
