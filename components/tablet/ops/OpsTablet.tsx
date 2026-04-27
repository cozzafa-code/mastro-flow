"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData, useMastroMutators, FaseCommessa } from "../store";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

interface FunzioneOps {
  id: string;
  categoria: "Workflow" | "Vendite" | "Produzione" | "Cantiere" | "Amministrazione" | "Compliance";
  titolo: string;
  descrizione: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  // funzione che ritorna n. record che soddisfano la condizione
  conta: (data: any) => number;
  // testo dinamico in base al numero
  badge: (n: number) => string;
  // azione contestuale: ritorna undefined o riassunto azione
  esegui?: (data: any, mut: any, openCommessa: (id: string) => void, navigate: (s: string) => void) => string | void;
  // se cliccando deve solo navigare, senza modificare
  navigaA?: string;
}

const FUNZIONI: FunzioneOps[] = [
  {
    id: "preventivi-pending",
    categoria: "Vendite",
    titolo: "Preventivi in attesa",
    descrizione: "Commesse in fase preventivo da seguire col cliente",
    icon: "preventivo",
    tint: "violet",
    conta: (d) => d.getCommesseByFase("preventivo").length,
    badge: (n) => n === 0 ? "Tutto chiuso" : `${n} preventiv${n === 1 ? "o" : "i"}`,
    navigaA: "commesse",
  },
  {
    id: "produzione-pronta",
    categoria: "Produzione",
    titolo: "Avanzamento produzione",
    descrizione: "Commesse pronte per consegna in cantiere",
    icon: "produzione",
    tint: "blue",
    conta: (d) => d.getProduzioni().filter((p: any) => p.avanzamentoPct >= 95).length,
    badge: (n) => n === 0 ? "Nessuna pronta" : `${n} pront${n === 1 ? "a" : "e"}`,
    navigaA: "produzione",
  },
  {
    id: "montaggi-prossimi",
    categoria: "Cantiere",
    titolo: "Montaggi 7 giorni",
    descrizione: "Interventi pianificati nella prossima settimana",
    icon: "montaggi",
    tint: "green",
    conta: (d) => d.getMontaggi().length,
    badge: (n) => n === 0 ? "Settimana libera" : `${n} interventi`,
    navigaA: "montaggi",
  },
  {
    id: "fatture-scadute",
    categoria: "Amministrazione",
    titolo: "Solleciti pagamenti",
    descrizione: "Fatture scadute o in scadenza che richiedono sollecito",
    icon: "bell",
    tint: "red",
    conta: (d) => d.getFatture().filter((f: any) => f.stato === "scaduta" || f.stato === "emessa").length,
    badge: (n) => n === 0 ? "Tutto incassato" : `${n} da sollecitare`,
    navigaA: "contabilita",
  },
  {
    id: "enea-pending",
    categoria: "Compliance",
    titolo: "ENEA da inviare",
    descrizione: "Pratiche fiscali con invio ENEA in sospeso",
    icon: "fiscale",
    tint: "amber",
    conta: (d) => d.getPratiche().filter((p: any) => p.enea === "da_inviare").length,
    badge: (n) => n === 0 ? "ENEA OK" : `${n} pratich${n === 1 ? "a" : "e"}`,
    navigaA: "fiscale",
  },
  {
    id: "stock-basso",
    categoria: "Produzione",
    titolo: "Articoli sotto soglia",
    descrizione: "Materiali magazzino sotto la soglia minima",
    icon: "magazzino",
    tint: "orange",
    conta: (d) => d.getArticoli().filter((a: any) => a.scorta < a.scortaMin).length,
    badge: (n) => n === 0 ? "Stock OK" : `${n} sotto soglia`,
    navigaA: "magazzino",
  },
  {
    id: "ordini-ritardo",
    categoria: "Produzione",
    titolo: "Ordini fornitore in ritardo",
    descrizione: "Ordini con consegna superata - chiamare fornitore",
    icon: "ordini",
    tint: "red",
    conta: (d) => d.getOrdini().filter((o: any) => o.giorniRitardo > 0).length,
    badge: (n) => n === 0 ? "Tutti puntuali" : `${n} in ritardo`,
    navigaA: "ordini",
  },
  {
    id: "rilievi-pending",
    categoria: "Workflow",
    titolo: "Rilievi non confermati",
    descrizione: "Sopralluoghi gia effettuati ma rilievo non ancora chiuso",
    icon: "sopralluoghi",
    tint: "teal",
    conta: (d) => d.getCommesseByFase("rilievo").length,
    badge: (n) => n === 0 ? "Tutti chiusi" : `${n} aperti`,
    navigaA: "sopralluoghi",
  },
  {
    id: "auto-avanza-preventivi",
    categoria: "Workflow",
    titolo: "Auto-avanza preventivi accettati",
    descrizione: "Sposta in 'Conferma ordine' i preventivi in fase preventivo",
    icon: "ai",
    tint: "blue",
    conta: (d) => d.getCommesseByFase("preventivo").length,
    badge: (n) => n === 0 ? "Niente da fare" : `${n} eseguibil${n === 1 ? "e" : "i"}`,
    esegui: (d, mut) => {
      const commesse = d.getCommesseByFase("preventivo");
      commesse.forEach((c: any) => {
        mut.updateCommessaFase(c.id, "conferma_ordine", "Auto-avanzato da OPS dopo controllo accettazione");
      });
      return `${commesse.length} commess${commesse.length === 1 ? "a avanzata" : "e avanzate"} a Conferma ordine`;
    },
  },
];

