"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon, IconName } from "./icons";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

export interface CardHeaderProps {
  icon: IconName;
  title: string;
  tint: keyof typeof TINTS;
  onSeeAll?: () => void;
  onExpand?: () => void;
  seeAllLabel?: string;
}

/**
 * Header riusabile per blocchi dashboard:
 * [icona colorata] [titolo]                  [Tutti ›] [espandi]
 */
export default function CardHeader({
  icon,
  title,
  tint,
  onSeeAll,
  onExpand,
  seeAllLabel = "Tutti",
}: CardHeaderProps) {
  const ramp = TINTS[tint];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 6px ${ramp[200]}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={13} color="#fff" strokeWidth={2.4} />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: TT.text1,
            letterSpacing: "-0.2px",
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            style={{
              padding: "4px 10px",
              background: "transparent",
              border: "none",
              color: ramp[600],
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              borderRadius: 6,
              fontFamily: TT.fontFamily,
              letterSpacing: "-0.05px",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = ramp[50])
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
            }
          >
            {seeAllLabel} &rsaquo;
          </button>
        )}
        {onExpand && (
          <button
            onClick={onExpand}
            title="Espandi"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
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
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = ramp[50];
              el.style.borderColor = ramp[100];
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = TT.bgSoft;
              el.style.borderColor = TT.border;
            }}
          >
            <Icon name="search" size={11} color={TT.text2} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}
