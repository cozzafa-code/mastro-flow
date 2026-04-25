"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

type Tipo = "tutti" | "privato" | "azienda" | "showroom";
type Stato = "attivo" | "potenziale" | "completato";

interface Cliente {
  id: string;
  nome: string;
  citta: string;
  tipo: Exclude<Tipo, "tutti">;
  preset: "a" | "b" | "c" | "d" | "e";
  telefono: string;
  email: string;
  commesseAperte: number;
  commesseChiuse: number;
  fatturatoTotale: number;
  ultimoContatto: string;
  stato: Stato;
}

const TINTS = {
  blue: TT.blue, violet: TT.violet, green: TT.green,
  amber: TT.amber, teal: TT.teal, orange: TT.orange, slate: TT.slate, red: TT.red,
} as const;

const TIPO_DEF: Record<Exclude<Tipo, "tutti">, { label: string; tint: keyof typeof TINTS }> = {
  privato:  { label: "Privato",  tint: "blue"   },
  azienda:  { label: "Azienda",  tint: "violet" },
  showroom: { label: "Showroom", tint: "amber"  },
};

const STATO_DEF: Record<Stato, { label: string; tint: keyof typeof TINTS }> = {
  attivo:     { label: "Attivo",     tint: "green" },
  potenziale: { label: "Potenziale", tint: "amber" },
  completato: { label: "Completato", tint: "slate" },
};

const FILTRI: { id: Tipo; label: string; count: number }[] = [
  { id: "tutti",    label: "Tutti",    count: 86 },
  { id: "privato",  label: "Privati",  count: 64 },
  { id: "azienda",  label: "Aziende",  count: 18 },
  { id: "showroom", label: "Showroom", count: 4  },
];

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

const DATA: Cliente[] = [
  { id: "c1", nome: "Verdi Giuseppe",        citta: "Cosenza",       tipo: "privato",  preset: "a", telefono: "+39 320 1234567", email: "g.verdi@email.it",          commesseAperte: 1, commesseChiuse: 2, fatturatoTotale: 24850, ultimoContatto: "Oggi",         stato: "attivo"     },
  { id: "c2", nome: "Bianchi Maria",         citta: "Rende",         tipo: "privato",  preset: "b", telefono: "+39 333 7654321", email: "m.bianchi@gmail.com",       commesseAperte: 1, commesseChiuse: 0, fatturatoTotale: 6820,  ultimoContatto: "5 ore fa",     stato: "attivo"     },
  { id: "c3", nome: "Rossi & Co. SRL",       citta: "Castrolibero", tipo: "azienda",  preset: "c", telefono: "+39 0984 555111", email: "info@rossi-srl.it",         commesseAperte: 1, commesseChiuse: 4, fatturatoTotale: 87230, ultimoContatto: "Ieri",         stato: "attivo"     },
  { id: "c4", nome: "Esposito Franco",       citta: "Mendicino",    tipo: "privato",  preset: "d", telefono: "+39 347 2345678", email: "f.esposito@yahoo.it",       commesseAperte: 1, commesseChiuse: 1, fatturatoTotale: 9680,  ultimoContatto: "2 giorni fa",  stato: "attivo"     },
  { id: "c5", nome: "De Luca Pasquale",      citta: "Cosenza",       tipo: "privato",  preset: "e", telefono: "+39 388 9876543", email: "p.deluca@libero.it",        commesseAperte: 1, commesseChiuse: 0, fatturatoTotale: 9200,  ultimoContatto: "3 giorni fa",  stato: "attivo"     },
  { id: "c6", nome: "Marino Edilizia SAS",   citta: "Cosenza",       tipo: "azienda",  preset: "a", telefono: "+39 0984 333222", email: "amministrazione@marino.it",commesseAperte: 1, commesseChiuse: 8, fatturatoTotale: 142680,ultimoContatto: "5 giorni fa",  stato: "attivo"     },
  { id: "c7", nome: "Showroom Cosenza Casa", citta: "Cosenza",       tipo: "showroom", preset: "b", telefono: "+39 0984 777888", email: "info@cosenzacasa.it",      commesseAperte: 0, commesseChiuse: 12,fatturatoTotale: 218450,ultimoContatto: "1 sett. fa",   stato: "attivo"     },
  { id: "c8", nome: "Greco Antonella",       citta: "Rende",         tipo: "privato",  preset: "c", telefono: "+39 351 1112233", email: "a.greco@hotmail.com",       commesseAperte: 0, commesseChiuse: 0, fatturatoTotale: 0,     ultimoContatto: "10 giorni fa", stato: "potenziale" },
];

