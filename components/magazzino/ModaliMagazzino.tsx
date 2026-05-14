"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ArticoloMagazzino } from "../../hooks/useMagazzinoTop";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// ============================================================
// SHELL: overlay full-screen modal
// ============================================================

interface ShellProps {
  title: string;
  kicker: string;
  onClose: () => void;
  children: React.ReactNode;
  ctaLabel?: string;
  ctaColor?: string;
  ctaDisabled?: boolean;
  onCta?: () => void;
  loading?: boolean;
  err?: string | null;
  ok?: string | null;
}

function ModalShell({ title, kicker, onClose, children, ctaLabel, ctaColor, ctaDisabled, onCta, loading, err, ok }: ShellProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "slideUp 0.25s ease-out",
      }}>
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
          color: "#fff", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
              {kicker}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <XIcon />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {err && <Banner kind="err">{err}</Banner>}
          {ok && <Banner kind="ok">{ok}</Banner>}
          {children}
        </div>
        {ctaLabel && (
          <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
            <button
              onClick={onCta}
              disabled={ctaDisabled || loading}
              style={{
                width: "100%", padding: 14,
                background: ctaDisabled || loading ? "#D8DEE5" : (ctaColor || `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`),
                color: "#fff", borderRadius: 11, fontSize: 13, fontWeight: 800,
                letterSpacing: 0.6, textTransform: "uppercase", border: "none",
                cursor: ctaDisabled || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Salvataggio..." : ctaLabel}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

function Banner({ kind, children }: { kind: "err" | "ok"; children: React.ReactNode }) {
  const cfg = kind === "err"
    ? { bg: "#FCE3E3", col: RED }
    : { bg: "#D5EBE0", col: GREEN };
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
      background: cfg.bg, color: cfg.col, marginBottom: 10,
      fontWeight: 700, borderLeft: `3px solid ${cfg.col}`,
    }}>{children}</div>
  );
}

// ============================================================
// 1) MODAL CARICO ARTICOLO
// ============================================================

interface ModalCaricoProps {
  mag: any;
  articolo: ArticoloMagazzino;
  onClose: () => void;
}

export function ModalCarico({ mag, articolo, onClose }: ModalCaricoProps) {
  const [qta, setQta] = useState<number>(1);
  const [prezzoUnit, setPrezzoUnit] = useState<string>(String(articolo.prezzo_acquisto || ""));
  const [ddt, setDdt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const conferma = async () => {
    if (qta <= 0) { setErr("Quantità deve essere > 0"); return; }
    setLoading(true); setErr(null);
    const r = await mag.carico(
      articolo.id, qta,
      prezzoUnit ? parseFloat(prezzoUnit) : undefined,
      ddt || undefined, undefined, note || undefined
    );
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore caricamento"); return; }
    setOk(`Caricati ${qta} ${articolo.unita_misura || "pz"} di ${articolo.nome}`);
    setTimeout(onClose, 1200);
  };

  return (
    <ModalShell
      kicker="CARICO MAGAZZINO" title={articolo.nome}
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel={`Conferma carico · +${qta}`} onCta={conferma}
    >
      <ArtPreview a={articolo} />
      <Field label="Quantità da caricare" required>
        <Stepper value={qta} onChange={setQta} />
      </Field>
      <Field label="Prezzo unitario (€)">
        <input type="number" inputMode="decimal" value={prezzoUnit} onChange={(e) => setPrezzoUnit(e.target.value)} placeholder="0.00" style={inputStyle} />
      </Field>
      <Field label="N° DDT fornitore">
        <input type="text" value={ddt} onChange={(e) => setDdt(e.target.value)} placeholder="es. 8721" style={inputStyle} />
      </Field>
      <Field label="Note">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. lotto B12, scaffale A-01..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <Recap rows={[
        ["Scorta attuale", `${articolo.scorta_attuale} ${articolo.unita_misura || "pz"}`],
        ["Dopo carico", <b key="d" style={{ color: GREEN }}>{articolo.scorta_attuale + qta} {articolo.unita_misura || "pz"}</b>],
        ["Valore aggiunto", `€ ${(qta * (parseFloat(prezzoUnit) || 0)).toFixed(2)}`],
      ]} />
    </ModalShell>
  );
}

// ============================================================
// 2) MODAL SCARICO PER COMMESSA
// ============================================================

export function ModalScarico({ mag, articolo, onClose }: ModalCaricoProps) {
  const [commesse, setCommesse] = useState<Array<{ id: string; code: string; cliente: string }>>([]);
  const [commessaId, setCommessaId] = useState("");
  const [qta, setQta] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("commesse")
        .select("id, code, cliente")
        .not("fase", "in", '("pagata","persa","annullata","chiusa")')
        .order("code", { ascending: false })
        .limit(50);
      setCommesse((data || []) as any);
    })();
  }, []);

  const conferma = async () => {
    if (!commessaId) { setErr("Scegli una commessa"); return; }
    if (qta <= 0) { setErr("Quantità deve essere > 0"); return; }
    if (qta > articolo.scorta_disponibile) {
      setErr(`Scorta insufficiente. Disponibile: ${articolo.scorta_disponibile}`);
      return;
    }
    setLoading(true); setErr(null);
    const r = await mag.scaricoCommessa(articolo.id, commessaId, qta, note || undefined);
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore scarico"); return; }
    setOk(`Scaricati ${qta} ${articolo.unita_misura || "pz"} su commessa`);
    setTimeout(onClose, 1200);
  };

  return (
    <ModalShell
      kicker="SCARICO PER COMMESSA" title={articolo.nome}
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel={`Conferma scarico · −${qta}`} ctaColor={`linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`}
      onCta={conferma} ctaDisabled={!commessaId || qta <= 0 || qta > articolo.scorta_disponibile}
    >
      <ArtPreview a={articolo} />
      <Field label="Commessa destinazione" required>
        <select value={commessaId} onChange={(e) => setCommessaId(e.target.value)} style={inputStyle}>
          <option value="">-- Scegli commessa --</option>
          {commesse.map(c => (
            <option key={c.id} value={c.id}>{c.code} · {c.cliente}</option>
          ))}
        </select>
      </Field>
      <Field label={`Quantità (max ${articolo.scorta_disponibile})`} required>
        <Stepper value={qta} onChange={setQta} max={articolo.scorta_disponibile} />
      </Field>
      <Field label="Note">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. consegna cantiere..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <Recap rows={[
        ["Scorta attuale", `${articolo.scorta_attuale}`],
        ["Riservata", `${articolo.scorta_riservata}`],
        ["Disponibile", <b key="d" style={{ color: GREEN }}>{articolo.scorta_disponibile}</b>],
        ["Dopo scarico", <b key="da" style={{ color: TEAL }}>{articolo.scorta_attuale - qta} {articolo.unita_misura || "pz"}</b>],
      ]} />
    </ModalShell>
  );
}

