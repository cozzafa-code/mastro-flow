"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

type Ruolo = "titolare" | "posatore" | "magazziniere" | "segreteria" | "agente" | "produzione";
type Status = "online" | "trasferta" | "ferie" | "offline";

interface Operatore {
  id: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  status: Status;
  preset: "a" | "b" | "c" | "d" | "e";
  tel: string;
  email: string;
  oreSettimana: number;
  oreMese: number;
  commesseAttive: number;
  efficienza: number;
  ultimaAttivita: string;
}

const RUOLO_DEF: Record<Ruolo, { label: string; tint: keyof typeof TINTS; icon: IconName }> = {
  titolare:     { label: "Titolare",     tint: "teal",   icon: "ai"           },
  posatore:     { label: "Posatore",     tint: "green",  icon: "montaggi"     },
  magazziniere: { label: "Magazziniere", tint: "amber",  icon: "magazzino"    },
  segreteria:   { label: "Segreteria",   tint: "violet", icon: "documento"    },
  agente:       { label: "Agente",       tint: "blue",   icon: "clienti"      },
  produzione:   { label: "Produzione",   tint: "orange", icon: "produzione"   },
};

const STATUS_DEF: Record<Status, { label: string; color: string }> = {
  online:    { label: "Online",    color: TT.green[500] },
  trasferta: { label: "Trasferta", color: TT.amber[500] },
  ferie:     { label: "In ferie",  color: TT.blue[500]  },
  offline:   { label: "Offline",   color: TT.slate[400] },
};

const DATA: Operatore[] = [
  { id: "t1", nome: "Walter",  cognome: "Cozza",     ruolo: "titolare",     status: "online",    preset: "b", tel: "+39 320 1112233", email: "walter@mastrosuite.it",       oreSettimana: 38, oreMese: 156, commesseAttive: 11, efficienza: 95, ultimaAttivita: "Adesso"          },
  { id: "t2", nome: "Marco",   cognome: "Esposito",  ruolo: "posatore",     status: "trasferta", preset: "a", tel: "+39 333 4567890", email: "m.esposito@mastrosuite.it",   oreSettimana: 42, oreMese: 168, commesseAttive: 6,  efficienza: 92, ultimaAttivita: "5 min fa"         },
  { id: "t3", nome: "Luca",    cognome: "Bianchi",   ruolo: "posatore",     status: "online",    preset: "e", tel: "+39 347 1234567", email: "l.bianchi@mastrosuite.it",    oreSettimana: 40, oreMese: 162, commesseAttive: 5,  efficienza: 88, ultimaAttivita: "12 min fa"        },
  { id: "t4", nome: "Anna",    cognome: "Verdi",     ruolo: "segreteria",   status: "online",    preset: "c", tel: "+39 351 9876543", email: "a.verdi@mastrosuite.it",      oreSettimana: 36, oreMese: 144, commesseAttive: 18, efficienza: 96, ultimaAttivita: "2 min fa"         },
  { id: "t5", nome: "Paolo",   cognome: "Rossi",     ruolo: "magazziniere", status: "offline",   preset: "d", tel: "+39 388 1234567", email: "p.rossi@mastrosuite.it",      oreSettimana: 38, oreMese: 152, commesseAttive: 18, efficienza: 90, ultimaAttivita: "Ieri 17:30"      },
  { id: "t6", nome: "Giulia",  cognome: "Marino",    ruolo: "agente",       status: "trasferta", preset: "b", tel: "+39 339 5556677", email: "g.marino@mastrosuite.it",     oreSettimana: 32, oreMese: 128, commesseAttive: 4,  efficienza: 85, ultimaAttivita: "1 ora fa"         },
  { id: "t7", nome: "Antonio", cognome: "Greco",     ruolo: "produzione",   status: "online",    preset: "a", tel: "+39 348 1112233", email: "a.greco@mastrosuite.it",      oreSettimana: 40, oreMese: 160, commesseAttive: 8,  efficienza: 91, ultimaAttivita: "30 min fa"        },
  { id: "t8", nome: "Carla",   cognome: "Russo",     ruolo: "produzione",   status: "ferie",     preset: "c", tel: "+39 347 9988776", email: "c.russo@mastrosuite.it",      oreSettimana: 0,  oreMese: 80,  commesseAttive: 0,  efficienza: 89, ultimaAttivita: "5 giorni fa"      },
];

