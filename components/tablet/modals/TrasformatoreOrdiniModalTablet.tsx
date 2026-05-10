"use client";
// MASTRO TABLET - Trasformatore Ordini Modal v1
// Wizard 4-step per generare ordini fornitori da una commessa esistente
// Riusa creaOrdiniSplitFornitori dal context MastroERP
import * as React from "react";
import { useMastro } from "../../MastroContext";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  navyTint: "#DBE6F1",
  red: "#991B1B",
  redTint: "#FEE2E2",
  green: "#065F46",
  greenTint: "#ECFDF5",
  amber: "#92400E",
  amberTint: "#FEF3C7",
  blue: "#3B7FE0",
  blueTint: "#DBEAFE",
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialCommessaId?: string;
  onCreated?: (ordiniIds: string[]) => void;
}

const CANALI_INVIO = [
  { value: "email", label: "Email", icon: "✉️" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "pdf", label: "Solo PDF", icon: "📄" },
];

type Step = 1 | 2 | 3 | 4;

export default function TrasformatoreOrdiniModalTablet({ open, onClose, initialCommessaId, onCreated }: Props) {
  const ctx = useMastro() as any;
  const cantieri = ctx?.cantieri || [];
  const creaOrdiniSplitFornitori = ctx?.creaOrdiniSplitFornitori;

  const [step, setStep] = React.useState<Step>(1);
  const [searchQ, setSearchQ] = React.useState("");
  const [commessaId, setCommessaId] = React.useState<string | null>(initialCommessaId || null);
  const [tipo, setTipo] = React.useState<"split" | "manual">("split");
  const [previewOrdini, setPreviewOrdini] = React.useState<any[]>([]);
  const [dataConsegna, setDataConsegna] = React.useState("");
  const [canaleInvio, setCanaleInvio] = React.useState("email");
  const [noteGenerali, setNoteGenerali] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep(initialCommessaId ? 2 : 1);
      setCommessaId(initialCommessaId || null);
      setTipo("split");
      setPreviewOrdini([]);
      setDataConsegna("");
      setCanaleInvio("email");
      setNoteGenerali("");
      setError(null);
      setSaving(false);
      setSearchQ("");
    }
  }, [open, initialCommessaId]);

  if (!open) return null;

  const commessa = cantieri.find((c: any) => c.id === commessaId);

  // Filtra commesse: solo attive con vani
  const commesseDisponibili = React.useMemo(() => {
    return cantieri.filter((c: any) => {
      if (c.deleted_at || c.archived_at) return false;
      const fasiOK = ["preventivo", "conferma_ordine", "confermata", "acconto_pagato", "ordine"];
      if (!fasiOK.includes(c.fase)) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const hay = `${c.cliente || ""} ${c.cognome || ""} ${c.code || ""} ${c.indirizzo || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cantieri, searchQ]);

  // Step 3: genera preview (no save)
  const generaPreview = () => {
    if (!commessa) return;
    // Simulazione preview: simulo split fornitori dai vani
    const vani = commessa.rilievi?.[commessa.rilievi.length - 1]?.vani || [];
    const fornitoriMap: Record<string, { fornitore: string; vani: any[]; totale: number }> = {};

    vani.forEach((v: any) => {
      const articoli = v.articoli || v.righe || [];
      articoli.forEach((a: any) => {
        const forn = a.fornitore || "Fornitore generico";
        if (!fornitoriMap[forn]) fornitoriMap[forn] = { fornitore: forn, vani: [], totale: 0 };
        fornitoriMap[forn].vani.push({ vano: v.nome, articolo: a.nome, qta: a.qta || 1, prezzo: a.prezzo || 0 });
        fornitoriMap[forn].totale += (a.qta || 1) * (a.prezzo || 0);
      });
    });

    let preview = Object.values(fornitoriMap);
    // Se nessun articolo nei vani, fallback: 1 ordine generico
    if (preview.length === 0) {
      preview = [{
        fornitore: "Fornitore da definire",
        vani: vani.map((v: any) => ({ vano: v.nome, articolo: "Da specificare", qta: 1, prezzo: 0 })),
        totale: 0,
      }];
    }
    setPreviewOrdini(preview);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!commessaId) { setError("Seleziona una commessa"); return; }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      setError(null);
      generaPreview();
      setStep(3);
    } else if (step === 3) {
      setError(null);
      setStep(4);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleConferma = async () => {
    if (!commessa) return;
    if (!creaOrdiniSplitFornitori) {
      setError("Funzione non disponibile");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const note = noteGenerali.trim();
      const noteWithDelivery = dataConsegna ? `${note}${note ? "\n" : ""}Consegna richiesta: ${new Date(dataConsegna).toLocaleDateString("it-IT")}` : note;
      const ordiniCreati = await creaOrdiniSplitFornitori(commessa, noteWithDelivery);
      const ids = (ordiniCreati || []).map((o: any) => o?.id).filter(Boolean);
      if (onCreated) onCreated(ids);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Errore creazione ordini");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 27, 45, 0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 9999, padding: 20, backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16, width: "100%", maxWidth: 680,
          marginTop: 20, marginBottom: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "18px 22px",
          background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
          color: "#fff",
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Trasformatore ordini
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, marginTop: 2 }}>
              {step === 1 && "Seleziona commessa"}
              {step === 2 && "Tipo ordine"}
              {step === 3 && "Anteprima ordini"}
              {step === 4 && "Consegna e invio"}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.12)", border: "none",
            cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#fff",
          }}>×</button>
        </div>

        {/* STEPPER */}
        <div style={{ padding: "14px 22px", background: C.cardSoft, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div style={{
                  flex: 1,
                  height: 6, borderRadius: 4,
                  background: step >= s ? C.navy : C.border,
                  transition: "background 0.2s",
                }} />
              </React.Fragment>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginTop: 8, letterSpacing: 0.4 }}>
            STEP {step} DI 4
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: 22, minHeight: 280 }}>
          {step === 1 && (
            <Step1
              search={searchQ}
              setSearch={setSearchQ}
              commesse={commesseDisponibili}
              selected={commessaId}
              onSelect={setCommessaId}
            />
          )}
          {step === 2 && commessa && (
            <Step2
              commessa={commessa}
              tipo={tipo}
              setTipo={setTipo}
            />
          )}
          {step === 3 && (
            <Step3 ordini={previewOrdini} commessa={commessa} />
          )}
          {step === 4 && (
            <Step4
              dataConsegna={dataConsegna}
              setDataConsegna={setDataConsegna}
              canaleInvio={canaleInvio}
              setCanaleInvio={setCanaleInvio}
              noteGenerali={noteGenerali}
              setNoteGenerali={setNoteGenerali}
              ordiniCount={previewOrdini.length}
            />
          )}

          {error && (
            <div style={{
              marginTop: 14,
              padding: "10px 14px", background: C.redTint,
              color: C.red, borderRadius: 10,
              fontSize: 13, fontWeight: 700,
            }}>⚠ {error}</div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 10, justifyContent: "space-between",
          background: C.cardSoft,
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          {step > 1 ? (
            <button onClick={handleBack} disabled={saving} style={{
              padding: "11px 18px", background: "transparent", color: C.sub,
              border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            }}>← Indietro</button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={(step === 1 && !commessaId) || saving}
              style={{
                padding: "11px 24px",
                background: ((step === 1 && !commessaId) || saving) ? C.subLight : C.navy,
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: ((step === 1 && !commessaId) || saving) ? "not-allowed" : "pointer",
                letterSpacing: 0.4,
                boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
              }}
            >Avanti →</button>
          ) : (
            <button
              onClick={handleConferma}
              disabled={saving || previewOrdini.length === 0}
              style={{
                padding: "11px 24px",
                background: (saving || previewOrdini.length === 0) ? C.subLight : C.green,
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 800, cursor: (saving || previewOrdini.length === 0) ? "not-allowed" : "pointer",
                letterSpacing: 0.4,
              }}
            >{saving ? "Creazione..." : `✓ Crea ${previewOrdini.length} ordini`}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ STEP 1: SELEZIONA COMMESSA ============
const Step1: React.FC<{
  search: string; setSearch: (s: string) => void;
  commesse: any[]; selected: string | null; onSelect: (id: string) => void;
}> = ({ search, setSearch, commesse, selected, onSelect }) => (
  <div>
    <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 14 }}>
      Scegli la commessa per cui generare gli ordini fornitore.
    </div>
    <div style={{
      background: C.cardSoft, borderRadius: 11, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.subLight} strokeWidth={2.5}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Cerca cliente, codice, indirizzo..."
        autoComplete="off"
        style={{
          flex: 1, border: "none", background: "transparent",
          fontSize: 14, fontWeight: 600, color: C.ink, outline: "none",
          fontFamily: "inherit", minWidth: 0,
        }}
      />
    </div>
    <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
      {commesse.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: C.sub, fontSize: 13, fontWeight: 600 }}>
          Nessuna commessa disponibile per ordini.<br/>
          <span style={{ fontSize: 11 }}>Le commesse devono essere in fase Preventivo, Conferma o Ordine.</span>
        </div>
      )}
      {commesse.map((c: any) => {
        const isSel = selected === c.id;
        const cliente = `${c.cliente || ""} ${c.cognome || ""}`.trim() || "Cliente n/d";
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: "12px 14px",
              background: isSel ? C.navyTint : C.cardSoft,
              border: `2px solid ${isSel ? C.navy : "transparent"}`,
              borderRadius: 11, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: isSel ? C.navy : C.subLight,
              color: "#fff", fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, letterSpacing: 0.3,
            }}>{c.code || "—"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {cliente}
              </div>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 2 }}>
                {c.indirizzo || "—"} · {c.fase || "—"}
              </div>
            </div>
            {isSel && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={3} strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ============ STEP 2: TIPO ORDINE ============
const Step2: React.FC<{ commessa: any; tipo: "split" | "manual"; setTipo: (t: "split" | "manual") => void; }> = ({ commessa, tipo, setTipo }) => {
  const cliente = `${commessa.cliente || ""} ${commessa.cognome || ""}`.trim() || "Cliente n/d";
  const vani = commessa.rilievi?.[commessa.rilievi.length - 1]?.vani || [];
  return (
    <div>
      <div style={{
        background: C.cardSoft, borderRadius: 11, padding: 14, marginBottom: 16,
        display: "flex", gap: 12, alignItems: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: C.navy,
          color: "#fff", fontSize: 11, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{commessa.code || "—"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{cliente}</div>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginTop: 2 }}>
            {vani.length} vani · {commessa.indirizzo || "—"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 14 }}>
        Come vuoi generare gli ordini fornitore?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <OptionCard
          active={tipo === "split"}
          onClick={() => setTipo("split")}
          icon="🔀"
          title="Split automatico per fornitore"
          desc="Raggruppa gli articoli per fornitore e crea un ordine separato per ognuno (consigliato)"
          recommended
        />
        <OptionCard
          active={tipo === "manual"}
          onClick={() => setTipo("manual")}
          icon="✋"
          title="Ordine singolo manuale"
          desc="Crea un solo ordine con tutti gli articoli, scegli tu il fornitore"
          disabled
        />
      </div>
    </div>
  );
};

const OptionCard: React.FC<{
  active: boolean; onClick: () => void;
  icon: string; title: string; desc: string;
  recommended?: boolean; disabled?: boolean;
}> = ({ active, onClick, icon, title, desc, recommended, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={{
      padding: 14, borderRadius: 12,
      background: disabled ? C.cardSoft : (active ? C.navyTint : C.cardSoft),
      border: `2px solid ${active ? C.navy : "transparent"}`,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}
  >
    <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{title}</div>
        {recommended && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
            background: C.greenTint, color: C.green, textTransform: "uppercase", letterSpacing: 0.5,
          }}>Consigliato</span>
        )}
        {disabled && (
          <span style={{
            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
            background: C.amberTint, color: C.amber, textTransform: "uppercase", letterSpacing: 0.5,
          }}>Presto</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, lineHeight: 1.4 }}>{desc}</div>
    </div>
    {active && !disabled && (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={3} strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

// ============ STEP 3: PREVIEW ============
const Step3: React.FC<{ ordini: any[]; commessa?: any }> = ({ ordini, commessa }) => {
  const totale = ordini.reduce((s, o) => s + (Number(o.totale) || 0), 0);
  return (
    <div>
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 14 }}>
        Verranno creati <strong style={{ color: C.ink }}>{ordini.length} ordini</strong> fornitore per un totale stimato di <strong style={{ color: C.ink }}>€{totale.toLocaleString("it-IT", { maximumFractionDigits: 2 })}</strong>
      </div>

      {ordini.length === 0 ? (
        <div style={{
          padding: 30, textAlign: "center",
          background: C.amberTint, color: C.amber,
          borderRadius: 11, fontSize: 13, fontWeight: 700,
        }}>
          ⚠ Nessun articolo trovato nei vani della commessa.<br/>
          <span style={{ fontWeight: 500, fontSize: 12 }}>Inserisci articoli nei vani prima di generare ordini.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto" }}>
          {ordini.map((o, idx) => (
            <div key={idx} style={{
              padding: 14, background: C.cardSoft, borderRadius: 11,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>
                  📦 {o.fornitore}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>
                  €{Number(o.totale || 0).toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>
                {o.vani.length} righe
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}`, display: "flex", flexDirection: "column", gap: 3 }}>
                {o.vani.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: C.sub, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                    <span>{r.vano} · {r.articolo}</span>
                    <span style={{ color: C.ink, fontWeight: 700 }}>{r.qta}× €{Number(r.prezzo).toFixed(2)}</span>
                  </div>
                ))}
                {o.vani.length > 5 && (
                  <div style={{ fontSize: 11, color: C.subLight, fontWeight: 600, fontStyle: "italic" }}>
                    + {o.vani.length - 5} altre righe...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ STEP 4: CONSEGNA + INVIO ============
const Step4: React.FC<{
  dataConsegna: string; setDataConsegna: (s: string) => void;
  canaleInvio: string; setCanaleInvio: (s: string) => void;
  noteGenerali: string; setNoteGenerali: (s: string) => void;
  ordiniCount: number;
}> = ({ dataConsegna, setDataConsegna, canaleInvio, setCanaleInvio, noteGenerali, setNoteGenerali, ordiniCount }) => (
  <div>
    <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 14 }}>
      Imposta consegna e canale di invio per i {ordiniCount} ordini.
    </div>

    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
        Data consegna richiesta
      </div>
      <input
        type="date"
        value={dataConsegna}
        onChange={(e) => setDataConsegna(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          background: C.cardSoft, border: `1px solid ${C.border}`,
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: C.ink, outline: "none", fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
    </div>

    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
        Canale di invio
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {CANALI_INVIO.map(c => (
          <div
            key={c.value}
            onClick={() => setCanaleInvio(c.value)}
            style={{
              flex: 1,
              padding: "12px 14px",
              background: canaleInvio === c.value ? C.navy : C.cardSoft,
              color: canaleInvio === c.value ? "#fff" : C.ink,
              borderRadius: 10, cursor: "pointer",
              fontSize: 13, fontWeight: 700, textAlign: "center",
              display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
            }}
          >
            <div style={{ fontSize: 22 }}>{c.icon}</div>
            <div>{c.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
        Note generali (opzionale)
      </div>
      <textarea
        value={noteGenerali}
        onChange={(e) => setNoteGenerali(e.target.value)}
        placeholder="Note che verranno aggiunte a tutti gli ordini..."
        rows={3}
        style={{
          width: "100%", padding: "10px 14px",
          background: C.cardSoft, border: `1px solid ${C.border}`,
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: C.ink, outline: "none", fontFamily: "inherit",
          boxSizing: "border-box", resize: "vertical", minHeight: 70,
        }}
      />
    </div>

    <div style={{
      padding: 14, background: C.greenTint, borderRadius: 11,
      borderLeft: `4px solid ${C.green}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.green, marginBottom: 4 }}>
        ✓ Pronto per la creazione
      </div>
      <div style={{ fontSize: 11, color: "#0F4435", fontWeight: 600, lineHeight: 1.4 }}>
        Clicca "Crea {ordiniCount} ordini" per salvare gli ordini in stato bozza.
        Potrai inviarli ai fornitori dalla sezione Ordini.
      </div>
    </div>
  </div>
);