// ============================================================
// 3) MODAL RETTIFICA INVENTARIO
// ============================================================

export function ModalRettifica({ mag, articolo, onClose }: ModalCaricoProps) {
  const [scortaReale, setScortaReale] = useState<number>(articolo.scorta_attuale);
  const [note, setNote] = useState("Conta fisica");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const delta = scortaReale - articolo.scorta_attuale;
  const deltaColor = delta > 0 ? GREEN : delta < 0 ? RED : MUTED;

  const conferma = async () => {
    if (scortaReale < 0) { setErr("Scorta non può essere negativa"); return; }
    if (!note.trim()) { setErr("Inserisci una causale"); return; }
    setLoading(true); setErr(null);
    const r = await mag.rettifica(articolo.id, scortaReale, note);
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore rettifica"); return; }
    setOk(`Scorta aggiornata a ${scortaReale} ${articolo.unita_misura || "pz"}`);
    setTimeout(onClose, 1200);
  };

  return (
    <ModalShell
      kicker="RETTIFICA INVENTARIO" title={articolo.nome}
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel="Conferma rettifica" ctaColor={`linear-gradient(180deg, ${AMBER}, #8B6926)`}
      onCta={conferma} ctaDisabled={delta === 0 || !note.trim()}
    >
      <ArtPreview a={articolo} />
      <Field label="Scorta reale contata" required>
        <Stepper value={scortaReale} onChange={setScortaReale} min={0} />
      </Field>
      <Field label="Causale" required>
        <select value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle}>
          <option>Conta fisica</option>
          <option>Mancanza (CR-MAN)</option>
          <option>Calo tecnico (CR-CAL)</option>
          <option>Eccedenza (CR-ECC)</option>
          <option>Errore di inserimento</option>
          <option>Furto/danno</option>
          <option>Resa fornitore</option>
        </select>
      </Field>
      <Recap rows={[
        ["Sistema", `${articolo.scorta_attuale}`],
        ["Conta reale", `${scortaReale}`],
        ["Differenza", <b key="d" style={{ color: deltaColor, fontSize: 15 }}>{delta > 0 ? "+" : ""}{delta} {articolo.unita_misura || "pz"}</b>],
        ["Impatto €", <span key="e" style={{ color: deltaColor, fontWeight: 800 }}>{(delta * (articolo.prezzo_acquisto || 0)).toFixed(2)}</span>],
      ]} />
    </ModalShell>
  );
}

