// hooks/useTeamMobile.ts
"use client";
import { useState, useMemo } from "react";
import type { Operator, Team, TeamProblem, TimelineEvent } from "@/lib/types/team";
import { getAvatarUrl } from "@/lib/types/team";

const MOCK_OPERATORS: Operator[] = [
  { id: "op_marco", name: "Marco Rossi", avatar_url: getAvatarUrl("marco-rossi"), status: "attivo", position_label: "Via Roma (cantiere)", current_job: "Montaggio S-0003", commessa_id: "cm_3", commessa_code: "S-0003", cliente: "Rossi", team_id: "sq_1", timer_label: "2h 15m", progress: 65, phone: "+39 333 1112233" },
  { id: "op_luca",  name: "Luca Bianchi", avatar_url: getAvatarUrl("luca-bianchi"), status: "pausa", position_label: "Officina", current_job: "Produzione Ordine 9131G", timer_label: "Pausa da 25m", progress: 30, team_id: "sq_1", phone: "+39 333 2223344" },
  { id: "op_gianni",name: "Gianni Verdi", avatar_url: getAvatarUrl("gianni-verdi"), status: "problema", cliente: "Cliente Verdi", commessa_id: "cm_1", commessa_code: "S-0001", problem_title: "Vetro mancante", problem_reported_ago: "10m fa", team_id: "sq_2", phone: "+39 333 3334455" },
  { id: "op_paolo", name: "Paolo Neri", avatar_url: getAvatarUrl("paolo-neri"), status: "viaggio", destination_label: "cantiere", arrival_eta: "14:30", timer_label: "Arrivo 14:30", team_id: "sq_2", phone: "+39 333 4445566" },
];

const MOCK_TEAMS: Team[] = [
  { id: "sq_1", name: "Squadra 1", members: ["Marco Rossi", "Luca Bianchi"], member_ids: ["op_marco","op_luca"], current_job: "Cantiere Rossi", status_label: "2 attivi", problem_count: 0, active_count: 2, progress: 65 },
  { id: "sq_2", name: "Squadra 2", members: ["Gianni Verdi", "Paolo Neri"], member_ids: ["op_gianni","op_paolo"], current_job: "Cliente Verdi", status_label: "1 problema", problem_count: 1, active_count: 0, progress: 20 },
  { id: "sq_3", name: "Squadra 3", members: ["Alessandro", "Matteo"], member_ids: ["op_ale","op_matteo"], current_job: "Produzione Officina", status_label: "2 attivi", problem_count: 0, active_count: 2, progress: 80 },
];

const MOCK_PROBLEMS: TeamProblem[] = [
  { id: "pb_1", title: "Vetro non arrivato", commessa_label: "S-0001 · Verdi", reported_by: "Gianni Verdi", reported_at: new Date(Date.now()-10*60000).toISOString(), reported_ago: "10m fa", priority: "Alta", status: "aperto" },
  { id: "pb_2", title: "Ritardo fornitore",  ordine_label: "Ordine 9131G · Produzione", reported_by: "Luca Bianchi", reported_at: new Date(Date.now()-35*60000).toISOString(), reported_ago: "35m fa", priority: "Media", status: "aperto" },
  { id: "pb_3", title: "Muro fuori squadra", commessa_label: "S-0003 · Rossi", reported_by: "Marco Rossi", reported_at: new Date(Date.now()-60*60000).toISOString(), reported_ago: "1h fa", priority: "Alta", status: "aperto" },
];

const MOCK_TIMELINE_MARCO: TimelineEvent[] = [
  { id: "ev_1", operator_id: "op_marco", time: "08:15", type: "partenza", label: "Partito dall'officina" },
  { id: "ev_2", operator_id: "op_marco", time: "08:30", type: "arrivo", label: "Arrivato in cantiere", detail: "Via Roma 12" },
  { id: "ev_3", operator_id: "op_marco", time: "08:40", type: "inizio_lavoro", label: "Iniziato montaggio" },
  { id: "ev_4", operator_id: "op_marco", time: "10:45", type: "foto", label: "Foto caricata", has_photo: true },
  { id: "ev_5", operator_id: "op_marco", time: "12:30", type: "pausa", label: "Pausa" },
  { id: "ev_6", operator_id: "op_marco", time: "12:55", type: "ripresa", label: "Ripreso lavoro" },
  { id: "ev_7", operator_id: "op_marco", time: "15:30", type: "previsto", label: "Prevista fine lavoro" },
];

export function useTeamMobile() {
  const [operators] = useState<Operator[]>(MOCK_OPERATORS);
  const [teams] = useState<Team[]>(MOCK_TEAMS);
  const [problems] = useState<TeamProblem[]>(MOCK_PROBLEMS);

  const stats = useMemo(() => ({
    attivi: operators.filter(o => o.status === "attivo").length,
    pausa: operators.filter(o => o.status === "pausa").length,
    probl: operators.filter(o => o.status === "problema").length,
    offline: operators.filter(o => o.status === "offline").length,
    total: operators.length,
  }), [operators]);

  const getTimelineFor = (id: string): TimelineEvent[] => id === "op_marco" ? MOCK_TIMELINE_MARCO : [];

  return { operators, teams, problems, stats, getTimelineFor };
}
