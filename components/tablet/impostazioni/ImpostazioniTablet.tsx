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

type Sezione = "profilo" | "azienda" | "abbonamento" | "integrazioni" | "notifiche" | "sicurezza";

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
  { id: "abbonamento",  label: "Abbonamento",   icon: "trendUp",     tint: "green",  desc: "Piano e fatturazione"   },
  { id: "integrazioni", label: "Integrazioni",  icon: "ai",          tint: "amber",  desc: "API e servizi esterni"  },
  { id: "notifiche",    label: "Notifiche",     icon: "bell",        tint: "red",    desc: "Email, push, SMS"       },
  { id: "sicurezza",    label: "Sicurezza",     icon: "fiscale",     tint: "teal",   desc: "Password e 2FA"         },
];

export default function ImpostazioniTablet() {
  const [sez, setSez] = React.useState<Sezione>("abbonamento");

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
          Impostazioni
        </div>
        <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
          Configurazione account, azienda e preferenze
        </div>
      </div>

      {/* LAYOUT 2 COLONNE */}
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

        {/* DX - contenuto sezione */}
        <div>
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
// SezioneAbbonamento (default visibile)
// ============================================================

function SezioneAbbonamento() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Piano attuale */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{
                padding: "2px 8px",
                background: TT.green[400], color: "#fff",
                borderRadius: 999,
                fontSize: 9, fontWeight: 800,
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                Piano attivo
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px", lineHeight: 1 }}>
              Bundle Multi-Artigiano
            </div>
            <div style={{ fontSize: 12, color: TT.text2, marginTop: 6 }}>
              Tutti i moduli inclusi &middot; Fino a 15 utenti &middot; Storage 50 GB
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: TT.green[500], letterSpacing: "-0.8px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              € 49
            </div>
            <div style={{ fontSize: 11, color: TT.text2, fontWeight: 600, marginTop: 4 }}>
              al mese &middot; +IVA
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${TT.green[100]}`,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}>
          <SubInfoCell label="Prossimo addebito" value="5 mag 2026" />
          <SubInfoCell label="Metodo pagamento" value="Visa **4242" />
          <SubInfoCell label="Fattura mensile" value="€ 59.78" />
          <SubInfoCell label="Stato" value="Pagato" tint="green" />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: TT.surface, color: TT.text2,
            border: `1px solid ${TT.borderStrong}`,
            borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}>
            <Icon name="documento" size={12} color={TT.text2} strokeWidth={2.2} />
            Storico fatture
          </button>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: TT.green[400], color: "#fff",
            border: "none", borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
            boxShadow: `0 2px 6px ${TT.green[200]}`,
          }}>
            <Icon name="trendUp" size={12} color="#fff" strokeWidth={2.4} />
            Cambia piano
          </button>
        </div>
      </div>

      {/* Comparazione piani */}
      <div style={cardStyle({ padding: "18px 20px" })}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, marginBottom: 14, letterSpacing: "-0.2px" }}>
          Bundle disponibili
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          <PianoCard nome="Solo"        prezzo="29" desc="1 utente"          tint="blue"   features={["ERP base","Commesse","Calendario"]} />
          <PianoCard nome="Multi"       prezzo="49" desc="Fino 15 utenti"    tint="green"  attivo features={["Tutto Solo","Team","Magazzino","OPS"]} />
          <PianoCard nome="Produttore"  prezzo="79" desc="Produzione avanzata" tint="amber"  features={["Tutto Multi","CNC","BOM","Distinte"]} />
          <PianoCard nome="Squadra"     prezzo="39" desc="Solo posatori"     tint="violet" features={["Montaggi","GPS","Foto cantiere"]} />
          <PianoCard nome="Agenti"      prezzo="45" desc="Solo agenti"       tint="pink"   features={["Lead Mgmt","Pipeline","Provvigioni"]} />
        </div>
      </div>
    </div>
  );
}

function SubInfoCell({ label, value, tint }: { label: string; value: string; tint?: keyof typeof TINTS }) {
  const color = tint ? TINTS[tint][500] : TT.text1;
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "-0.05px" }}>
        {value}
      </div>
    </div>
  );
}

function PianoCard({ nome, prezzo, desc, tint, attivo, features }: {
  nome: string; prezzo: string; desc: string; tint: keyof typeof TINTS; attivo?: boolean; features: string[];
}) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({
      padding: "12px 12px",
      background: attivo ? ramp[50] : TT.surface,
      borderColor: attivo ? ramp[300] : TT.border,
      borderWidth: attivo ? 2 : 1,
      cursor: "pointer",
      position: "relative",
    })}>
      {attivo && (
        <div style={{
          position: "absolute",
          top: -8, right: 10,
          padding: "2px 7px",
          background: ramp[400], color: "#fff",
          borderRadius: 999,
          fontSize: 8, fontWeight: 800,
          letterSpacing: "0.4px", textTransform: "uppercase",
        }}>
          Attuale
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: ramp[500], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 4 }}>
        {nome}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: TT.text2 }}>€</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {prezzo}
        </span>
        <span style={{ fontSize: 10, color: TT.text3, fontWeight: 600 }}>/m</span>
      </div>
      <div style={{ fontSize: 10, color: TT.text3, marginBottom: 8 }}>
        {desc}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="check" size={9} color={ramp[500]} strokeWidth={3} />
            <span style={{ fontSize: 10, color: TT.text2, fontWeight: 600 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SezioneProfilo
// ============================================================

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
        <button style={{
          padding: "7px 13px",
          background: TT.surface, color: TT.text2,
          border: `1px solid ${TT.borderStrong}`,
          borderRadius: 9,
          fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
        }}>
          Modifica avatar
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Nome"        value="Fabio"             />
        <Field label="Cognome"     value="Cozza"             />
        <Field label="Email"       value="fabio@mastrosuite.it" />
        <Field label="Telefono"    value="+39 320 1112233"   />
        <Field label="Ruolo"       value="Amministratore"    />
        <Field label="Lingua"      value="Italiano"          />
      </div>
    </div>
  );
}

function SezioneAzienda() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, marginBottom: 16, letterSpacing: "-0.2px" }}>
        Dati aziendali
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Ragione sociale" value="Walter Cozza Serramenti" />
        <Field label="Forma giuridica" value="Ditta individuale" />
        <Field label="Partita IVA" value="IT 12345678901" />
        <Field label="Codice fiscale" value="CZZWLT60A01D086X" />
        <Field label="Indirizzo" value="Via Roma 12" />
        <Field label="Città" value="Cosenza (CS)" />
        <Field label="Telefono" value="+39 0984 123456" />
        <Field label="PEC" value="walter.cozza@pec.it" />
      </div>
    </div>
  );
}

function SezioneIntegrazioni() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <IntegrazioneCard nome="Stripe"             desc="Pagamenti online clienti"    tint="violet" attiva />
      <IntegrazioneCard nome="Sistema SDI"        desc="Fatturazione elettronica"     tint="green"  attiva />
      <IntegrazioneCard nome="ENEA"               desc="Dichiarazioni Ecobonus"        tint="amber"  attiva />
      <IntegrazioneCard nome="Twilio WhatsApp"    desc="Notifiche WhatsApp Business"  tint="teal"   attiva />
      <IntegrazioneCard nome="Google Maps"        desc="Geocoding indirizzi"           tint="blue"   attiva />
      <IntegrazioneCard nome="Soisy Financing"    desc="Finanziamento in loco"         tint="orange" />
    </div>
  );
}

function SezioneNotifiche() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, marginBottom: 16 }}>
        Preferenze notifiche
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SwitchRow label="Email - nuove commesse"     attivo />
        <SwitchRow label="Email - scadenze fiscali"    attivo />
        <SwitchRow label="Push - sopralluoghi"         attivo />
        <SwitchRow label="Push - pagamenti ricevuti"  attivo />
        <SwitchRow label="SMS - urgenze critiche"     />
        <SwitchRow label="WhatsApp - messaggi cliente" attivo />
      </div>
    </div>
  );
}

function SezioneSicurezza() {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, marginBottom: 16 }}>
        Sicurezza account
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SwitchRow label="Autenticazione a 2 fattori (2FA)" attivo />
        <SwitchRow label="Login solo da IP autorizzati"  />
        <SwitchRow label="Sessione max 8 ore" attivo />
        <SwitchRow label="Notifica login da nuovo dispositivo" attivo />
      </div>
    </div>
  );
}

// ============================================================
// IntegrazioneCard
// ============================================================

function IntegrazioneCard({ nome, desc, tint, attiva }: { nome: string; desc: string; tint: keyof typeof TINTS; attiva?: boolean }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 })}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontWeight: 800,
        letterSpacing: "-0.3px",
      }}>
        {nome.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
          {nome}
        </div>
        <div style={{ fontSize: 11, color: TT.text3, marginTop: 2 }}>
          {desc}
        </div>
      </div>
      {attiva ? (
        <span style={{
          padding: "3px 10px",
          background: TT.green[100], color: TT.green[500],
          borderRadius: 999,
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.3px", textTransform: "uppercase",
        }}>
          Attiva
        </span>
      ) : (
        <button style={{
          padding: "6px 12px",
          background: ramp[400], color: "#fff",
          border: "none", borderRadius: 8,
          fontSize: 11, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
        }}>
          Connetti
        </button>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

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

function SwitchRow({ label, attivo }: { label: string; attivo?: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      background: TT.bgSoft,
      borderRadius: 8,
      border: `1px solid ${TT.border}`,
    }}>
      <span style={{ fontSize: 12, color: TT.text1, fontWeight: 600, letterSpacing: "-0.05px" }}>
        {label}
      </span>
      <div style={{
        width: 38, height: 22,
        background: attivo ? TT.teal[400] : TT.slate[300],
        borderRadius: 999,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s",
      }}>
        <div style={{
          position: "absolute",
          top: 2, left: attivo ? 18 : 2,
          width: 18, height: 18,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 3px rgba(15,23,42,0.2)",
          transition: "left 0.15s",
        }} />
      </div>
    </div>
  );
}
