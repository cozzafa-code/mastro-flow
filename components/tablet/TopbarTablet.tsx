"use client";
import * as React from "react";
import { TT } from "./design-system";
import { Icon } from "./icons";
import AvatarGradient from "./AvatarGradient";

// =========================================================
// TopbarTablet - 64px altezza
// =========================================================
// Struttura:
//   - Greeting (titolo + sottotitolo data)
//   - Search input 480px max-width (pill)
//   - 3 icon-button: bell (con badge), chat, task
//   - Avatar utente
// =========================================================

export interface TopbarTabletProps {
  /** "Buongiorno, Fabio Cozza". */
  greeting?: string;
  /** Sottotitolo (data formattata). Default: oggi in italiano. */
  subtitle?: string;
  /** Numero notifiche (badge bell). 0 = nascosto. */
  notificationCount?: number;
  /** Placeholder search. */
  searchPlaceholder?: string;
  /** Callback search input change. */
  onSearch?: (value: string) => void;
  /** Click bell. */
  onBellClick?: () => void;
  /** Click chat. */
  onChatClick?: () => void;
  /** Click task. */
  onTaskClick?: () => void;
  /** Click avatar. */
  onAvatarClick?: () => void;
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
}: TopbarTabletProps) {
  // Hydration-safe date: render solo dopo mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const sub = subtitle || (mounted ? formatDateIT(new Date()) : " ");

  return (
    <header
      style={{
        gridArea: "topbar",
        background: TT.surface,
        borderBottom: `1px solid ${TT.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 20,
      }}
    >
      {/* GREETING */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: TT.text1,
            letterSpacing: "-0.4px",
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            fontSize: 12,
            color: TT.text3,
            marginTop: 2,
            letterSpacing: "-0.05px",
          }}
        >
          {sub}
        </div>
      </div>

      {/* SEARCH */}
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          position: "relative",
          marginLeft: 28,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: TT.text3,
            display: "flex",
          }}
        >
          <Icon name="search" size={14} color={TT.text3} strokeWidth={2} />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
          style={{
            width: "100%",
            height: 40,
            padding: "0 14px 0 42px",
            background: "#F1F5F9",
            border: "1px solid transparent",
            borderRadius: TT.rMd,
            fontSize: 13,
            fontFamily: TT.fontFamily,
            color: TT.text1,
            outline: "none",
            letterSpacing: "-0.1px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginLeft: "auto",
        }}
      >
        <IcButton onClick={onBellClick} badge={notificationCount}>
          <Icon name="bell" size={18} color={TT.text2} strokeWidth={2} />
        </IcButton>
        <IcButton onClick={onChatClick}>
          <Icon name="chat" size={18} color={TT.text2} strokeWidth={2} />
        </IcButton>
        <IcButton onClick={onTaskClick}>
          <Icon name="task" size={18} color={TT.text2} strokeWidth={2} />
        </IcButton>

        <div onClick={onAvatarClick} style={{ cursor: "pointer" }}>
          <AvatarGradient size={36} preset="b" />
        </div>
      </div>
    </header>
  );
}

// ---------- IcButton ----------
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
        width: 36,
        height: 36,
        borderRadius: TT.rSm + 2, // 10
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
            top: 5,
            right: 5,
            background: TT.red[400],
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 10,
            padding: "1px 4px",
            minWidth: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #fff",
            lineHeight: 1,
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </div>
  );
}
