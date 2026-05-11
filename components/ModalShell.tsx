"use client";
import React from "react";
import { BG_APP, BORDER, MUTED, SURFACE, TEXT } from "../lib/modaleColors";

interface Props {
  cat: { bg: string; solid: string; deep: string; text: string };
  Ico: any;
  kicker: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export default function ModalShell({ cat, Ico, kicker, title, onClose, children, footer, maxWidth = 560 }: Props) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.55)',
      backdropFilter: 'blur(4px)', zIndex: 9970,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: BG_APP, borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth, maxHeight: '95vh',
        display: 'flex', flexDirection: 'column' as const,
        boxShadow: '0 -8px 32px rgba(15,27,45,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D5D8DC' }} />
        </div>

        <div style={{ padding: '8px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: cat.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ico size={24} color={cat.text} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.4, color: MUTED, fontWeight: 800 }}>{kicker}</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: TEXT, marginTop: 1, lineHeight: 1.15 }}>{title}</div>
          </div>
          <button onClick={onClose} aria-label="Chiudi" style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F1F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT,
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
          </button>
        </div>

        <div style={{ flex: 1, padding: '4px 14px 14px', overflowY: 'auto' as const }}>
          {children}
        </div>

        {footer && (
          <div style={{ background: SURFACE, padding: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Sezione({ titolo, accent, children }: any) {
  return (
    <div style={{ background: SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderLeft: accent ? `4px solid ${accent}` : undefined }}>
      {titolo && <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10, fontWeight: 800 }}>{titolo}</div>}
      {children}
    </div>
  );
}

export function FieldRow({ children }: any) {
  return <div style={{ display: 'flex', gap: 8 }}>{children}</div>;
}

export function Field({ label, val, onChange, placeholder, type = 'text' }: any) {
  return (
    <div style={{ flex: 1, marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>{label}</div>
      <input type={type} value={val ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 13px', fontSize: 13,
          border: `1.5px solid ${BORDER}`, borderRadius: 9,
          fontFamily: 'inherit', boxSizing: 'border-box' as const,
          background: SURFACE, color: TEXT,
        }} />
    </div>
  );
}

export function TextareaField({ label, val, onChange, placeholder, rows = 3 }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>{label}</div>
      <textarea value={val ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={rows} style={{
          width: '100%', padding: '11px 13px', fontSize: 13,
          border: `1.5px solid ${BORDER}`, borderRadius: 9,
          fontFamily: 'inherit', boxSizing: 'border-box' as const,
          background: SURFACE, color: TEXT,
          resize: 'vertical' as const, lineHeight: 1.4,
        }} />
    </div>
  );
}

export function BtnSecondary({ children, onClick, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '14px 0',
      background: SURFACE, color: MUTED,
      border: `1.5px solid ${BORDER}`, borderRadius: 12,
      fontSize: 12, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer',
      fontFamily: 'inherit',
    }}>{children}</button>
  );
}

export function BtnPrimary({ children, onClick, disabled, cat }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 2, padding: '14px 0',
      background: disabled ? '#94A3B8' : cat.solid,
      color: '#fff', border: 'none', borderRadius: 12,
      fontSize: 13, fontWeight: 800, cursor: disabled ? 'wait' : 'pointer',
      fontFamily: 'inherit', letterSpacing: 0.3,
      boxShadow: disabled ? 'none' : `0 4px 14px ${cat.solid}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>{children}</button>
  );
}