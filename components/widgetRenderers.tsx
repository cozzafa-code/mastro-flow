"use client";
import React from "react";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1F7A7A";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const AMBER = "#F5A030";
const RED = "#DC4444";
const GREEN = "#28A0A0";

const Empty = ({ msg }: { msg: string }) => (
  <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>{msg}</p>
);

const Row = ({ children, onClick, last }: any) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 2px",
    borderBottom: last ? "none" : "1px solid rgba(40,160,160,0.08)",
    cursor: onClick ? "pointer" : "default",
  }}>{children}</div>
);

const Badge = ({ text, bg, fg }: any) => (
  <span style={{
    fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 8,
    background: bg, color: fg, whiteSpace: "nowrap" as any,
  }}>{text}</span>
);

const today = () => new Date().toISOString().slice(0, 10);

// Accetta sia ISO timestamp sia date string - ritorna giorni interi da allora
const daysSince = (date: any): number => {
    if (!date || date === 0 || date === "0") return 0;
    const d = new Date(date);
    if (isNaN(d.getTime())) return 0;
    // Ignora date assurde (prima del 2020) = bug su created_at/fase_start null in localStorage
    if (d.getTime() < 1577836800000) return 0;
    const diff = Date.now() - d.getTime();
    const gg = Math.floor(diff / 86400000);
    return gg < 0 ? 0 : gg;
  }

