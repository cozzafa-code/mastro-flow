"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";

export interface ExpandModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: IconName;
  tint?: keyof typeof TINTS;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

export default function ExpandModal({
  open,
  title,
  subtitle,
  icon = "search",
  tint = "teal",
  onClose,
  children,
  width = 920,
}: ExpandModalProps) {
  // ESC chiude
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const ramp = TINTS[tint];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.42)",
        backdropFilter: "blur(8px) saturate(140%)",
        WebkitBackdropFilter: "blur(8px) saturate(140%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
        animation: "mastroFadeIn 0.18s ease-out",
      }}
    >
      <style>{`
        @keyframes mastroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes mastroScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "90vh",
          background: TT.surface,
          borderRadius: TT.rXl,
          boxShadow: TT.shadowXl,
          border: `1px solid ${TT.border}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "mastroScaleIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 22px",
            borderBottom: `1px solid ${TT.border}`,
            background: `linear-gradient(135deg, ${ramp[50]}, ${TT.bg})`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: TT.rMd,
              background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${ramp[200]}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              flexShrink: 0,
            }}
          >
            <Icon name={icon} size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: TT.text1,
                letterSpacing: "-0.4px",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: TT.text3,
                  marginTop: 2,
                  letterSpacing: "-0.05px",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: TT.bgSoft,
              border: `1px solid ${TT.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = TT.surface;
              (e.currentTarget as HTMLButtonElement).style.borderColor = TT.borderStrong;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = TT.bgSoft;
              (e.currentTarget as HTMLButtonElement).style.borderColor = TT.border;
            }}
          >
            <Icon name="x" size={16} color={TT.text2} strokeWidth={2.4} />
          </button>
        </div>

        {/* Body scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 22px 22px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
