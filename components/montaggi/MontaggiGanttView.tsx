// components/montaggi/MontaggiGanttView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { C, MontaggioRow } from "./montaggi-types";
import MontaggiGanttRow from "./MontaggiGanttRow";
import {
  GanttZoomToggle,
  GanttDaysHeader,
  GanttScrollHint,
  GANTT_ZOOM_DAYS,
  GanttZoom,
} from "./MontaggiGanttHeader";
import { SumItem, InsightCard } from "./montaggi-shared";

interface Props {
  montaggi: MontaggioRow[];
  onMontaggioClick: (m: MontaggioRow) => void;
}

export default function MontaggiGanttView({
  montaggi,
  onMontaggioClick,
}: Props) {
  const [zoom, setZoom] = useState<GanttZoom>("2sett");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(() => {
    const n = GANTT_ZOOM_DAYS[zoom];
    const startOffset = -2;
    const out: Date[] = [];
    for (let i = 0; i < n; i++) {
      out.push(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + startOffset + i
        )
      );
    }
    return out;
  }, [zoom, today]);

  const { bySquad, liberi } = useMemo(() => {
    const map = new Map<string, MontaggioRow[]>();
    const liberi: MontaggioRow[] = [];
    for (const m of montaggi) {
      if (!m.squadra || m.squadra.length === 0) {
        liberi.push(m);
        continue;
      }
      // Usa primo nome non-UUID come chiave leggibile
      const nomi = m.squadra.filter(function(s) { return s && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(s); });
      const key = nomi.length > 0 ? nomi[0] : m.squadra[0];
      const arr = map.get(key) || [];
      arr.push(m);
      map.set(key, arr);
    }
    return {
      bySquad: Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      liberi,
    };
  }, [montaggi]);

  const stats = useMemo(() => {
    let sovracc = 0;
    const squads: {label: string; h: number}[] = [];
    bySquad.forEach(([k, arr]) => {
      const h = arr.reduce((s, m) => s + (m.ore_preventivate || 0), 0);
      squads.push({ label: k, h });
      if (h > 16) sovracc++;
    });
    const sq1H = squads[0]?.h || 0;
    const sq2H = squads[1]?.h || 0;
    const sq1L = squads[0]?.label || "Sq1";
    const sq2L = squads[1]?.label || "Sq2";
    return { sq1H, sq2H, sq1L, sq2L, sovracc, nonAss: liberi.length };
  }, [bySquad, liberi]);

  return (
    <div>
      {/* Zoom tools */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <GanttZoomToggle zoom={zoom} onChange={setZoom} />
      </div>

      {/* Summary KPI */}
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 12,
          boxShadow: C.shadowSm,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <SumItem num={stats.sq1H + "h"} lbl={stats.sq1L + " carico"} />
        <SumItem num={stats.sq2H + "h"} lbl={stats.sq2L + " carico"} color={C.green} />
        <SumItem
          num={String(stats.sovracc)}
          lbl="Sovracc."
          color={stats.sovracc > 0 ? C.amberDark : undefined}
        />
        <SumItem
          num={String(stats.nonAss)}
          lbl="Non ass."
          color={stats.nonAss > 0 ? C.red : undefined}
        />
      </div>

      {/* Gantt */}
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          boxShadow: C.shadowSm,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <GanttScrollHint />

        <div
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch" as any,
          }}
        >
          <div style={{ minWidth: Math.max(700, days.length * 60) }}>
            <GanttDaysHeader days={days} today={today} />

            {bySquad.map(([squadId, arr]) => {
              const totH = arr.reduce(
                (s, m) => s + (m.ore_preventivate || 0),
                0
              );
              return (
                <MontaggiGanttRow
                  key={squadId}
                  squadId={squadId}
                  squadLabel={squadId}
                  loadStr={`${totH}h / 16h`}
                  loadOver={totH > 16}
                  montaggi={arr}
                  days={days}
                  today={today}
                  onClick={onMontaggioClick}
                />
              );
            })}

            {liberi.length > 0 && (
              <MontaggiGanttRow
                squadId="liberi"
                squadLabel="Liberi"
                loadStr={`${liberi.length} da ass.`}
                loadOver={false}
                montaggi={liberi}
                days={days}
                today={today}
                onClick={onMontaggioClick}
                isLiberi
              />
            )}
          </div>
        </div>
      </div>

      {stats.sovracc > 0 && (
        <InsightCard
          color="red"
          title="Squadra sovraccarica"
          desc={`${stats.sovracc} squadra con oltre 16h pianificate. Considera split o riassegnazione.`}
        />
      )}
      {stats.nonAss > 0 && (
        <InsightCard
          color="amber"
          title={`${stats.nonAss} montaggio non assegnato`}
          desc={`Hai ${stats.nonAss} montaggio senza squadra. Assegna per programmare.`}
        />
      )}
    </div>
  );
}
