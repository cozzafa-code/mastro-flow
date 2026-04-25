"use client";
import * as React from "react";
import { TT } from "../design-system";
import { Icon, IconName } from "../icons";

export type TabCommessa = "vani" | "documenti" | "pagamenti" | "note" | "storico";

interface TabDef {
  id: TabCommessa;
  label: string;
  icon: IconName;
  badge?: number;
}

const TABS: TabDef[] = [
  { id: "vani",       label: "Vani",       icon: "magazzino",    badge: 8 },
  { id: "documenti",  label: "Documenti",  icon: "documento",    badge: 12 },
  { id: "pagamenti",  label: "Pagamenti",  icon: "contabilita",  badge: 3 },
  { id: "note",       label: "Note",       icon: "chat",         badge: 5 },
  { id: "storico",    label: "Storico",    icon: "ops"                   },
];

export interface CommessaTabbarTabletProps {
  active: TabCommessa;
  onChange: (t: TabCommessa) => void;
}

export default function CommessaTabbarTablet({ active, onChange }: CommessaTabbarTabletProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 14,
        borderBottom: `1px solid ${TT.border}`,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <div
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 16px",
              cursor: "pointer",
              borderBottom: `2px solid ${isActive ? TT.teal[400] : "transparent"}`,
              marginBottom: -1,
              color: isActive ? TT.teal[500] : TT.text2,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "-0.1px",
              transition: "color 0.12s",
            }}
          >
            <Icon name={t.icon} size={14} color={isActive ? TT.teal[500] : TT.text3} strokeWidth={2.2} />
            <span>{t.label}</span>
            {t.badge !== undefined && (
              <span
                style={{
                  background: isActive ? TT.teal[100] : TT.bgSoft,
                  color: isActive ? TT.teal[500] : TT.text3,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {t.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
