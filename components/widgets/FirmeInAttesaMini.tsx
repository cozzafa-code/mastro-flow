"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "./MiniAppCard";
import { IconSign, IconWhatsapp, IconArrow, IconAlert, IconFile, IconCheck } from "./shared/icons";
import {
  pick, giorniDa, formatRelative, sendWa, callTel,
  templateSollecitoFirma, stopProp,
} from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   FIRME IN ATTESA · mini-app
   Hero = firma più vecchia (più tempo passa più diventa rossa) con bottone Sollecita
   Lista = altre firme pendenti
   Empty = "Nessuna firma in attesa"
   ──────────────────────────────────────────────────────────── */

interface NormFirma {
  id: string;
  oggetto: string;     // "Preventivo #123" / "Contratto #45" / nome cliente
  cliente: string;
  telefono: string;
  giorniInAttesa: number;
  importo: number;
  tipo: "preventivo" | "contratto" | "consenso" | "altro";
  cm_id: string | null;
  url: string;         // link al documento se disponibile
  raw: any;
}

const tipoBadge = (t: NormFirma["tipo"]) => {
  switch (t) {
    case "preventivo": return { label: "PREV",    bg: TOKENS.lilac, fg: TOKENS.lilacInk };
    case "contratto":  return { label: "CONTR",   bg: TOKENS.amber, fg: TOKENS.amberInk };
    case "consenso":   return { label: "CONS",    bg: TOKENS.tealLight, fg: TOKENS.teal };
    default:           return { label: "FIRMA",   bg: TOKENS.hairlineSoft, fg: TOKENS.muted };
  }
};

const colorByDays = (days: number): "red" | "amber" | "teal" => {
  if (days >= 7) return "red";
  if (days >= 3) return "amber";
  return "teal";
};

/* Estrae firme da varie sorgenti possibili: commesse in fase "firma", ordini in attesa firma, ecc */
const extractFromCommesse = (commesse: any[]): NormFirma[] => {
  if (!Array.isArray(commesse)) return [];
  const out: NormFirma[] = [];
  for (const c of commesse) {
    const fase = String(pick(c, "fase", "stato", "status") || "").toLowerCase();
    const firmataFlag = pick(c, "firmato", "firma_data", "firma");
    const inAttesaFirma =
      (fase.includes("firma") && !firmataFlag) ||
      (fase.includes("conferma") && !firmataFlag) ||
      pick(c, "attendi_firma", "needs_signature");

    if (!inAttesaFirma) continue;

    const dataFase = pick(c, "data_firma_richiesta", "data_invio_preventivo", "data_preventivo", "data_creazione", "created_at") || "";
    const tipo: NormFirma["tipo"] =
      fase.includes("contr") ? "contratto" :
      fase.includes("prev") ? "preventivo" :
      fase.includes("conferma") ? "preventivo" : "altro";

    out.push({
      id: c?.id || `f-${Math.random().toString(36).slice(2, 9)}`,
      oggetto: pick(c, "titolo", "oggetto") || `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)} ${c?.codice || ""}`.trim(),
      cliente: pick(c, "cliente", "client_name", "nome_cliente") || "",
      telefono: pick(c, "telefono", "phone", "cell") || "",
      giorniInAttesa: dataFase ? giorniDa(dataFase) : 0,
      importo: Number(pick(c, "totale_finale", "totale_preventivo", "totale", "valore") || 0),
      tipo,
      cm_id: c?.id || null,
      url: pick(c, "preventivo_url", "url_firma", "doc_url") || "",
      raw: c,
    });
  }
  return out;
};

