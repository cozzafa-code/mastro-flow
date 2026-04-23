"use client";
// @ts-nocheck
// MASTRO ERP - HomePanel MOBILE - fliwoX Widget Home v5 (drag+add+apri)
import React from "react";
import { useMastro } from "./MastroContext";

const ALL_WIDGETS: any[] = [
  { id: "oggi",     label: "Oggi devi fare",  bg: "#B5B0E8", fg: "#26215C" },
  { id: "corso",    label: "In corso",        bg: "#F5C4B3", fg: "#4A1B0C" },
  { id: "fatt",     label: "Fatturato",       bg: "#9FE1CB", fg: "#04342C" },
  { id: "pipeline", label: "Pipeline",        bg: "#B5D4F4", fg: "#042C53" },
  { id: "recenti",  label: "Lavori recenti",  bg: "#FFFFFF", fg: "#1A1A1A" },
  { id: "agenda",   label: "Agenda oggi",     bg: "#F4C0D1", fg: "#4B1528" },
  { id: "azioni",   label: "Azioni rapide",   bg: "#FAC775", fg: "#412402" },
];
const DEFAULT_LAYOUT = ["oggi", "corso", "fatt", "pipeline", "recenti", "azioni"];

export default function HomePanelMobile(props: any) {
  const mastro: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const user = props?.user || mastro?.user || {};
  const commesse: any[] = props?.commesse || mastro?.commesse || mastro?.cantieri || [];
  const onNavigate = props?.onNavigate || mastro?.onNavigate || (() => {});
  const onApriCommessa = props?.onApriCommessa || mastro?.onApriCommessa || ((id: string) => onNavigate?.("commesse"));

  // Layout persistito in localStorage
  const [layout, setLayout] = React.useState<string[]>(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("mastro_home_layout_v1");
      if (saved) setLayout(JSON.parse(saved));
    } catch {}
  }, []);
  const saveLayout = (next: string[]) => {
    setLayout(next);
    try { localStorage.setItem("mastro_home_layout_v1", JSON.stringify(next)); } catch {}
  };

  // Drag handlers
  const dragIdRef = React.useRef<string | null>(null);
  const onDragStart = (id: string) => (e: any) => {
    if (!editMode) return;
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (id: string) => (e: any) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (targetId: string) => (e: any) => {
    if (!editMode) return;
    e.preventDefault();
    const src = dragIdRef.current;
    if (!src || src === targetId) return;
    const next = [...layout];
    const si = next.indexOf(src);
    const ti = next.indexOf(targetId);
    if (si < 0 || ti < 0) return;
    next.splice(si, 1);
    next.splice(ti, 0, src);
    saveLayout(next);
    dragIdRef.current = null;
  };
  const removeWidget = (id: string) => saveLayout(layout.filter(x => x !== id));
  const addWidget = (id: string) => {
    if (!layout.includes(id)) saveLayout([...layout, id]);
    setShowAdd(false);
  };

  const now = React.useMemo(() => new Date(), []);
  const greeting = React.useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "BUONGIORNO";
    if (h < 18) return "BUON POMERIGGIO";
    return "BUONASERA";
  }, [now]);
  const dataLunga = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const nome = (user?.nome || user?.email?.split("@")[0] || "FABIO").toString().toUpperCase();
  const iniziali = nome.slice(0, 2);

  const commesseAttive = (commesse || []).filter((c: any) => c?.stato !== "archiviata" && c?.stato !== "fatturata");
  const recenti = (commesseAttive || []).slice(0, 3);
  const taskOggi = recenti.length;
  const totMese = (commesseAttive || []).reduce((s: number, c: any) => s + Number(c?.totale || c?.importo || 0), 0);
  const totMeseK = totMese >= 1000 ? `€${(totMese / 1000).toFixed(1)}k` : `€${Math.round(totMese)}`;

  const faseColors: any = {
    Sopralluogo: { bg: "#EEEDFE", fg: "#3C3489" },
    Preventivo:  { bg: "#E1F5EE", fg: "#0F6E56" },
    Conferma:    { bg: "#FAEEDA", fg: "#854F0B" },
    Produzione:  { bg: "#B5D4F4", fg: "#185FA5" },
    Montaggio:   { bg: "#F4C0D1", fg: "#993556" },
    Fattura:     { bg: "#C0DD97", fg: "#3B6D11" },
  };
  const faseCol = (f: string) => faseColors[f] || { bg: "#F0EDE5", fg: "#666" };

  // === Widget renderers ===
  const W: any = {};

  W.oggi = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#B5B0E8", borderRadius: 20, padding: "14px 16px", position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="oggi" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#3C3489", fontWeight: 500, letterSpacing: 0.3 }}>OGGI DEVI FARE</div>
          <div style={{ fontSize: 16, color: "#26215C", fontWeight: 600, marginTop: 3 }}>{taskOggi} task urgenti</div>
          <div style={{ fontSize: 10, color: "#3C3489", marginTop: 2 }}>Sopralluogo · Firma · Fattura</div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 50, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26215C" strokeWidth={2.5}><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
        </div>
      </div>
    </div>
  );

  W.corso = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#F5C4B3", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="corso" fg="#712B13" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#712B13", fontWeight: 500, letterSpacing: 0.3 }}>IN CORSO</div>
      <div style={{ fontSize: 28, color: "#4A1B0C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{commesseAttive.length}</div>
      <div style={{ fontSize: 10, color: "#712B13", marginTop: 4 }}>commesse attive</div>
    </div>
  );

  W.fatt = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#9FE1CB", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="fatt" fg="#085041" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#085041", fontWeight: 500, letterSpacing: 0.3 }}>FATTURATO</div>
      <div style={{ fontSize: 28, color: "#04342C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{totMeseK}</div>
      <div style={{ fontSize: 10, color: "#085041", marginTop: 4 }}>questo mese</div>
    </div>
  );

  W.pipeline = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#B5D4F4", borderRadius: 20, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="pipeline" fg="#0C447C" onRemove={removeWidget} />}
      <div style={{ fontSize: 11, color: "#185FA5", fontWeight: 500, letterSpacing: 0.3 }}>PIPELINE</div>
      <div style={{ fontSize: 14, color: "#042C53", fontWeight: 600, marginTop: 2, marginBottom: 10 }}>Distribuzione per fase</div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 40, marginBottom: 8 }}>
        {[40, 70, 100, 55, 30].map((h, i) => (
          <div key={i} style={{ flex: 1, background: "#378ADD", height: `${h}%`, borderRadius: 4 }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#0C447C", fontWeight: 500 }}>
        <span>Sopr.</span><span>Prev.</span><span>Prod.</span><span>Mont.</span><span>Fatt.</span>
      </div>
    </div>
  );

  W.recenti = () => (
    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 14, position: "relative" }}>
      {editMode && <RemoveBtn id="recenti" fg="#888" onRemove={removeWidget} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Lavori recenti</div>
        <div style={{ fontSize: 10, color: "#28A0A0", fontWeight: 500, cursor: "pointer" }} onClick={() => !editMode && onNavigate?.("commesse")}>Vedi tutti</div>
      </div>
      {recenti.length === 0 && (
        <div style={{ fontSize: 11, color: "#888", textAlign: "center", padding: "14px 0" }}>Nessuna commessa attiva</div>
      )}
      {recenti.map((c: any, idx: number) => {
        const fase = c?.fase_corrente || c?.stato || "Sopralluogo";
        const col = faseCol(fase);
        const imp = Number(c?.totale || c?.importo || 0);
        const impLabel = imp >= 1000 ? `€${(imp / 1000).toFixed(1)}k` : `€${Math.round(imp)}`;
        return (
          <div key={c?.id || idx} onClick={() => !editMode && onApriCommessa?.(c?.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: idx < recenti.length - 1 ? "1px solid #F0EDE5" : "none", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: col.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col.fg} strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#1A1A1A", fontWeight: 600 }}>{c?.codice || c?.code || `S-00${64 + idx}`} · {c?.cliente_nome || c?.cliente || "Cliente"}</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{fase}</div>
            </div>
            <div style={{ fontSize: 11, color: "#1A1A1A", fontWeight: 600 }}>{impLabel}</div>
          </div>
        );
      })}
    </div>
  );

  W.agenda = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#F4C0D1", borderRadius: 20, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="agenda" fg="#72243E" onRemove={removeWidget} />}
      <div style={{ fontSize: 11, color: "#993556", fontWeight: 500, letterSpacing: 0.3 }}>AGENDA OGGI</div>
      <div style={{ fontSize: 14, color: "#4B1528", fontWeight: 600, marginTop: 2, marginBottom: 10 }}>2 appuntamenti</div>
      <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 12, padding: "8px 10px", marginBottom: 5, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#4B1528", fontWeight: 600, minWidth: 38 }}>15:30</div>
        <div style={{ fontSize: 11, color: "#4B1528" }}>Sopralluogo S-0064</div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 12, padding: "8px 10px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#4B1528", fontWeight: 600, minWidth: 38 }}>17:00</div>
        <div style={{ fontSize: 11, color: "#4B1528" }}>Montaggio S-0061</div>
      </div>
    </div>
  );

  W.azioni = () => (
    <div style={{ background: "#FAC775", borderRadius: 20, padding: 14, position: "relative" }}>
      {editMode && <RemoveBtn id="azioni" fg="#633806" onRemove={removeWidget} />}
      <div style={{ fontSize: 11, color: "#854F0B", fontWeight: 500, letterSpacing: 0.3, marginBottom: 10 }}>AZIONI RAPIDE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={() => onNavigate?.("nuova-commessa")} style={QBTN}><PlusIco /> Nuova commessa</button>
        <button onClick={() => onNavigate?.("commesse")} style={QBTN}><DocIco /> Preventivo</button>
        <button onClick={() => onNavigate?.("contabilita")} style={QBTN}><MailIco /> Fattura</button>
        <button onClick={() => onNavigate?.("clienti")} style={QBTN}><UserIco /> Cliente</button>
      </div>
    </div>
  );

  // wrapper con drag
  const renderWidget = (id: string) => {
    const render = W[id];
    if (!render) return null;
    // Doppia-colonna per metriche piccole
    if (id === "corso" || id === "fatt") {
      return (
        <div key={id} draggable={editMode} onDragStart={onDragStart(id)} onDragOver={onDragOver(id)} onDrop={onDrop(id)} style={{ opacity: editMode ? 0.95 : 1 }}>
          {render()}
        </div>
      );
    }
    return (
      <div key={id} draggable={editMode} onDragStart={onDragStart(id)} onDragOver={onDragOver(id)} onDrop={onDrop(id)} style={{ marginBottom: 10, opacity: editMode ? 0.95 : 1 }}>
        {render()}
      </div>
    );
  };

  // Raggruppa corso+fatt in una griglia
  const renderOrder = () => {
    const blocks: any[] = [];
    let i = 0;
    while (i < layout.length) {
      const id = layout[i];
      if (id === "corso" && layout[i + 1] === "fatt") {
        blocks.push(
          <div key="pair-corso-fatt" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {renderWidget("corso")}
            {renderWidget("fatt")}
          </div>
        );
        i += 2;
      } else {
        blocks.push(renderWidget(id));
        i += 1;
      }
    }
    return blocks;
  };

  const availableToAdd = ALL_WIDGETS.filter(w => !layout.includes(w.id));

  return (
    <div style={{ background: "#F4F1EA", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: 100 }}>
      <div style={{ background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)", padding: "18px 16px 22px", borderRadius: "0 0 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={3}><path d="M18 6L6 18M6 6l12 12" /></svg>
            </div>
            <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 500 }}>fliwoX</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: 50, background: "#FFB84D" }} />
            <div style={{ width: 6, height: 6, borderRadius: 50, background: "#7FD97F" }} />
            <div style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#28A0A0", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{iniziali}</div>
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
        <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
          <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>I miei widget</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowAdd(true)} style={{ background: "#FFFFFF", border: "1px solid #E0DCD0", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              Aggiungi
            </button>
            <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? "#1E8080" : "#28A0A0", border: "none", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#FFF", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
              {editMode ? "Fine" : "Modifica"}
            </button>
          </div>
        </div>

        {editMode && (
          <div style={{ background: "#FFF7E0", border: "1px dashed #FAC775", borderRadius: 12, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#854F0B" }}>
            Trascina i widget per riordinare · Tocca la X per rimuovere
          </div>
        )}

        {renderOrder()}
      </div>

      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", width: "100%", borderRadius: "20px 20px 0 0", padding: 16, maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>Aggiungi widget</div>
            {availableToAdd.length === 0 && <div style={{ fontSize: 12, color: "#888", padding: 16, textAlign: "center" }}>Tutti i widget sono già aggiunti.</div>}
            {availableToAdd.map(w => (
              <div key={w.id} onClick={() => addWidget(w.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 6, background: w.bg, cursor: "pointer" }}>
                <div style={{ flex: 1, fontSize: 13, color: w.fg, fontWeight: 600 }}>{w.label}</div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={w.fg} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              </div>
            ))}
            <button onClick={() => setShowAdd(false)} style={{ width: "100%", background: "#F0EDE5", border: "none", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 8, cursor: "pointer" }}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}

const QBTN: any = { background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" };

const RemoveBtn = ({ id, fg, onRemove }: any) => (
  <div onClick={(e) => { e.stopPropagation(); onRemove(id); }} style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 50, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth={3}><path d="M18 6L6 18M6 6l12 12" /></svg>
  </div>
);

const PlusIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>;
const DocIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
const MailIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>;
const UserIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>;
