// components/mobile/team/TeamMobile.tsx
"use client";
import React, { useState } from "react";
import { useTeamMobile } from "@/hooks/useTeamMobile";
import { useTeamFilters } from "@/hooks/useTeamFilters";
import type { Operator } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";

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
import { IcoPlus } from "./icons";

interface Props {
  hideBottomNav?: boolean;
  onOpenCommessa?: (id: string) => void;
}

type View = "list" | "detail" | "map";

export default function TeamMobile({ hideBottomNav, onOpenCommessa }: Props) {
  const { operators, teams, problems, stats, getTimelineFor } = useTeamMobile();
  const { tab, setTab, filtered } = useTeamFilters(operators);

  const [view, setView] = useState<View>("list");
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);
  const [showFab, setShowFab] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskDefaultOp, setTaskDefaultOp] = useState<string | undefined>();

  const handleOpen = (op: Operator) => { setSelectedOp(op); setView("detail"); };
  const handleChiama = (op: Operator) => { if (op.phone) window.location.href = "tel:" + op.phone.replace(/\s/g, ""); };

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

  return (
    <div style={{ background: PAL.pageBg, minHeight: "100vh", paddingBottom: hideBottomNav ? 16 : 100, fontFamily: "Inter, -apple-system, sans-serif" }}>
      <TeamHeaderMobile
        totalOperators={stats.total}
        attivi={stats.attivi}
        problemi={stats.probl}
      />

      <TeamTabsMobile tab={tab} setTab={setTab} problemiBadge={problems.filter(p => p.status === "aperto").length} />

      {(tab === "tutti" || tab === "attivi") && (
        <>
          <TeamStatusCardMobile
            attivi={stats.attivi}
            pausa={stats.pausa}
            problemi={stats.probl}
            offline={stats.offline}
          />

          {/* H3 16px SemiBold "Operatori" — mockup */}
          <div style={{ padding: "20px 16px 0", fontSize: 16, fontWeight: 600, color: PAL.text }}>
            Operatori
          </div>

          <div>
            {filtered.map(op => (
              <OperatorCardMobile
                key={op.id}
                op={op}
                onOpen={handleOpen}
                onChiama={handleChiama}
                onMappa={() => setView("map")}
                onTask={(o) => { setTaskDefaultOp(o.id); setShowNewTask(true); }}
                onRisolvi={(o) => handleOpen(o)}
                onTraccia={() => setView("map")}
              />
            ))}
          </div>
        </>
      )}

      {tab === "squadre" && (
        <TeamSquadsMobile teams={teams} onOpen={() => {}} onNuovaSquadra={() => {}} />
      )}

      {tab === "problemi" && (
        <TeamProblemsMobile
          problems={problems.filter(p => p.status === "aperto")}
          onOpen={() => {}}
          onRisolvi={() => {}}
          onVediTutti={() => {}}
        />
      )}

      {/* FAB 48px - 16dx 80bottom */}
      <div onClick={() => setShowFab(true)} style={{
        position: "fixed",
        bottom: hideBottomNav ? 24 : 80,
        right: 16,
        zIndex: 100,
        width: 48, height: 48,
        borderRadius: 999,
        background: PAL.gradEnd,
        color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(40,160,160,0.4)",
      }}>
        <IcoPlus s={20} />
      </div>

      {showFab && (
        <NewTeamActionSheetMobile
          onClose={() => setShowFab(false)}
          onNuovoTask={() => { setShowFab(false); setShowNewTask(true); }}
          onNuovaSquadra={() => setShowFab(false)}
          onNuovoProblema={() => setShowFab(false)}
          onAssegnaLavoro={() => setShowFab(false)}
          onApriMappa={() => { setShowFab(false); setView("map"); }}
          onNotaVeloce={() => setShowFab(false)}
        />
      )}

      {showNewTask && (
        <NewTaskSheetMobile
          operators={operators}
          defaultOperatorId={taskDefaultOp}
          onClose={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
          onSubmit={() => { setShowNewTask(false); setTaskDefaultOp(undefined); }}
        />
      )}
    </div>
  );
}