// ============================================================
// 4) MODAL NUOVO ARTICOLO
// ============================================================

interface ModalNuovoProps {
  mag: any;
  aziendaId: string;
  onClose: () => void;
}

export function ModalNuovoArticolo({ mag, aziendaId, onClose }: ModalNuovoProps) {
  const [codice, setCodice] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [unita, setUnita] = useState("pz");
  const [prezzoAcq, setPrezzoAcq] = useState("");
  const [scortaMin, setScortaMin] = useState("0");
  const [scortaIniz, setScortaIniz] = useState("0");
  const [scaffale, setScaffale] = useState("");
  const [fornitori, setFornitori] = useState<Array<{ id: string; nome: string }>>([]);
  const [fornitoreId, setFornitoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("fornitori").select("id, nome").eq("azienda_id", aziendaId).order("nome").then(({ data }) => {
      setFornitori((data || []) as any);
    });
  }, [aziendaId]);

  const conferma = async () => {
    if (!codice.trim() || !nome.trim()) { setErr("Codice e nome obbligatori"); return; }
    setLoading(true); setErr(null);
    const { data, error } = await supabase.from("articoli_magazzino").insert({
      azienda_id: aziendaId,
      codice: codice.trim(),
      nome: nome.trim(),
      tipo: tipo || null,
      unita_misura: unita,
      prezzo_acquisto: prezzoAcq ? parseFloat(prezzoAcq) : null,
      scorta_minima: parseFloat(scortaMin) || 0,
      scorta_attuale: parseFloat(scortaIniz) || 0,
      posizione_magazzino: scaffale || null,
      fornitore_id: fornitoreId || null,
      attivo: true,
    }).select("id").single();
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(`Articolo ${codice} creato`);
    await mag.reload();
    setTimeout(onClose, 1200);
  };

  return (
    <ModalShell
      kicker="NUOVO ARTICOLO" title="Aggiungi a magazzino"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel="Crea articolo" onCta={conferma}
      ctaDisabled={!codice.trim() || !nome.trim()}
    >
      <Field label="Codice articolo" required>
        <input value={codice} onChange={(e) => setCodice(e.target.value.toUpperCase())} placeholder="es. FER-CER-MAICO-RC2" style={inputStyle} />
      </Field>
      <Field label="Nome / descrizione" required>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="es. Cerniera Maico RC2" style={inputStyle} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Field label="Tipo / categoria">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
            <option value="">--</option>
            <option>profilo</option><option>vetro</option><option>ferramenta</option>
            <option>guarnizione</option><option>sigillante</option><option>accessorio</option>
            <option>tapparella</option><option>zanzariera</option><option>persiana</option>
          </select>
        </Field>
        <Field label="UM">
          <select value={unita} onChange={(e) => setUnita(e.target.value)} style={inputStyle}>
            <option>pz</option><option>ml</option><option>mq</option><option>kg</option><option>cad</option>
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Field label="Prezzo €"><input type="number" value={prezzoAcq} onChange={(e) => setPrezzoAcq(e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
        <Field label="Scorta min"><input type="number" value={scortaMin} onChange={(e) => setScortaMin(e.target.value)} style={inputStyle} /></Field>
        <Field label="Scorta iniz."><input type="number" value={scortaIniz} onChange={(e) => setScortaIniz(e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Fornitore">
        <select value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)} style={inputStyle}>
          <option value="">--</option>
          {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </Field>
      <Field label="Posizione scaffale">
        <input value={scaffale} onChange={(e) => setScaffale(e.target.value)} placeholder="es. A-01" style={inputStyle} />
      </Field>
    </ModalShell>
  );
}

// ============================================================
// 5) MODAL NUOVO RESO CLIENTE
// ============================================================

interface ModalResoProps {
  mag: any;
  aziendaId: string;
  onClose: () => void;
  articolo?: ArticoloMagazzino;
}

export function ModalNuovoReso({ mag, aziendaId, onClose, articolo }: ModalResoProps) {
  const [commesse, setCommesse] = useState<Array<{ id: string; code: string; cliente: string }>>([]);
  const [commessaId, setCommessaId] = useState("");
  const [articoloId, setArticoloId] = useState(articolo?.id || "");
  const [qta, setQta] = useState(1);
  const [motivo, setMotivo] = useState("Difetto fabbrica");
  const [fonte, setFonte] = useState("whatsapp");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("commesse").select("id, code, cliente")
      .order("code", { ascending: false }).limit(50)
      .then(({ data }) => setCommesse((data || []) as any));
  }, []);

  const conferma = async () => {
    if (!commessaId || !articoloId) { setErr("Commessa e articolo obbligatori"); return; }
    setLoading(true); setErr(null);
    const r = await mag.resoCrea(commessaId, articoloId, qta, motivo, fonte);
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore creazione reso"); return; }
    setOk("Reso registrato");
    setTimeout(onClose, 1200);
  };

  return (
    <ModalShell
      kicker="NUOVO RESO CLIENTE" title="Segnalazione reso"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel="Crea reso" ctaColor={`linear-gradient(180deg, #5C2D8C, #3D1E5E)`}
      onCta={conferma} ctaDisabled={!commessaId || !articoloId}
    >
      <Field label="Commessa originale" required>
        <select value={commessaId} onChange={(e) => setCommessaId(e.target.value)} style={inputStyle}>
          <option value="">-- Scegli commessa --</option>
          {commesse.map(c => <option key={c.id} value={c.id}>{c.code} · {c.cliente}</option>)}
        </select>
      </Field>
      <Field label="Articolo reso" required>
        <select value={articoloId} onChange={(e) => setArticoloId(e.target.value)} style={inputStyle}>
          <option value="">-- Scegli --</option>
          {mag.articoli.map((a: ArticoloMagazzino) => (
            <option key={a.id} value={a.id}>{a.codice} · {a.nome}</option>
          ))}
        </select>
      </Field>
      <Field label="Quantità" required>
        <Stepper value={qta} onChange={setQta} />
      </Field>
      <Field label="Motivo" required>
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)} style={inputStyle}>
          <option>Difetto fabbrica</option>
          <option>Misura sbagliata</option>
          <option>Colore errato</option>
          <option>Danneggiato in trasporto</option>
          <option>Cliente cambia idea</option>
          <option>Sostituzione in garanzia</option>
        </select>
      </Field>
      <Field label="Canale segnalazione">
        <select value={fonte} onChange={(e) => setFonte(e.target.value)} style={inputStyle}>
          <option value="whatsapp">WhatsApp</option>
          <option value="portale">Portale cliente</option>
          <option value="telefono">Telefono</option>
          <option value="email">Email</option>
          <option value="altro">Altro</option>
        </select>
      </Field>
    </ModalShell>
  );
}

