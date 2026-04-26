"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, TOKENS } from "./MiniAppCard";
import { IconFile, IconArrow, IconPin, IconNav, IconPhone } from "./shared/icons";
import {
  pick, eur, formatRelative, callTel, openUrl, mapsLnk, stopProp,
} from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   LAVORI RECENTI · mini-app
   Hero = commessa più recente toccata (Continua dove avevi lasciato)
   Lista = altre commesse recenti con badge fase
   ──────────────────────────────────────────────────────────── */

interface NormCm {
  id: string;
  codice: string;       // S-0001 / 2024-045 / ecc
  cliente: string;
  telefono: string;
  indirizzo: string;
  fase: string;
  faseLabel: string;
  faseBadge: { label: string; bg: string; fg: string };
  totale: number;
  ultimoTocco: string;  // ISO datetime
  raw: any;
}

const FASI: Record<string, { label: string; bg: string; fg: string; order: number }> = {
  sopralluogo: { label: "SOPR",  bg: TOKENS.tealLight, fg: TOKENS.teal,     order: 1 },
  rilievo:     { label: "RIL",   bg: TOKENS.peach,     fg: TOKENS.peachInk, order: 2 },
  preventivo:  { label: "PREV",  bg: TOKENS.lilac,     fg: TOKENS.lilacInk, order: 3 },
  conferma:    { label: "CONF",  bg: TOKENS.amber,     fg: TOKENS.amberInk, order: 4 },
  ordine:      { label: "ORD",   bg: TOKENS.amber,     fg: TOKENS.amberInk, order: 5 },
  produzione:  { label: "PROD",  bg: TOKENS.sky,       fg: TOKENS.skyInk,   order: 6 },
  consegna:    { label: "CONS",  bg: TOKENS.sky,       fg: TOKENS.skyInk,   order: 7 },
  posa:        { label: "POSA",  bg: TOKENS.mint,      fg: TOKENS.mintInk,  order: 8 },
  montaggio:   { label: "MONT",  bg: TOKENS.mint,      fg: TOKENS.mintInk,  order: 8 },
  fattura:     { label: "FATT",  bg: TOKENS.green,     fg: TOKENS.greenInk, order: 9 },
  pagata:      { label: "OK",    bg: TOKENS.green,     fg: TOKENS.greenInk, order: 10 },
  chiusa:      { label: "FINE",  bg: TOKENS.hairlineSoft, fg: TOKENS.muted, order: 11 },
  ferma:       { label: "STOP",  bg: TOKENS.red,       fg: TOKENS.redInk,   order: 0 },
};

const detectFase = (cm: any): { key: string; meta: { label: string; bg: string; fg: string; order: number } } => {
  const raw = String(pick(cm, "fase", "stato", "status", "phase") || "").toLowerCase();
  for (const k of Object.keys(FASI)) {
    if (raw.includes(k)) return { key: k, meta: FASI[k] };
  }
  return { key: "sopralluogo", meta: FASI.sopralluogo };
};

const normalize = (commesse: any[]): NormCm[] => {
  if (!Array.isArray(commesse)) return [];
  return commesse
    .filter((c) => {
      const fase = String(pick(c, "fase", "stato", "status") || "").toLowerCase();
      return !fase.includes("chius") && !fase.includes("archiv");
    })
    .map((c: any, i: number): NormCm => {
      const { key: fase, meta } = detectFase(c);
      return {
        id: c?.id || `cm-${i}`,
        codice: String(pick(c, "codice", "code", "numero", "id_visibile") || `#${i + 1}`),
        cliente: String(pick(c, "cliente", "client_name", "nome_cliente") || "Cliente"),
        telefono: String(pick(c, "telefono", "phone", "cell") || ""),
        indirizzo: String(pick(c, "indirizzo", "address", "luogo") || ""),
        fase,
        faseLabel: meta.label,
        faseBadge: { label: meta.label, bg: meta.bg, fg: meta.fg },
        totale: Number(pick(c, "totale_finale", "totale_preventivo", "totale", "valore", "euro") || 0),
        ultimoTocco: String(pick(c, "updated_at", "modified_at", "ultimo_aggiornamento", "data_modifica", "created_at") || ""),
        raw: c,
      };
    })
    .sort((a, b) => String(b.ultimoTocco || "0").localeCompare(String(a.ultimoTocco || "0")));
};

