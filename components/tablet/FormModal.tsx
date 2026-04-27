"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

export interface FormModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  width?: number;
  children: React.ReactNode;
}

export function FormModal({ open, title, subtitle, icon, tint, onClose, onSave, saveLabel = "Salva", saveDisabled = false, width = 560, children }: FormModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const ramp = TINTS[tint];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.45)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
      animation: "mastroFadeIn 0.18s ease-out",
    }}>
      <style>{`
        @keyframes mastroFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mastroScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width, maxWidth: "100%", maxHeight: "90vh",
        background: TT.surface,
        borderRadius: 18,
        boxShadow: TT.shadowXl,
        border: `1px solid ${TT.border}`,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        animation: "mastroScaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        {/* HEADER */}
        <div style={{
          padding: "16px 22px",
          borderBottom: `1px solid ${TT.border}`,
          background: `linear-gradient(135deg, ${ramp[50]}, ${TT.bg})`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `linear-gradient(135deg, ${ramp[400]}, ${ramp[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${ramp[200]}`,
            flexShrink: 0,
          }}>
            <Icon name={icon} size={19} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: TT.text1, letterSpacing: "-0.3px" }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: TT.text3, marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 9,
            background: TT.bgSoft,
            border: `1px solid ${TT.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
            <Icon name="x" size={14} color={TT.text2} strokeWidth={2.4} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {children}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${TT.border}`,
          background: TT.bgSoft,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: "10px 18px",
            background: TT.surface, color: TT.text2,
            border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}>
            Annulla
          </button>
          <button onClick={onSave} disabled={saveDisabled} style={{
            padding: "10px 22px",
            background: saveDisabled ? TT.slate[200] : ramp[500],
            color: "#fff",
            border: "none", borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            cursor: saveDisabled ? "not-allowed" : "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: saveDisabled ? "none" : `0 2px 8px ${ramp[300]}`,
            opacity: saveDisabled ? 0.6 : 1,
          }}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------- FORM PRIMITIVES -----------

export function FormField({ label, value, onChange, placeholder, type = "text", required, hint }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; type?: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700, color: TT.text3,
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label} {required && <span style={{ color: TT.red[500] }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 13px",
          background: TT.surface,
          border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
          fontSize: 13, fontFamily: TT.fontFamily,
          color: TT.text1, outline: "none",
          boxSizing: "border-box",
          fontVariantNumeric: type === "number" ? "tabular-nums" : "normal",
        }}
      />
      {hint && (
        <div style={{ fontSize: 10, color: TT.text3, marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

export function FormSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (s: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700, color: TT.text3,
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label} {required && <span style={{ color: TT.red[500] }}>*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", padding: "10px 13px",
        background: TT.surface,
        border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
        fontSize: 13, fontFamily: TT.fontFamily,
        color: TT.text1, outline: "none",
        boxSizing: "border-box", cursor: "pointer",
      }}>
        <option value="">Seleziona...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700, color: TT.text3,
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", padding: "10px 13px",
          background: TT.surface,
          border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
          fontSize: 13, fontFamily: TT.fontFamily,
          color: TT.text1, outline: "none", resize: "vertical",
          boxSizing: "border-box", lineHeight: 1.5,
        }}
      />
    </div>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: TT.teal[600],
        letterSpacing: "0.5px", textTransform: "uppercase",
        paddingBottom: 6, marginBottom: 12,
        borderBottom: `1px solid ${TT.border}`,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function ToastSuccess({ open, msg }: { open: boolean; msg: string }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: TT.green[500], color: "#fff",
      padding: "12px 18px",
      borderRadius: 11,
      boxShadow: TT.shadowXl,
      display: "flex", alignItems: "center", gap: 10,
      zIndex: 1100,
      fontSize: 13, fontWeight: 700,
      animation: "mastroSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <style>{`
        @keyframes mastroSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Icon name="check" size={15} color="#fff" strokeWidth={3} />
      {msg}
    </div>
  );
}