export default function TeamTablet() {
  const [filtro, setFiltro] = React.useState<"tutti" | Ruolo>("tutti");

  const filtered = filtro === "tutti" ? DATA : DATA.filter((o) => o.ruolo === filtro);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Team
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            8 operatori &middot; 4 online &middot; 2 in trasferta &middot; 1170 ore questo mese
          </div>
        </div>
        <button style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 14px",
          background: TT.teal[400],
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: TT.fontFamily,
          boxShadow: "0 2px 8px rgba(45,212,191,0.30)",
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo membro
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="team"     label="Totale"      value="8"    sub="3 ruoli"       tint="teal"   />
        <KpiMini icon="check"    label="Online ora"   value="4"    sub="50%"           tint="green"  />
        <KpiMini icon="montaggi" label="In trasferta" value="2"    sub="su sito"       tint="amber"  />
        <KpiMini icon="trendUp"  label="Ore mese"     value="1170" sub="+8% vs scorso" tint="blue"   />
      </div>

      {/* FILTRI */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <FiltroChip id="tutti" label="Tutti" count={DATA.length} active={filtro === "tutti"} onClick={() => setFiltro("tutti")} />
        {(Object.keys(RUOLO_DEF) as Ruolo[]).map((r) => {
          const def = RUOLO_DEF[r];
          const count = DATA.filter((o) => o.ruolo === r).length;
          return (
            <FiltroChip
              key={r}
              id={r}
              label={def.label}
              count={count}
              tint={def.tint}
              active={filtro === r}
              onClick={() => setFiltro(r)}
            />
          );
        })}
      </div>

      {/* GRID 3 colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {filtered.map((o) => (
          <OperatoreCard key={o.id} op={o} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// OperatoreCard
// ============================================================

function OperatoreCard({ op }: { op: Operatore }) {
  const ruolo = RUOLO_DEF[op.ruolo];
  const ruoloRamp = TINTS[ruolo.tint];
  const status = STATUS_DEF[op.status];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "16px 18px",
        cursor: "pointer",
        borderColor: hover ? ruoloRamp[100] : TT.border,
        boxShadow: hover ? `0 4px 12px ${ruoloRamp[100]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      {/* Header avatar + nome + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <AvatarGradient size={48} preset={op.preset} />
          <div style={{
            position: "absolute",
            bottom: -1, right: -1,
            width: 14, height: 14,
            borderRadius: "50%",
            background: status.color,
            border: "2px solid #fff",
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: TT.text1, letterSpacing: "-0.2px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {op.nome} {op.cognome}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center", gap: 4,
              padding: "1px 7px",
              background: ruoloRamp[100], color: ruoloRamp[500],
              borderRadius: 999,
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              <Icon name={ruolo.icon} size={9} color={ruoloRamp[500]} strokeWidth={2.4} />
              {ruolo.label}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: status.color,
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Contatti */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TT.border}` }}>
        <ContactLine icon="chat" text={op.tel} />
        <ContactLine icon="documento" text={op.email} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Stat label="Ore sett." value={op.oreSettimana.toString()} tint={ruolo.tint} />
        <Stat label="Commesse"  value={op.commesseAttive.toString()} tint="blue" />
        <Stat label="Efficienza" value={`${op.efficienza}%`} tint="green" />
      </div>

      {/* Ultimo attivita */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 10,
        color: TT.text3,
      }}>
        <span>Ultima attività</span>
        <span style={{ fontWeight: 700, color: TT.text2 }}>{op.ultimaAttivita}</span>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function KpiMini({ icon, label, value, sub, tint }: { icon: IconName; label: string; value: string; sub?: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 9, color: TT.text3, marginTop: 3, fontWeight: 600 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function FiltroChip({
  id, label, count, tint, active, onClick,
}: { id: string; label: string; count: number; tint?: keyof typeof TINTS; active: boolean; onClick: () => void }) {
  const ramp = tint ? TINTS[tint] : null;
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: active ? (ramp ? ramp[400] : TT.text1) : TT.surface,
        color: active ? "#fff" : TT.text2,
        border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
        color: active ? "#fff" : (ramp ? ramp[500] : TT.text3),
        fontSize: 9, fontWeight: 700,
        padding: "1px 6px", borderRadius: 999,
        fontVariantNumeric: "tabular-nums",
      }}>
        {count}
      </span>
    </div>
  );
}

function ContactLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: TT.text2 }}>
      <Icon name={icon} size={11} color={TT.text3} strokeWidth={2} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {text}
      </span>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "6px 8px",
      background: ramp[50],
      border: `1px solid ${ramp[100]}`,
      borderRadius: 6,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: ramp[500], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>
        {value}
      </div>
    </div>
  );
}
