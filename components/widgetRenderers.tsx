"use client";
import React from "react";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const AMBER = "#F5A030";
const RED = "#DC4444";
const GREEN = "#1A9E73";

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
      const urg = tasks.filter((t: any) => !t?.done && (t?.prio === "alta" || t?.urgent));
      if (urg.length === 0) return <Empty msg="Nessuna azione urgente" />;
      return urg.slice(0, 4).map((t: any, i: number) => (
        <Row key={t.id || i} last={i === Math.min(urg.length, 4) - 1} onClick={() => nav?.openTask?.(t)}>
          <div style={{ width: 22, height: 22, borderRadius: 7, border: "1.5px solid #BDE0E0", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title || t.text || "Task"}</div>
            <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{t.cm || t.meta || ""}</div>
          </div>
          {t.urgent && <Badge text="ORA" bg={AMBER} fg="#fff" />}
        </Row>
      ));
    }
    case "squadra": {
      if (team.length === 0) return <Empty msg="Nessun operatore configurato" />;
      const attivi = team.filter((m: any) => m?.attivo || m?.inCantiere);
      if (attivi.length === 0) return <Empty msg="Nessun operatore in cantiere" />;
      return attivi.slice(0, 5).map((m: any, i: number) => (
        <Row key={m.id || i} last={i === Math.min(attivi.length, 5) - 1} onClick={() => nav?.goto?.("team")}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.colore || TEAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            {(m.nome || "?").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{m.nome}</div>
            <div style={{ fontSize: 11, color: SUB }}>{m.ruolo || "Operatore"}</div>
          </div>
          <Badge text="ATTIVO" bg={GREEN + "20"} fg={GREEN} />
        </Row>
      ));
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
      const oggi = events.filter((e: any) => e?.date === td);
      if (oggi.length === 0) return <Empty msg="Nessun evento oggi" />;
      return oggi.slice(0, 5).map((e: any, i: number) => (
        <Row key={e.id || i} last={i === Math.min(oggi.length, 5) - 1} onClick={() => nav?.openEvent?.(e)}>
          <div style={{ fontSize: 11, fontWeight: 800, color: TEAL_DARK, width: 44, flexShrink: 0 }}>{e.time || "—"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text || e.titolo}</div>
            <div style={{ fontSize: 11, color: SUB }}>{e.persona || e.addr || ""}</div>
          </div>
        </Row>
      ));
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
      const a = cantieri.filter((c: any) => c?.fase && c.fase !== "chiusura" && c.fase !== "consegnato");
      if (a.length === 0) return <Empty msg="Nessun lavoro attivo" />;
      return a.slice(0, 5).map((c: any, i: number) => (
        <Row key={c.id || i} last={i === Math.min(a.length, 5) - 1} onClick={() => nav?.openCM?.(c)}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.code} · {c.cliente}</div>
            <div style={{ fontSize: 11, color: SUB }}>{c.fase}</div>
          </div>
        </Row>
      ));
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
