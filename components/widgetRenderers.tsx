"use client";
import React from "react";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS v2 - Palette mockup v3 scelta da Fabio
// ═══════════════════════════════════════════════════════════
const DARK = "#0D1F1F";
const INK = "#0F2525";
const SUB = "#5A7878";
const MUTED = "#8FA8A8";
const BORDER = "rgba(200,228,228,0.5)";
const BORDER_SOFT = "rgba(200,228,228,0.3)";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const TEAL_BRIGHT = "#5FD0D0";

// Colori fase (mockup v3)
const FASE: any = {
  sopralluogo:  { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)" },
  rilievo:      { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)" },
  preventivo:   { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", solid: "#1D9E75", dark: "#04342C", tint: "rgba(29,158,117,0.12)", bg: "rgba(29,158,117,0.08)" },
  conferma:     { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  ordini:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  ordine:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  produzione:   { grad: "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)", solid: "#378ADD", dark: "#042C53", tint: "rgba(55,138,221,0.12)", bg: "rgba(55,138,221,0.08)" },
  posa:         { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  montaggio:    { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  collaudo:     { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  consegna:     { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", bg: "rgba(99,153,34,0.1)" },
  fattura:      { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", bg: "rgba(99,153,34,0.1)" },
  chiusura:     { grad: "linear-gradient(155deg, #888780 0%, #5F5E5A 100%)", solid: "#5F5E5A", dark: "#2C2C2A", tint: "rgba(95,94,90,0.14)", bg: "rgba(95,94,90,0.1)" },
  ferma:        { grad: "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)", solid: "#E24B4A", dark: "#8B1A1A", tint: "rgba(226,75,74,0.14)", bg: "rgba(226,75,74,0.1)" },
};

const getFase = (f: string): any => {
  if (!f) return FASE.sopralluogo;
  const k = f.toLowerCase();
  if (k.includes("ferma")) return FASE.ferma;
  if (k.includes("rilievo") || k.includes("sopral")) return FASE.sopralluogo;
  if (k.includes("preventivo")) return FASE.preventivo;
  if (k.includes("conferma") || k.includes("ordin")) return FASE.ordini;
  if (k.includes("produzione")) return FASE.produzione;
  if (k.includes("posa") || k.includes("montag") || k.includes("collaudo")) return FASE.posa;
  if (k.includes("fattur") || k.includes("saldo") || k.includes("consegn")) return FASE.fattura;
  if (k.includes("chius") || k.includes("archivi")) return FASE.chiusura;
  return FASE.sopralluogo;
};

// ═══════════════════════════════════════════════════════════
// Elementi base
// ═══════════════════════════════════════════════════════════
const Empty = ({ msg, icon }: { msg: string; icon?: string }) => (
  <div style={{
    display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
    padding: "24px 16px", gap: 8,
  }}>
    {icon && <div style={{ fontSize: 32, opacity: 0.4 }}>{icon}</div>}
    <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", fontWeight: 600, letterSpacing: "0.2px" }}>{msg}</p>
  </div>
);

const AvatarColored = ({ text, fase, size = 36, urgent }: { text: string; fase?: string; size?: number; urgent?: boolean }) => {
  const f = urgent ? FASE.ferma : getFase(fase || "");
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: f.grad,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 900, color: "#fff",
      boxShadow: "0 3px 8px rgba(13,31,31,0.18), inset 0 1px 1px rgba(255,255,255,0.25)",
      letterSpacing: "-0.2px",
      textShadow: "0 1px 2px rgba(0,0,0,0.15)",
    }}>{text}</div>
  );
};

const PillFase = ({ fase, small }: { fase: string; small?: boolean }) => {
  const f = getFase(fase);
  const testo = fase ? fase.charAt(0).toUpperCase() + fase.slice(1) : "—";
  return (
    <span style={{
      fontSize: small ? 9 : 10, fontWeight: 900,
      padding: small ? "2px 7px" : "3px 9px",
      borderRadius: 7,
      background: f.tint, color: f.dark,
      letterSpacing: "0.3px", textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const, flexShrink: 0,
    }}>{testo}</span>
  );
};

// ═══════════════════════════════════════════════════════════
// Utility data
// ═══════════════════════════════════════════════════════════
const today = () => new Date().toISOString().slice(0, 10);
const daysSince = (date: any): number => {
  if (!date || date === 0 || date === "0") return 0;
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  if (d.getTime() < 1577836800000) return 0;
  const diff = Date.now() - d.getTime();
  const gg = Math.floor(diff / 86400000);
  return gg < 0 ? 0 : gg;
};
const eur = (n: number): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n)}`;
};
const eurFull = (n: number): string => {
  if (!n || n <= 0) return "€0";
  return "€" + Math.round(n).toLocaleString("it-IT");
};
const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") return obj[k];
  }
  return null;
};
const valoreCM = (c: any): number => Number(pick(c, "totale_finale", "totale_preventivo", "euro", "totale", "valore_totale")) || 0;
const clienteCM = (c: any): string => {
  const nome = pick(c, "cliente", "cliente_nome");
  const cognome = pick(c, "cognome");
  if (nome && cognome) return `${nome} ${cognome}`;
  return nome || cognome || "—";
};
const initials = (s: string): string => {
  if (!s) return "—";
  const parts = s.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || s[0]?.toUpperCase() || "—";
};
const lastCMActivity = (c: any): any => pick(c, "ops_ultimo_avanzamento", "fase_start", "updated_at", "aggiornato", "created_at", "creato");
const fattPagata = (f: any): boolean => {
  if (f?.pagata === true) return true;
  if (f?.stato === "pagata" || f?.stato === "paid") return true;
  const residuo = Number(f?.residuo);
  if (!isNaN(residuo) && residuo === 0 && Number(f?.totale) > 0) return true;
  return false;
};
const fattImporto = (f: any): number => Number(pick(f, "totale", "importo")) || 0;
const fattScadenza = (f: any): string | null => pick(f, "data_scadenza", "scadenza");
const fattCliente = (f: any): string => pick(f, "cliente", "ragione_sociale") || "—";

// ═══════════════════════════════════════════════════════════
// RENDER ENTRY
// ═══════════════════════════════════════════════════════════
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
      cantieri.filter((c: any) => c?.ferma === true && c?.ferma_dal).forEach((c: any) => {
        const gg = daysSince(c.ferma_dal);
        if (gg > 0) actions.push({
          titolo: `Sblocca ${c.code}`,
          sub: `${clienteCM(c)} · ferma da ${gg}gg`,
          fase: "ferma", urgent: true,
          onClick: () => nav?.openCM?.(c),
        });
      });
      cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return f === "preventivo" && c?.updated_at && daysSince(c.updated_at) > 5;
      }).forEach((c: any) => {
        actions.push({
          titolo: `Sollecita preventivo`,
          sub: `${c.code} · ${clienteCM(c)}`,
          fase: "preventivo",
          onClick: () => nav?.openCM?.(c),
        });
      });
      fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td)).forEach((f: any) => {
        actions.push({
          titolo: `Incassa ${eur(fattImporto(f))}`,
          sub: `${fattCliente(f)} · scaduta`,
          fase: "ferma", urgent: true,
          onClick: () => nav?.openFatt?.(f),
        });
      });

      if (actions.length === 0) return <Empty msg="Tutto sotto controllo" icon="✓" />;

      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {actions.slice(0, 5).map((a, i) => {
            const f = getFase(a.fase);
            return (
              <div key={i} onClick={a.onClick} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff",
                borderRadius: 10,
                borderLeft: `3px solid ${f.solid}`,
                boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: f.solid,
                  boxShadow: `0 0 0 3px ${f.tint}`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titolo}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.sub}</div>
                </div>
                <span style={{ color: f.solid, fontSize: 18, fontWeight: 900 }}>›</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "squadra": {
      if (team.length === 0) return <Empty msg="Nessun membro in squadra" icon="👷" />;
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {team.slice(0, 6).map((t: any, i: number) => {
            const nome = pick(t, "nome", "name") || "—";
            const ruolo = pick(t, "ruolo", "role") || "";
            const cantiere = pick(t, "cantiere_attuale", "cantiere");
            const stato = cantiere ? "in cantiere" : "libero";
            const col = cantiere ? FASE.produzione : FASE.preventivo;
            return (
              <div key={t.id || i} onClick={() => nav?.openTeam?.(t)} style={{
                background: "#fff", borderRadius: 12, padding: "10px 11px",
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${col.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AvatarColored text={initials(nome)} fase={cantiere ? "produzione" : "preventivo"} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</div>
                    <div style={{ fontSize: 9, color: SUB, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.3px" }}>{ruolo}</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 7, fontSize: 9, fontWeight: 800,
                  padding: "2px 7px", borderRadius: 6,
                  background: col.tint, color: col.dark,
                  display: "inline-block",
                  letterSpacing: "0.3px", textTransform: "uppercase" as const,
                }}>● {stato}</div>
              </div>
            );
          })}
        </div>
      );
    }

    case "produzione": {
      const inprod = cantieri.filter((c: any) => (c?.fase || "").toLowerCase().includes("produzione"));
      if (inprod.length === 0) return <Empty msg="Nessuna commessa in produzione" icon="🏭" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {inprod.slice(0, 5).map((c: any, i: number) => {
            const vani = c?.vani?.length || 0;
            const valore = valoreCM(c);
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                borderLeft: `3px solid ${FASE.produzione.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
              }}>
                <AvatarColored text={initials(clienteCM(c))} fase="produzione" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600, marginTop: 2 }}>{vani} van{vani === 1 ? "o" : "i"} · {eur(valore)}</div>
                </div>
                <span style={{ color: FASE.produzione.solid, fontSize: 16, fontWeight: 900 }}>›</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "fatture_incassare": {
      const da = fattureDB.filter((f: any) => !fattPagata(f));
      if (da.length === 0) return <Empty msg="Tutto incassato" icon="✓" />;
      const totale = da.reduce((s: number, f: any) => s + fattImporto(f), 0);
      return (
        <>
          <div style={{
            background: FASE.fattura.grad,
            borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            color: "#fff",
            boxShadow: `0 4px 12px ${FASE.fattura.tint}`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Da incassare</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(totale)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{da.length} fattur{da.length === 1 ? "a" : "e"} aperte</div>
          </div>
          {da.slice(0, 3).map((f: any, i: number) => {
            const scad = fattScadenza(f);
            const scaduta = scad && new Date(scad) < new Date(td);
            const ff = scaduta ? FASE.ferma : FASE.fattura;
            return (
              <div key={f.id || i} onClick={() => nav?.openFatt?.(f)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderBottom: i < Math.min(da.length, 3) - 1 ? "1px solid " + BORDER_SOFT : "none",
                cursor: "pointer",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ff.solid, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK }}>{fattCliente(f)}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>{scad ? (scaduta ? "scaduta" : "scade " + scad) : ""}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: ff.dark }}>{eur(fattImporto(f))}</div>
              </div>
            );
          })}
        </>
      );
    }

    case "fatture_scadute": {
      const sc = fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td));
      if (sc.length === 0) return <Empty msg="Nessuna fattura scaduta" icon="✓" />;
      const totale = sc.reduce((s: number, f: any) => s + fattImporto(f), 0);
      return (
        <>
          <div style={{
            background: FASE.ferma.grad,
            borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            color: "#fff",
            boxShadow: `0 4px 12px ${FASE.ferma.tint}`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>⚠ Scadute</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(totale)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{sc.length} da recuperare</div>
          </div>
          {sc.slice(0, 3).map((f: any, i: number) => {
            const scad = fattScadenza(f);
            const gg = scad ? daysSince(scad) : 0;
            return (
              <div key={f.id || i} onClick={() => nav?.openFatt?.(f)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderBottom: i < Math.min(sc.length, 3) - 1 ? "1px solid " + BORDER_SOFT : "none",
                cursor: "pointer",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK }}>{fattCliente(f)}</div>
                  <div style={{ fontSize: 10, color: FASE.ferma.dark, fontWeight: 700 }}>{gg} gg in ritardo</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: FASE.ferma.dark }}>{eur(fattImporto(f))}</div>
              </div>
            );
          })}
        </>
      );
    }

    case "eventi_oggi": {
      const oggi = events.filter((e: any) => {
        const d = pick(e, "data", "date");
        const st = e?.start_time;
        const done = e?.completato || e?.annullato;
        return !done && (d === td || (st || "").startsWith(td));
      });
      if (oggi.length === 0) return <Empty msg="Nessun evento oggi" icon="📅" />;
      oggi.sort((a: any, b: any) => {
        const ta = pick(a, "ora", "time") || (a?.start_time || "").slice(11, 16) || "99:99";
        const tb = pick(b, "ora", "time") || (b?.start_time || "").slice(11, 16) || "99:99";
        return ta.localeCompare(tb);
      });
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {oggi.slice(0, 5).map((e: any, i: number) => {
            const ora = pick(e, "ora", "time") || (e?.start_time || "").slice(11, 16) || "—";
            const tipo = (pick(e, "tipo", "event_type", "type") || "").toLowerCase();
            const titolo = pick(e, "titolo", "title", "text");
            const persona = pick(e, "persona", "client_name", "cliente");
            const addr = pick(e, "indirizzo", "address", "addr");
            const f = getFase(tipo);
            return (
              <div key={e.id || i} onClick={() => nav?.openEvent?.(e)} style={{
                display: "flex", alignItems: "stretch", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 12,
                border: "1px solid " + BORDER_SOFT,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
              }}>
                <div style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
                  width: 52, flexShrink: 0,
                  background: f.tint,
                  borderRadius: 10,
                  padding: "4px 0",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: f.dark, letterSpacing: "-0.3px" }}>{ora}</div>
                  {tipo && <div style={{ fontSize: 8, fontWeight: 800, color: f.dark, marginTop: 2, letterSpacing: "0.3px", textTransform: "uppercase" as const, opacity: 0.85 }}>{tipo.slice(0, 7)}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {titolo || persona || "Evento"}
                  </div>
                  {(addr || persona) && (
                    <div style={{ fontSize: 10, color: SUB, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {addr || persona || ""}
                    </div>
                  )}
                </div>
                <span style={{ color: MUTED, fontSize: 16, fontWeight: 900, alignSelf: "center" }}>›</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "messaggi_non_letti": {
      const nuovi = msgs.filter((m: any) => !m?.letto && !m?.read);
      if (nuovi.length === 0) return <Empty msg="Nessun messaggio nuovo" icon="💬" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {nuovi.slice(0, 4).map((m: any, i: number) => {
            const mittente = pick(m, "da", "mittente", "sender") || "—";
            return (
              <div key={m.id || i} onClick={() => nav?.openMsg?.(m)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${TEAL}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
              }}>
                <AvatarColored text={initials(mittente)} fase="preventivo" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{mittente}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {pick(m, "text", "anteprima", "contenuto") || ""}
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: TEAL_BRIGHT,
                  boxShadow: `0 0 0 3px rgba(40,160,160,0.2)`,
                  flexShrink: 0,
                }} />
              </div>
            );
          })}
        </div>
      );
    }

    case "commesse_ritardo": {
      const r = cantieri.filter((c: any) => c?.ferma === true && c?.ferma_dal);
      if (r.length === 0) return <Empty msg="Tutto in orario" icon="✓" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {r.slice(0, 4).map((c: any, i: number) => {
            const gg = daysSince(c.ferma_dal);
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: FASE.ferma.grad,
                borderRadius: 12,
                cursor: "pointer",
                color: "#fff",
                boxShadow: `0 4px 10px rgba(226,75,74,0.25)`,
              }}>
                <AvatarColored text={initials(clienteCM(c))} urgent size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{c.code} · {clienteCM(c)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginTop: 1 }}>
                    {c?.motivo_ferma || "ferma"} · {gg} gg
                  </div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6,
                  background: "rgba(255,255,255,0.95)", color: FASE.ferma.dark,
                  letterSpacing: "0.4px", textTransform: "uppercase" as const, flexShrink: 0,
                }}>FERMA</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "lavori_in_corso": {
      const a = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return c?.fase && !f.includes("chius") && !f.includes("consegn") && !f.includes("archivi");
      });
      if (a.length === 0) return <Empty msg="Nessun lavoro attivo" icon="🔨" />;
      a.sort((x: any, y: any) => daysSince(lastCMActivity(y)) - daysSince(lastCMActivity(x)));
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {a.slice(0, 5).map((c: any, i: number) => {
            const fase = c.fase || "—";
            const f = getFase(fase);
            const cliente = clienteCM(c);
            const valore = valoreCM(c);
            const gg = daysSince(lastCMActivity(c));
            const fermo = c?.ferma === true || gg >= 7;
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${f.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              }}>
                <AvatarColored text={initials(cliente)} fase={fase} size={32} urgent={fermo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.code} · {cliente}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <PillFase fase={fase} small />
                    {valore > 0 && <span style={{ fontSize: 10, color: SUB, fontWeight: 700 }}>· {eur(valore)}</span>}
                    {fermo && <span style={{ fontSize: 9, color: FASE.ferma.dark, fontWeight: 900, letterSpacing: "0.3px" }}>· FERMA</span>}
                  </div>
                </div>
                <span style={{ color: f.solid, fontSize: 16, fontWeight: 900 }}>›</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "preventivi_scadenza": {
      const prev = cantieri.filter((c: any) => (c?.fase || "").toLowerCase() === "preventivo");
      if (prev.length === 0) return <Empty msg="Nessun preventivo aperto" icon="📄" />;
      prev.sort((a: any, b: any) => daysSince(a.updated_at) - daysSince(b.updated_at));
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {prev.slice(0, 5).map((c: any, i: number) => {
            const gg = daysSince(c.updated_at || c.created_at);
            const urg = gg > 5;
            const f = urg ? FASE.ferma : FASE.preventivo;
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${f.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              }}>
                <AvatarColored text={initials(clienteCM(c))} fase="preventivo" size={32} urgent={urg} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                  <div style={{ fontSize: 10, color: urg ? FASE.ferma.dark : SUB, fontWeight: 700, marginTop: 1 }}>
                    {gg} gg senza firma {urg && "· SOLLECITA"}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: f.dark }}>{eur(valoreCM(c))}</div>
              </div>
            );
          })}
        </div>
      );
    }

    case "preventivi_da_inviare": {
      const da = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return (f === "rilievo" || f === "sopralluogo") && (c?.rilievo_completato || c?.rilievo_confermato);
      });
      if (da.length === 0) return <Empty msg="Nessun preventivo pronto" icon="📋" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {da.slice(0, 5).map((c: any, i: number) => (
            <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${FASE.sopralluogo.solid}`,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <AvatarColored text={initials(clienteCM(c))} fase="sopralluogo" size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                <div style={{ fontSize: 10, color: SUB, fontWeight: 700, marginTop: 1 }}>{c?.vani?.length || 0} vani misurati</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 900, padding: "4px 9px", borderRadius: 7,
                background: FASE.sopralluogo.grad, color: "#fff",
                letterSpacing: "0.3px", textTransform: "uppercase" as const,
                boxShadow: "0 2px 4px rgba(127,119,221,0.3)",
              }}>Genera</span>
            </div>
          ))}
        </div>
      );
    }

    case "rilievi_da_confermare": {
      const r = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return f === "rilievo" || f === "sopralluogo";
      });
      if (r.length === 0) return <Empty msg="Nessun rilievo aperto" icon="📐" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {r.slice(0, 5).map((c: any, i: number) => {
            const vani = c?.vani?.length || 0;
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${FASE.sopralluogo.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              }}>
                <AvatarColored text={initials(clienteCM(c))} fase="sopralluogo" size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 700, marginTop: 1 }}>{vani} van{vani === 1 ? "o" : "i"} · {c?.indirizzo || "—"}</div>
                </div>
                <span style={{ color: FASE.sopralluogo.solid, fontSize: 16, fontWeight: 900 }}>›</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "prossime_consegne": {
      const c5 = [...cantieri]
        .filter((c: any) => c?.data_consegna)
        .sort((a: any, b: any) => (a.data_consegna || "").localeCompare(b.data_consegna || ""))
        .filter((c: any) => c.data_consegna >= td);
      if (c5.length === 0) return <Empty msg="Nessuna consegna programmata" icon="🚚" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {c5.slice(0, 5).map((c: any, i: number) => {
            const gg = Math.max(0, Math.floor((new Date(c.data_consegna).getTime() - Date.now()) / 86400000));
            const urg = gg <= 2;
            const f = urg ? FASE.ferma : FASE.consegna;
            return (
              <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                background: "#fff", borderRadius: 10,
                border: "1px solid " + BORDER_SOFT,
                borderLeft: `3px solid ${f.solid}`,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: f.tint, display: "flex", flexDirection: "column" as const,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: f.dark, letterSpacing: "-0.3px" }}>{gg}</div>
                  <div style={{ fontSize: 7, fontWeight: 800, color: f.dark, letterSpacing: "0.3px", textTransform: "uppercase" as const }}>GG</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                  <div style={{ fontSize: 10, color: urg ? FASE.ferma.dark : SUB, fontWeight: 700, marginTop: 1 }}>{c.data_consegna}{urg && " · URGENTE"}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case "pipeline_commesse": {
      const fasi = [
        { k: "sopralluogo", l: "Sopral." },
        { k: "preventivo", l: "Prev." },
        { k: "ordini", l: "Ordine" },
        { k: "produzione", l: "Prod." },
        { k: "posa", l: "Posa" },
        { k: "fattura", l: "Fatt." },
      ];
      const counts = fasi.map(f => {
        const n = cantieri.filter((c: any) => {
          const cf = (c?.fase || "").toLowerCase();
          if (f.k === "sopralluogo") return cf.includes("sopral") || cf.includes("rilievo");
          if (f.k === "ordini") return cf.includes("ordin") || cf.includes("conferma");
          if (f.k === "posa") return cf.includes("posa") || cf.includes("montag") || cf.includes("collaudo");
          if (f.k === "fattura") return cf.includes("fattur") || cf.includes("saldo") || cf.includes("consegn");
          return cf.includes(f.k);
        }).length;
        return { ...f, n, fase: getFase(f.k) };
      });
      const maxN = Math.max(...counts.map(x => x.n), 1);
      return (
        <div>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 4,
            height: 90, padding: "4px 2px 0",
          }}>
            {counts.map((c) => {
              const h = Math.max(8, (c.n / maxN) * 80);
              return (
                <div key={c.k} onClick={() => nav?.openCommesseFase?.(c.k)} style={{
                  flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center",
                  cursor: "pointer",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: c.fase.dark, marginBottom: 3 }}>{c.n}</div>
                  <div style={{
                    width: "100%",
                    height: h,
                    background: c.fase.grad,
                    borderRadius: "6px 6px 2px 2px",
                    boxShadow: `0 2px 6px ${c.fase.tint}, inset 0 1px 1px rgba(255,255,255,0.25)`,
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {counts.map(c => (
              <div key={c.k} style={{
                flex: 1, textAlign: "center" as const,
                fontSize: 9, fontWeight: 800, color: c.fase.dark,
                letterSpacing: "0.2px",
              }}>{c.l}</div>
            ))}
          </div>
        </div>
      );
    }

    case "ordini_attesa": {
      const ord = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return f === "conferma ordine" || f === "ordini" || f === "ordine";
      });
      if (ord.length === 0) return <Empty msg="Nessun ordine in attesa" icon="📦" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {ord.slice(0, 5).map((c: any, i: number) => (
            <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${FASE.ordini.solid}`,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <AvatarColored text={initials(clienteCM(c))} fase="ordini" size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{c.code} · {clienteCM(c)}</div>
                <div style={{ fontSize: 10, color: SUB, fontWeight: 700, marginTop: 1 }}>{c?.vani?.length || 0} vani · {eur(valoreCM(c))}</div>
              </div>
              <PillFase fase="ordini" small />
            </div>
          ))}
        </div>
      );
    }

    case "ordini_settimana": {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const ord = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        const d = pick(c, "ordine_conferma_data", "data_ordine", "updated_at");
        return (f.includes("ordin") || f.includes("produzione")) && d && d >= weekAgo;
      });
      if (ord.length === 0) return <Empty msg="Nessun ordine questa settimana" icon="📆" />;
      const tot = ord.reduce((s: number, c: any) => s + valoreCM(c), 0);
      return (
        <>
          <div style={{
            background: FASE.ordini.grad,
            borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            color: "#fff",
            boxShadow: `0 4px 12px ${FASE.ordini.tint}`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Settimana</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(tot)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{ord.length} ordini</div>
          </div>
          {ord.slice(0, 3).map((c: any, i: number) => (
            <div key={c.id || i} onClick={() => nav?.openCM?.(c)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px",
              borderBottom: i < Math.min(ord.length, 3) - 1 ? "1px solid " + BORDER_SOFT : "none",
              cursor: "pointer",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: INK }}>{c.code} · {clienteCM(c)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: FASE.ordini.dark }}>{eur(valoreCM(c))}</div>
            </div>
          ))}
        </>
      );
    }

    case "spese_mese": {
      const spese = data?.spese || [];
      const mese = td.slice(0, 7);
      const del_mese = spese.filter((s: any) => {
        const d = pick(s, "data", "date");
        return d && d.startsWith(mese);
      });
      const tot = del_mese.reduce((s: number, sp: any) => s + Number(pick(sp, "importo", "totale") || 0), 0);
      return (
        <>
          <div style={{
            background: FASE.chiusura.grad,
            borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            color: "#fff",
            boxShadow: `0 4px 12px ${FASE.chiusura.tint}`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Spese mese</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(tot)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{del_mese.length} spese</div>
          </div>
          {del_mese.length === 0 && <Empty msg="Nessuna spesa questo mese" icon="💸" />}
        </>
      );
    }

    case "fatturato_mese": {
      const mese = td.slice(0, 7);
      const tot = fattureDB
        .filter((f: any) => fattPagata(f) && (pick(f, "data_emissione", "data") || "").startsWith(mese))
        .reduce((s: number, f: any) => s + fattImporto(f), 0);
      const daInc = fattureDB
        .filter((f: any) => !fattPagata(f) && (pick(f, "data_emissione", "data") || "").startsWith(mese))
        .reduce((s: number, f: any) => s + fattImporto(f), 0);
      return (
        <div style={{
          background: FASE.fattura.grad,
          borderRadius: 12, padding: "12px 14px",
          color: "#fff",
          boxShadow: `0 4px 12px ${FASE.fattura.tint}`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Fatturato mese</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.6px", marginTop: 3, textShadow: "0 2px 3px rgba(0,0,0,0.15)" }}>{eurFull(tot)}</div>
          <div style={{
            marginTop: 10, padding: "7px 10px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9 }}>Da incassare</span>
            <span style={{ fontSize: 12, fontWeight: 900 }}>{eurFull(daInc)}</span>
          </div>
        </div>
      );
    }

    case "pagamenti_arrivo": {
      const prossimi = fattureDB
        .filter((f: any) => !fattPagata(f) && fattScadenza(f))
        .sort((a: any, b: any) => (fattScadenza(a) || "").localeCompare(fattScadenza(b) || ""))
        .filter((f: any) => fattScadenza(f)! >= td);
      if (prossimi.length === 0) return <Empty msg="Nessun incasso in arrivo" icon="💰" />;
      const tot = prossimi.reduce((s: number, f: any) => s + fattImporto(f), 0);
      return (
        <>
          <div style={{
            background: FASE.preventivo.grad,
            borderRadius: 12, padding: "10px 12px", marginBottom: 8,
            color: "#fff",
            boxShadow: `0 4px 12px ${FASE.preventivo.tint}`,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>In arrivo</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(tot)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{prossimi.length} pagamenti attesi</div>
          </div>
          {prossimi.slice(0, 3).map((f: any, i: number) => {
            const gg = Math.floor((new Date(fattScadenza(f)!).getTime() - Date.now()) / 86400000);
            return (
              <div key={f.id || i} onClick={() => nav?.openFatt?.(f)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderBottom: i < Math.min(prossimi.length, 3) - 1 ? "1px solid " + BORDER_SOFT : "none",
                cursor: "pointer",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: INK }}>{fattCliente(f)}</div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>tra {gg} gg</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: FASE.preventivo.dark }}>{eur(fattImporto(f))}</div>
              </div>
            );
          })}
        </>
      );
    }

    case "margine_medio": {
      const ff = fattureDB.filter((f: any) => fattPagata(f));
      const totFatt = ff.reduce((s: number, f: any) => s + fattImporto(f), 0);
      const spese = data?.spese || [];
      const totSpese = spese.reduce((s: number, sp: any) => s + Number(pick(sp, "importo", "totale") || 0), 0);
      const margine = totFatt - totSpese;
      const pct = totFatt > 0 ? Math.round((margine / totFatt) * 100) : 0;
      const good = pct >= 30;
      const f = good ? FASE.preventivo : pct >= 15 ? FASE.ordini : FASE.ferma;
      return (
        <div style={{
          background: f.grad,
          borderRadius: 14, padding: "14px 16px",
          color: "#fff",
          boxShadow: `0 6px 18px ${f.tint}`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>Margine medio</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.8px", marginTop: 4, textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>{pct}%</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.8, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>Fatt.</div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{eurFull(totFatt)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.8, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>Margine</div>
              <div style={{ fontSize: 13, fontWeight: 900 }}>{eurFull(margine)}</div>
            </div>
          </div>
        </div>
      );
    }

    case "clienti_insolventi": {
      const scad = fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td));
      const byCliente = new Map<string, { nome: string; tot: number; gg: number; count: number }>();
      scad.forEach((f: any) => {
        const k = fattCliente(f);
        const gg = daysSince(fattScadenza(f));
        const cur = byCliente.get(k) || { nome: k, tot: 0, gg: 0, count: 0 };
        cur.tot += fattImporto(f);
        cur.gg = Math.max(cur.gg, gg);
        cur.count += 1;
        byCliente.set(k, cur);
      });
      const arr = [...byCliente.values()].sort((a, b) => b.tot - a.tot);
      if (arr.length === 0) return <Empty msg="Nessun cliente insolvente" icon="✓" />;
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {arr.slice(0, 4).map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${FASE.ferma.solid}`,
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <AvatarColored text={initials(c.nome)} urgent size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</div>
                <div style={{ fontSize: 10, color: FASE.ferma.dark, fontWeight: 700, marginTop: 1 }}>{c.count} fatt · {c.gg} gg</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: FASE.ferma.dark }}>{eur(c.tot)}</div>
            </div>
          ))}
        </div>
      );
    }

    case "top_clienti": {
      const byCliente = new Map<string, { nome: string; tot: number; count: number }>();
      fattureDB.filter((f: any) => fattPagata(f)).forEach((f: any) => {
        const k = fattCliente(f);
        const cur = byCliente.get(k) || { nome: k, tot: 0, count: 0 };
        cur.tot += fattImporto(f);
        cur.count += 1;
        byCliente.set(k, cur);
      });
      const arr = [...byCliente.values()].sort((a, b) => b.tot - a.tot);
      if (arr.length === 0) return <Empty msg="Nessun cliente pagante" icon="🏆" />;
      const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {arr.slice(0, 5).map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${i < 3 ? medals[i] : FASE.fattura.solid}`,
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 13,
                background: i < 3 ? medals[i] : FASE.chiusura.tint,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900, color: i < 3 ? "#fff" : SUB,
                flexShrink: 0,
                boxShadow: i < 3 ? `0 2px 6px ${medals[i]}60` : "none",
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</div>
                <div style={{ fontSize: 10, color: SUB, fontWeight: 700, marginTop: 1 }}>{c.count} fatt</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: FASE.fattura.dark }}>{eur(c.tot)}</div>
            </div>
          ))}
        </div>
      );
    }

    case "iva_versare": {
      const trim = Math.floor((new Date().getMonth()) / 3) + 1;
      const meseNum = parseInt(td.split("-")[1]);
      const trimStart = Math.floor((meseNum - 1) / 3) * 3 + 1;
      const trimPrefix = td.slice(0, 4) + "-" + String(trimStart).padStart(2, "0");
      const ivaFatture = fattureDB
        .filter((f: any) => (pick(f, "data_emissione", "data") || "") >= trimPrefix)
        .reduce((s: number, f: any) => s + (fattImporto(f) * 0.22 / 1.22), 0);
      return (
        <div style={{
          background: FASE.conferma.grad,
          borderRadius: 14, padding: "14px 16px",
          color: "#fff",
          boxShadow: `0 6px 18px ${FASE.conferma.tint}`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>IVA Trim. {trim}</div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.7px", marginTop: 3, textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>{eurFull(ivaFatture)}</div>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 2 }}>da versare</div>
        </div>
      );
    }

    default:
      return <Empty msg={`Widget "${id}" in arrivo`} icon="⚡" />;
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

// Alias per retrocompatibilita' con HomeWidgetsDynamic.tsx che importa renderWidgetBody
const renderWidgetBody = safeRender;

export default safeRender;
export { safeRender, renderWidgetBody };