// ============================================================
// 6) MODAL CREA ORDINE SINGOLO (da articolo sotto-minimo)
// ============================================================

interface ModalCreaOrdineProps {
  mag: any;
  aziendaId: string;
  articolo: ArticoloMagazzino;
  onClose: () => void;
}

export function ModalCreaOrdine({ mag, aziendaId, articolo, onClose }: ModalCreaOrdineProps) {
  const sugQta = Math.max(articolo.scorta_minima * 2 - articolo.scorta_attuale, 1);
  const [qta, setQta] = useState<number>(Math.round(sugQta * 1.3));
  const [consegnaPrevista, setConsegnaPrevista] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + (articolo.lead_time_giorni || 7));
    return d.toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const prezzoUnit = articolo.prezzo_acquisto || 0;
  const totale = qta * prezzoUnit;

  const conferma = async () => {
    if (!articolo.fornitore_id) {
      setErr("Articolo senza fornitore assegnato. Modificalo prima.");
      return;
    }
    if (qta <= 0) { setErr("Quantità deve essere > 0"); return; }
    setLoading(true); setErr(null);

    const righe = [{
      articolo_id: articolo.id,
      codice: articolo.codice,
      nome: articolo.nome,
      quantita: qta,
      unita_misura: articolo.unita_misura,
      prezzo_unitario: prezzoUnit,
      subtotale: totale,
    }];

    const { data, error } = await supabase.from("ordini_fornitore").insert({
      azienda_id: aziendaId,
      fornitore_id: articolo.fornitore_id,
      fornitore_nome: articolo.fornitore_nome,
      data_ordine: new Date().toISOString().split("T")[0],
      consegna_prevista: consegnaPrevista,
      stato: "da_inviare",
      righe,
      totale_euro: totale,
      note,
    }).select("id").single();

    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(`Ordine #${data?.id?.slice(0, 8)} creato`);
    setTimeout(onClose, 1500);
  };

  return (
    <ModalShell
      kicker="ORDINE SINGOLO" title="Crea ordine fornitore"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel={`Crea ordine · € ${totale.toFixed(2)}`} onCta={conferma}
      ctaDisabled={qta <= 0}
    >
      <ArtPreview a={articolo} />
      {!articolo.fornitore_id && (
        <Banner kind="err">Articolo senza fornitore. Modifica prima dell'ordine.</Banner>
      )}
      {articolo.fornitore_nome && (
        <div style={{
          background: "#FBF0DC", borderLeft: `3px solid ${AMBER}`,
          padding: "9px 11px", borderRadius: 8, marginBottom: 10, fontSize: 11.5,
          color: "#8B6926", fontWeight: 700,
        }}>
          Fornitore: <b>{articolo.fornitore_nome}</b>
        </div>
      )}
      <Field label="Quantità da ordinare" required>
        <Stepper value={qta} onChange={setQta} />
      </Field>
      <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, marginTop: -4, marginBottom: 10 }}>
        AI suggerisce: <b>{Math.round(sugQta * 1.3)} {articolo.unita_misura || "pz"}</b> (scorta min × 2 + 30%)
      </div>
      <Field label="Consegna prevista">
        <input type="date" value={consegnaPrevista} onChange={(e) => setConsegnaPrevista(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Note ordine">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. urgente cantiere Greco..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>
      <Recap rows={[
        ["Prezzo unitario", `€ ${prezzoUnit.toFixed(2)}`],
        ["Quantità", `${qta} ${articolo.unita_misura || "pz"}`],
        ["Totale ordine", <b key="t" style={{ color: TEAL, fontSize: 16 }}>€ {totale.toFixed(2)}</b>],
      ]} />
    </ModalShell>
  );
}

