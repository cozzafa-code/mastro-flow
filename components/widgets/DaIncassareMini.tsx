"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "./MiniAppCard";
import { IconWallet, IconWhatsapp, IconAlert, IconArrow, IconPhone, IconFile, IconEuro } from "./shared/icons";
import {
  pick, eur, giorniDa, giorniA, sendWa, callTel,
  templateSollecitoPagamento, stopProp,
} from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   DA INCASSARE · mini-app
   Hero = TOTALE da incassare grande + numero scaduti
   Lista = fatture aperte ordinate per scadenza, scadute prima
   Azione: sollecita via WhatsApp con messaggio precompilato
   ──────────────────────────────────────────────────────────── */

interface NormFattura {
  id: string;
  numero: string;
  cliente: string;
  telefono: string;
  importo: number;
  scadenza: string;       // YYYY-MM-DD
  giorniRitardo: number;  // > 0 = scaduta, < 0 = futura, 0 = oggi
  pagata: boolean;
  cm_id: string | null;
  raw: any;
}

const normalize = (fatture: any[]): NormFattura[] => {
  if (!Array.isArray(fatture)) return [];
  return fatture
    .filter((f) => {
      const pagata = pick(f, "pagata", "paid", "saldata") === true ||
                     pick(f, "stato", "status") === "pagata" ||
                     pick(f, "stato", "status") === "paid";
      return !pagata;
    })
    .map((f: any, i: number) => {
      const scadenza = pick(f, "scadenza", "data_scadenza", "due_date") || "";
      const giorniRitardo = scadenza ? -giorniA(scadenza) : 0;
      return {
        id: f?.id || `f-${i}`,
        numero: String(pick(f, "numero", "numero_fattura", "numero_doc", "n") || `#${i + 1}`),
        cliente: String(pick(f, "cliente", "client_name", "cliente_nome") || "Cliente"),
        telefono: String(pick(f, "telefono", "phone", "cell") || ""),
        importo: Number(pick(f, "totale", "importo", "totale_finale", "valore") || 0),
        scadenza: String(scadenza),
        giorniRitardo,
        pagata: false,
        cm_id: pick(f, "cm_id", "commessa_id") || null,
        raw: f,
      };
    })
    .sort((a, b) => {
      // Più scadute prima (giorniRitardo decrescente)
      if (a.giorniRitardo !== b.giorniRitardo) return b.giorniRitardo - a.giorniRitardo;
      // A parità di scadenza, importo decrescente
      return b.importo - a.importo;
    });
};

const colorByRitardo = (g: number): "red" | "amber" | "teal" => {
  if (g >= 30) return "red";
  if (g >= 7) return "red";
  if (g > 0) return "amber";
  return "teal";
};

const labelRitardo = (g: number): string => {
  if (g > 30) return `SCADUTA ${g}G FA · GRAVE`;
  if (g > 7) return `SCADUTA ${g} GIORNI FA`;
  if (g > 0) return `SCADUTA ${g}G FA`;
  if (g === 0) return "SCADE OGGI";
  if (g === -1) return "SCADE DOMANI";
  if (g >= -7) return `SCADE TRA ${-g}G`;
  return `SCADE ${new Date(Date.now() - g * 86_400_000).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`;
};

