// components/montaggi/MontaggiSheet.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useMastroData } from "@/hooks/useMastroData";
import {
  C,
  MontaggioRow,
  MontaggiView,
  MontaggiFilter,
} from "./montaggi-types";
import MontaggiSheetHeader from "./MontaggiSheetHeader";
import MontaggiListView from "./MontaggiListView";
import MontaggiCalendarView from "./MontaggiCalendarView";
import MontaggiGanttView from "./MontaggiGanttView";
import MontaggiEditModal from "./MontaggiEditModal";
import { Chip, Bdg } from "./montaggi-shared";

interface Props {
  open: boolean;
  onClose: () => void;
  onApriCommessa?: (commessaId: string) => void;
}

export default function MontaggiSheet({
  open,
  onClose,
  onApriCommessa,
}: Props) {
  const _md = useMastroData(); const rawMontaggi = (_md as any)?.state?.montaggi || (_md as any)?.montaggi || []; const commesse = (_md as any)?.state?.commesse || (_md as any)?.commesse || [];
  const [view, setView] = useState<MontaggiView>("lista");
  const [filter, setFilter] = useState<MontaggiFilter>("tutti");
  const [editing, setEditing] = useState<MontaggioRow | null>(null);

  // Arricchimento con dati commessa
  const montaggi = useMemo<MontaggioRow[]>(() => {
    if (!rawMontaggi) return [];
    const cMap = new Map((commesse || []).map((c: any) => [c.id, c]));
    return rawMontaggi
      .filter((m: any) => m.commessa_id && cMap.has(m.commessa_id))
      .map((m: any) => {
        const c: any = cMap.get(m.commessa_id);
        return {
          ...m,
          commessa_code: c?.code,
          commessa_cliente: c?.cliente,
          commessa_cognome: c?.cognome,
          commessa_indirizzo: c?.indirizzo,
          commessa_citta: c?.citta,
          commessa_telefono: c?.telefono,
          commessa_vani_count: c?.vani_count || 0,
          commessa_totale: c?.totale_finale || c?.totale_preventivo || 0,
        };
      });
  }, [rawMontaggi, commesse]);

  const stats = useMemo(() => {
    let daFare = 0, inOpera = 0, daPianif = 0, fatti = 0;
    for (const m of montaggi) {
      if (m.stato === "programmato") daFare++;
      else if (m.stato === "in_corso") inOpera++;
      else if (m.stato === "da_pianificare") daPianif++;
      else if (m.stato === "completato") fatti++;
    }
    return { daFare, inOpera, daPianif, fatti, totale: montaggi.length };
  }, [montaggi]);

  const filtered = useMemo(() => {
    if (filter === "tutti") return montaggi;
    if (filter === "da_fare")
      return montaggi.filter((m) => m.stato === "programmato");
    if (filter === "in_opera")
      return montaggi.filter((m) => m.stato === "in_corso");
    if (filter === "da_pianificare")
      return montaggi.filter((m) => m.stato === "da_pianificare");
    if (filter === "fatti")
      return montaggi.filter((m) => m.stato === "completato");
    return montaggi.filter(
      (m) => Array.isArray(m.squadra) && m.squadra.includes(filter as string)
    );
  }, [montaggi, filter]);

  const squadre = useMemo(() => {
    const set = new Set<string>();
    montaggi.forEach((m) => {
      if (Array.isArray(m.squadra)) m.squadra.forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [montaggi]);

  function handleApri(id: string) {
    if (onApriCommessa) onApriCommessa(id);
    else onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: C.bgApp,
        display: "flex",
        flexDirection: "column",
        maxWidth: 420,
        margin: "0 auto",
        height: "100vh",
      }}
    >
      <MontaggiSheetHeader onClose={onClose} stats={stats} />

      {/* TAB VIEW */}
      <div style={{ flex: "0 0 auto", padding: "12px 14px 4px 14px" }}>
        <div
          style={{
            display: "flex",
            background: C.white,
            borderRadius: 13,
            padding: 4,
            boxShadow: C.shadowSm,
          }}
        >
          {(["lista", "calendario", "gantt"] as MontaggiView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: "9px 8px",
                borderRadius: 9,
                background: view === v ? C.navy : "transparent",
                border: "none",
                color: view === v ? C.white : C.navyDim,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow:
                  view === v ? "0 2px 8px rgba(26, 42, 71, 0.25)" : "none",
              }}
            >
              {v === "lista" ? "Lista" : v === "calendario" ? "Calendario" : "Gantt"}
            </button>
          ))}
        </div>
      </div>

      {/* FILTRI */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "10px 14px 8px 14px",
          background: C.bgApp,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none" as any,
          }}
        >
          <Chip active={filter === "tutti"} onClick={() => setFilter("tutti")}>
            Tutti<Bdg active={filter === "tutti"}>{stats.totale}</Bdg>
          </Chip>
          <Chip active={filter === "da_fare"} onClick={() => setFilter("da_fare")} dotColor={C.amber}>
            Da fare<Bdg active={filter === "da_fare"}>{stats.daFare}</Bdg>
          </Chip>
          <Chip active={filter === "in_opera"} onClick={() => setFilter("in_opera")} dotColor={C.greenBright}>
            In opera<Bdg active={filter === "in_opera"}>{stats.inOpera}</Bdg>
          </Chip>
          <Chip active={filter === "da_pianificare"} onClick={() => setFilter("da_pianificare")} dotColor={C.red}>
            Da pianif.<Bdg active={filter === "da_pianificare"}>{stats.daPianif}</Bdg>
          </Chip>
          <Chip active={filter === "fatti"} onClick={() => setFilter("fatti")} dotColor={C.navyFaint}>
            Fatti<Bdg active={filter === "fatti"}>{stats.fatti}</Bdg>
          </Chip>
          {squadre.map((s) => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {/* SCROLL AREA */}
      <div
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          padding: "4px 14px 100px 14px",
          WebkitOverflowScrolling: "touch" as any,
        }}
      >
        {view === "lista" && (
          <MontaggiListView
            montaggi={filtered}
            onMontaggioClick={setEditing}
            onApriCommessa={handleApri}
          />
        )}
        {view === "calendario" && (
          <MontaggiCalendarView
            montaggi={filtered}
            onMontaggioClick={setEditing}
          />
        )}
        {view === "gantt" && (
          <MontaggiGanttView
            montaggi={filtered}
            onMontaggioClick={setEditing}
          />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setEditing({} as MontaggioRow)}
        style={{
          position: "absolute",
          bottom: 90,
          right: 16,
          height: 56,
          padding: "0 22px 0 18px",
          borderRadius: 18,
          background: C.navy,
          color: C.white,
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(26, 42, 71, 0.4)",
          zIndex: 30,
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Nuovo</span>
      </button>

      <MontaggiEditModal
        montaggio={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
