"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";
import { useDashboard, Preset } from "../dashboard-context";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

type Sezione = "profilo" | "azienda" | "dashboard" | "abbonamento" | "integrazioni" | "notifiche" | "sicurezza";

interface SezioneDef {
  id: Sezione;
  label: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  desc: string;
}

const SEZIONI: SezioneDef[] = [
  { id: "profilo",      label: "Profilo",       icon: "clienti",     tint: "blue",   desc: "Account personale"     },
  { id: "azienda",      label: "Azienda",       icon: "ordini",      tint: "violet", desc: "Dati aziendali e P.IVA" },
  { id: "dashboard",    label: "Dashboard",     icon: "dashboard",   tint: "teal",   desc: "Layout e preset ruolo" },
  { id: "abbonamento",  label: "Abbonamento",   icon: "trendUp",     tint: "green",  desc: "Piano e fatturazione"   },
  { id: "integrazioni", label: "Integrazioni",  icon: "ai",          tint: "amber",  desc: "API e servizi esterni"  },
  { id: "notifiche",    label: "Notifiche",     icon: "bell",        tint: "red",    desc: "Email, push, SMS"       },
  { id: "sicurezza",    label: "Sicurezza",     icon: "fiscale",     tint: "teal",   desc: "Password e 2FA"         },
];

