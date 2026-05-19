"use client";
import React, { useMemo } from "react";
import { MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse, TOKENS } from "./MiniAppCard";
import { IconChat, IconWhatsapp, IconPhone, IconArrow, IconStar, IconCheck, IconMail } from "./shared/icons";
import { pick, formatRelative, callTel, sendWa, stopProp } from "./shared/helpers";

/* ────────────────────────────────────────────────────────────
   MESSAGGI NON LETTI · mini-app
   Hero = messaggio più recente non letto + risposta rapida
   Lista = altre chat non lette, scrollabile
   Empty = "Inbox pulita"
   ──────────────────────────────────────────────────────────── */

interface NormMsg {
  id: string;
  da: string;       // nome cliente / contatto
  preview: string;  // testo messaggio
  timestamp: string;
  letto: boolean;
  canale: "wa" | "sms" | "mail" | "interno";
  telefono: string;
  email: string;
  iniziali: string;
  bgAvatar: string;
  cm_id: string | null;
  raw: any;
}

const colorForName = (n: string): string => {
  const palette = [TOKENS.peachBar, TOKENS.lilacBar, TOKENS.mintBar, TOKENS.amberBar, TOKENS.skyBar, TOKENS.roseBar];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
};

const getIniziali = (s: string): string => {
  if (!s) return "?";
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const detectCanale = (m: any): NormMsg["canale"] => {
  const c = String(pick(m, "canale", "channel", "tipo", "source") || "").toLowerCase();
  if (c.includes("wa") || c.includes("whats")) return "wa";
  if (c.includes("sms")) return "sms";
  if (c.includes("mail") || c.includes("email") || c.includes("gmail")) return "mail";
  return "interno";
};

const normalize = (msgs: any[]): NormMsg[] => {
  if (!Array.isArray(msgs)) return [];
  return msgs
    .filter((m) => !(m?.letto === true || m?.read === true))
    .map((m: any, i: number) => {
      const da = pick(m, "da", "from", "mittente", "cliente", "client_name", "sender") || "Sconosciuto";
      const nameStr = String(da);
      return {
        id: m?.id || `m-${i}`,
        da: nameStr,
        preview: String(pick(m, "testo", "preview", "message", "body", "snippet", "text") || ""),
        timestamp: pick(m, "timestamp", "data", "date", "created_at", "sent_at") || "",
        letto: false,
        canale: detectCanale(m),
        telefono: pick(m, "telefono", "phone") || "",
        email: pick(m, "email", "mail") || "",
        iniziali: getIniziali(nameStr),
        bgAvatar: colorForName(nameStr),
        cm_id: pick(m, "cm_id", "commessa_id", "cantiere_id") || null,
        raw: m,
      };
    })
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
};

const canaleBadge = (c: NormMsg["canale"]) => {
  switch (c) {
    case "wa":   return { label: "WHATSAPP", bg: TOKENS.mint,  fg: TOKENS.mintInk };
    case "sms":  return { label: "SMS",      bg: TOKENS.amber, fg: TOKENS.amberInk };
    case "mail": return { label: "EMAIL",    bg: TOKENS.sky,   fg: TOKENS.skyInk };
    default:     return { label: "CHAT",     bg: TOKENS.tealLight, fg: TOKENS.teal };
  }
};

const Avatar: React.FC<{ iniziali: string; bg: string; size?: number }> = ({ iniziali, bg, size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: 50,
    background: bg,
    color: TOKENS.white,
    fontSize: size * 0.36,
    fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  }}>{iniziali}</div>
);

interface Props {
  msgs?: any[];
  onNavigate?: (tab: string) => void;
  onApriMsg?: (msgId: string) => void;
  onApriCommessa?: (cmId: string) => void;
  onMarkRead?: (msgId: string) => void;
  onAiSuggest?: (msg: any) => void;
  editMode?: boolean;
  onRemove?: () => void;
}

