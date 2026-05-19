"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "./MiniAppCard";
import { IconCheckCircle, IconClock, IconAlert, IconCheck, IconArrow, IconWhatsapp, IconFile, IconPhone } from "./shared/icons";
import {
  pick, todayISO, giorniDa, formatRelative, sendWa, callTel,
  templateSollecitoFirma, stopProp,
} from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   OGGI DEVI FARE · mini-app
   Hero = task più urgente con azione contestuale
   Lista = altri task, scrollabile, ognuno con checkbox + azione
   Stato vuoto = "Sei in pari! +" per nuovo task
   ──────────────────────────────────────────────────────────── */

interface NormTask {
  id: string;
  titolo: string;
  giorno: string;
  ora: string;
  tipo: string;        // "firma" | "chiamata" | "fattura" | "preventivo" | "rilievo" | ...
  urgenza: "alta" | "media" | "bassa";
  cm_id: string | null;
  cliente: string;
  telefono: string;
  scaduto: boolean;
  raw: any;
}

const tipoFromTitle = (t: string): string => {
  const s = t.toLowerCase();
  if (s.includes("firm")) return "firma";
  if (s.includes("chiam") || s.includes("telef")) return "chiamata";
  if (s.includes("fattur")) return "fattura";
  if (s.includes("prev")) return "preventivo";
  if (s.includes("riliev") || s.includes("sopral")) return "rilievo";
  if (s.includes("montag") || s.includes("posa")) return "montaggio";
  if (s.includes("ordin")) return "ordine";
  if (s.includes("invia") || s.includes("manda")) return "invio";
  return "task";
};

const tipoBadge = (tipo: string): { label: string; bg: string; fg: string } => {
  switch (tipo) {
    case "firma":      return { label: "FIRMA",  bg: TOKENS.amber, fg: TOKENS.amberInk };
    case "chiamata":   return { label: "CHIAMA", bg: TOKENS.sky,   fg: TOKENS.skyInk };
    case "fattura":    return { label: "FATT",   bg: TOKENS.mint,  fg: TOKENS.mintInk };
    case "preventivo": return { label: "PREV",   bg: TOKENS.lilac, fg: TOKENS.lilacInk };
    case "rilievo":    return { label: "RIL",    bg: TOKENS.peach, fg: TOKENS.peachInk };
    case "montaggio":  return { label: "MONT",   bg: TOKENS.mint,  fg: TOKENS.mintInk };
    case "ordine":     return { label: "ORD",    bg: TOKENS.lilac, fg: TOKENS.lilacInk };
    case "invio":      return { label: "INVIA",  bg: TOKENS.tealLight, fg: TOKENS.teal };
    default:           return { label: "TODO",   bg: TOKENS.hairlineSoft, fg: TOKENS.muted };
  }
};

const normalize = (tasks: any[]): NormTask[] => {
  if (!Array.isArray(tasks)) return [];
  const td = todayISO();
  return tasks
    .filter((t: any) => !(t?.completato || t?.done || t?.fatto))
    .map((t: any, i: number) => {
      const titolo = pick(t, "titolo", "title", "text", "descrizione") || "Task";
      const tipoExplicit = pick(t, "tipo", "type", "categoria") || "";
      const tipo = tipoExplicit ? String(tipoExplicit).toLowerCase() : tipoFromTitle(String(titolo));
      const giorno = pick(t, "giorno", "data", "date", "scadenza", "due_date") || "";
      const urgenzaRaw = pick(t, "urgenza", "priority", "priorita") || "";
      const urgString = String(urgenzaRaw).toLowerCase();
      const urgenza: NormTask["urgenza"] =
        urgString.includes("alt") || urgString === "high" ? "alta" :
        urgString.includes("bass") || urgString === "low" ? "bassa" : "media";
      const scaduto = giorno && giorno < td;
      return {
        id: t?.id || `t-${i}`,
        titolo: String(titolo),
        giorno: String(giorno || ""),
        ora: pick(t, "ora", "time") || "",
        tipo,
        urgenza,
        cm_id: pick(t, "cm_id", "commessa_id", "cantiere_id") || null,
        cliente: pick(t, "cliente", "client_name", "persona") || "",
        telefono: pick(t, "telefono", "phone") || "",
        scaduto: Boolean(scaduto),
        raw: t,
      };
    })
    .sort((a, b) => {
      // Scaduti prima, poi alta urgenza, poi data più vicina
      if (a.scaduto !== b.scaduto) return a.scaduto ? -1 : 1;
      const urgOrder = { alta: 0, media: 1, bassa: 2 };
      if (a.urgenza !== b.urgenza) return urgOrder[a.urgenza] - urgOrder[b.urgenza];
      return (a.giorno || "9999").localeCompare(b.giorno || "9999");
    });
};