interface Props {
  commesse?: any[];
  onNavigate?: (tab: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onNuovaCommessa?: () => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function LavoriRecentiMini({
  commesse = [],
  onNavigate,
  onApriCommessa,
  onNuovaCommessa,
  editMode = false,
  onRemove,
}: Props) {

  const items = useMemo(() => normalize(commesse), [commesse]);
  const top = items[0];
  const altri = items.slice(1, 20);

  return (
    <MiniAppCard
      icon={<IconFile size={14} color={TOKENS.skyInk} />}
      iconBg={TOKENS.sky}
      title="Lavori recenti"
      subtitle={items.length === 0 ? "Nessuna commessa" : `${items.length} attiv${items.length === 1 ? "a" : "e"}`}
      heroVariant="sky"
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("commesse")}
      openLabel="tutte"
      isEmpty={items.length === 0}
      empty={{
        title: "Nessuna commessa attiva",
        cta: onNuovaCommessa ? { label: "+ Nuova commessa", onClick: onNuovaCommessa } :
             onNavigate ? { label: "Apri commesse", onClick: () => onNavigate("commesse") } : undefined,
      }}
      hero={top ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.skyInk, letterSpacing: 0.4 }}>
              {top.ultimoTocco ? `MODIFICATA ${formatRelative(top.ultimoTocco).toUpperCase()}` : "ULTIMA APERTA"}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <MiniBadge {...top.faseBadge} size="sm" />
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.2, marginBottom: 3 }}>
            {top.codice} · {top.cliente}
          </div>
          {(top.indirizzo || top.totale > 0) && (
            <div style={{ fontSize: 11, color: TOKENS.inkSoft, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {top.indirizzo && (
                <>
                  <IconPin size={9} color={TOKENS.muted} />
                  <span style={{
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                    flex: 1, minWidth: 0,
                  }}>{top.indirizzo}</span>
                </>
              )}
              {top.totale > 0 && (
                <span style={{ fontWeight: 600, color: TOKENS.ink, marginLeft: top.indirizzo ? 4 : 0 }}>
                  {eur(top.totale, { compact: top.totale >= 10000 })}
                </span>
              )}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 5 }}>
            <button
              onClick={(e) => { stopProp(e); onApriCommessa?.(top.id); }}
              style={{
                background: TOKENS.skyBar,
                border: "none",
                color: "#fff",
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconArrow size={11} color="#fff" />Continua</button>
            <button
              onClick={(e) => { stopProp(e); if (top.indirizzo) openUrl(mapsLnk(top.indirizzo)); }}
              disabled={!top.indirizzo}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: top.indirizzo ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: top.indirizzo ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconNav size={11} color={TOKENS.ink} />Vai</button>
            <button
              onClick={(e) => { stopProp(e); callTel(top.telefono); }}
              disabled={!top.telefono}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: top.telefono ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: top.telefono ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconPhone size={11} color={TOKENS.ink} />Chiama</button>
          </div>
        </div>
      ) : null}
    >
      {altri.map((c, i) => (
        <MiniListRow
          key={c.id}
          isFirst={i === 0}
          leading={
            <div style={{
              fontSize: 9, fontWeight: 700, color: TOKENS.muted,
              minWidth: 44, textAlign: "right" as const,
            }}>{c.codice}</div>
          }
          title={c.cliente}
          subtitle={
            c.totale > 0
              ? `${c.indirizzo || c.faseLabel} · ${eur(c.totale, { compact: c.totale >= 10000 })}`
              : c.indirizzo || c.faseLabel
          }
          trailing={<MiniBadge {...c.faseBadge} size="sm" />}
          onClick={() => onApriCommessa?.(c.id)}
        />
      ))}
    </MiniAppCard>
  );
}
