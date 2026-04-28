// components/mobile/team/SquadDetailMobile.tsx
// FASE 5B - dettaglio squadra: header colorato, lista membri con stato, montaggi recenti
"use client";
import React, { useEffect, useState, useMemo } from "react";
import type { Operator, Team } from "@/lib/types/team";
import { listaMontaggiFinestra, getSquadra, eliminaSquadra, type MontaggioPianificato, type SquadraDettaglio } from "@/lib/team-actions";
import { TOKENS, MiniAppCard, MiniListRow, MiniBadge } from "@/components/widgets/MiniAppCard";
import { IconUsers, IconUser, IconClose, IconEdit, IconFile, IconPin } from "@/components/widgets/shared/icons";

interface Props {
  team: Team;
  operators: Operator[];
  onBack: () => void;
  onEdit: () => void;
  onOpenOperator: (op: Operator) => void;
  onOpenCommessa?: (id: string) => void;
  onDeleted?: () => void;
}

function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: TOKENS.mintBar,  text: "Attivo",   bg: TOKENS.mint,  fg: TOKENS.mintInk };
    case "pausa":    return { dot: TOKENS.amberBar, text: "Pausa",    bg: TOKENS.amber, fg: TOKENS.amberInk };
    case "problema": return { dot: TOKENS.redBar,   text: "Problema", bg: TOKENS.red,   fg: TOKENS.redInk };
    case "viaggio":  return { dot: TOKENS.skyBar,   text: "Viaggio",  bg: TOKENS.sky,   fg: TOKENS.skyInk };
    default:         return { dot: "#9CA3AF",       text: "Offline",  bg: TOKENS.hairlineSoft, fg: TOKENS.muted };
  }
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

