"use client";

import { TIPO_COLORE, STATO_LABEL, STATO_BADGE, type AgendaEvento } from "@/hooks/useAgenda";

interface Props {
  evento: AgendaEvento;
  variant?: "block" | "row";
  onTap?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  draggable?: boolean;
}

export function EventCard({ evento, variant = "block", onTap, onDragStart, onDragEnd, draggable = false }: Props) {
  const c = TIPO_COLORE[evento.tipo];
  const stato = STATO_BADGE[evento.stato];

  const oraInizio = (evento.ora_inizio ?? "").slice(0, 5);
  const oraFine = (evento.ora_fine ?? "").slice(0, 5);

  if (variant === "row") {
    // Vista Timeline · row orizzontale
    return (
      <div
        draggable={draggable}
        onDragStart={() => onDragStart?.()}
        onDragEnd={() => onDragEnd?.()}
        onClick={onTap}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          background: "#fff", borderRadius: 12,
          boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
          borderLeft: `3px solid ${c.fg}`,
          cursor: onTap ? "pointer" : (draggable ? "grab" : "default"),
        }}>
        <div style={{ minWidth: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>{oraInizio}</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#8FA8A8" }}>{oraFine}</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: c.gradient, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 3px 8px ${c.fg}55`,
        }}>
          <TipoIcon tipo={evento.tipo} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{evento.titolo}</div>
          <div style={{
            fontSize: 9.5, fontWeight: 700, color: c.fg, letterSpacing: 0.2, textTransform: "uppercase", marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{evento.luogo ?? evento.cliente ?? evento.tipo}</div>
        </div>
        <span style={{
          padding: "3px 7px", borderRadius: 5,
          background: stato.bg, color: stato.fg,
          fontSize: 8.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase",
          flexShrink: 0,
        }}>{STATO_LABEL[evento.stato]}</span>
      </div>
    );
  }

  // Vista Giorno · block verticale dentro slot orari
  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart?.()}
      onDragEnd={() => onDragEnd?.()}
      onClick={onTap}
      style={{
        padding: "5px 7px", borderRadius: 7,
        background: c.bg,
        borderLeft: `3px solid ${c.fg}`,
        cursor: onTap ? "pointer" : (draggable ? "grab" : "default"),
        height: "100%", overflow: "hidden",
        boxShadow: "0 1px 3px rgba(13,31,31,0.06)",
      }}>
      <div style={{
        fontSize: 8, fontWeight: 900, color: c.fg, letterSpacing: 0.4, textTransform: "uppercase",
      }}>{evento.tipo}</div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: "#0F2525", letterSpacing: -0.1, marginTop: 1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{evento.cliente ?? evento.titolo}</div>
      {evento.luogo && (
        <div style={{
          fontSize: 8.5, fontWeight: 700, color: "#5A7878", marginTop: 1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{evento.luogo}</div>
      )}
    </div>
  );
}

function TipoIcon({ tipo }: { tipo: AgendaEvento["tipo"] }) {
  const sz = 13;
  const props = { width: sz, height: sz, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tipo === "sopralluogo") return (<svg {...props}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
  if (tipo === "montaggio")   return (<svg {...props}><path d="M3 21h18M5 21V8l7-5 7 5v13M9 9h.01M15 9h.01"/></svg>);
  if (tipo === "produzione")  return (<svg {...props}><path d="M2 20h20M5 20V8l4 4 4-8 4 4 4-4v16"/></svg>);
  if (tipo === "ordine")      return (<svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>);
  if (tipo === "problema")    return (<svg {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>);
  return null;
}
