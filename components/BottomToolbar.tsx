"use client";
// @ts-nocheck
// MASTRO ERP - Bottom Toolbar Google Material 3 style
import React from "react";

type Props = {
  active?: "home" | "commesse" | "agenda" | "talk" | "altro";
  onNavigate?: (dest: string) => void;
  unreadTalk?: number;
};

export default function BottomToolbar({ active = "home", onNavigate, unreadTalk = 0 }: Props) {
  const go = (k: string) => onNavigate?.(k);

  const Tab = ({ k, label, icon, activeIcon }: any) => {
    const isActive = active === k;
    return (
      <div onClick={() => go(k)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", flex: 1 }}>
        <div style={{ background: isActive ? "#D4EDEC" : "transparent", padding: "6px 16px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "background 0.18s" }}>
          {isActive ? activeIcon : icon}
          {k === "talk" && unreadTalk > 0 && (
            <div style={{ position: "absolute", top: 4, right: 10, width: 7, height: 7, background: "#E24B4A", borderRadius: 50, border: "1.5px solid #FFF" }} />
          )}
        </div>
        <span style={{ fontSize: 10, color: isActive ? "#1A1A1A" : "#5F5E5A", fontWeight: isActive ? 600 : 400 }}>{label}</span>
      </div>
    );
  };

  const iconHome = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth={2}><path d="M3 10l9-7 9 7v11h-6v-7H9v7H3z" /></svg>;
  const iconHomeA = <svg width="18" height="18" viewBox="0 0 24 24" fill="#28A0A0" stroke="none"><path d="M12 3l9 7v11h-6v-7H9v7H3V10z" /></svg>;

  const iconCommesse = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth={2}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
  const iconCommesseA = <svg width="18" height="18" viewBox="0 0 24 24" fill="#28A0A0" stroke="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;

  const iconAgenda = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth={2}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  const iconAgendaA = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={2.5}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;

  const iconTalk = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  const iconTalkA = <svg width="18" height="18" viewBox="0 0 24 24" fill="#28A0A0" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;

  const iconAltro = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F5E5A" strokeWidth={2}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
  const iconAltroA = <svg width="18" height="18" viewBox="0 0 24 24" fill="#28A0A0" stroke="none"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>;

  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      left: 10,
      right: 10,
      background: "#FFFFFF",
      borderRadius: 22,
      padding: "10px 8px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      zIndex: 100,
      maxWidth: 480,
      margin: "0 auto",
    }}>
      <Tab k="home" label="Home" icon={iconHome} activeIcon={iconHomeA} />
      <Tab k="commesse" label="Commesse" icon={iconCommesse} activeIcon={iconCommesseA} />
      <Tab k="agenda" label="Agenda" icon={iconAgenda} activeIcon={iconAgendaA} />
      <Tab k="talk" label="Talk" icon={iconTalk} activeIcon={iconTalkA} />
      <Tab k="altro" label="Altro" icon={iconAltro} activeIcon={iconAltroA} />
    </div>
  );
}