interface Props {
  tasks?: any[];
  commesse?: any[];
  onNavigate?: (tab: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onNuovoTask?: () => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function OggiDeviFareMini({
  tasks = [],
  commesse = [],
  onNavigate,
  onCompleteTask,
  onApriCommessa,
  onNuovoTask,
  editMode = false,
  onRemove,
}: Props) {

  const items = useMemo(() => normalize(tasks), [tasks]);
  const td = todayISO();
  const oggi = useMemo(() => items.filter((t) => !t.giorno || t.giorno === td || t.scaduto), [items, td]);
  const top = oggi[0];
  const altri = oggi.slice(1, 20);
  const scaduti = oggi.filter((t) => t.scaduto).length;

  const findCommessa = (cm_id: string | null) =>
    cm_id ? commesse.find((c) => c.id === cm_id) : null;

  const azioniHero = (t: NormTask) => {
    const out: { label: string; onClick: (e: React.MouseEvent) => void; variant?: any; icon?: React.ReactNode }[] = [];
    out.push({
      label: "Fatto",
      variant: "primary",
      icon: <IconCheck size={11} color="#fff" />,
      onClick: (e) => { stopProp(e); onCompleteTask?.(t.id); },
    });
    // Azione contestuale sul tipo
    if (t.tipo === "firma") {
      out.push({
        label: "Sollecita",
        variant: "secondary",
        icon: <IconWhatsapp size={11} color={TOKENS.ink} />,
        onClick: (e) => {
          stopProp(e);
          const msg = templateSollecitoFirma(t.cliente || "Cliente", t.titolo);
          sendWa(t.telefono, msg);
        },
      });
    } else if (t.tipo === "chiamata") {
      out.push({
        label: "Chiama",
        variant: "secondary",
        icon: <IconPhone size={11} color={TOKENS.ink} />,
        onClick: (e) => { stopProp(e); callTel(t.telefono); },
      });
    } else if (t.tipo === "fattura" || t.tipo === "preventivo" || t.tipo === "ordine") {
      if (t.cm_id) {
        out.push({
          label: "Apri",
          variant: "secondary",
          icon: <IconFile size={11} color={TOKENS.ink} />,
          onClick: (e) => { stopProp(e); onApriCommessa?.(t.cm_id!); },
        });
      }
    } else if (t.cm_id) {
      out.push({
        label: "Apri",
        variant: "secondary",
        icon: <IconFile size={11} color={TOKENS.ink} />,
        onClick: (e) => { stopProp(e); onApriCommessa?.(t.cm_id!); },
      });
    }
    return out;
  };

  const heroVariant: "peach" | "amber" | "teal" =
    !top ? "teal" : top.scaduto ? "peach" : top.urgenza === "alta" ? "amber" : "teal";

  return (
    <MiniAppCard
      icon={<IconCheckCircle size={14} color={TOKENS.teal} />}
      title="Oggi devi fare"
      subtitle={oggi.length === 0
        ? "Tutto in pari"
        : `${oggi.length} ${oggi.length === 1 ? "task" : "task"}${scaduti ? ` · ${scaduti} scaduti` : ""}`}
      badge={scaduti > 0 ? { label: `${scaduti} scad.`, bg: TOKENS.peach, fg: TOKENS.peachInk } : null}
      heroVariant={heroVariant}
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("agenda")}
      openLabel="apri"
      isEmpty={oggi.length === 0}
      empty={{
        title: "Hai finito tutto. Bel lavoro.",
        cta: onNuovoTask ? { label: "+ Nuovo task", onClick: onNuovoTask } : undefined,
      }}
      hero={top ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {top.scaduto ? (
              <>
                <IconAlert size={11} color={TOKENS.peachInk} />
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.peachInk, letterSpacing: 0.4 }}>
                  SCADUTO · {giorniDa(top.giorno)}g
                </span>
              </>
            ) : top.urgenza === "alta" ? (
              <>
                <MiniLivePulse color={TOKENS.amberBar} />
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.amberInk, letterSpacing: 0.4 }}>
                  PRIORITÀ ALTA
                </span>
              </>
            ) : (
              <>
                <IconClock size={11} color={TOKENS.tealInk} />
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.tealInk, letterSpacing: 0.4 }}>
                  PROSSIMA
                </span>
              </>
            )}
            <div style={{ marginLeft: "auto" }}>
              <MiniBadge {...tipoBadge(top.tipo)} size="sm" />
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.25, marginBottom: 3 }}>
            {top.titolo}
          </div>
          {(top.cliente || top.giorno) && (
            <div style={{ fontSize: 10, color: TOKENS.inkSoft, marginBottom: 8 }}>
              {top.cliente}{top.cliente && top.giorno ? " · " : ""}{top.giorno && !top.scaduto ? formatRelative(top.giorno) : top.giorno || ""}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${azioniHero(top).length}, 1fr)`, gap: 5 }}>
            {azioniHero(top).map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                style={{
                  background: a.variant === "primary" ? TOKENS.teal : TOKENS.white,
                  border: a.variant === "primary" ? "none" : `1px solid ${TOKENS.hairline}`,
                  color: a.variant === "primary" ? TOKENS.white : TOKENS.ink,
                  fontSize: 11, fontWeight: 600,
                  padding: "7px 8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >{a.icon}{a.label}</button>
            ))}
          </div>
        </div>
      ) : null}
    >
      {altri.map((t, i) => {
        const badge = tipoBadge(t.tipo);
        return (
          <MiniListRow
            key={t.id}
            isFirst={i === 0}
            alert={t.scaduto}
            leading={
              <button
                onClick={(e) => { e.stopPropagation(); onCompleteTask?.(t.id); }}
                aria-label="Completa"
                style={{
                  width: 20, height: 20, borderRadius: 50,
                  border: `1.5px solid ${TOKENS.hairline}`,
                  background: TOKENS.white,
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              />
            }
            title={t.titolo}
            subtitle={
              t.scaduto ? `Scaduto ${giorniDa(t.giorno)}g fa${t.cliente ? ` · ${t.cliente}` : ""}` :
              t.giorno ? `${formatRelative(t.giorno)}${t.cliente ? ` · ${t.cliente}` : ""}` :
              t.cliente || ""
            }
            trailing={<MiniBadge label={badge.label} bg={badge.bg} fg={badge.fg} size="sm" />}
            onClick={() => {
              if (t.cm_id) onApriCommessa?.(t.cm_id);
              else onNavigate?.("agenda");
            }}
          />
        );
      })}
    </MiniAppCard>
  );
}
