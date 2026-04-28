"use client";
// @ts-nocheck
// MASTRO ERP - Bottom Toolbar Google Material 3 - multicolor
import React from "react";

type Props = {
  active?: "home" | "commesse" | "agenda" | "team" | "altro";
  onNavigate?: (dest: string) => void;
  unreadTalk?: number;
};

const THEMES: any = {
  home:     { pill: "#D4EDEC", ic: "#28A0A0" },
  commesse: { pill: "#EEEDFE", ic: "#3C3489" },
  agenda:   { pill: "#FBEAF0", ic: "#993556" },
  team:     { pill: "#E0F2EE", ic: "#0F766E" },
  altro:    { pill: "#E6F1FB", ic: "#185FA5" },
};

export default function BottomToolbar({ active = "home", onNavigate, unreadTalk = 0 }: Props) {
  const go = (k: string) => onNavigate?.(k);

  const Tab = ({ k, label, icon }: any) => {
    const isActive = active === k;
    const t = THEMES[k];
    return (
      <div onClick={() => go(k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", flex: 1 }}>
        <div style={{ background: t.pill, padding: "6px 16px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: isActive ? `0 0 0 2px ${t.ic}40` : "none", transition: "box-shadow 0.18s" }}>
          {icon(t.ic)}

        </div>
        <span style={{ fontSize: 10, color: "#1A1A1A", fontWeight: isActive ? 700 : 500 }}>{label}</span>
      </div>
    );
  };

  const ic = {
    home: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 3l9 7v11h-6v-7H9v7H3V10z" /></svg>,
    commesse: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c} stroke="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
    agenda: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>,
    team: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    altro: (c: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c} stroke="none"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>,
  };

  return (
    <div style={{ position: "fixed", bottom: 10, left: 10, right: 10, background: "#FFFFFF", borderRadius: 22, padding: "10px 8px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", zIndex: 100, maxWidth: 480, margin: "0 auto" }}>
      <Tab k="home" label="Home" icon={ic.home} />
      <Tab k="commesse" label="Commesse" icon={ic.commesse} />
      <Tab k="agenda" label="Agenda" icon={ic.agenda} />
      <Tab k="team" label="Team" icon={ic.team} />
      <Tab k="altro" label="Altro" icon={ic.altro} />
    </div>
  );
}