const CATEGORIE = ["Workflow", "Vendite", "Produzione", "Cantiere", "Amministrazione", "Compliance"] as const;

const CAT_TINT: Record<typeof CATEGORIE[number], keyof typeof TINTS> = {
  Workflow: "teal",
  Vendite: "violet",
  Produzione: "blue",
  Cantiere: "green",
  Amministrazione: "pink",
  Compliance: "amber",
};

export default function OpsTablet() {
  const data = useMastroData();
  const mut = useMastroMutators();
  const { navigate, openCommessa } = useDashboard();
  const [filtroCat, setFiltroCat] = React.useState<typeof CATEGORIE[number] | "Tutte">("Tutte");
  const [esito, setEsito] = React.useState<{ id: string; testo: string; ts: number } | null>(null);

  React.useEffect(() => {
    if (!esito) return;
    const t = setTimeout(() => setEsito(null), 4000);
    return () => clearTimeout(t);
  }, [esito]);

  const funzioniFiltrate = filtroCat === "Tutte"
    ? FUNZIONI
    : FUNZIONI.filter((f) => f.categoria === filtroCat);

  const totEseguibili = FUNZIONI.reduce((s, f) => s + f.conta(data), 0);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            OPS &middot; Cervello operativo
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            Funzioni che leggono il tuo stato attuale e propongono azioni concrete &middot; {totEseguibili} totale
          </div>
        </div>
      </div>

      {/* INFO BANNER */}
      <div style={cardStyle({
        padding: "14px 18px",
        marginBottom: 14,
        background: `linear-gradient(135deg, ${TT.teal[50]}, ${TT.blue[50]})`,
        borderColor: TT.teal[100],
      })}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${TT.teal[400]}, ${TT.blue[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 3px 10px ${TT.teal[200]}`,
          }}>
            <Icon name="ai" size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px", marginBottom: 2 }}>
              OPS analizza il tuo stato in tempo reale
            </div>
            <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.5 }}>
              Ogni tile mostra il numero esatto di azioni rilevanti dai tuoi dati. Click su un tile per navigare al modulo, oppure clicca un&apos;azione automatica per eseguirla.
            </div>
          </div>
        </div>
      </div>

      {/* FILTRI CATEGORIA */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <FilterPill label="Tutte" count={FUNZIONI.length} active={filtroCat === "Tutte"} onClick={() => setFiltroCat("Tutte")} tint="slate" />
        {CATEGORIE.map((cat) => {
          const count = FUNZIONI.filter((f) => f.categoria === cat).length;
          return (
            <FilterPill key={cat} label={cat} count={count} active={filtroCat === cat} onClick={() => setFiltroCat(cat)} tint={CAT_TINT[cat]} />
          );
        })}
      </div>

      {/* GRID FUNZIONI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {funzioniFiltrate.map((f) => {
          const ramp = TINTS[f.tint];
          const n = f.conta(data);
          const eseguito = esito?.id === f.id;
          const inattiva = n === 0 && !!f.esegui;
          const isAuto = !!f.esegui;
          return (
            <div
              key={f.id}
              onClick={() => {
                if (inattiva) return;
                if (f.esegui) {
                  const r = f.esegui(data, mut, openCommessa, navigate);
                  if (r) setEsito({ id: f.id, testo: r, ts: Date.now() });
                  return;
                }
                if (f.navigaA) navigate(f.navigaA);
              }}
              style={cardStyle({
                padding: "16px 18px",
                cursor: inattiva ? "default" : "pointer",
                opacity: inattiva ? 0.6 : 1,
                position: "relative",
                overflow: "hidden",
                borderColor: eseguito ? ramp[400] : TT.border,
                boxShadow: eseguito ? `0 0 0 3px ${ramp[100]}, ${TT.shadowMd}` : TT.shadowSm,
                transition: "all 0.18s",
              })}
            >
              {/* badge categoria */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{
                  padding: "1px 8px",
                  background: TINTS[CAT_TINT[f.categoria]][50],
                  color: TINTS[CAT_TINT[f.categoria]][600],
                  borderRadius: 999, fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                }}>
                  {f.categoria}
                </span>
                {isAuto && (
                  <span style={{
                    padding: "1px 8px",
                    background: TT.blue[400], color: "#fff",
                    borderRadius: 999, fontSize: 9, fontWeight: 800,
                    letterSpacing: "0.4px", textTransform: "uppercase",
                  }}>
                    Auto
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 4px 10px ${ramp[200]}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}>
                  <Icon name={f.icon} size={20} color="#fff" strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TT.text1, letterSpacing: "-0.2px", marginBottom: 3 }}>
                    {f.titolo}
                  </div>
                  <div style={{ fontSize: 11, color: TT.text2, lineHeight: 1.5 }}>
                    {f.descrizione}
                  </div>
                </div>
              </div>

              {/* badge stato */}
              <div style={{
                marginTop: 12, paddingTop: 12,
                borderTop: `1px solid ${TT.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: ramp[600],
                  letterSpacing: "-0.4px", fontVariantNumeric: "tabular-nums",
                }}>
                  {f.badge(n)}
                </div>
                {!inattiva && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: ramp[600],
                    display: "flex", alignItems: "center", gap: 3,
                  }}>
                    {f.esegui ? "Esegui" : "Apri"} <Icon name="chevronRight" size={11} color={ramp[600]} strokeWidth={2.6} />
                  </div>
                )}
              </div>

              {/* esito flash */}
              {eseguito && (
                <div style={{
                  position: "absolute", left: 0, right: 0, bottom: 0,
                  padding: "6px 12px",
                  background: ramp[500], color: "#fff",
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name="check" size={11} color="#fff" strokeWidth={3} />
                  {esito.testo}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick, tint }: { label: string; count: number; active: boolean; onClick: () => void; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        background: active ? ramp[400] : TT.surface,
        color: active ? "#fff" : TT.text2,
        border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
        borderRadius: 999,
        fontSize: 12, fontWeight: 600,
        cursor: "pointer", transition: "all 0.12s",
      }}
    >
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.28)" : TT.bgSoft,
        color: active ? "#fff" : TT.text3,
        fontSize: 10, fontWeight: 700,
        padding: "1px 7px", borderRadius: 999,
        fontVariantNumeric: "tabular-nums",
      }}>
        {count}
      </span>
    </div>
  );
}