// ============================================================
// COMPONENTI CONDIVISI
// ============================================================

function ArtPreview({ a }: { a: ArticoloMagazzino }) {
  return (
    <div style={{
      display: "flex", gap: 10, padding: "10px 12px",
      background: "#fff", borderRadius: 10, marginBottom: 12,
      border: "1px solid #E5EAF0",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 7, background: "#F1F4F7",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#8794A6",
      }}><FrameIcon size={22} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "#8794A6", fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{a.codice}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
          Disp. <b style={{ color: NAVY }}>{a.scorta_disponibile}</b> · min {a.scorta_minima}
          {a.scaffale_codice && <> · {a.scaffale_codice}</>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: NAVY,
        letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5,
      }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "#fff", borderRadius: 9, padding: 4,
      border: "1px solid #D8DEE5",
    }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={stpBtn}>−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value) || 0;
          if (max !== undefined && v > max) return onChange(max);
          if (v < min) return onChange(min);
          onChange(v);
        }}
        style={{
          flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: NAVY,
          border: "none", outline: "none", background: "transparent", padding: "6px 0",
          MozAppearance: "textfield" as any,
        }}
      />
      <button onClick={() => max !== undefined ? onChange(Math.min(max, value + 1)) : onChange(value + 1)} style={stpBtn}>+</button>
    </div>
  );
}

function Recap({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: 11,
      border: "1px solid #E5EAF0", marginTop: 5,
    }}>
      {rows.map(([k, v], i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 0",
          borderBottom: i < rows.length - 1 ? "1px solid #F1F4F7" : "none",
          fontSize: 11.5,
        }}>
          <span style={{ color: MUTED, fontWeight: 600 }}>{k}</span>
          <span style={{ color: NAVY, fontWeight: 700 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #D8DEE5", borderRadius: 8,
  fontSize: 13, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff",
  fontFamily: "inherit",
};

const stpBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 7,
  background: NAVY, color: "#fff",
  fontSize: 20, fontWeight: 800,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer", flexShrink: 0,
};

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FrameIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
);
