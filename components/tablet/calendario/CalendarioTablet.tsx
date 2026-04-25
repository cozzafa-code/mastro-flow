"use client";
import * as React from "react";
import CalendarioToolbarTablet, { VistaCal, FiltroTipo } from "./CalendarioToolbarTablet";
import CalendarioMeseTablet from "./CalendarioMeseTablet";
import CalendarioSettimanaTablet from "./CalendarioSettimanaTablet";
import CalendarioGiornoTablet from "./CalendarioGiornoTablet";
import CalendarioSidebarTablet from "./CalendarioSidebarTablet";

export default function CalendarioTablet() {
  const [vista, setVista] = React.useState<VistaCal>("mese");
  const [filtro, setFiltro] = React.useState<FiltroTipo>("tutti");

  const titolo = vista === "mese"
    ? "aprile 2026"
    : vista === "settimana"
      ? "20-26 aprile 2026"
      : "Sabato 25 aprile 2026";

  return (
    <div>
      <CalendarioToolbarTablet
        vista={vista}
        onVistaChange={setVista}
        filtro={filtro}
        onFiltroChange={setFiltro}
        meseAnno={titolo}
        onPrev={() => console.log("prev")}
        onNext={() => console.log("next")}
        onToday={() => console.log("today")}
        onNuovoEvento={() => console.log("nuovo evento")}
      />

      {vista === "mese" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 264px", gap: 12, alignItems: "flex-start" }}>
          <CalendarioMeseTablet
            primoGiornoWeekday={2}
            giorniMese={30}
            oggi={25}
            onSelectGiorno={(g) => console.log("giorno:", g)}
            onSelectEvento={(id) => console.log("evento:", id)}
          />
          <CalendarioSidebarTablet />
        </div>
      )}

      {vista === "settimana" && (
        <CalendarioSettimanaTablet
          oggiIdx={5}
          onSelectEvento={(id) => console.log("evento:", id)}
        />
      )}

      {vista === "giorno" && (
        <CalendarioGiornoTablet
          onSelectEvento={(id) => console.log("evento:", id)}
        />
      )}
    </div>
  );
}
