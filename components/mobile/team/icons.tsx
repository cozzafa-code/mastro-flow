// components/mobile/team/icons.tsx - Lucide icons ESATTE come da specifica
import React from "react";

const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

// Apri = ExternalLink (SquareArrowOutUp Lucide)
export const IcoApri = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
);

// Chiama = Phone
export const IcoPhone = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

// Mappa = MapPin
export const IcoMapPin = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

// Task = ClipboardList
export const IcoTask = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);

// Risolvi = XCircle
export const IcoXCircle = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

// Traccia = Navigation
export const IcoNavigation = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
);

// Pausa = Pause
export const IcoPause = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
);

// Stop = Square (filled)
export const IcoStop = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>
);

// Menu detail = MoreVertical
export const IcoMore = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);

// Indietro = ArrowLeft
export const IcoBack = ({ s = 20 }: { s?: number }) => (
  <svg {...base(s)} strokeWidth={2.4 as any}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

// Filtri = SlidersHorizontal
export const IcoSliders = ({ s = 18 }: { s?: number }) => (
  <svg {...base(s)}><line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/></svg>
);

// Calendario = Calendar
export const IcoCalendar = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

// User
export const IcoUser = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

// Hammer (per "lavoro corrente")
export const IcoHammer = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></svg>
);

// Clock
export const IcoClock = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

// Alert Triangle
export const IcoAlert = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

// Folder
export const IcoFolder = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
);

// Camera
export const IcoCamera = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

// Message Circle
export const IcoChat = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

// Plus
export const IcoPlus = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

// Chevron right
export const IcoChevronRight = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><polyline points="9 18 15 12 9 6"/></svg>
);

// Chevron down
export const IcoChevronDown = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><polyline points="6 9 12 15 18 9"/></svg>
);

// X Close
export const IcoClose = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)} strokeWidth={2.4 as any}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

// Users (squadra)
export const IcoUsers = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

// Edit (nota)
export const IcoEdit = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

// Plus sheet
export const IcoUserPlus = ({ s = 16 }: { s?: number }) => (
  <svg {...base(s)}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
);
