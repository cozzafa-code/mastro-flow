// components/mobile/team/TeamMobile.tsx
"use client";
import React, { useState } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator, Team, TeamProblem } from "@/lib/types/team";
import { TT } from "@/lib/types/team";

import TeamHeaderMobile from "./TeamHeaderMobile";
import TeamTabsMobile from "./TeamTabsMobile";
import TeamStatusCardMobile from "./TeamStatusCardMobile";
import OperatorCardMobile from "./OperatorCardMobile";
import OperatorDetailMobile from "./OperatorDetailMobile";
import TeamSquadsMobile from "./TeamSquadsMobile";
import TeamProblemsMobile from "./TeamProblemsMobile";
import TeamMapMobile from "./TeamMapMobile";
import NewTaskSheetMobile from "./NewTaskSheetMobile";
import NewTeamActionSheetMobile from "./NewTeamActionSheetMobile";

interface Props {
  hideBottomNav?: boolean;
  onOpenCommessa?: (commessaId: string) => void;
}

type View = "list" | "detail" | "map";

export default function TeamMobile({ hideBottomNav, onOpenCommessa }: Props) {
  const { operators, teams, problems, stats, getTimelineFor } = useTeamMobile();
  const { tab, setTab, filtered } = useTeamFilters(operators);

  const [view, setView] = useState<View>("list");
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskDefaultOp, setTaskDefaultOp] = useState<string | undefined>(undefined);

  // === HANDLERS OPERATORE ===
  const handleOpen = (op: Operator) => { setSelectedOp(op); setView("detail"); };
  const handleChiama = (op: Operator) => { if (op.phone) window.location.href = "tel:" + op.phone.replace(/\s/g, ""); };
  const handleMappa = (op: Operator) => { setView("map"); };
  const handleTask = (op: Operator) => { setTaskDefaultOp(op.id); setShowNewTask(true); };
  const handleRisolvi = (op: Operator) => { /* aprirà problema dettaglio - per ora stub */ };
  const handleTraccia = (op: Operator) => { setView("map"); };

  // === SUBMIT NEW TASK ===
  const handleSubmitTask = (data: any) => {
    // qui andrebbe il save in DB - per ora chiudo e basta
    console.log("[TASK]", data);
    setShowNewTask(false);
    setTaskDefaultOp(undefined);
  };

  // === VIEWS ===
  if (view === "detail" && selectedOp) {
    return (
      <OperatorDetailMobile
        op={selectedOp}
        timeline={getTimelineFor(selectedOp.id)}
        onBack={() => { setView("list"); setSelectedOp(null); }}
        onChiama={() => handleChiama(selectedOp)}
        onMappa={() => setView("map")}
        onChat={() => {}}
        onFoto={() => {}}
        onTask={() => { setTaskDefaultOp(selectedOp.id); setShowNewTask(true); }}
        onProblema={() => {}}
        onVaiCommessa={() => selectedOp.commessa_id && onOpenCommessa?.(selectedOp.commessa_id)}
        onPausa={() => {}}
        onStop={() => {}}
        onAssegnaTask={() => { setTaskDefaultOp(selectedOp.id); setShowNewTask(true); }}
      />
    );
  }

  if (view === "map") {
    return (
      <TeamMapMobile
        operators={operators}
        onBack={() => setView("list")}
        onOpenOperator={(op) => { setSelectedOp(op); setView("detail"); }}
      />
    );
  }

  // === LIST VIEW ===
  return (
    <div style={{ background: TT.bg, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 90 }}>
      <TeamHeaderMobile
        totalOperators={stats.total}
        attivi={stats.attivi}
        problemi={stats.probl}
        onFilters={() => {}}
      />

      <TeamTabsMobile tab={tab} setTab={setTab} problemiBadge={problems.filter(p => p.status === "aperto").length} />

      {tab === "tutti" || tab === "attivi" ? (
        <>
          <TeamStatusCardMobile
            attivi={stats.attivi}
            pausa={stats.pausa}
            problemi={stats.probl}
            offline={stats.offline}
          />

          <div style={{ padding: "16px 14px 0", fontSize: 13, fontWeight: 900, color: TT.text }}>
            Operatori
          </div>

          <div style={{ paddingBottom: 90 }}>
            {filtered.map(op => (
              <OperatorCardMobile
                key={op.id}
                op={op}
                onOpen={handleOpen}
                onChiama={handleChiama}
                onMappa={handleMappa}
                onTask={handleTask}
                onRisolvi={handleRisolvi}
                onTraccia={handleTraccia}
              />
            ))}
          </div>
        </>
      ) : tab === "squadre" ? (
        <TeamSquadsMobile
          teams={teams}
          onOpen={() => {}}
          onAssegna={() => {}}
          onNuovaSquadra={() => {}}
        />
      ) : (
        <TeamProblemsMobile
          problems={problems.filter(p => p.status === "aperto")}
          onOpen={() => {}}
          onRisolvi={() => {}}
          onVediTutti={() => {}}
        />
      )}

      {/* FAB */}
      <div onClick={() => setShowFab(true)} style={{
        position: "fixed", bottom: hideBottomNav ? 24 : 92, right: 18, zIndex: 100,
        width: 56, height: 56, borderRadius: 999,
        background: TT.acc, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 6px 16px rgba(40,160,160,0.5)",
        fontSize: 28, fontWeight: 300,
      }}>+</div>

      {/* MODALS */}
      {showFab && (
        <NewTeamActionSheetMobile
          onClose={() => setShowFab(false)}
          onNuovoTask={() => { setShowFab(false); setShowNewTask(true); }}
          onNuovaSquadra={() => { setShowFab(false); }}
          onNuovoProblema={() => { setShowFab(false); }}
          onAssegnaLavoro={() => { setShowFab(false); }}
          onApriMappa={() => { setShowFab(false); setView("map"); }}
          onNotaVeloce={() => { setShowFab(false); }}
        />
      )}

      {showNewTask && (
        <NewTaskSheetMobile
          operators={operators}
          defaultOperatorId={taskDefaultOp}
          onClose={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
          onSubmit={handleSubmitTask}
        />
      )}
    </div>
  );
}
