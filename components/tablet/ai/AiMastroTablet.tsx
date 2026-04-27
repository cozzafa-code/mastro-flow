"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

interface Messaggio {
  id: string;
  ruolo: "user" | "ai";
  testo: string;
  ts: number;
  azioni?: { label: string; onClick: () => void; icon: IconName }[];
}

interface SuggerimentoRapido {
  testo: string;
  icon: IconName;
  tint: keyof typeof TINTS;
}

const SUGGERIMENTI: SuggerimentoRapido[] = [
  { testo: "Quante commesse ho aperte?",                icon: "commesse",     tint: "orange" },
  { testo: "Riassumi le scadenze prossime",              icon: "bell",         tint: "red"    },
  { testo: "Stato della commessa Verdi",                  icon: "clienti",      tint: "teal"   },
  { testo: "Quali fatture sono in attesa?",               icon: "contabilita",  tint: "pink"   },
  { testo: "Cosa devo fare per le pratiche fiscali?",    icon: "fiscale",      tint: "amber"  },
  { testo: "Articoli a rischio rottura stock",            icon: "magazzino",    tint: "blue"   },
];

// Knowledge engine: risposte basate sul vero state
function rispondi(domanda: string, data: any, openCommessa: (id: string) => void, navigate: (s: string) => void): { testo: string; azioni?: any[] } {
  const q = domanda.toLowerCase();
  const fmtEuro = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

  // Numero commesse aperte
  if (/quante|quanti|numero/.test(q) && /commess/.test(q)) {
    const aperte = data.getCommesse().filter((c: any) => c.fase !== "pagata").length;
    const tot = data.getCommesse().length;
    const valoreAperte = data.getCommesse().filter((c: any) => c.fase !== "pagata").reduce((s: number, c: any) => s + c.valore, 0);
    return {
      testo: `Hai **${aperte} commesse aperte** su un totale di ${tot}, per un valore complessivo di **${fmtEuro(valoreAperte)}**. La piu' avanzata e' attualmente in fase montaggio.`,
      azioni: [{ label: "Vedi tutte", icon: "commesse" as IconName, onClick: () => navigate("commesse") }],
    };
  }

  // Scadenze
  if (/scaden/.test(q)) {
    const fatture = data.getFatture().filter((f: any) => f.stato === "scaduta" || f.stato === "emessa");
    const enea = data.getPratiche().filter((p: any) => p.enea === "da_inviare").length;
    const totDovuti = fatture.reduce((s: number, f: any) => s + f.importo, 0);
    return {
      testo: `Hai **${fatture.length} fatture in attesa** per un totale di **${fmtEuro(totDovuti)}**. ${enea > 0 ? `Inoltre ci sono **${enea} pratiche ENEA da inviare** entro 90 giorni dalla fine dei lavori.` : "Le pratiche ENEA sono in regola."}`,
      azioni: [
        { label: "Apri Contabilita", icon: "contabilita" as IconName, onClick: () => navigate("contabilita") },
        ...(enea > 0 ? [{ label: "Apri Fiscale", icon: "fiscale" as IconName, onClick: () => navigate("fiscale") }] : []),
      ],
    };
  }

  // Verdi
  if (/verdi|giuseppe/.test(q)) {
    const cli = data.getClienti().find((c: any) => c.nome.toLowerCase().includes("verdi"));
    if (cli) {
      const commesse = data.getCommesseByCliente(cli.id);
      const c = commesse[0];
      if (c) {
        const prod = data.getProduzioneByCommessa(c.id);
        const prat = data.getPraticaByCommessa(c.id);
        return {
          testo: `**${cli.nome}** (${cli.citta}) - commessa **${c.numero}**, fase attuale: **${c.fase}**. ${prod ? `La produzione e' al ${prod.avanzamentoPct}%, consegna prevista ${prod.consegnaPrevista}. ` : ""}${prat ? `Pratica fiscale ${prat.numero} (${prat.tipo.replace("_", " ")}, ${fmtEuro(prat.importoDetraibile)} detraibili).` : ""}`,
          azioni: [{ label: "Apri commessa", icon: "commesse" as IconName, onClick: () => openCommessa(c.id) }],
        };
      }
    }
    return { testo: "Non trovo nessun cliente di nome Verdi nel sistema." };
  }

  // Fatture in attesa
  if (/fattur/.test(q)) {
    const tot = data.getFatture().length;
    const pagate = data.getFatture().filter((f: any) => f.stato === "pagata");
    const attesa = data.getFatture().filter((f: any) => f.stato === "emessa");
    const scadute = data.getFatture().filter((f: any) => f.stato === "scaduta");
    return {
      testo: `**${tot} fatture totali**: ${pagate.length} pagate, ${attesa.length} in attesa, ${scadute.length} scadute. Importo da incassare: **${fmtEuro(attesa.reduce((s: number, f: any) => s + f.importo, 0) + scadute.reduce((s: number, f: any) => s + f.importo, 0))}**.`,
      azioni: [{ label: "Vedi Contabilita", icon: "contabilita" as IconName, onClick: () => navigate("contabilita") }],
    };
  }

  // Pratiche fiscali
  if (/pratich|fiscal|enea|bonus|cam/.test(q)) {
    const pratiche = data.getPratiche();
    const enea = pratiche.filter((p: any) => p.enea === "da_inviare");
    const cam = pratiche.filter((p: any) => p.cam);
    const totDetr = pratiche.reduce((s: number, p: any) => s + p.importoDetraibile, 0);
    return {
      testo: `Hai **${pratiche.length} pratiche fiscali** attive per un totale di **${fmtEuro(totDetr)}** detraibili. ${enea.length > 0 ? `**${enea.length} hanno l'invio ENEA in sospeso** (deadline 90gg fine lavori). ` : ""}${cam.length} pratiche richiedono conformita CAM.`,
      azioni: [{ label: "Apri Fiscale", icon: "fiscale" as IconName, onClick: () => navigate("fiscale") }],
    };
  }

  // Stock
  if (/stock|articol|magazz|materiale/.test(q)) {
    const articoli = data.getArticoli();
    const sotto = articoli.filter((a: any) => a.scorta < a.scortaMin);
    const esauriti = articoli.filter((a: any) => a.scorta === 0);
    return {
      testo: `Magazzino: **${articoli.length} articoli** totali. ${esauriti.length > 0 ? `**${esauriti.length} sono esauriti**: ${esauriti.map((a: any) => a.nome).join(", ")}. ` : ""}${sotto.length} articoli sono sotto la soglia minima.`,
      azioni: [{ label: "Apri Magazzino", icon: "magazzino" as IconName, onClick: () => navigate("magazzino") }],
    };
  }

  // Fallback: riassunto generico
  const k = data.getKPIDashboard();
  return {
    testo: `Posso aiutarti a navigare il tuo MASTRO. Stato corrente:\n\n- **${k.commesseAttive} commesse attive**\n- **${fmtEuro(k.fatturatoMese)}** fatturato mese\n- **${k.produzioneInCorso}** lavorazioni in corso\n- Margine medio: **${k.margine}%**\n\nProva a chiedermi qualcosa di specifico, oppure usa i suggerimenti qui sotto.`,
  };
}

