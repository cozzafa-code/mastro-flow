// components/montaggi/MontaggiCalendarHeader.tsx
"use client";

import React from "react";
import { C, MONTH_FULL } from "./montaggi-types";
import { NavBtn } from "./montaggi-shared";

interface Props {
  viewMonth: Date;
  monthCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function MontaggiCalendarHeader({
  viewMonth,
  monthCount,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 16px 10px 16px",
      }}
    >
      <div style={{ lineHeight: 1.2 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: C.navyText,
            letterSpacing: -0.3,
          }}
        >
          {MONTH_FULL[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.navyDim,
            fontWeight: 700,
            marginTop: 1,
          }}
        >
          {monthCount} montaggi questo mese
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <NavBtn onClick={onPrev}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </NavBtn>
        <button
          onClick={onToday}
          style={{
            padding: "0 12px",
            height: 32,
            borderRadius: 9,
            border: `1px solid ${C.borderStrong}`,
            background: C.whiteOff,
            color: C.navyText,
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            cursor: "pointer",
          }}
        >
          Oggi
        </button>
        <NavBtn onClick={onNext}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </NavBtn>
      </div>
    </div>
  );
}
