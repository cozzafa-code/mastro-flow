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

const daysSince = (date: any): number => {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
};

const eur = (n: number): string => {
  if (!n) return "—";
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n)}`;
};

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
      const td2 = today();
      const actions: any[] = [];

      tasks.filter((t: any) => !t?.done).forEach((t: any) => {
        const isAlta = t?.priority === "alta" || t?.prio === "alta" || t?.urgent;
        const scadOggi = t?.date === td2 || t?.scadenza === td2;
        actions.push({
          icon: isAlta ? "🔴" : scadOggi ? "🟠" : "🟡",
          title: t.title || t.text || "Task",
          meta: t.cm || t.meta || "",
          priority: isAlta ? 3 : scadOggi ? 2 : 1,
          onClick: () => nav?.openTask?.(t),
          badge: isAlta ? "ORA" : scadOggi ? "OGGI" : null,
          badgeBg: isAlta ? RED : AMBER,
        });
      });

      cantieri.forEach((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        if (f === "preventivo") {
          const gg = daysSince(c?.data_preventivo || c?.aggiornato || c?.creato);
          if (gg >= 7) {
            actions.push({
              icon: "📞",
              title: `Richiama ${c.cliente || c.cliente_nome || c.cognome || c.code}`,
              meta: `Preventivo ${c.code || c.numero} · ${eur(c.euro || c.valore_totale || 0)} · fermo ${gg}gg`,
              priority: gg >= 15 ? 3 : 2,
              onClick: () => nav?.openCM?.(c),
              badge: gg >= 15 ? "URGENTE" : `${gg}gg`,
              badgeBg: gg >= 15 ? RED : AMBER,
            });
          }
        }
      });

      events.filter((e: any) => e?.date === td2 || (e?.start_time || "").startsWith(td2)).forEach((e: any) => {
        actions.push({
          icon: "📅",
          title: e.text || e.titolo || e.title || "Evento",
          meta: `${e.time || (e.start_time || "").slice(11, 16) || ""} · ${e.persona || e.client_name || e.addr || ""}`,
          priority: 2,
          onClick: () => nav?.openEvent?.(e),
          badge: null,
        });
      });

      fattureDB.filter((f: any) => !f?.pagata && f?.scadenza && f.scadenza < td2).slice(0, 2).forEach((f: any) => {
        const gg = daysSince(f.scadenza);
        actions.push({
          icon: "💰",
          title: `Sollecito ${f.cliente || f.ragione_sociale}`,
          meta: `${eur(f.importo || 0)} · scaduta ${gg}gg fa`,
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
      const attivi = team.filter((m: any) => m?.attivo || m?.inCantiere || m?.stato_oggi === "in cantiere" || m?.stato_oggi === "in rilievo" || m?.stato_oggi === "online");
      const lista = attivi.length > 0 ? attivi : team;
      return lista.slice(0, 5).map((m: any, i: number) => {
        const stato = m?.stato_oggi || (m?.attivo ? "attivo" : "offline");
        const inServizio = ["in cantiere", "in rilievo", "online", "attivo"].includes(stato);
        return (
          <Row key={m.id || i} last={i === Math.min(lista.length, 5) - 1} onClick={() => nav?.goto?.("team")}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.colore || TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {((m.nome || "?")[0] + (m.cognome || "?")[0]).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{m.nome} {m.cognome || ""}</div>
              <div style={{ fontSize: 11, color: SUB }}>{m.ruolo || "Operatore"}</div>
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
      const aperte = fattureDB.filter((f: any) => !f?.pagata);
      const tot = aperte.reduce((s: number, f: any) => s + (f?.importo || 0), 0);
      if (tot === 0) return <Empty msg="Nessuna fattura aperta" />;
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{aperte.length} fatture aperte</div>
        </div>
      );
    }

    case "fatture_scadute": {
      const scad = fattureDB.filter((f: any) => !f?.pagata && f?.scadenza && f.scadenza < td);
      if (scad.length === 0) return <Empty msg="Tutto regolare" />;
      return scad.slice(0, 4).map((f: any, i: number) => (
        <Row key={f.id || i} last={i === Math.min(scad.length, 4) - 1} onClick={() => nav?.goto?.("contabilita")}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>€ {Math.round(f.importo || 0).toLocaleString("it-IT")}</div>
            <div style={{ fontSize: 11, color: SUB }}>{f.cliente || f.ragione_sociale || ""}</div>
          </div>
          <Badge text="SCADUTA" bg={RED} fg="#fff" />
        </Row>
      ));
    }

    case "eventi_oggi": {
      const oggi = events.filter((e: any) => e?.date === td || (e?.start_time || "").startsWith(td));
      if (oggi.length === 0) return <Empty msg="Nessun evento oggi" />;

      oggi.sort((a: any, b: any) => {
        const ta = a.time || (a.start_time || "").slice(11, 16) || "99:99";
        const tb = b.time || (b.start_time || "").slice(11, 16) || "99:99";
        return ta.localeCompare(tb);
      });

      return oggi.slice(0, 5).map((e: any, i: number) => {
        const time = e.time || (e.start_time || "").slice(11, 16) || "—";
        const tipo = (e.event_type || e.tipo || e.type || "").toUpperCase();
        const cliente = e.client_name || e.cliente || e.persona || "";
        const addr = e.address || e.addr || e.indirizzo || "";
        const squadra = Array.isArray(e.assigned_to) && e.assigned_to.length > 0
          ? e.assigned_to[0]
          : (e.assegnato_a || e.squadra || "");
        const col = faseColor(tipo);
        return (
          <Row key={e.id || i} last={i === Math.min(oggi.length, 5) - 1} onClick={() => nav?.openEvent?.(e)}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 46, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: TEAL_DARK, lineHeight: 1 }}>{time}</div>
              {tipo && <div style={{ fontSize: 8, fontWeight: 700, color: col, marginTop: 3, letterSpacing: "0.3px" }}>{tipo.slice(0, 6)}</div>}
            </div>
            <div style={{ width: 3, height: 32, borderRadius: 2, background: col, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.title || e.text || e.titolo || cliente || "Evento"}
              </div>
              <div style={{ fontSize: 11, color: SUB, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {addr || cliente}{squadra ? ` · ${squadra}` : ""}
              </div>
            </div>
            {(e.priority === "urgent" || e.priorita === "urgente") && <Badge text="!" bg={RED} fg="#fff" />}
          </Row>
        );
      });
    }

    case "messaggi_non_letti": {
      const nuovi = msgs.filter((m: any) => !m?.letto);
      if (nuovi.length === 0) return <Empty msg="Nessun messaggio nuovo" />;
      return nuovi.slice(0, 4).map((m: any, i: number) => (
        <Row key={m.id || i} last={i === Math.min(nuovi.length, 4) - 1} onClick={() => nav?.openMsg?.(m)}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{m.da || m.mittente || "—"}</div>
            <div style={{ fontSize: 11, color: SUB, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.text || m.anteprima || ""}</div>
          </div>
        </Row>
      ));
    }

    case "commesse_ritardo": {
      const r = cantieri.filter((c: any) => c?.scadenza && c.scadenza < td && c.fase !== "chiusura");
      if (r.length === 0) return <Empty msg="Tutto in orario" />;
      return r.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(r.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {c.cliente}</div>
            <div style={{ fontSize: 11, color: SUB }}>Scad. {c.scadenza}</div>
          </div>
          <Badge text="RITARDO" bg={RED} fg="#fff" />
        </Row>
      ));
    }

    case "lavori_in_corso": {
      const a = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return c?.fase && !f.includes("chius") && !f.includes("consegn") && !f.includes("saldo");
      });
      if (a.length === 0) return <Empty msg="Nessun lavoro attivo" />;

      a.sort((x: any, y: any) => {
        const ggX = daysSince(x?.aggiornato || x?.updated_at || x?.creato);
        const ggY = daysSince(y?.aggiornato || y?.updated_at || y?.creato);
        return ggY - ggX;
      });

      return a.slice(0, 5).map((c: any, i: number) => {
        const fase = c.fase || "—";
        const col = faseColor(fase);
        const cliente = c.cliente || c.cliente_nome || c.cognome || "—";
        const valore = c.euro || c.valore_totale || c.totale || 0;
        const gg = daysSince(c?.aggiornato || c?.updated_at || c?.creato);
        const fermo = gg >= 7;
        return (
          <Row key={c.id || i} last={i === Math.min(a.length, 5) - 1} onClick={() => nav?.openCM?.(c)}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: col, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {c.code || c.numero} · {cliente}
                </div>
                {valore > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: TEAL_DARK, flexShrink: 0 }}>{eur(valore)}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.3px" }}>{fase}</span>
                <span style={{ fontSize: 10, color: SUB }}>·</span>
                <span style={{ fontSize: 10, color: fermo ? RED : SUB, fontWeight: fermo ? 700 : 500 }}>
                  {gg === 0 ? "oggi" : `${gg}gg in fase`}
                </span>
              </div>
            </div>
            {fermo && <Badge text="FERMO" bg={AMBER} fg="#fff" />}
          </Row>
        );
      });
    }

    case "preventivi_scadenza": {
      const prev = cantieri.filter((c: any) => c?.fase === "preventivo" || c?.fase === "PREVENTIVO");
      const inScad = prev.filter((c: any) => {
        if (!c.prevScadenza && !c.validita) return false;
        const sc = c.prevScadenza || c.validita;
        return sc >= td && sc <= data?._d7;
      });
      const list = inScad.length > 0 ? inScad : prev.slice(0, 5);
      if (list.length === 0) return <Empty msg="Nessun preventivo in scadenza" />;
      return list.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(list.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {c.cliente}</div>
            <div style={{ fontSize: 11, color: SUB }}>{c.prevScadenza || c.validita || "—"}</div>
          </div>
          <Badge text="SCAD" bg={AMBER} fg="#fff" />
        </Row>
      ));
    }

    case "preventivi_da_inviare": {
      const bozze = cantieri.filter((c: any) =>
        (c?.fase === "preventivo" || c?.fase === "PREVENTIVO") && !c?.prevInviato && !c?.inviato
      );
      if (bozze.length === 0) return <Empty msg="Nessuna bozza in attesa" />;
      return bozze.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(bozze.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {c.cliente}</div>
            <div style={{ fontSize: 11, color: SUB }}>Da inviare</div>
          </div>
        </Row>
      ));
    }

    case "rilievi_da_confermare": {
      const r = cantieri.filter((c: any) =>
        (c?.fase === "rilievo" || c?.fase === "RILIEVO" || c?.fase === "sopralluogo") &&
        !c?.rilievoConfermato
      );
      if (r.length === 0) return <Empty msg="Nessun rilievo in attesa" />;
      return r.slice(0, 4).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(r.length, 4) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {c.cliente}</div>
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
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{c.code} · {c.cliente}</div>
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
        fasi[f].val += (c?.euro || c?.valore_totale || c?.totale || 0);
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
      const m = spese.filter((s: any) => (s?.data || s?.date || "").startsWith(mese));
      const tot = m.reduce((acc: number, s: any) => acc + (s?.importo || 0), 0);
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
      const pag = fattureDB.filter((f: any) => f?.pagata && (f?.data || "").startsWith(mese));
      const tot = pag.reduce((s: number, f: any) => s + (f?.importo || 0), 0);
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
      const att = fattureDB.filter((f: any) => !f?.pagata && f?.scadenza && f.scadenza >= td && f.scadenza <= d7);
      if (att.length === 0) return <Empty msg="Nessun pagamento atteso" />;
      const tot = att.reduce((s: number, f: any) => s + (f?.importo || 0), 0);
      return (
        <div onClick={() => nav?.goto?.("contabilita")} style={{ cursor: "pointer", padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, letterSpacing: "-0.5px" }}>€ {Math.round(tot).toLocaleString("it-IT")}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{att.length} fatture in arrivo entro 7gg</div>
        </div>
      );
    }

    case "margine_medio": {
      const chiuse = cantieri.filter((c: any) => c?.totale && c?.costoTotale);
      if (chiuse.length === 0) return <Empty msg="Dati margine non disponibili" />;
      const margini = chiuse.map((c: any) => ((c.totale - c.costoTotale) / c.totale) * 100);
      const avg = margini.reduce((s: number, m: number) => s + m, 0) / margini.length;
      return (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: DARK }}>{avg.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>Su {chiuse.length} commesse</div>
        </div>
      );
    }

    case "clienti_insolventi": {
      const scad = fattureDB.filter((f: any) => !f?.pagata && f?.scadenza && f.scadenza < td);
      const perCli: Record<string, { cli: string; count: number; tot: number }> = {};
      scad.forEach((f: any) => {
        const k = f?.cliente || f?.ragione_sociale || "—";
        if (!perCli[k]) perCli[k] = { cli: k, count: 0, tot: 0 };
        perCli[k].count += 1;
        perCli[k].tot += (f?.importo || 0);
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
      fattureDB.filter((f: any) => f?.pagata).forEach((f: any) => {
        const k = f?.cliente || f?.ragione_sociale || "—";
        if (!perCli[k]) perCli[k] = { cli: k, tot: 0 };
        perCli[k].tot += (f?.importo || 0);
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
        .filter((f: any) => f?.pagata && (f?.data || "") >= trimPrefix)
        .reduce((s: number, f: any) => s + (f?.importo || 0), 0);
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
