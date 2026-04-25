"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon } from "./icons";
import AvatarGradient from "./AvatarGradient";

export interface TopbarTabletProps {
  greeting?: string;
  subtitle?: string;
  notificationCount?: number;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onBellClick?: () => void;
  onChatClick?: () => void;
  onTaskClick?: () => void;
  onAvatarClick?: () => void;
  compact?: boolean;
}

const formatDateIT = (d: Date): string => {
  const giorni = ["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
  const mesi = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  const g = giorni[d.getDay()];
  const dd = d.getDate();
  const m = mesi[d.getMonth()];
  const y = d.getFullYear();
  return `${g.charAt(0).toUpperCase()}${g.slice(1)} ${dd} ${m} ${y}`;
};

export default function TopbarTablet({
  greeting = "Buongiorno, Fabio Cozza",
  subtitle,
  notificationCount = 3,
  searchPlaceholder = "Cerca clienti, commesse, documenti...",
  onSearch,
  onBellClick,
  onChatClick,
  onTaskClick,
  onAvatarClick,
  compact = false,
}: TopbarTabletProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const sub = subtitle || (mounted ? formatDateIT(new Date()) : " ");

  return (
    <header
      style={{
        gridArea: "topbar",
        background: TT.surfaceGlass,
        borderBottom: `1px solid ${TT.border}`,
        display: "flex",
        alignItems: "center",
        padding: compact ? "0 16px" : "0 28px",
        gap: compact ? 12 : 20,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{
          fontSize: compact ? 14 : 16,
          fontWeight: 700,
          color: TT.text1,
          letterSpacing: "-0.4px",
          lineHeight: 1.1,
        }}>
          {greeting}
        </div>
        <div style={{
          fontSize: 12,
          color: TT.text3,
          marginTop: 3,
          letterSpacing: "-0.05px",
        }}>
          {sub}
        </div>
      </div>

      {!compact && (
        <div style={{ flex: 1, maxWidth: 480, position: "relative", marginLeft: 28 }}>
          <div style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: TT.text3,
            display: "flex",
          }}>
            <Icon name="search" size={14} color={TT.text3} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              padding: "0 14px 0 42px",
              background: TT.bgSoft,
              border: `1px solid ${TT.border}`,
              borderRadius: TT.rMd,
              fontSize: 13,
              fontFamily: TT.fontFamily,
              color: TT.text1,
              outline: "none",
              letterSpacing: "-0.1px",
              boxSizing: "border-box",
              transition: "all 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = TT.teal[300];
              e.currentTarget.style.background = TT.surface;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${TT.teal[100]}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = TT.border;
              e.currentTarget.style.background = TT.bgSoft;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
        {compact && (
          <IcButton onClick={() => {}}>
            <Icon name="search" size={17} color={TT.text2} strokeWidth={2} />
          </IcButton>
        )}
        <IcButton onClick={onBellClick} badge={notificationCount}>
          <Icon name="bell" size={17} color={TT.text2} strokeWidth={2} />
        </IcButton>
        {!compact && (
          <>
            <IcButton onClick={onChatClick}>
              <Icon name="chat" size={17} color={TT.text2} strokeWidth={2} />
            </IcButton>
            <IcButton onClick={onTaskClick}>
              <Icon name="task" size={17} color={TT.text2} strokeWidth={2} />
            </IcButton>
          </>
        )}
        <div onClick={onAvatarClick} style={{ cursor: "pointer", marginLeft: 4 }}>
          <AvatarGradient size={36} preset="b" />
        </div>
      </div>
    </header>
  );
}

interface IcButtonProps {
  children: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

function IcButton({ children, badge, onClick }: IcButtonProps) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        background: hover ? TT.bgSoft : "transparent",
        transition: "background 0.12s",
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: `linear-gradient(135deg, ${TT.red[400]}, ${TT.red[500]})`,
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            borderRadius: 10,
            padding: "1px 5px",
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
            boxShadow: `0 2px 4px ${TT.red[300]}`,
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </div>
  );
}
