"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import CalendarioToolbarTablet, { VistaCal, FiltroTipo } from "./CalendarioToolbarTablet";
import CalendarioMeseTablet from "./CalendarioMeseTablet";
import CalendarioSidebarTablet from "./CalendarioSidebarTablet";

export default function CalendarioTablet() {
  const [vista, setVista] = React.useState<VistaCal>("mese");
  const [filtro, setFiltro] = React.useState<FiltroTipo>("tutti");

  return (
    <div>
      <CalendarioToolbarTablet
        vista={vista}
        onVistaChange={setVista}
        filtro={filtro}
        onFiltroChange={setFiltro}
        meseAnno="aprile 2026"
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

      {vista !== "mese" && (
        <div style={cardStyle({ padding: "40px 28px", textAlign: "center" })}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TT.text2, marginBottom: 4 }}>
            Vista {vista}
          </div>
          <div style={{ fontSize: 12, color: TT.text3 }}>
            In arrivo step 9b.
          </div>
        </div>
      )}
    </div>
  );
}