// Formatta euro compatto (€4.2k, €850)
const eur = (n: number): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n)}`;
};

// Leggi campi di fallback - supporta sia i nomi DB (Supabase) che quelli legacy in-memory
const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") return obj[k];
  }
  return null;
};

// Valore commessa (DB: totale_finale > totale_preventivo; legacy: euro/totale/valore_totale)
const valoreCM = (c: any): number => {
  return Number(pick(c, "totale_finale", "totale_preventivo", "euro", "totale", "valore_totale")) || 0;
};

// Nome cliente commessa
const clienteCM = (c: any): string => {
  const nome = pick(c, "cliente", "cliente_nome");
  const cognome = pick(c, "cognome");
  if (nome && cognome) return `${nome} ${cognome}`;
  return nome || cognome || "—";
};

// Data ultimo avanzamento commessa (per calcolare gg fermo)
const lastCMActivity = (c: any): any => {
  return pick(c, "ops_ultimo_avanzamento", "fase_start", "updated_at", "aggiornato", "created_at", "creato");
};

// Colore per fase commessa
const faseColor = (f: string): string => {
  const k = (f || "").toLowerCase();
  if (k.includes("rilievo") || k.includes("sopral")) return "#5856D6";
  if (k.includes("preventivo")) return AMBER;
  if (k.includes("conferma") || k.includes("ordine")) return TEAL;
  if (k.includes("produzione")) return "#EA580C";
  if (k.includes("posa") || k.includes("montag")) return "#2563EB";
  if (k.includes("collaudo") || k.includes("consegna")) return "#22C55E";
  if (k.includes("fattur") || k.includes("saldo")) return "#D08008";
  return TEAL_DARK;
};

// Legge se fattura è pagata - supporta sia fin_fatture_emesse (stato/residuo) che legacy (pagata)
const fattPagata = (f: any): boolean => {
  if (f?.pagata === true) return true;
  if (f?.stato === "pagata" || f?.stato === "paid") return true;
  const residuo = Number(f?.residuo);
  if (!isNaN(residuo) && residuo === 0 && Number(f?.totale) > 0) return true;
  return false;
};

const fattImporto = (f: any): number => {
  return Number(pick(f, "totale", "importo")) || 0;
};

const fattScadenza = (f: any): string | null => {
  return pick(f, "data_scadenza", "scadenza");
};

const fattCliente = (f: any): string => {
  return pick(f, "cliente", "ragione_sociale") || "—";
};

function safeRender(id: string, data: any, nav: any): React.ReactNode {
  const tasks = data?.tasks || [];
  const cantieri = data?.cantieri || [];
  const fattureDB = data?.fattureDB || [];
  const team = data?.team || [];
  const msgs = data?.msgs || [];
  const problemi = data?.problemi || [];
  const events = data?.events || [];
  const td = today();

  switch (id) {
    case "oggi_devi_fare": {
      const actions: any[] = [];

      // 1. TASK non completati con priorità
      tasks.filter((t: any) => !t?.done).forEach((t: any) => {
        const prio = (t?.priorita || t?.priority || t?.prio || "").toLowerCase();
        const isAlta = prio === "alta" || prio === "urgente" || prio === "urgent" || t?.urgent;
        const dataT = pick(t, "data", "date", "scadenza");
        const scadOggi = dataT === td;
        const testo = pick(t, "testo", "title", "text") || "Task";
        const meta = pick(t, "meta", "cm", "persona");
        actions.push({
          icon: isAlta ? "🔴" : scadOggi ? "🟠" : "🟡",
          title: testo,
          meta: meta || "",
          priority: isAlta ? 3 : scadOggi ? 2 : 1,
          onClick: () => nav?.openTask?.(t),
          badge: isAlta ? "ORA" : scadOggi ? "OGGI" : null,
          badgeBg: isAlta ? RED : AMBER,
        });
      });

      // 2. COMMESSE FERME (campo DB ferma=true) o preventivi inviati senza risposta da 7+gg
      cantieri.forEach((c: any) => {
        // Commesse esplicitamente marcate ferma
        if (c?.ferma === true && c?.ferma_dal) {
          const gg = daysSince(c.ferma_dal);
          actions.push({
            icon: "⏸",
            title: `Sbloccare ${clienteCM(c)}`,
            meta: `${c.code || ""} · ${c?.motivo_ferma || "ferma"} da ${gg}gg`,
            priority: gg >= 7 ? 3 : 2,
            onClick: () => nav?.openCM?.(c),
            badge: gg >= 14 ? "CRITICO" : "FERMA",
            badgeBg: gg >= 14 ? RED : AMBER,
          });
          return;
        }
        // Preventivi inviati senza risposta
        const f = (c?.fase || "").toLowerCase();
        if (f === "preventivo" && c?.preventivo_inviato_at) {
          const gg = daysSince(c.preventivo_inviato_at);
          if (gg >= 5) {
            actions.push({
              icon: "📞",
              title: `Richiama ${clienteCM(c)}`,
              meta: `${c.code || ""} · ${eur(valoreCM(c))} · inviato ${gg}gg fa`,
              priority: gg >= 15 ? 3 : 2,
              onClick: () => nav?.openCM?.(c),
              badge: gg >= 15 ? "URGENTE" : `${gg}gg`,
              badgeBg: gg >= 15 ? RED : AMBER,
            });
          }
        }
      });

      // 3. EVENTI DI OGGI (campo DB: data + ora)
      events.filter((e: any) => {
        const d = pick(e, "data", "date");
        const st = e?.start_time;
        return d === td || (st || "").startsWith(td);
      }).forEach((e: any) => {
        const ora = pick(e, "ora", "time") || (e?.start_time || "").slice(11, 16);
        const titolo = pick(e, "titolo", "title", "text");
        const persona = pick(e, "persona", "client_name", "cliente");
        actions.push({
          icon: "📅",
          title: titolo || "Evento",
          meta: `${ora || ""}${persona ? " · " + persona : ""}`,
          priority: 2,
          onClick: () => nav?.openEvent?.(e),
          badge: null,
        });
      });

      // 4. FATTURE SCADUTE da sollecitare
      fattureDB.filter((f: any) => {
        const scad = fattScadenza(f);
        return !fattPagata(f) && scad && scad < td;
      }).slice(0, 2).forEach((f: any) => {
        const gg = daysSince(fattScadenza(f));
        actions.push({
          icon: "💰",
          title: `Sollecito ${fattCliente(f)}`,
          meta: `${eur(fattImporto(f))} · scaduta ${gg}gg fa`,
          priority: 3,
          onClick: () => nav?.goto?.("contabilita"),
          badge: "SCADUTA",
          badgeBg: RED,
        });
      });

      actions.sort((a, b) => b.priority - a.priority);
      if (actions.length === 0) return <Empty msg="Tutto in ordine oggi" />;

      return actions.slice(0, 5).map((a, i) => (
        <Row key={i} last={i === Math.min(actions.length, 5) - 1} onClick={a.onClick}>
          <div style={{ fontSize: 14, width: 20, flexShrink: 0, textAlign: "center" }}>{a.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
            {a.meta && <div style={{ fontSize: 11, color: SUB, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.meta}</div>}
          </div>
          {a.badge && <Badge text={a.badge} bg={a.badgeBg || AMBER} fg="#fff" />}
        </Row>
      ));
    }

    case "squadra": {
      if (team.length === 0) return <Empty msg="Nessun operatore configurato" />;
      // DB team: stato_attuale / commessa_attuale_id / ultimo_accesso
      const attivi = team.filter((m: any) => {
        const st = (m?.stato_attuale || m?.stato_oggi || "").toLowerCase();
        return m?.attivo === true || m?.inCantiere || m?.commessa_attuale_id ||
          ["in cantiere", "in rilievo", "online", "attivo", "al lavoro"].includes(st);
      });
      const lista = attivi.length > 0 ? attivi : team;
      return lista.slice(0, 5).map((m: any, i: number) => {
        const st = (m?.stato_attuale || m?.stato_oggi || (m?.attivo ? "attivo" : "offline")).toLowerCase();
        const inServizio = ["in cantiere", "in rilievo", "online", "attivo", "al lavoro"].includes(st) || !!m?.commessa_attuale_id;
        const iniziali = ((m.nome || "?")[0] + (m.cognome || "?")[0]).toUpperCase();
        return (
          <Row key={m.id || i} last={i === Math.min(lista.length, 5) - 1} onClick={() => nav?.goto?.("team")}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.colore || TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{iniziali}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{m.nome} {m.cognome || ""}</div>
              <div style={{ fontSize: 11, color: SUB }}>{m.ruolo || m.qualifica || "Operatore"}</div>
            </div>
            <Badge text={inServizio ? "ATTIVO" : "OFFLINE"} bg={inServizio ? GREEN + "20" : "#BDBDBD30"} fg={inServizio ? GREEN : SUB} />
          </Row>
        );
      });
    }

    case "produzione": {
      const aperti = problemi.filter((p: any) => p?.stato !== "risolto" && p?.stato !== "chiuso");
      if (aperti.length === 0) return <Empty msg="Nessun problema attivo" />;
      return aperti.slice(0, 4).map((p: any, i: number) => {
        const u = p?.priorita === "alta" || p?.priorita === "urgente";
        return (
          <Row key={p.id || i} last={i === Math.min(aperti.length, 4) - 1} onClick={() => nav?.openProblema?.(p)}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: u ? RED : AMBER, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titolo || p.descrizione}</div>
              <div style={{ fontSize: 11, color: SUB }}>{p.cm_code || ""}</div>
            </div>
            {u && <Badge text="URGENTE" bg={RED} fg="#fff" />}
          </Row>
        );
      });
    }

    case "fatture_incassare": {
      const aperte = fattureDB.filter((f: any) => !fattPagata(f));
      const tot = aperte.reduce((s: number, f: any) => s + fattImporto(f), 0);
      if (tot === 0) return <Empty msg="Nessuna fattura aperta" />;
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{aperte.length} fatture aperte</div>
        </div>
      );
    }

    case "fatture_scadute": {
      const scad = fattureDB.filter((f: any) => {
        const s = fattScadenza(f);
        return !fattPagata(f) && s && s < td;
      });
      if (scad.length === 0) return <Empty msg="Tutto regolare" />;
      return scad.slice(0, 4).map((f: any, i: number) => (
        <Row key={f.id || i} last={i === Math.min(scad.length, 4) - 1} onClick={() => nav?.goto?.("contabilita")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>€ {Math.round(fattImporto(f)).toLocaleString("it-IT")}</div>
            <div style={{ fontSize: 11, color: SUB }}>{fattCliente(f)}</div>
          </div>
          <Badge text="SCADUTA" bg={RED} fg="#fff" />
        </Row>
      ));
    }

    case "eventi_oggi": {
      // DB: data (date), ora (text HH:MM), tipo, persona, titolo, indirizzo
      const oggi = events.filter((e: any) => {
        const d = pick(e, "data", "date");
        const st = e?.start_time;
        const done = e?.completato || e?.annullato;
        return !done && (d === td || (st || "").startsWith(td));
      });
      if (oggi.length === 0) return <Empty msg="Nessun evento oggi" />;

      oggi.sort((a: any, b: any) => {
        const ta = pick(a, "ora", "time") || (a?.start_time || "").slice(11, 16) || "99:99";
        const tb = pick(b, "ora", "time") || (b?.start_time || "").slice(11, 16) || "99:99";
        return ta.localeCompare(tb);
      });

      return oggi.slice(0, 5).map((e: any, i: number) => {
        const ora = pick(e, "ora", "time") || (e?.start_time || "").slice(11, 16) || "—";
        const tipo = (pick(e, "tipo", "event_type", "type") || "").toUpperCase();
        const titolo = pick(e, "titolo", "title", "text");
        const persona = pick(e, "persona", "client_name", "cliente");
        const addr = pick(e, "indirizzo", "address", "addr");
        const col = e?.colore || faseColor(tipo);
        return (
          <Row key={e.id || i} last={i === Math.min(oggi.length, 5) - 1} onClick={() => nav?.openEvent?.(e)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 46, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: TEAL_DARK, lineHeight: 1 }}>{ora}</div>
              {tipo && <div style={{ fontSize: 8, fontWeight: 700, color: col, marginTop: 3, letterSpacing: "0.3px" }}>{tipo.slice(0, 7)}</div>}
            </div>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: col, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {titolo || persona || "Evento"}
              </div>
              <div style={{ fontSize: 11, color: SUB, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {addr ? addr : persona || ""}
              </div>
            </div>
          </Row>
        );
      });
    }

    case "messaggi_non_letti": {
      const nuovi = msgs.filter((m: any) => !m?.letto && !m?.read);
      if (nuovi.length === 0) return <Empty msg="Nessun messaggio nuovo" />;
      return nuovi.slice(0, 4).map((m: any, i: number) => (
        <Row key={m.id || i} last={i === Math.min(nuovi.length, 4) - 1} onClick={() => nav?.openMsg?.(m)}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{pick(m, "da", "mittente", "sender") || "—"}</div>
            <div style={{ fontSize: 11, color: SUB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick(m, "text", "anteprima", "contenuto") || ""}</div>
          </div>
        </Row>
      ));
    }

    case "commesse_ritardo": {
      // Usa campo DB: ferma = true con ferma_dal
      const r = cantieri.filter((c: any) => c?.ferma === true && c?.ferma_dal);
      if (r.length === 0) return <Empty msg="Tutto in orario" />;
      return r.slice(0, 4).map((c: any, i: number) => {
        const gg = daysSince(c.ferma_dal);
        return (
          <Row key={c.id || i} last={i === Math.min(r.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {clienteCM(c)}</div>
              <div style={{ fontSize: 11, color: SUB }}>{c?.motivo_ferma || "ferma"} da {gg}gg</div>
            </div>
            <Badge text="FERMA" bg={RED} fg="#fff" />
          </Row>
        );
      });
    }

    case "lavori_in_corso": {
      // Esclude fasi di chiusura
      const a = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return c?.fase && !f.includes("chius") && !f.includes("consegn") && !f.includes("archivi");
      });
      if (a.length === 0) return <Empty msg="Nessun lavoro attivo" />;

      // Ordina per "più fermi in cima" usando fase_start o ultimo avanzamento
      a.sort((x: any, y: any) => daysSince(lastCMActivity(y)) - daysSince(lastCMActivity(x)));

      return a.slice(0, 5).map((c: any, i: number) => {
        const fase = c.fase || "—";
        const col = faseColor(fase);
        const cliente = clienteCM(c);
        const valore = valoreCM(c);
        const gg = daysSince(lastCMActivity(c));
        const fermo = c?.ferma === true || gg >= 7;
        return (
          <Row key={c.id || i} last={i === Math.min(a.length, 5) - 1} onClick={() => nav?.openCM?.(c)}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: col, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {c.code || ""} · {cliente}
                </div>
                {valore > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: TEAL_DARK, flexShrink: 0 }}>{eur(valore)}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.3px" }}>{fase}</span>
                <span style={{ fontSize: 10, color: SUB }}>·</span>
                <span style={{ fontSize: 10, color: fermo ? RED : SUB, fontWeight: fermo ? 700 : 500 }}>
                  {gg === 0 ? "oggi" : `${gg}gg`}
                </span>
              </div>
            </div>
            {c?.ferma === true
              ? <Badge text="FERMA" bg={RED} fg="#fff" />
              : (gg >= 7 ? <Badge text="FERMO" bg={AMBER} fg="#fff" /> : null)}
          </Row>
        );
      });
    }

    case "preventivi_scadenza": {
      const prev = cantieri.filter((c: any) => (c?.fase || "").toLowerCase() === "preventivo");
      // Scadenza basata su preventivo_inviato_at + 30gg (tipica validità)
      const inScad = prev.filter((c: any) => {
        if (!c?.preventivo_inviato_at) return false;
        const gg = daysSince(c.preventivo_inviato_at);
        return gg >= 20 && gg < 30;
      });
      const list = inScad.length > 0 ? inScad : prev.slice(0, 5);
      if (list.length === 0) return <Empty msg="Nessun preventivo in scadenza" />;
      return list.slice(0, 4).map((c: any, i: number) => {
        const gg = c?.preventivo_inviato_at ? daysSince(c.preventivo_inviato_at) : null;
        return (
          <Row key={c.id || i} last={i === Math.min(list.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {clienteCM(c)}</div>
              <div style={{ fontSize: 11, color: SUB }}>{gg !== null ? `inviato ${gg}gg fa` : "da inviare"}</div>
            </div>
            {gg !== null && gg >= 20 && <Badge text="SCAD" bg={AMBER} fg="#fff" />}
          </Row>
        );
      });
    }

    case "preventivi_da_inviare": {
      const bozze = cantieri.filter((c: any) =>
        (c?.fase || "").toLowerCase() === "preventivo" && !c?.preventivo_inviato_at
      );
      if (bozze.length === 0) return <Empty msg="Nessuna bozza in attesa" />;
      return bozze.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(bozze.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {clienteCM(c)}</div>
            <div style={{ fontSize: 11, color: SUB }}>{eur(valoreCM(c))} · da inviare</div>
          </div>
        </Row>
      ));
    }

    case "rilievi_da_confermare": {
      const r = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return (f === "rilievo" || f === "sopralluogo") && !c?.rilievoConfermato;
      });
      if (r.length === 0) return <Empty msg="Nessun rilievo in attesa" />;
      return r.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(r.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {clienteCM(c)}</div>
            <div style={{ fontSize: 11, color: SUB }}>Rilievo da confermare</div>
          </div>
        </Row>
      ));
    }

    case "prossime_consegne": {
      const d7 = data?._d7 || td;
      const c7 = cantieri.filter((c: any) => c?.consegnaPrevista && c.consegnaPrevista >= td && c.consegnaPrevista <= d7);
      if (c7.length === 0) return <Empty msg="Nessuna consegna nei 7gg" />;
      return c7.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(c7.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {clienteCM(c)}</div>
            <div style={{ fontSize: 11, color: SUB }}>{c.consegnaPrevista}</div>
          </div>
        </Row>
      ));
    }

    case "pipeline_commesse": {
      const fasi: Record<string, { count: number; val: number }> = {};
      cantieri.forEach((c: any) => {
        const f = c?.fase || "—";
        if (!fasi[f]) fasi[f] = { count: 0, val: 0 };
        fasi[f].count += 1;
        fasi[f].val += valoreCM(c);
      });
      const keys = Object.keys(fasi);
      if (keys.length === 0) return <Empty msg="Nessuna commessa in pipeline" />;

      const order = ["rilievo", "sopralluogo", "preventivo", "conferma", "ordine", "produzione", "posa", "montaggio", "collaudo", "consegna", "fattura", "saldo", "chiusura"];
      keys.sort((a, b) => {
        const ia = order.findIndex(o => a.toLowerCase().includes(o));
        const ib = order.findIndex(o => b.toLowerCase().includes(o));
        if (ia === -1 && ib === -1) return fasi[b].count - fasi[a].count;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      const maxCount = Math.max(...keys.map(k => fasi[k].count));
      const totVal = keys.reduce((s, k) => s + fasi[k].val, 0);

      return (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 0 6px", borderBottom: "1px solid rgba(40,160,160,0.1)", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: SUB, fontWeight: 600 }}>Totale pipeline</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: TEAL_DARK }}>{eur(totVal)}</span>
          </div>
          {keys.slice(0, 6).map((f, i) => {
            const d = fasi[f];
            const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            const col = faseColor(f);
            return (
              <div key={f} onClick={() => nav?.goto?.("commesse")} style={{ padding: "7px 2px", cursor: "pointer", borderBottom: i === Math.min(keys.length, 6) - 1 ? "none" : "1px solid rgba(40,160,160,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: DARK, textTransform: "capitalize" }}>{f}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    {d.val > 0 && <span style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>{eur(d.val)}</span>}
                    <span style={{ fontSize: 14, fontWeight: 900, color: col }}>{d.count}</span>
                  </div>
                </div>
                <div style={{ height: 4, background: "rgba(40,160,160,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </>
      );
    }

    case "ordini_attesa": {
      const ord = data?.ordiniFornDB || [];
      const attesa = ord.filter((o: any) => o?.stato === "attesa" || o?.stato === "bozza" || !o?.confermato);
      if (attesa.length === 0) return <Empty msg="Nessun ordine in attesa" />;
      return attesa.slice(0, 4).map((o: any, i: number) => (
        <Row key={o.id || i} last={i === Math.min(attesa.length, 4) - 1} onClick={() => nav?.goto?.("ordini")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{o.fornitore || o.ragione_sociale}</div>
            <div style={{ fontSize: 11, color: SUB }}>{o.numero || o.id}</div>
          </div>
        </Row>
      ));
    }

    case "ordini_settimana": {
      const d7 = data?._d7 || td;
      const ord = data?.ordiniFornDB || [];
      const sett = ord.filter((o: any) => o?.consegnaPrevista && o.consegnaPrevista >= td && o.consegnaPrevista <= d7);
      if (sett.length === 0) return <Empty msg="Nessuna consegna nei 7gg" />;
      return sett.slice(0, 4).map((o: any, i: number) => (
        <Row key={o.id || i} last={i === Math.min(sett.length, 4) - 1} onClick={() => nav?.goto?.("ordini")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{o.fornitore}</div>
            <div style={{ fontSize: 11, color: SUB }}>{o.consegnaPrevista}</div>
          </div>
        </Row>
      ));
    }

    case "spese_mese": {
      const spese = data?.spese || [];
      const mese = td.slice(0, 7);
      const m = spese.filter((s: any) => (s?.data || s?.date || s?.data_emissione || "").startsWith(mese));
      const tot = m.reduce((acc: number, s: any) => acc + (Number(s?.importo || s?.totale) || 0), 0);
      if (tot === 0) return <Empty msg="Nessuna spesa registrata" />;
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{m.length} spese nel mese</div>
        </div>
      );
    }

    case "fatturato_mese": {
      const mese = td.slice(0, 7);
      const pag = fattureDB.filter((f: any) => {
        const dataE = pick(f, "data_emissione", "data");
        return fattPagata(f) && (dataE || "").startsWith(mese);
      });
      const tot = pag.reduce((s: number, f: any) => s + fattImporto(f), 0);
      if (tot === 0) return <Empty msg="Nessun incasso nel mese" />;
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{pag.length} fatture incassate</div>
        </div>
      );
    }

    case "pagamenti_arrivo": {
      const d7 = data?._d7 || td;
      const att = fattureDB.filter((f: any) => {
        const s = fattScadenza(f);
        return !fattPagata(f) && s && s >= td && s <= d7;
      });
      if (att.length === 0) return <Empty msg="Nessun pagamento atteso" />;
      const tot = att.reduce((s: number, f: any) => s + fattImporto(f), 0);
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{att.length} fatture in arrivo entro 7gg</div>
        </div>
      );
    }

    case "margine_medio": {
      const chiuse = cantieri.filter((c: any) => {
        const tot = valoreCM(c);
        const costo = Number(pick(c, "costoTotale", "costo_totale")) || 0;
        return tot > 0 && costo > 0;
      });
      if (chiuse.length === 0) return <Empty msg="Dati margine non disponibili" />;
      const margini = chiuse.map((c: any) => {
        const tot = valoreCM(c);
        const costo = Number(pick(c, "costoTotale", "costo_totale")) || 0;
        return ((tot - costo) / tot) * 100;
      });
      const avg = margini.reduce((s: number, m: number) => s + m, 0) / margini.length;
      return (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK }}>{avg.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>Su {chiuse.length} commesse</div>
        </div>
      );
    }

    case "clienti_insolventi": {
      const scad = fattureDB.filter((f: any) => {
        const s = fattScadenza(f);
        return !fattPagata(f) && s && s < td;
      });
      const perCli: Record<string, { cli: string; count: number; tot: number }> = {};
      scad.forEach((f: any) => {
        const k = fattCliente(f);
        if (!perCli[k]) perCli[k] = { cli: k, count: 0, tot: 0 };
        perCli[k].count += 1;
        perCli[k].tot += fattImporto(f);
      });
      const list = Object.values(perCli).sort((a: any, b: any) => b.tot - a.tot);
      if (list.length === 0) return <Empty msg="Nessun cliente insolvente" />;
      return list.slice(0, 4).map((c: any, i: number) => (
        <Row key={i} last={i === Math.min(list.length, 4) - 1} onClick={() => nav?.goto?.("contabilita")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.cli}</div>
            <div style={{ fontSize: 11, color: SUB }}>{c.count} fatture scadute</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: RED }}>€ {Math.round(c.tot).toLocaleString("it-IT")}</div>
        </Row>
      ));
    }

    case "top_clienti": {
      const perCli: Record<string, { cli: string; tot: number }> = {};
      fattureDB.filter((f: any) => fattPagata(f)).forEach((f: any) => {
        const k = fattCliente(f);
        if (!perCli[k]) perCli[k] = { cli: k, tot: 0 };
        perCli[k].tot += fattImporto(f);
      });
      const list = Object.values(perCli).sort((a: any, b: any) => b.tot - a.tot).slice(0, 5);
      if (list.length === 0) return <Empty msg="Nessun dato clienti" />;
      return list.map((c: any, i: number) => (
        <Row key={i} last={i === list.length - 1}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEAL_DARK, width: 20, flexShrink: 0 }}>{i + 1}°</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.cli}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, color: GREEN }}>€ {Math.round(c.tot).toLocaleString("it-IT")}</div>
        </Row>
      ));
    }

    case "iva_versare": {
      const mese = parseInt(td.slice(5, 7), 10);
      const trimStart = mese <= 3 ? "01" : mese <= 6 ? "04" : mese <= 9 ? "07" : "10";
      const yr = td.slice(0, 4);
      const trimPrefix = yr + "-" + trimStart.padStart(2, "0");
      const ric = fattureDB
        .filter((f: any) => fattPagata(f) && (pick(f, "data_emissione", "data") || "") >= trimPrefix)
        .reduce((s: number, f: any) => s + fattImporto(f), 0);
      const ivaStimata = ric * 0.22 / 1.22;
      if (ric === 0) return <Empty msg="Nessun dato per calcolo IVA" />;
      return (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: DARK }}>€ {Math.round(ivaStimata).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>Stima trimestre corrente</div>
        </div>
      );
    }
    default:
      return <Empty msg="In arrivo nei prossimi aggiornamenti" />;
  }
}

export function renderWidgetBody(id: string, data: any, nav: any): React.ReactNode {
  try {
    return safeRender(id, data, nav);
  } catch (e) {
    console.warn("[widget]", id, "render failed", e);
    return <Empty msg="Errore caricamento widget" />;
  }
}
