"use client";

import { useState } from "react";
import MastroPanelHeader from "@/components/mastro/ui/MastroPanelHeader";
import { CalendarHeader, type AgendaVista } from "@/components/agenda/CalendarHeader";
import { AlertStrip } from "@/components/agenda/AlertStrip";
import { CalendarGiorno } from "@/components/agenda/CalendarGiorno";
import { CalendarSettimana } from "@/components/agenda/CalendarSettimana";
import { CalendarTimeline } from "@/components/agenda/CalendarTimeline";
import { CalendarMappa } from "@/components/agenda/CalendarMappa";
import { AgendaPersonale } from "@/components/agenda/AgendaPersonale";
import { AssistenteAI } from "@/components/agenda/AssistenteAI";
import { FloatingActions } from "@/components/agenda/FloatingActions";
import { KPIFooter } from "@/components/agenda/KPIFooter";
import { useAgenda } from "@/hooks/useAgenda";

interface AgendaCalendarioPanelProps {
  onBack?: () => void;
  onClose?: () => void;
}

export default function AgendaCalendarioPanel({ onBack, onClose }: AgendaCalendarioPanelProps = {}) {
  const [vista, setVista] = useState<AgendaVista>("giorno");
  const { kpiAlert, rangeDa, rangeA } = useAgenda();

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      background: "#0D1F1F",
      overflow: "hidden",
    }}>
      {(onBack || onClose) && (
        <MastroPanelHeader
          title="Agenda"
          subtitle={`${vista.charAt(0).toUpperCase() + vista.slice(1)} · ${rangeDa}`}
          iconKey="calendar"
          variant="navy"
          onBack={onBack}
          onClose={onClose}
        />
      )}
      <CalendarHeader vista={vista} setVista={setVista} rangeDa={rangeDa} rangeA={rangeA} />
      {vista !== "ai" && vista !== "personale" && <AlertStrip alert={kpiAlert} />}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {vista === "giorno"    && <CalendarGiorno />}
        {vista === "settimana" && <CalendarSettimana />}
        {vista === "timeline"  && <CalendarTimeline />}
        {vista === "mappa"     && <CalendarMappa />}
        {vista === "personale" && <AgendaPersonale />}
        {vista === "ai"        && <AssistenteAI />}
      </div>

      {vista !== "ai" && <KPIFooter />}
      <FloatingActions />
    </div>
  );
}