export default function AiMastroTablet() {
  const data = useMastroData();
  const { navigate, openCommessa } = useDashboard();
  const [messaggi, setMessaggi] = React.useState<Messaggio[]>(() => {
    const k = data.getKPIDashboard();
    return [{
      id: "welcome",
      ruolo: "ai",
      ts: Date.now(),
      testo: `Ciao Fabio. Sono AI MASTRO, il tuo assistente operativo. Conosco lo stato attuale di MASTRO Suite:\n\n**${k.commesseAttive}** commesse aperte &middot; **€ ${k.fatturatoMese.toLocaleString("it-IT")}** fatturato mese &middot; **${k.produzioneInCorso}** lavorazioni in corso\n\nDimmi cosa vuoi sapere o fare.`,
    }];
  });
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const send = (testo: string) => {
    const t = testo.trim();
    if (!t) return;

    const userMsg: Messaggio = { id: `u-${Date.now()}`, ruolo: "user", testo: t, ts: Date.now() };
    setMessaggi((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const r = rispondi(t, data, openCommessa, navigate);
      const aiMsg: Messaggio = {
        id: `a-${Date.now()}`,
        ruolo: "ai",
        testo: r.testo,
        ts: Date.now(),
        azioni: r.azioni,
      };
      setMessaggi((m) => [...m, aiMsg]);
      setThinking(false);
    }, 600);
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messaggi, thinking]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${TT.teal[400]}, ${TT.blue[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${TT.teal[300]}`,
          }}>
            <Icon name="ai" size={22} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TT.text1, letterSpacing: "-0.4px" }}>
              AI MASTRO
            </div>
            <div style={{ fontSize: 11, color: TT.text3, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: TT.green[500] }} />
              Conosco il tuo stato attuale &middot; risposte basate sui tuoi dati
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "flex-start" }}>
        {/* CHAT */}
        <div style={cardStyle({ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 220px)" })}>
          <div ref={scrollRef} style={{
            flex: 1, overflowY: "auto", padding: "18px 20px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {messaggi.map((m) => <Bolla key={m.id} m={m} />)}
            {thinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `linear-gradient(135deg, ${TT.teal[400]}, ${TT.blue[500]})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="ai" size={15} color="#fff" strokeWidth={2.4} />
                </div>
                <div style={{
                  padding: "10px 14px",
                  background: TT.bgSoft, borderRadius: 12,
                  display: "flex", gap: 4,
                }}>
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{
            padding: "12px 16px",
            borderTop: `1px solid ${TT.border}`,
            background: TT.bgSoft,
            display: "flex", gap: 8,
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
              placeholder="Chiedi qualcosa al tuo MASTRO..."
              style={{
                flex: 1, padding: "10px 14px",
                background: TT.surface,
                border: `1px solid ${TT.borderStrong}`, borderRadius: 10,
                fontSize: 13, fontFamily: TT.fontFamily,
                color: TT.text1, outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              style={{
                width: 42, height: 42, borderRadius: 10,
                background: input.trim() && !thinking ? `linear-gradient(135deg, ${TT.teal[400]}, ${TT.blue[500]})` : TT.slate[200],
                border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !thinking ? "pointer" : "not-allowed",
                boxShadow: input.trim() && !thinking ? `0 3px 8px ${TT.teal[300]}` : "none",
                opacity: input.trim() && !thinking ? 1 : 0.6,
              }}
            >
              <Icon name="chevronRight" size={16} color="#fff" strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {/* SIDEBAR SUGGERIMENTI */}
        <div>
          <div style={cardStyle({ padding: "14px 16px", marginBottom: 12 })}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 12 }}>
              Suggerimenti rapidi
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGERIMENTI.map((s, i) => {
                const ramp = TINTS[s.tint];
                return (
                  <div
                    key={i}
                    onClick={() => send(s.testo)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 11px",
                      background: ramp[50],
                      border: `1px solid ${ramp[100]}`,
                      borderRadius: 8, cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = ramp[100];
                      el.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background = ramp[50];
                      el.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: ramp[400],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon name={s.icon} size={12} color="#fff" strokeWidth={2.4} />
                    </div>
                    <span style={{ flex: 1, fontSize: 11, color: TT.text1, fontWeight: 600, letterSpacing: "-0.05px" }}>
                      {s.testo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={cardStyle({ padding: "12px 14px", background: TT.amber[50], borderColor: TT.amber[100] })}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <Icon name="bell" size={14} color={TT.amber[600]} strokeWidth={2.4} />
              <div style={{ fontSize: 10, color: TT.text2, lineHeight: 1.5 }}>
                AI MASTRO risponde basandosi <strong>solo</strong> sui dati attualmente nel sistema. Non inventa informazioni.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Bolla({ m }: { m: Messaggio }) {
  const isUser = m.ruolo === "user";

  // Parse markdown semplice **bold**
  const formatTesto = (t: string) => {
    const parts = t.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i}>{p.slice(2, -2)}</strong>;
      }
      // newline support
      const lines = p.split("\n");
      return lines.map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {line}
          {j < lines.length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

  return (
    <div style={{
      display: "flex", gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: isUser
          ? TT.violet[400]
          : `linear-gradient(135deg, ${TT.teal[400]}, ${TT.blue[500]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={isUser ? "clienti" : "ai"} size={15} color="#fff" strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, maxWidth: "calc(100% - 50px)" }}>
        <div style={{
          padding: "10px 14px",
          background: isUser ? TT.violet[400] : TT.bgSoft,
          color: isUser ? "#fff" : TT.text1,
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          fontSize: 12, lineHeight: 1.6,
          letterSpacing: "-0.05px",
          display: "inline-block",
        }}>
          {formatTesto(m.testo)}
        </div>
        {m.azioni && m.azioni.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {m.azioni.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 11px",
                  background: TT.surface,
                  color: TT.teal[600],
                  border: `1px solid ${TT.teal[200]}`, borderRadius: 7,
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: TT.fontFamily,
                }}
              >
                <Icon name={a.icon} size={11} color={TT.teal[600]} strokeWidth={2.4} />
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <>
      <style>{`
        @keyframes mastroPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: TT.text3,
        animation: `mastroPulse 1.4s infinite ${delay}ms`,
      }} />
    </>
  );
}
