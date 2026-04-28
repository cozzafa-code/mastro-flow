// hooks/useTeamMobile.ts
"use client";
import { useState, useMemo, useEffect } from "react";
import type { Operator, Team, TeamProblem, WorkSession, TimelineEvent } from "@/lib/types/team";

// ===== DATI MOCK INIZIALI (sostituibili con Supabase) =====
const MOCK_OPERATORS: Operator[] = [
  {
    id: "op_marco",
    name: "Marco Rossi",
    status: "attivo",
    position_label: "Via Roma (cantiere)",
    current_job: "Montaggio S-0003",
    commessa_id: "cm_3",
    commessa_code: "S-0003",
    cliente: "Rossi",
    team_id: "sq_1",
    timer_label: "2h 15m",
    progress: 65,
    phone: "+39 333 1112233",
    lat: 39.2986, lng: 16.2536,
  },
  {
    id: "op_luca",
    name: "Luca Bianchi",
    status: "pausa",
    position_label: "Officina",
    current_job: "Produzione Ordine 9131G",
    timer_label: "Pausa da 25m",
    progress: 30,
    team_id: "sq_1",
    phone: "+39 333 2223344",
    lat: 39.3019, lng: 16.2510,
  },
  {
    id: "op_gianni",
    name: "Gianni Verdi",
    status: "problema",
    cliente: "Cliente Verdi",
    commessa_id: "cm_1",
    commessa_code: "S-0001",
    problem_title: "Vetro mancante",
    problem_reported_ago: "10m fa",
    team_id: "sq_2",
    phone: "+39 333 3334455",
    lat: 39.3050, lng: 16.2580,
  },
  {
    id: "op_paolo",
    name: "Paolo Neri",
    status: "viaggio",
    destination_label: "cantiere",
    arrival_eta: "14:30",
    timer_label: "Arrivo 14:30",
    team_id: "sq_2",
    phone: "+39 333 4445566",
    lat: 39.3000, lng: 16.2600,
  },
];

const MOCK_TEAMS: Team[] = [
  {
    id: "sq_1",
    name: "Squadra 1",
    members: ["Marco Rossi", "Luca Bianchi"],
    member_ids: ["op_marco", "op_luca"],
    current_job: "Cantiere Rossi",
    status_label: "2 attivi",
    problem_count: 0,
    active_count: 2,
    progress: 65,
    capo_id: "op_marco",
  },
  {
    id: "sq_2",
    name: "Squadra 2",
    members: ["Gianni Verdi", "Paolo Neri"],
    member_ids: ["op_gianni", "op_paolo"],
    current_job: "Cliente Verdi",
    status_label: "1 problema",
    problem_count: 1,
    active_count: 0,
    progress: 20,
    capo_id: "op_gianni",
  },
  {
    id: "sq_3",
    name: "Squadra 3",
    members: ["Alessandro", "Matteo"],
    member_ids: ["op_ale", "op_matteo"],
    current_job: "Produzione Officina",
    status_label: "2 attivi",
    problem_count: 0,
    active_count: 2,
    progress: 80,
  },
];

const MOCK_PROBLEMS: TeamProblem[] = [
  {
    id: "pb_1",
    title: "Vetro non arrivato",
    commessa_id: "cm_1",
    commessa_label: "S-0001 · Verdi",
    reported_by: "Gianni Verdi",
    reported_at: new Date(Date.now() - 10*60000).toISOString(),
    reported_ago: "10m fa",
    priority: "alta",
    status: "aperto",
    blocca_cantiere: true,
  },
  {
    id: "pb_2",
    title: "Ritardo fornitore",
    ordine_label: "Ordine 9131G · Produzione",
    reported_by: "Luca Bianchi",
    reported_at: new Date(Date.now() - 35*60000).toISOString(),
    reported_ago: "35m fa",
    priority: "media",
    status: "aperto",
  },
  {
    id: "pb_3",
    title: "Muro fuori squadra",
    commessa_id: "cm_3",
    commessa_label: "S-0003 · Rossi",
    reported_by: "Marco Rossi",
    reported_at: new Date(Date.now() - 60*60000).toISOString(),
    reported_ago: "1h fa",
    priority: "alta",
    status: "aperto",
  },
];

const MOCK_TIMELINE_MARCO: TimelineEvent[] = [
  { id: "ev_1", operator_id: "op_marco", time: "08:15", type: "partenza", label: "Partito dall'officina" },
  { id: "ev_2", operator_id: "op_marco", time: "08:30", type: "arrivo", label: "Arrivato in cantiere", detail: "Via Roma 12" },
  { id: "ev_3", operator_id: "op_marco", time: "08:40", type: "inizio_lavoro", label: "Iniziato montaggio" },
  { id: "ev_4", operator_id: "op_marco", time: "10:45", type: "foto", label: "Foto caricata", photo_url: "" },
  { id: "ev_5", operator_id: "op_marco", time: "12:30", type: "pausa", label: "Pausa" },
  { id: "ev_6", operator_id: "op_marco", time: "12:55", type: "ripresa", label: "Ripreso lavoro" },
  { id: "ev_7", operator_id: "op_marco", time: "15:30", type: "previsto", label: "Prevista fine lavoro" },
];

export function useTeamMobile() {
  const [operators, setOperators] = useState<Operator[]>(MOCK_OPERATORS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [problems, setProblems] = useState<TeamProblem[]>(MOCK_PROBLEMS);

  const stats = useMemo(() => {
    const attivi = operators.filter(o => o.status === "attivo").length;
    const pausa = operators.filter(o => o.status === "pausa").length;
    const probl = operators.filter(o => o.status === "problema").length;
    const offline = operators.filter(o => o.status === "offline").length;
    return { attivi, pausa, probl, offline, total: operators.length };
  }, [operators]);

  const getTimelineFor = (operatorId: string): TimelineEvent[] => {
    if (operatorId === "op_marco") return MOCK_TIMELINE_MARCO;
    return [];
  };

  return {
    operators, setOperators,
    teams, setTeams,
    problems, setProblems,
    stats,
    getTimelineFor,
  };
}
