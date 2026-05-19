// components/montaggi/MontaggiListView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { C, MontaggioRow, parseDateISO } from "./montaggi-types";
import MontaggiCompactCard from "./MontaggiCompactCard";
import MontaggiHeroCard from "./MontaggiHeroCard";
import MontaggiDateCard from "./MontaggiDateCard";
import { SectionLabel } from "./montaggi-shared";

interface Props {
  montaggi: MontaggioRow[];
  onMontaggioClick: (m: MontaggioRow) => void;
  onApriCommessa: (commessaId: string) => void;
}

type SubTab = "prossimi" | "per_data" | "per_squadra";

export default function MontaggiListView({
  montaggi,
  onMontaggioClick,
  onApriCommessa,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>("prossimi");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Classifico montaggi per sezione
  const { inOpera, inProgramma, daPianificare, completati, prossimo } =
    useMemo(() => {
      const inOpera: MontaggioRow[] = [];
      const inProgramma: MontaggioRow[] = [];
      const daPianificare: MontaggioRow[] = [];
      const completati: MontaggioRow[] = [];

      for (const m of montaggi) {
        if (m.stato === "in_corso") inOpera.push(m);
        else if (m.stato === "da_pianificare") daPianificare.push(m);
        else if (m.stato === "completato") completati.push(m);
        else if (m.stato === "programmato") inProgramma.push(m);
      }

      inProgramma.sort((a, b) => {
        const da = a.data_montaggio || "9999-12-31";
        const db = b.data_montaggio || "9999-12-31";
        return da.localeCompare(db);
      });

      completati.sort((a, b) => {
        const da = a.data_montaggio || "0000-01-01";
        const db = b.data_montaggio || "0000-01-01";
        return db.localeCompare(da);
      });

      const prossimo =
        inProgramma.find((m) => {
          const d = parseDateISO(m.data_montaggio);
          return d && d >= today;
        }) || null;

      return { inOpera, inProgramma, daPianificare, completati, prossimo };
    }, [montaggi, today]);

  // Raggruppa programmati per data
  const programmatiByDate = useMemo(() => {
    const map = new Map<string, MontaggioRow[]>();
    for (const m of inProgramma) {
      if (!m.data_montaggio) continue;
      const arr = map.get(m.data_montaggio) || [];
      arr.push(m);
      map.set(m.data_montaggio, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [inProgramma]);

  const totProgHours = inProgramma.reduce(
    (s, m) => s + (m.ore_preventivate || 0),
    0
  );

  return (
    <div>
      {/* SUB-TABS */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
          padding: 3,
          background: "rgba(255,255,255,0.4)",
          borderRadius: 10,
        }}
      >
        {(["prossimi", "per_data", "per_squadra"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 7,
              border: "none",
              background: subTab === t ? C.white : "transparent",
              color: subTab === t ? C.navyText : C.navyDim,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              boxShadow: subTab === t ? C.shadowXs : "none",
            }}
          >
            {t === "prossimi"
              ? "Prossimi"
              : t === "per_data"
                ? "Per data"
                : "Per squadra"}
          </button>
        ))}
      </div>

      {/* HERO PROSSIMO */}
      {prossimo && (
        <MontaggiHeroCard
          prossimo={prossimo}
          today={today}
          onApriCommessa={onApriCommessa}
        />
      )}

      {/* IN OPERA */}
      {inOpera.length > 0 && (
        <>
          <SectionLabel title="In opera ora" right={`${inOpera.length} attivo`} />
          {inOpera.map((m) => (
            <MontaggiCompactCard
              key={m.id}
              montaggio={m}
              onClick={onMontaggioClick}
            />
          ))}
        </>
      )}

      {/* IN PROGRAMMA */}
      {inProgramma.length > 0 && (
        <>
          <SectionLabel
            title="In programma"
            right={`${inProgramma.length} montaggi · ${totProgHours}h tot.`}
          />
          {programmatiByDate.map(([dateStr, items]) => (
            <React.Fragment key={dateStr}>
              <MontaggiDateCard dateStr={dateStr} items={items} />
              {items.map((m) => (
                <MontaggiCompactCard
                  key={m.id}
                  montaggio={m}
                  onClick={onMontaggioClick}
                />
              ))}
            </React.Fragment>
          ))}
        </>
      )}

      {/* DA PIANIFICARE */}
      {daPianificare.length > 0 && (
        <>
          <SectionLabel
            title="⚠ Da pianificare"
            right={`${daPianificare.length} in attesa`}
            warn
          />
          {daPianificare.map((m) => (
            <MontaggiCompactCard
              key={m.id}
              montaggio={m}
              onClick={onMontaggioClick}
            />
          ))}
        </>
      )}

      {/* COMPLETATI */}
      {completati.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "18px 0 10px 0",
              padding: "0 4px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(26, 42, 71, 0.15)",
              }}
            />
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: C.navyDim,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Completati recenti
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(26, 42, 71, 0.15)",
              }}
            />
          </div>
          {completati.slice(0, 5).map((m) => (
            <MontaggiCompactCard
              key={m.id}
              montaggio={m}
              onClick={onMontaggioClick}
              showDate
            />
          ))}
        </>
      )}

      {/* Empty state */}
      {montaggi.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: C.navyDim,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Nessun montaggio
        </div>
      )}
    </div>
  );
}
