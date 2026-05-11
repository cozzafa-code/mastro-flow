"use client";
// components/IconLib.tsx - Icone SVG monocrome professionali (lucide-style)
// Tutte 1.75 stroke, size default 16

import React from "react";

interface IcoProps { size?: number; color?: string; strokeWidth?: number; }
const D = (size = 16, color = 'currentColor', sw = 1.75) => ({
  width: size, height: size, viewBox: "0 0 24 24",
  fill: "none", stroke: color, strokeWidth: sw,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
});

export const IcoCamera = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx={12} cy={13} r={4}/></svg>;
export const IcoMic = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1={12} y1={19} x2={12} y2={23}/><line x1={8} y1={23} x2={16} y2={23}/></svg>;
export const IcoStop = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={6} y={6} width={12} height={12} rx={1}/></svg>;
export const IcoPlay = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
export const IcoPause = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={6} y={4} width={4} height={16}/><rect x={14} y={4} width={4} height={16}/></svg>;
export const IcoTrash = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
export const IcoClose = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>;
export const IcoCheck = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="20 6 9 17 4 12"/></svg>;
export const IcoChevronRight = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="9 18 15 12 9 6"/></svg>;
export const IcoChevronDown = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="6 9 12 15 18 9"/></svg>;
export const IcoChevronUp = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="18 15 12 9 6 15"/></svg>;
export const IcoChevronLeft = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="15 18 9 12 15 6"/></svg>;
export const IcoCalendar = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>;
export const IcoPhone = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>;
export const IcoMail = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
export const IcoChat = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
export const IcoBuilding = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={3} y={3} width={18} height={18} rx={1}/><path d="M9 22V12h6v10"/><path d="M8 6h.01"/><path d="M12 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>;
export const IcoHome = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
export const IcoFile = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
export const IcoFileSigned = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 14 11 16 15 12"/></svg>;
export const IcoShield = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M12 2L4 6v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V6l-8-4z"/></svg>;
export const IcoLock = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={3} y={11} width={18} height={11} rx={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
export const IcoAlertTriangle = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>;
export const IcoInfo = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><circle cx={12} cy={12} r={10}/><line x1={12} y1={16} x2={12} y2={12}/><line x1={12} y1={8} x2={12.01} y2={8}/></svg>;
export const IcoSparkles = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6L19 14z"/><path d="M5 14l.6 1.8L7 16l-1.4.4L5 18l-.6-1.8L3 16l1.4-.4L5 14z"/></svg>;
export const IcoBrain = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M9 6a3 3 0 1 0 0 6v0M15 6a3 3 0 1 1 0 6v0M9 12v0a3 3 0 0 0 0 6h0M15 12v0a3 3 0 0 1 0 6h0M9 6v0a3 3 0 0 1 6 0v0M9 18v0a3 3 0 0 0 6 0v0"/></svg>;
export const IcoCar = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M5 17h14M3 12l2-7h14l2 7M5 17v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3M16 17v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3M3 12v5h18v-5"/><circle cx={7} cy={14} r={1}/><circle cx={17} cy={14} r={1}/></svg>;
export const IcoVolume = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
export const IcoVolumeMute = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1={23} y1={9} x2={17} y2={15}/><line x1={17} y1={9} x2={23} y2={15}/></svg>;
export const IcoRefresh = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
export const IcoEye = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx={12} cy={12} r={3}/></svg>;
export const IcoEyeOff = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1={1} y1={1} x2={23} y2={23}/></svg>;
export const IcoUpload = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1={12} y1={3} x2={12} y2={15}/></svg>;
export const IcoDownload = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={3} x2={12} y2={15}/></svg>;
export const IcoPaperclip = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
export const IcoSearch = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/></svg>;
export const IcoTag = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1={7} y1={7} x2={7.01} y2={7}/></svg>;
export const IcoPin = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><line x1={12} y1={17} x2={12} y2={22}/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>;
export const IcoStar = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
export const IcoUsers = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
export const IcoUser = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx={12} cy={7} r={4}/></svg>;
export const IcoCrown = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M2 18h20l-2-9-5 3-3-6-3 6-5-3z"/><line x1={4} y1={22} x2={20} y2={22}/></svg>;
export const IcoEuro = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>;
export const IcoMap = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1={8} y1={2} x2={8} y2={18}/><line x1={16} y1={6} x2={16} y2={22}/></svg>;
export const IcoLayout = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={3} y={3} width={18} height={18} rx={2}/><line x1={3} y1={9} x2={21} y2={9}/><line x1={9} y1={21} x2={9} y2={9}/></svg>;
export const IcoTool = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
export const IcoZap = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
export const IcoTrendingUp = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
export const IcoSettings = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><circle cx={12} cy={12} r={3}/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
export const IcoBox = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1={12} y1={22.08} x2={12} y2={12}/></svg>;
export const IcoTruck = (p: IcoProps) => <svg {...D(p.size, p.color, p.strokeWidth)}><rect x={1} y={3} width={15} height={13}/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx={5.5} cy={18.5} r={2.5}/><circle cx={18.5} cy={18.5} r={2.5}/></svg>;