export default function ImpostazioniTablet() {
  const [sez, setSez] = React.useState<Sezione>("dashboard");

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
          Impostazioni
        </div>
        <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
          Configurazione account, azienda e preferenze
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 12, alignItems: "flex-start" }}>
        {/* SX - sidebar sezioni */}
        <div style={cardStyle({ padding: "10px", display: "flex", flexDirection: "column", gap: 4 })}>
          {SEZIONI.map((s) => {
            const ramp = TINTS[s.tint];
            const isActive = s.id === sez;
            return (
              <div
                key={s.id}
                onClick={() => setSez(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: isActive ? ramp[50] : "transparent",
                  border: `1px solid ${isActive ? ramp[100] : "transparent"}`,
                  borderRadius: 9,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: isActive ? ramp[400] : TT.bgSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={s.icon} size={14} color={isActive ? "#fff" : TT.text3} strokeWidth={2.4} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? ramp[500] : TT.text1,
                    letterSpacing: "-0.05px",
                  }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
                    {s.desc}
                  </div>
                </div>
                {isActive && (
                  <Icon name="chevronRight" size={13} color={ramp[500]} strokeWidth={2.4} />
                )}
              </div>
            );
          })}
        </div>

        {/* DX - contenuto */}
        <div>
          {sez === "dashboard"   && <SezioneDashboard />}
          {sez === "abbonamento" && <SezioneAbbonamento />}
          {sez === "profilo"     && <SezioneProfilo />}
          {sez === "azienda"     && <SezioneAzienda />}
          {sez === "integrazioni"&& <SezioneIntegrazioni />}
          {sez === "notifiche"   && <SezioneNotifiche />}
          {sez === "sicurezza"   && <SezioneSicurezza />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SezioneDashboard - SCELTA PRESET RUOLO
// ============================================================

interface PresetCard {
  id: Preset;
  label: string;
  desc: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  features: string[];
}

const PRESET_CARDS: PresetCard[] = [
  {
    id: "titolare",
    label: "Titolare",
    desc: "Vista completa azienda",
    icon: "ai",
    tint: "teal",
    features: ["Tutti i KPI", "Agenda + Scadenze + Produzione", "Commesse + Team", "Azioni rapide"],
  },
  {
    id: "posatore",
    label: "Posatore",
    desc: "Focus campo e cantieri",
    icon: "montaggi",
    tint: "green",
    features: ["KPI commesse e sopralluoghi", "Agenda di oggi grande", "Produzione cantieri", "Azioni montaggio"],
  },
  {
    id: "segreteria",
    label: "Segreteria",
    desc: "Focus amministrazione",
    icon: "documento",
    tint: "violet",
    features: ["KPI fatturato + margine", "Scadenze in evidenza", "Commesse complete", "Azioni documentali"],
  },
];

function SezioneDashboard() {
  const { preset, setPreset } = useDashboard();

  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: TT.text1, letterSpacing: "-0.3px", marginBottom: 4 }}>
          Layout dashboard
        </div>
        <div style={{ fontSize: 12, color: TT.text2, lineHeight: 1.5 }}>
          Scegli il preset che si adatta al tuo ruolo. La dashboard mostrerà solo i blocchi rilevanti per la tua attività quotidiana.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PRESET_CARDS.map((p) => {
          const ramp = TINTS[p.tint];
          const isActive = preset === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setPreset(p.id)}
              style={{
                padding: "16px 16px",
                background: isActive ? ramp[50] : TT.surface,
                border: `2px solid ${isActive ? ramp[400] : TT.border}`,
                borderRadius: TT.rLg,
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
                boxShadow: isActive ? `0 4px 12px ${ramp[100]}` : TT.shadowSm,
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute", top: -10, right: 12,
                  padding: "2px 9px",
                  background: ramp[400], color: "#fff",
                  borderRadius: 999,
                  fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.5px", textTransform: "uppercase",
                  boxShadow: `0 2px 6px ${ramp[200]}`,
                }}>
                  Attivo
                </div>
              )}
              <div style={{
                width: 44, height: 44,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
                boxShadow: `0 4px 10px ${ramp[200]}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}>
                <Icon name={p.icon} size={22} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{
                fontSize: 15, fontWeight: 800, color: TT.text1,
                letterSpacing: "-0.3px", marginBottom: 3,
              }}>
                {p.label}
              </div>
              <div style={{
                fontSize: 11, color: TT.text3,
                marginBottom: 12,
                fontWeight: 600,
                letterSpacing: "-0.05px",
              }}>
                {p.desc}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="check" size={11} color={ramp[500]} strokeWidth={3} />
                    <span style={{ fontSize: 10, color: TT.text2, fontWeight: 600 }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 16,
        padding: "12px 14px",
        background: TT.amber[50],
        border: `1px solid ${TT.amber[100]}`,
        borderRadius: TT.rMd,
        display: "flex",
        gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: TT.amber[400],
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="bell" size={14} color="#fff" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.amber[700], letterSpacing: "-0.1px", marginBottom: 2 }}>
            Layout configurabile in arrivo
          </div>
          <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.5 }}>
            Il drag & drop completo per ridisporre i blocchi sarà disponibile nel piano TITAN dopo il lancio.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sezioni esistenti (immutate)
// ============================================================

function SezioneAbbonamento() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardStyle({
        padding: "20px 22px",
        background: `linear-gradient(135deg, ${TT.green[50]}, ${TT.teal[50]})`,
        borderColor: TT.green[100],
      })}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg, ${TT.green[400]}, ${TT.teal[400]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 6px 16px ${TT.green[200]}`,
            flexShrink: 0,
          }}>
            <Icon name="check" size={28} color="#fff" strokeWidth={3} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{
              padding: "2px 8px",
              background: TT.green[400], color: "#fff",
              borderRadius: 999,
              fontSize: 9, fontWeight: 800,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>
              Piano attivo
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px", lineHeight: 1, marginTop: 6 }}>
              Bundle Multi-Artigiano
            </div>
            <div style={{ fontSize: 12, color: TT.text2, marginTop: 6 }}>
              Tutti i moduli inclusi &middot; Fino a 15 utenti &middot; Storage 50 GB
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: TT.green[600], letterSpacing: "-0.8px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              € 49
            </div>
            <div style={{ fontSize: 11, color: TT.text2, fontWeight: 600, marginTop: 4 }}>
              al mese &middot; +IVA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SezioneProfilo() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
        <AvatarGradient size={64} preset="b" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TT.text1, letterSpacing: "-0.4px" }}>
            Fabio Cozza
          </div>
          <div style={{ fontSize: 12, color: TT.text2, marginTop: 3 }}>
            Amministratore principale &middot; Walter Cozza Serramenti
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Nome" value="Fabio" />
        <Field label="Cognome" value="Cozza" />
        <Field label="Email" value="fabio@mastrosuite.it" />
        <Field label="Telefono" value="+39 320 1112233" />
      </div>
    </div>
  );
}

function SezioneAzienda() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, marginBottom: 16 }}>
        Dati aziendali
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Ragione sociale" value="Walter Cozza Serramenti" />
        <Field label="Partita IVA" value="IT 12345678901" />
      </div>
    </div>
  );
}

function SezioneIntegrazioni() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1 }}>
        6 integrazioni configurate
      </div>
    </div>
  );
}

function SezioneNotifiche() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1 }}>
        Preferenze notifiche
      </div>
    </div>
  );
}

function SezioneSicurezza() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1 }}>
        Sicurezza account
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{
        padding: "9px 12px",
        background: TT.bgSoft,
        border: `1px solid ${TT.border}`,
        borderRadius: 8,
        fontSize: 12, color: TT.text1,
        fontWeight: 600,
      }}>
        {value}
      </div>
    </div>
  );
}