export default function SquadDetailMobile({ team, operators, onBack, onEdit, onOpenOperator, onOpenCommessa, onDeleted }: Props) {
  const [dettaglio, setDettaglio] = useState<SquadraDettaglio | null>(null);
  const [montaggi, setMontaggi] = useState<MontaggioPianificato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const sq = await getSquadra(team.id);
        if (!alive) return;
        setDettaglio(sq);

        // Montaggi della squadra: oggi + prossimi 14 giorni
        const da = fmtDate(new Date());
        const aDate = new Date(); aDate.setDate(aDate.getDate() + 14);
        const list = await listaMontaggiFinestra({ da, a: fmtDate(aDate) });
        if (!alive) return;
        const memberIds = new Set(sq?.membri_ids || []);
        const filtered = list.filter(m =>
          (m.operatore_id && memberIds.has(m.operatore_id)) ||
          m.squadra.some(id => memberIds.has(id))
        );
        setMontaggi(filtered);
      } catch (e: any) {
        if (alive) setError(e?.message || "errore");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [team.id]);

  const membri = useMemo(() => {
    if (!dettaglio) return [];
    return dettaglio.membri_ids.map(id => operators.find(o => o.id === id)).filter(Boolean) as Operator[];
  }, [dettaglio, operators]);

  const capo = dettaglio?.capo_squadra_id ? operators.find(o => o.id === dettaglio.capo_squadra_id) : null;
  const colore = dettaglio?.colore || team.id || "#28A0A0";

  const handleDelete = async () => {
    try {
      setBusy(true);
      await eliminaSquadra(team.id);
      onDeleted?.();
      onBack();
    } catch (e: any) {
      setError(e?.message || "errore eliminazione");
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#F4F1EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${colore} 0%, ${colore}CC 100%)`,
        padding: "16px 16px 22px", color: "#FFF",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4, color: "#FFF", fontSize: 22, lineHeight: 1 }}>←</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600, letterSpacing: 0.4 }}>SQUADRA</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 1, letterSpacing: -0.3 }}>{team.name}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
            {membri.length} {membri.length === 1 ? "membro" : "membri"}
            {dettaglio?.zona && ` · ${dettaglio.zona}`}
            {dettaglio?.specializzazione && ` · ${dettaglio.specializzazione}`}
          </div>
        </div>
        <div onClick={onEdit} style={{
          width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <IconEdit size={16} color="#FFF" />
        </div>
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {error && <div style={{ background: TOKENS.red, color: TOKENS.redInk, padding: 12, borderRadius: 12, fontSize: 12 }}>{error}</div>}
        {loading && <div style={{ padding: 24, textAlign: "center", color: TOKENS.muted, fontSize: 13 }}>Caricamento...</div>}

        {!loading && (
          <>
            {/* CARD KPI SQUADRA */}
            <MiniAppCard
              icon={<IconUsers size={14} color={colore} />}
              iconBg={colore + "20"}
              iconColor={colore}
              title="Stato squadra ora"
              subtitle={dettaglio?.descrizione || "—"}
              heroVariant="none"
              hero={
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 0 }}>
                  <KPI n={team.active_count}   col={TOKENS.mintBar}  inkCol={TOKENS.mintInk}  lbl="Attivi" />
                  <KPI n={team.problem_count}  col={TOKENS.redBar}   inkCol={TOKENS.redInk}   lbl="Problemi" />
                  <KPI n={montaggi.filter(m => m.stato === "programmato").length} col={TOKENS.skyBar}   inkCol={TOKENS.skyInk}   lbl="Pianif." />
                  <KPI n={montaggi.filter(m => m.stato === "completato").length} col={TOKENS.tealInk}  inkCol={TOKENS.tealInk}  lbl="Fatti" />
                </div>
              }
            />

            {/* CAPO SQUADRA */}
            {capo && (
              <MiniAppCard
                icon={<IconUser size={14} color={colore} />}
                iconBg={colore + "20"}
                iconColor={colore}
                title="Capo squadra"
                heroVariant="none"
              >
                <MiniListRow
                  isFirst
                  leading={<Avatar name={capo.name} url={capo.avatar_url} size={32} />}
                  title={capo.name}
                  subtitle={statusInfo(capo.status).text + (capo.current_job ? ` · ${capo.current_job}` : "")}
                  trailing={<MiniBadge label="CAPO" bg={colore + "20"} fg={colore} />}
                  onClick={() => onOpenOperator(capo)}
                />
              </MiniAppCard>
            )}

            {/* MEMBRI */}
            {membri.filter(m => m.id !== capo?.id).length > 0 && (
              <MiniAppCard
                icon={<IconUsers size={14} color={TOKENS.teal} />}
                title="Membri squadra"
                subtitle={`${membri.filter(m => m.id !== capo?.id).length} ${membri.filter(m => m.id !== capo?.id).length === 1 ? "membro" : "membri"}`}
                heroVariant="none"
              >
                {membri.filter(m => m.id !== capo?.id).map((op, i) => {
                  const s = statusInfo(op.status);
                  return (
                    <MiniListRow
                      key={op.id}
                      isFirst={i === 0}
                      leading={<Avatar name={op.name} url={op.avatar_url} size={32} />}
                      bar={s.dot}
                      title={op.name}
                      subtitle={s.text + (op.current_job ? ` · ${op.current_job}` : "")}
                      trailing={<MiniBadge label={s.text.toUpperCase()} bg={s.bg} fg={s.fg} />}
                      onClick={() => onOpenOperator(op)}
                    />
                  );
                })}
              </MiniAppCard>
            )}

            {/* MONTAGGI ASSEGNATI */}
            {montaggi.length > 0 && (
              <MiniAppCard
                icon={<IconFile size={14} color={TOKENS.teal} />}
                title="Lavori assegnati"
                subtitle={`${montaggi.length} montaggi · oggi e prossimi 14 giorni`}
                heroVariant="none"
              >
                {montaggi.slice(0, 8).map((m, i) => {
                  const dt = new Date(m.data_montaggio + "T00:00:00");
                  const giorno = dt.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
                  const stato = m.motivo_pausa ? "PAUSA" : m.stato === "in_corso" ? "IN CORSO" : m.stato === "completato" ? "FATTO" : "PIANIF.";
                  const colorPair = m.motivo_pausa ? { bg: TOKENS.amber, fg: TOKENS.amberInk } :
                                    m.stato === "in_corso" ? { bg: TOKENS.mint, fg: TOKENS.mintInk } :
                                    m.stato === "completato" ? { bg: TOKENS.tealLight, fg: TOKENS.tealInk } :
                                    { bg: TOKENS.sky, fg: TOKENS.skyInk };
                  return (
                    <MiniListRow
                      key={m.id}
                      isFirst={i === 0}
                      leading={<div style={{ width: 32, height: 32, borderRadius: 8, background: colorPair.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><IconFile size={13} color={colorPair.fg} /></div>}
                      title={`${m.commessa_code || "—"} ${m.cliente ? "· " + m.cliente : ""}`}
                      subtitle={`${giorno}${m.ora_inizio ? " " + m.ora_inizio.slice(0,5) : ""}${m.indirizzo ? " · " + m.indirizzo : ""}`}
                      trailing={<MiniBadge label={stato} bg={colorPair.bg} fg={colorPair.fg} />}
                      onClick={() => m.commessa_id && onOpenCommessa?.(m.commessa_id)}
                    />
                  );
                })}
              </MiniAppCard>
            )}

            {/* ELIMINA */}
            <div style={{ padding: "16px 0 0" }}>
              <button onClick={() => setShowConfirmDelete(true)} disabled={busy} style={{
                width: "100%", padding: "12px 16px",
                background: "transparent", color: TOKENS.redInk,
                border: `1px solid ${TOKENS.redBar}40`, borderRadius: 12,
                fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.5 : 1, fontFamily: "inherit",
              }}>Elimina squadra</button>
            </div>
          </>
        )}
      </div>

      {showConfirmDelete && (
        <div onClick={() => setShowConfirmDelete(false)} style={{
          position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#FFF", padding: 20, borderRadius: 18,
            maxWidth: 320, margin: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TOKENS.ink, marginBottom: 8 }}>Eliminare {team.name}?</div>
            <div style={{ fontSize: 12, color: TOKENS.inkSoft, marginBottom: 16 }}>L'operazione è permanente. I membri della squadra resteranno operatori, ma la squadra sparirà.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowConfirmDelete(false)} disabled={busy} style={{
                flex: 1, padding: "10px 14px", background: TOKENS.hairlineSoft, color: TOKENS.ink,
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Annulla</button>
              <button onClick={handleDelete} disabled={busy} style={{
                flex: 1, padding: "10px 14px", background: TOKENS.redBar, color: "#FFF",
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1, fontFamily: "inherit",
              }}>{busy ? "..." : "Elimina"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ n, col, inkCol, lbl }: { n: number; col: string; inkCol: string; lbl: string }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: "8px 4px", textAlign: "center" as any }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: col }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: inkCol, lineHeight: 1 }}>{n}</span>
      </div>
      <div style={{ fontSize: 9, color: TOKENS.muted, fontWeight: 600, marginTop: 4, letterSpacing: 0.3 }}>{lbl}</div>
    </div>
  );
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9" }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, background: "linear-gradient(135deg,#94A3B8,#64748B)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{init}</div>;
}