export default function ClientiTablet() {
  const [filtro, setFiltro] = React.useState<Tipo>("tutti");
  const [search, setSearch] = React.useState("");

  const filtered = filtro === "tutti" ? DATA : DATA.filter((c) => c.tipo === filtro);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Clienti
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            86 clienti totali &middot; 12 attivi &middot; 4 potenziali in pipeline
          </div>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: TT.violet[400],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 8px rgba(167,139,250,0.30)",
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo cliente
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="clienti"    label="Clienti totali" value="86"            tint="violet" />
        <KpiMini icon="check"      label="Attivi"          value="12"            tint="green"  />
        <KpiMini icon="trendUp"    label="Fatturato YTD"   value="€ 142k"   tint="teal"   />
        <KpiMini icon="bell"       label="Potenziali"      value="4"             tint="amber"  />
      </div>

      {/* FILTRI + SEARCH */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {FILTRI.map((f) => {
            const ramp = f.id !== "tutti" ? TINTS[TIPO_DEF[f.id as Exclude<Tipo,"tutti">].tint] : null;
            const isActive = f.id === filtro;
            return (
              <div
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                  color: isActive ? "#fff" : TT.text2,
                  border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {f.label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                  color: isActive ? "#fff" : (ramp ? ramp[500] : TT.text3),
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {f.count}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", width: 240 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={13} color={TT.text3} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nome, telefono, email..."
            style={{
              width: "100%", height: 36,
              padding: "0 12px 0 34px",
              background: TT.surface,
              border: `1px solid ${TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12, fontFamily: TT.fontFamily,
              color: TT.text1, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* GRID 2 colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filtered.map((c) => (
          <ClienteCard key={c.id} cliente={c} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ClienteCard
// ============================================================

function ClienteCard({ cliente }: { cliente: Cliente }) {
  const tipo = TIPO_DEF[cliente.tipo];
  const tipoRamp = TINTS[tipo.tint];
  const stato = STATO_DEF[cliente.stato];
  const statoRamp = TINTS[stato.tint];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: "16px 18px",
        cursor: "pointer",
        borderColor: hover ? tipoRamp[100] : TT.border,
        boxShadow: hover ? `0 4px 12px ${tipoRamp[100]}` : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      {/* Header: avatar + nome + tipi */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <AvatarGradient size={44} preset={cliente.preset} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{
              padding: "1px 7px",
              background: tipoRamp[100], color: tipoRamp[500],
              borderRadius: 999,
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {tipo.label}
            </span>
            <span style={{
              padding: "1px 7px",
              background: statoRamp[100], color: statoRamp[500],
              borderRadius: 999,
              fontSize: 9, fontWeight: 700,
              letterSpacing: "0.3px", textTransform: "uppercase",
            }}>
              {stato.label}
            </span>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {cliente.nome}
          </div>
          <div style={{ fontSize: 11, color: TT.text3, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Icon name="sopralluoghi" size={10} color={TT.text3} strokeWidth={2} />
            {cliente.citta}
          </div>
        </div>
      </div>

      {/* Contatti */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TT.border}` }}>
        <ContactLine icon="chat" text={cliente.telefono} />
        <ContactLine icon="documento" text={cliente.email} />
      </div>

      {/* Footer stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 8 }}>
        <Stat label="Aperte"    value={cliente.commesseAperte.toString()} tint="teal"  />
        <Stat label="Chiuse"    value={cliente.commesseChiuse.toString()} tint="slate" />
        <Stat label="Fatturato" value={fmt(cliente.fatturatoTotale)}      tint="green" />
      </div>

      {/* Ultimo contatto */}
      <div style={{
        marginTop: 10,
        fontSize: 10,
        color: TT.text3,
        textAlign: "right",
      }}>
        Ultimo contatto: <span style={{ fontWeight: 700, color: TT.text2 }}>{cliente.ultimoContatto}</span>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function KpiMini({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
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
      </div>
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
      <div style={{ fontSize: 13, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}