interface Props {
  /* Sorgente principale: array di firme già normalizzate (se disponibile in MastroContext) */
  firme?: any[];
  /* Sorgente derivata: estrae firme da commesse in fase "firma" */
  commesse?: any[];
  onNavigate?: (tab: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onApriDoc?: (url: string) => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function FirmeInAttesaMini({
  firme,
  commesse = [],
  onNavigate,
  onApriCommessa,
  onApriDoc,
  editMode = false,
  onRemove,
}: Props) {

  const items = useMemo(() => {
    // Se firme è passato esplicitamente, normalizzalo
    let result: NormFirma[] = [];
    if (Array.isArray(firme) && firme.length > 0) {
      result = firme.map((f: any, i: number) => ({
        id: f?.id || `f-${i}`,
        oggetto: pick(f, "oggetto", "titolo") || "Documento",
        cliente: pick(f, "cliente", "client_name") || "",
        telefono: pick(f, "telefono", "phone") || "",
        giorniInAttesa: f?.giorni || (f?.data ? giorniDa(f.data) : 0),
        importo: Number(pick(f, "importo", "totale", "valore") || 0),
        tipo: (pick(f, "tipo") || "altro") as NormFirma["tipo"],
        cm_id: pick(f, "cm_id", "commessa_id") || null,
        url: pick(f, "url", "doc_url") || "",
        raw: f,
      }));
    } else {
      result = extractFromCommesse(commesse);
    }
    return result.sort((a, b) => b.giorniInAttesa - a.giorniInAttesa);
  }, [firme, commesse]);

  const top = items[0];
  const altri = items.slice(1, 20);
  const urgenti = items.filter((f) => f.giorniInAttesa >= 7).length;

  const heroVariant: "red" | "amber" | "teal" = top ? colorByDays(top.giorniInAttesa) : "teal";

  const sollecitaWa = (f: NormFirma) => {
    const oggetto = `${f.oggetto}${f.importo > 0 ? ` (€${f.importo.toLocaleString("it-IT")})` : ""}`;
    const msg = templateSollecitoFirma(f.cliente || "Cliente", oggetto);
    sendWa(f.telefono, msg);
  };

  return (
    <MiniAppCard
      icon={<IconSign size={14} color={TOKENS.amberInk} />}
      iconBg={TOKENS.amber}
      title="Firme in attesa"
      subtitle={items.length === 0 ? "Tutto firmato" : `${items.length} ${items.length === 1 ? "documento" : "documenti"}`}
      badge={urgenti > 0 ? { label: `${urgenti} urgenti`, bg: TOKENS.red, fg: TOKENS.redInk } : null}
      heroVariant={heroVariant}
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("commesse")}
      openLabel="apri"
      isEmpty={items.length === 0}
      empty={{
        title: "Nessuna firma in attesa. Tutto a posto.",
        cta: onNavigate ? { label: "Apri commesse", onClick: () => onNavigate("commesse") } : undefined,
      }}
      hero={top ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {top.giorniInAttesa >= 7 ? (
              <>
                <IconAlert size={11} color={TOKENS.redInk} />
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.redInk, letterSpacing: 0.4 }}>
                  IN ATTESA DA {top.giorniInAttesa} GIORNI · URGENTE
                </span>
              </>
            ) : top.giorniInAttesa >= 3 ? (
              <>
                <MiniLivePulse color={TOKENS.amberBar} />
                <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.amberInk, letterSpacing: 0.4 }}>
                  IN ATTESA DA {top.giorniInAttesa} GIORNI
                </span>
              </>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: TOKENS.tealInk, letterSpacing: 0.4 }}>
                {top.giorniInAttesa === 0 ? "INVIATO OGGI" : `IN ATTESA DA ${top.giorniInAttesa}G`}
              </span>
            )}
            <div style={{ marginLeft: "auto" }}>
              <MiniBadge {...tipoBadge(top.tipo)} size="sm" />
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink, lineHeight: 1.2, marginBottom: 3 }}>
            {top.cliente || top.oggetto}
          </div>
          <div style={{ fontSize: 11, color: TOKENS.inkSoft, marginBottom: 8 }}>
            {top.oggetto}
            {top.importo > 0 ? ` · €${top.importo.toLocaleString("it-IT")}` : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            <button
              onClick={(e) => { stopProp(e); sollecitaWa(top); }}
              disabled={!top.telefono}
              style={{
                background: TOKENS.mintBar,
                border: "none",
                color: "#fff",
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: top.telefono ? "pointer" : "default",
                fontFamily: "inherit",
                opacity: top.telefono ? 1 : 0.45,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconWhatsapp size={11} color="#fff" />Sollecita</button>
            <button
              onClick={(e) => {
                stopProp(e);
                if (top.url) onApriDoc?.(top.url);
                else if (top.cm_id) onApriCommessa?.(top.cm_id);
              }}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconFile size={11} color={TOKENS.ink} />Doc</button>
            <button
              onClick={(e) => {
                stopProp(e);
                if (top.cm_id) onApriCommessa?.(top.cm_id);
                else onNavigate?.("commesse");
              }}
              style={{
                background: TOKENS.white,
                border: `1px solid ${TOKENS.hairline}`,
                color: TOKENS.ink,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconArrow size={11} color={TOKENS.ink} />Apri</button>
          </div>
        </div>
      ) : null}
    >
      {altri.map((f, i) => {
        const days = f.giorniInAttesa;
        return (
          <MiniListRow
            key={f.id}
            isFirst={i === 0}
            alert={days >= 7}
            leading={
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: days >= 7 ? TOKENS.red : days >= 3 ? TOKENS.amber : TOKENS.tealLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: days >= 7 ? TOKENS.redInk : days >= 3 ? TOKENS.amberInk : TOKENS.teal,
                }}>{days}g</span>
              </div>
            }
            title={f.cliente || f.oggetto}
            subtitle={f.importo > 0 ? `${f.oggetto} · €${f.importo.toLocaleString("it-IT")}` : f.oggetto}
            actions={f.telefono ? [{
              icon: <IconWhatsapp size={12} color={TOKENS.mintInk} />,
              color: TOKENS.mint,
              onClick: () => sollecitaWa(f),
            }] : []}
            trailing={<MiniBadge {...tipoBadge(f.tipo)} size="sm" />}
            onClick={() => f.cm_id ? onApriCommessa?.(f.cm_id) : onNavigate?.("commesse")}
          />
        );
      })}
    </MiniAppCard>
  );
}