interface Props {
  fattureDB?: any[];
  /* Mostrare solo scadute (true) o tutte aperte (false). Default: false. */
  onlyScadute?: boolean;
  onNavigate?: (tab: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onApriFattura?: (fId: string) => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function DaIncassareMini({
  fattureDB = [],
  onlyScadute = false,
  onNavigate,
  onApriCommessa,
  onApriFattura,
  editMode = false,
  onRemove,
}: Props) {

  const all = useMemo(() => normalize(fattureDB), [fattureDB]);
  const items = useMemo(() => onlyScadute ? all.filter((f) => f.giorniRitardo > 0) : all, [all, onlyScadute]);

  const totale = useMemo(() => items.reduce((s, f) => s + f.importo, 0), [items]);
  const scadute = useMemo(() => items.filter((f) => f.giorniRitardo > 0), [items]);
  const totaleScaduto = useMemo(() => scadute.reduce((s, f) => s + f.importo, 0), [scadute]);

  const top = items[0];
  const altri = items.slice(1, 20);

  const heroVariant: "red" | "amber" | "teal" =
    !top ? "teal" : colorByRitardo(top.giorniRitardo);

  const sollecitaWa = (f: NormFattura) => {
    const importo = eur(f.importo);
    const scadStr = f.scadenza ? new Date(f.scadenza).toLocaleDateString("it-IT") : "scadenza";
    const msg = templateSollecitoPagamento(f.cliente, importo, scadStr);
    sendWa(f.telefono, msg);
  };

  return (
    <MiniAppCard
      icon={<IconWallet size={14} color={TOKENS.mintInk} />}
      iconBg={TOKENS.mint}
      title={onlyScadute ? "Fatture scadute" : "Da incassare"}
      subtitle={items.length === 0 ? "Tutto incassato" : `${items.length} fattur${items.length === 1 ? "a" : "e"} apert${items.length === 1 ? "a" : "e"}`}
      badge={scadute.length > 0 && !onlyScadute ? {
        label: `${scadute.length} scad.`,
        bg: TOKENS.red, fg: TOKENS.redInk,
      } : null}
      heroVariant={heroVariant}
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("contabilita")}
      openLabel="apri"
      isEmpty={items.length === 0}
      empty={{
        title: "Tutto incassato. Bel risultato.",
        cta: onNavigate ? { label: "Apri contabilità", onClick: () => onNavigate("contabilita") } : undefined,
      }}
      hero={top ? (
        <div>
          {/* Riga top: totale grande */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            marginBottom: 6,
          }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.4, marginBottom: 2 }}>
                TOTALE APERTO
              </div>
              <div style={{
                fontSize: 24, fontWeight: 800, color: TOKENS.ink,
                lineHeight: 1, letterSpacing: -0.5,
              }}>{eur(totale, { compact: totale >= 100000 })}</div>
            </div>
            {totaleScaduto > 0 && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: TOKENS.redInk, letterSpacing: 0.3 }}>
                  DI CUI SCADUTO
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.redInk, marginTop: 2 }}>
                  {eur(totaleScaduto, { compact: totaleScaduto >= 100000 })}
                </div>
              </div>
            )}
          </div>

          {/* Hero della singola fattura più urgente */}
          <div style={{
            background: "rgba(255,255,255,0.6)",
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              {top.giorniRitardo > 0 && <IconAlert size={10} color={TOKENS.redInk} />}
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: top.giorniRitardo > 7 ? TOKENS.redInk : top.giorniRitardo > 0 ? TOKENS.amberInk : TOKENS.tealInk,
                letterSpacing: 0.3,
              }}>{labelRitardo(top.giorniRitardo)}</span>
              <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: TOKENS.ink }}>
                {eur(top.importo)}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: TOKENS.ink }}>
              {top.cliente} · Fatt. {top.numero}
            </div>
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
            <button
              onClick={(e) => {
                stopProp(e);
                if (top.cm_id) onApriCommessa?.(top.cm_id);
                else onApriFattura?.(top.id);
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
            ><IconFile size={11} color={TOKENS.ink} />Vedi</button>
          </div>
        </div>
      ) : null}
    >
      {altri.map((f, i) => (
        <MiniListRow
          key={f.id}
          isFirst={i === 0}
          alert={f.giorniRitardo > 7}
          leading={
            <div style={{
              minWidth: 50, textAlign: "right" as const,
              padding: "2px 6px",
              borderRadius: 6,
              background: f.giorniRitardo > 7 ? TOKENS.red : f.giorniRitardo > 0 ? TOKENS.amber : TOKENS.hairlineSoft,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800,
                color: f.giorniRitardo > 7 ? TOKENS.redInk : f.giorniRitardo > 0 ? TOKENS.amberInk : TOKENS.muted,
              }}>{f.giorniRitardo > 0 ? `+${f.giorniRitardo}g` : f.giorniRitardo === 0 ? "oggi" : `${-f.giorniRitardo}g`}</div>
            </div>
          }
          title={f.cliente}
          subtitle={`Fatt. ${f.numero} · ${eur(f.importo)}`}
          actions={f.telefono ? [{
            icon: <IconWhatsapp size={12} color={TOKENS.mintInk} />,
            color: TOKENS.mint,
            onClick: () => sollecitaWa(f),
          }] : []}
          onClick={() => {
            if (f.cm_id) onApriCommessa?.(f.cm_id);
            else onApriFattura?.(f.id);
          }}
        />
      ))}
    </MiniAppCard>
  );
}