export default function MessaggiNonLettiMini({
  msgs = [],
  onNavigate,
  onApriMsg,
  onApriCommessa,
  onMarkRead,
  onAiSuggest,
  editMode = false,
  onRemove,
}: Props) {

  const items = useMemo(() => normalize(msgs), [msgs]);
  const top = items[0];
  const altri = items.slice(1, 20);
  const totaleNonLetti = items.length;

  const apriChat = (m: NormMsg) => {
    if (m.canale === "wa") sendWa(m.telefono);
    else onApriMsg?.(m.id);
  };

  return (
    <MiniAppCard
      icon={<IconChat size={14} color={TOKENS.peachInk} />}
      iconBg={TOKENS.peach}
      title="Messaggi"
      subtitle={totaleNonLetti === 0 ? "Tutti letti" : `${totaleNonLetti} non lett${totaleNonLetti === 1 ? "o" : "i"}`}
      badge={totaleNonLetti > 0 ? { label: `${totaleNonLetti} nuovi`, bg: TOKENS.peach, fg: TOKENS.peachInk } : null}
      heroVariant="peach"
      editMode={editMode}
      onRemove={onRemove}
      onOpen={() => onNavigate?.("messaggi")}
      openLabel="apri"
      isEmpty={totaleNonLetti === 0}
      empty={{
        title: "Tutto letto. Risposto a tutti.",
        cta: onNavigate ? { label: "Apri inbox", onClick: () => onNavigate("messaggi") } : undefined,
      }}
      hero={top ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar iniziali={top.iniziali} bg={top.bgAvatar} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: TOKENS.ink,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  flex: 1, minWidth: 0,
                }}>{top.da}</div>
                <MiniBadge {...canaleBadge(top.canale)} size="sm" />
              </div>
              <div style={{
                fontSize: 9, color: TOKENS.muted, marginTop: 1,
              }}>{formatRelative(top.timestamp)}</div>
            </div>
          </div>
          <div style={{
            fontSize: 11, color: TOKENS.inkSoft, lineHeight: 1.4,
            background: "rgba(255,255,255,0.6)",
            padding: "8px 10px",
            borderRadius: 8,
            marginBottom: 8,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any,
            overflow: "hidden",
            minHeight: 36,
          }}>
            {top.preview || <span style={{ fontStyle: "italic", color: TOKENS.muted }}>(messaggio senza testo)</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: onAiSuggest ? "1fr 1fr 1fr" : "1fr 1fr", gap: 5 }}>
            <button
              onClick={(e) => { stopProp(e); apriChat(top); }}
              style={{
                background: TOKENS.teal,
                border: "none",
                color: TOKENS.white,
                fontSize: 11, fontWeight: 600,
                padding: "7px 6px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}
            ><IconChat size={11} color="#fff" />Rispondi</button>
            {onAiSuggest && (
              <button
                onClick={(e) => { stopProp(e); onAiSuggest(top.raw); }}
                style={{
                  background: TOKENS.lilac,
                  border: `1px solid ${TOKENS.lilacBar}40`,
                  color: TOKENS.lilacInk,
                  fontSize: 11, fontWeight: 600,
                  padding: "7px 6px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              ><IconStar size={11} color={TOKENS.lilacInk} />AI</button>
            )}
            <button
              onClick={(e) => { stopProp(e); onMarkRead?.(top.id); }}
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
            ><IconCheck size={11} color={TOKENS.ink} />Letto</button>
          </div>
        </div>
      ) : null}
    >
      {altri.map((m, i) => (
        <MiniListRow
          key={m.id}
          isFirst={i === 0}
          leading={<Avatar iniziali={m.iniziali} bg={m.bgAvatar} size={26} />}
          title={m.da}
          subtitle={m.preview || `(${canaleBadge(m.canale).label.toLowerCase()})`}
          trailing={
            <div style={{ fontSize: 9, color: TOKENS.muted, flexShrink: 0, textAlign: "right" }}>
              {formatRelative(m.timestamp)}
            </div>
          }
          onClick={() => apriChat(m)}
        />
      ))}
    </MiniAppCard>
  );
}
