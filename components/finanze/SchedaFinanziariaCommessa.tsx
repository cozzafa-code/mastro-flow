// components/finanze/SchedaFinanziariaCommessa.tsx
"use client";
import React, { useState, useMemo } from "react";

type FatturaTipo = "acconto" | "sal" | "saldo" | "unica";
type StatoFattura = "pagata" | "scaduta" | "in_scadenza" | "da_emettere" | "emessa";

interface Fattura {
  id: string;
  numero: string | number;
  anno: number;
  data: string;
  dataISO?: string;
  tipo: FatturaTipo;
  cmId: string;
  importo: number;
  pagata: boolean;
  dataPagamento?: string | null;
  metodoPagamento?: string;
  scadenza?: string;
  note?: string;
}

interface Props {
  commessa: any; // selectedCM
  totaleCommessa: number; // calcolato dall'host
  fatture: Fattura[]; // gia' filtrate per cmId
  onCreaFattura: (tipo: FatturaTipo, importo: number, scadenza: string, note: string) => Promise<any> | any;
  aziendaInfo?: any;
  onMarcaPagata: (fatturaId: string, metodoPag: string) => void;
  onGeneraPDF?: (fattura: Fattura) => void;
  onSollecitaWhatsApp?: (fattura: Fattura) => void;
  onAnnullaFattura?: (fatturaId: string) => void;
  fmtEur?: (n: number) => string;
}

const T = {
  card: "#FFFFFF",
  bdr: "#E4F2F2",
  bg: "#F5F8F8",
  text: "#0D1F1F",
  sub: "#71717A",
  acc: "#28A0A0",
  green: "#15803D",
  amber: "#D97706",
  red: "#DC2626",
  blue: "#2563EB",
  gray: "#A1A1AA",
};

const TIPO_LABEL: Record<FatturaTipo, string> = {
  acconto: "ACCONTO",
  sal: "SAL",
  saldo: "SALDO",
  unica: "UNICA",
};

const STATO_COLORS: Record<StatoFattura, { bg: string; tx: string; lbl: string }> = {
  pagata:       { bg: "#DCFCE7", tx: "#15803D", lbl: "PAGATA" },
  scaduta:      { bg: "#FEE2E2", tx: "#DC2626", lbl: "SCADUTA" },
  in_scadenza:  { bg: "#FEF3C7", tx: "#D97706", lbl: "IN SCADENZA" },
  emessa:       { bg: "#DBEAFE", tx: "#2563EB", lbl: "EMESSA" },
  da_emettere:  { bg: "#F4F4F5", tx: "#71717A", lbl: "DA EMETTERE" },
};

function diffDays(from: string, to: string): number {
  try {
    const a = new Date(from + (from.length === 10 ? "T00:00:00" : ""));
    const b = new Date(to + (to.length === 10 ? "T00:00:00" : ""));
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  } catch { return 0; }
}

function statoOf(f: Fattura): StatoFattura {
  if (f.pagata) return "pagata";
  if (!f.scadenza) return "emessa";
  const today = new Date().toISOString().split("T")[0];
  const giorni = diffDays(today, f.scadenza);
  if (giorni < 0) return "scaduta";
  if (giorni <= 7) return "in_scadenza";
  return "emessa";
}

function defaultFmtEur(n: number): string {
  return "€ " + (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function SchedaFinanziariaCommessa({
  commessa, totaleCommessa, fatture,
  onCreaFattura, onMarcaPagata, onGeneraPDF, onSollecitaWhatsApp, onAnnullaFattura, aziendaInfo,
  fmtEur = defaultFmtEur,
}: Props) {
  const [showWizard, setShowWizard] = useState(false);
  const [showPagataModal, setShowPagataModal] = useState<Fattura | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ===== KPI =====
  const fatturato = fatture.reduce((s, f) => s + (f.importo || 0), 0);
  const pagato = fatture.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const [showInviaModal, setShowInviaModal] = useState<any>(null);
  const inScadenza = fatture.filter(f => !f.pagata && statoOf(f) === "in_scadenza").reduce((s, f) => s + (f.importo || 0), 0);
  const scaduto = fatture.filter(f => !f.pagata && statoOf(f) === "scaduta").reduce((s, f) => s + (f.importo || 0), 0);
  const residuo = Math.max(0, totaleCommessa - fatturato);
  const pctFatturato = totaleCommessa > 0 ? Math.min(100, Math.round(fatturato / totaleCommessa * 100)) : 0;
  const pctPagato = totaleCommessa > 0 ? Math.min(100, Math.round(pagato / totaleCommessa * 100)) : 0;

  // ===== Suggerimento prossima fattura =====
  const haAcconto = fatture.some(f => f.tipo === "acconto" || f.tipo === "unica");
  const haSaldo = fatture.some(f => f.tipo === "saldo");
  const accontoTuttoPagato = fatture.filter(f => f.tipo === "acconto" || f.tipo === "unica").every(f => f.pagata);
  const tuttoPagato = fatturato > 0 && fatturato === pagato;
  const fatNonPagate = fatture.filter(f => !f.pagata && (statoOf(f) === "scaduta" || statoOf(f) === "in_scadenza"));

  let suggerimento: { tipo: FatturaTipo; importo: number; lbl: string; urgente?: boolean } | null = null;
  if (fatNonPagate.length > 0) {
    suggerimento = { tipo: fatNonPagate[0].tipo, importo: fatNonPagate[0].importo, lbl: "SOLLECITA pagamento", urgente: true };
  } else if (!haAcconto) {
    suggerimento = { tipo: "acconto", importo: Math.round(totaleCommessa * 0.5), lbl: "Emetti ACCONTO 50%" };
  } else if (!haSaldo && residuo > 0 && accontoTuttoPagato) {
    suggerimento = { tipo: "saldo", importo: residuo, lbl: "Emetti SALDO" };
  } else if (!haSaldo && residuo > 0) {
    suggerimento = { tipo: "sal", importo: Math.round(residuo * 0.3), lbl: "Emetti SAL intermedio" };
  }

  return (
    <div style={{ background: T.card, borderRadius: 18, padding: "16px 16px 14px", boxShadow: "0 4px 14px rgba(13,31,31,0.08)", border: "1px solid rgba(40,160,160,0.15)", marginTop: 12 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, color: T.acc, letterSpacing: 1.2 }}>SCHEDA FINANZIARIA</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginTop: 2 }}>
            Commessa {commessa?.code || "—"} · {commessa?.cliente || ""} {commessa?.cognome || ""}
          </div>
        </div>
        {tuttoPagato && fatturato >= totaleCommessa && (
          <span style={{ padding: "4px 10px", borderRadius: 8, background: STATO_COLORS.pagata.bg, color: STATO_COLORS.pagata.tx, fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>
            ✓ TUTTO INCASSATO
          </span>
        )}
      </div>

      {/* 4 KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <Kpi label="TOTALE CONTRATTO" value={fmtEur(totaleCommessa)} sub="" color={T.text} />
        <Kpi label="GIÀ FATTURATO" value={fmtEur(fatturato)} sub={`${pctFatturato}% del totale`} color={T.blue} />
        <Kpi label="INCASSATO" value={fmtEur(pagato)} sub={`${pctPagato}% del totale`} color={T.green} />
        <Kpi label="DA FATTURARE" value={fmtEur(residuo)} sub={residuo > 0 ? "ancora" : "completo"} color={residuo > 0 ? T.amber : T.gray} />
      </div>

      {/* BARRA AVANZAMENTO */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.sub, fontWeight: 700, marginBottom: 4 }}>
          <span>Avanzamento finanziario</span>
          <span>{pctPagato}% pagato · {pctFatturato}% fatturato</span>
        </div>
        <div style={{ position: "relative", height: 8, background: T.bg, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pctFatturato}%`, background: T.blue + "40", transition: "width 0.3s" }} />
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pctPagato}%`, background: T.green, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* ALERT SCADUTI / IN SCADENZA */}
      {(scaduto > 0 || inScadenza > 0) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {scaduto > 0 && (
            <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: STATO_COLORS.scaduta.bg, border: `1px solid ${STATO_COLORS.scaduta.tx}30` }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: STATO_COLORS.scaduta.tx, letterSpacing: 0.5 }}>SCADUTO</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: STATO_COLORS.scaduta.tx, marginTop: 2 }}>{fmtEur(scaduto)}</div>
            </div>
          )}
          {inScadenza > 0 && (
            <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: STATO_COLORS.in_scadenza.bg, border: `1px solid ${STATO_COLORS.in_scadenza.tx}30` }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: STATO_COLORS.in_scadenza.tx, letterSpacing: 0.5 }}>IN SCADENZA</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: STATO_COLORS.in_scadenza.tx, marginTop: 2 }}>{fmtEur(inScadenza)}</div>
            </div>
          )}
        </div>
      )}

      {/* SUGGERIMENTO PROSSIMA AZIONE */}
      {suggerimento && (
        <div onClick={() => suggerimento?.urgente ? null : setShowWizard(true)}
          style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 12,
            background: suggerimento.urgente ? STATO_COLORS.scaduta.bg : "linear-gradient(135deg, #E0F2EE 0%, #C8E5DF 100%)",
            border: `1.5px solid ${suggerimento.urgente ? STATO_COLORS.scaduta.tx : T.acc}`,
            cursor: suggerimento.urgente ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: suggerimento.urgente ? STATO_COLORS.scaduta.tx : T.acc, letterSpacing: 0.6 }}>
              PROSSIMA AZIONE CONSIGLIATA
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginTop: 3 }}>
              {suggerimento.lbl} · {fmtEur(suggerimento.importo)}
            </div>
          </div>
          <span style={{ fontSize: 18, color: suggerimento.urgente ? STATO_COLORS.scaduta.tx : T.acc, fontWeight: 900 }}>›</span>
        </div>
      )}

      {/* STORICO FATTURE */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: T.acc, letterSpacing: 0.8 }}>
            STORICO FATTURE · {fatture.length}
          </div>
          {fatture.length > 0 && (
            <span style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>
              {fatture.filter(f => f.pagata).length}/{fatture.length} pagate
            </span>
          )}
        </div>

        {fatture.length === 0 ? (
          <div style={{ padding: "20px 16px", borderRadius: 10, background: T.bg, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Nessuna fattura ancora emessa</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fatture
              .slice()
              .sort((a, b) => (b.dataISO || b.data).localeCompare(a.dataISO || a.data))
              .map(f => {
                const stato = statoOf(f);
                const c = STATO_COLORS[stato];
                const giorniSc = f.scadenza ? diffDays(new Date().toISOString().split("T")[0], f.scadenza) : null;
                const isExp = expanded === f.id;
                return (
                  <div key={f.id} style={{ borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, overflow: "hidden" }}>
                    <div onClick={() => setExpanded(isExp ? null : f.id)}
                      style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, background: c.bg, color: c.tx, fontSize: 9, fontWeight: 900, letterSpacing: 0.4 }}>
                        {c.lbl}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
                          {TIPO_LABEL[f.tipo]} · n.{f.numero}/{f.anno}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>
                          {f.data}
                          {f.scadenza && stato !== "pagata" && giorniSc !== null && (
                            <> · Scadenza {giorniSc < 0 ? `${-giorniSc}gg fa` : giorniSc === 0 ? "oggi" : `fra ${giorniSc}gg`}</>
                          )}
                          {f.pagata && f.dataPagamento && <> · Pagata {new Date(f.dataPagamento + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>
                          {fmtEur(f.importo)}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: T.sub, transform: isExp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>›</span>
                    </div>

                    {isExp && (
                      <div style={{ padding: "10px 12px", borderTop: `1px solid ${T.bdr}`, background: T.bg }}>
                        {f.note && <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, fontStyle: "italic" }}>{f.note}</div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {!f.pagata && (
                            <button onClick={(e) => { e.stopPropagation(); setShowPagataModal(f); }}
                              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                              ✓ Marca pagata
                            </button>
                          )}
                          {!f.pagata && stato === "scaduta" && onSollecitaWhatsApp && (
                            <button onClick={(e) => { e.stopPropagation(); onSollecitaWhatsApp(f); }}
                              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: T.amber, color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                              💬 Sollecita
                            </button>
                          )}
                          {onGeneraPDF && (
                            <button onClick={(e) => { e.stopPropagation(); onGeneraPDF(f); }}
                              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.acc}`, background: T.card, color: T.acc, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              📄 PDF
                            </button>
                          )}
                          {onAnnullaFattura && !f.pagata && (
                            <button onClick={(e) => { e.stopPropagation();
                              if (window.confirm("Annullare questa fattura?")) onAnnullaFattura(f.id);
                            }}
                              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.red}40`, background: T.card, color: T.red, fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}>
                              Annulla
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* BOTTONE NUOVA FATTURA */}
      {residuo > 0 && (
        <button onClick={() => setShowWizard(true)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px dashed ${T.acc}`, background: T.acc + "08", color: T.acc, fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3 }}>
          + NUOVA FATTURA
        </button>
      )}

      {/* WIZARD NUOVA FATTURA */}
      {showWizard && (
        <WizardNuovaFattura
          totaleCommessa={totaleCommessa}
          giaFatturato={fatturato}
          giaPagato={pagato}
          residuo={residuo}
          suggerimento={suggerimento}
          fmtEur={fmtEur}
          onCancel={() => setShowWizard(false)}
          onConfirm={async (tipo, importo, scadenza, note) => {
            const fattCreata = await Promise.resolve(onCreaFattura(tipo, importo, scadenza, note));
            setShowWizard(false);
            if (fattCreata && (fattCreata.id || fattCreata.dbId)) {
              setShowInviaModal(fattCreata);
            }
          }}
          aziendaInfo={aziendaInfo}
          commessa={commessa}
        />
      )}

      {/* MODAL MARCA PAGATA */}
      {showPagataModal && (
        <ModalMarcaPagata
          fattura={showPagataModal}
          fmtEur={fmtEur}
          onCancel={() => setShowPagataModal(null)}
          onConfirm={(metodo) => {
            onMarcaPagata(showPagataModal.id, metodo);
            setShowPagataModal(null);
          }}
        />
      )}

      {/* MODAL INVIA FATTURA dopo creazione bozza */}
      {showInviaModal && (
        <ModalInviaFattura
          fattura={showInviaModal}
          commessa={commessa}
          aziendaInfo={aziendaInfo}
          fmtEur={fmtEur}
          onClose={() => setShowInviaModal(null)}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: T.bg, border: `1px solid ${T.bdr}` }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: T.sub, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 900, color, marginTop: 3, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.3 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.sub, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ===== WIZARD NUOVA FATTURA =====
function WizardNuovaFattura({ totaleCommessa, giaFatturato, giaPagato, residuo, suggerimento, fmtEur, onCancel, onConfirm, aziendaInfo, commessa }: {
  totaleCommessa: number; giaFatturato: number; giaPagato: number; residuo: number;
  suggerimento: { tipo: FatturaTipo; importo: number; lbl: string } | null;
  fmtEur: (n: number) => string;
  onCancel: () => void;
  onConfirm: (tipo: FatturaTipo, importo: number, scadenza: string, note: string) => void | Promise<void>;
  aziendaInfo?: any;
  commessa?: any;
}) {
  const [tipo, setTipo] = useState<FatturaTipo>(suggerimento?.tipo || "acconto");
  const [importo, setImporto] = useState<string>(suggerimento ? String(suggerimento.importo) : String(Math.round(totaleCommessa * 0.5)));
  const [scadenzaGg, setScadenzaGg] = useState<number>(30);
  const [note, setNote] = useState<string>("");
  const [step, setStep] = useState<"dati" | "anteprima">("dati");
  const [pdfUri, setPdfUri] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const importoNum = parseFloat(importo) || 0;
  const dopoFatt = giaFatturato + importoNum;
  const residuoDopo = Math.max(0, totaleCommessa - dopoFatt);
  const scadenzaIso = (() => { const d = new Date(); d.setDate(d.getDate() + scadenzaGg); return d.toISOString().split("T")[0]; })();

  const presetImporti = [
    { lbl: "30%", v: Math.round(totaleCommessa * 0.3) },
    { lbl: "40%", v: Math.round(totaleCommessa * 0.4) },
    { lbl: "50%", v: Math.round(totaleCommessa * 0.5) },
    { lbl: "60%", v: Math.round(totaleCommessa * 0.6) },
    { lbl: "Residuo", v: residuo },
    { lbl: "Tutto", v: totaleCommessa },
  ];

  const valid = importoNum > 0 && importoNum <= residuo + 1; // tolleranza 1€

  // STEP ANTEPRIMA: mostra PDF inline
  if (step === "anteprima") {
    return (
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 18, width: "100%", maxWidth: 600, maxHeight: "94vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.acc, letterSpacing: 0.8 }}>ANTEPRIMA FATTURA</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginTop: 2 }}>{TIPO_LABEL[tipo]} - {fmtEur(importoNum)}</div>
            </div>
            <div onClick={onCancel} style={{ width: 30, height: 30, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.sub }}>x</div>
          </div>
          <div style={{ flex: 1, background: "#525659", padding: 0, overflow: "hidden" }}>
            {pdfUri ? (
              <iframe src={pdfUri} style={{ width: "100%", height: "100%", border: "none" }} title="Anteprima fattura" />
            ) : (
              <div style={{ padding: 40, color: "#fff", textAlign: "center" }}>Generazione anteprima...</div>
            )}
          </div>
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.bdr}`, display: "flex", gap: 8 }}>
            <button onClick={() => setStep("dati")} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              MODIFICA
            </button>
            <button disabled={submitting} onClick={async () => {
              setSubmitting(true);
              try {
                await onConfirm(tipo, importoNum, scadenzaIso, note);
              } finally {
                setSubmitting(false);
              }
            }} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none",
              background: submitting ? T.gray : "linear-gradient(135deg, #28A0A0 0%, #1A7A7A 100%)",
              color: "#fff", fontSize: 13, fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>
              {submitting ? "Creazione..." : `CONFERMA E CREA BOZZA · ${fmtEur(importoNum)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP DATI (originale)
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 18, width: "100%", maxWidth: 420, maxHeight: "92vh", overflowY: "auto", padding: "20px 18px" }}>

        <div style={{ fontSize: 11, fontWeight: 900, color: T.acc, letterSpacing: 0.8 }}>NUOVA FATTURA</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginTop: 3, marginBottom: 14 }}>Crea documento fiscale</div>

        {/* Stato attuale */}
        <div style={{ background: T.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 16, border: `1px solid ${T.bdr}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>STATO COMMESSA</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
            <div><span style={{ color: T.sub }}>Totale:</span> <strong style={{ color: T.text }}>{fmtEur(totaleCommessa)}</strong></div>
            <div><span style={{ color: T.sub }}>Fatturato:</span> <strong style={{ color: T.blue }}>{fmtEur(giaFatturato)}</strong></div>
            <div><span style={{ color: T.sub }}>Pagato:</span> <strong style={{ color: T.green }}>{fmtEur(giaPagato)}</strong></div>
            <div><span style={{ color: T.sub }}>Residuo:</span> <strong style={{ color: T.amber }}>{fmtEur(residuo)}</strong></div>
          </div>
        </div>

        {/* TIPO */}
        <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>TIPO FATTURA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
          {(["acconto", "sal", "saldo", "unica"] as FatturaTipo[]).map(t => {
            const active = tipo === t;
            return (
              <div key={t} onClick={() => setTipo(t)}
                style={{ padding: "10px 6px", borderRadius: 10, textAlign: "center" as any, cursor: "pointer",
                  background: active ? T.acc : T.card, color: active ? "#fff" : T.text,
                  border: `1.5px solid ${active ? T.acc : T.bdr}`, fontSize: 11, fontWeight: 800 }}>
                {TIPO_LABEL[t]}
              </div>
            );
          })}
        </div>

        {/* IMPORTO */}
        <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>IMPORTO (€)</div>
        <input
          type="number"
          value={importo}
          onChange={e => setImporto(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${valid ? T.acc : T.red}`,
            fontSize: 22, fontWeight: 900, color: valid ? T.acc : T.red, background: T.bg,
            fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, boxSizing: "border-box" as any, outline: "none" }}
          autoFocus
        />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
          {presetImporti.map(p => (
            <span key={p.lbl} onClick={() => setImporto(String(p.v))}
              style={{ padding: "4px 8px", borderRadius: 6, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10, fontWeight: 700, color: T.acc, cursor: "pointer" }}>
              {p.lbl} · {fmtEur(p.v)}
            </span>
          ))}
        </div>

        {/* SCADENZA */}
        <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>SCADENZA PAGAMENTO</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[7, 15, 30, 60, 90].map(g => {
            const active = scadenzaGg === g;
            return (
              <div key={g} onClick={() => setScadenzaGg(g)}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 8, textAlign: "center" as any, cursor: "pointer",
                  background: active ? T.acc : T.card, color: active ? "#fff" : T.text,
                  border: `1.5px solid ${active ? T.acc : T.bdr}`, fontSize: 11, fontWeight: 800 }}>
                {g}gg
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: T.sub, marginBottom: 14, marginTop: -6 }}>
          Scade il <strong style={{ color: T.text }}>{new Date(scadenzaIso + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</strong>
        </div>

        {/* NOTE */}
        <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>NOTE (opzionale)</div>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Es: SAL 60% lavori in corso"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, marginBottom: 16, boxSizing: "border-box" as any, outline: "none", fontFamily: "inherit" }}
        />

        {/* PREVIEW STATO RISULTANTE */}
        <div style={{ background: "linear-gradient(135deg, #E0F2EE 0%, #C8E5DF 100%)", borderRadius: 10, padding: "10px 12px", marginBottom: 16, border: `1px solid ${T.acc}40` }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: T.acc, letterSpacing: 0.5, marginBottom: 6 }}>DOPO QUESTA FATTURA</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
            <div><span style={{ color: T.sub }}>Fatturato totale:</span> <strong style={{ color: T.blue }}>{fmtEur(dopoFatt)}</strong></div>
            <div><span style={{ color: T.sub }}>Residuo:</span> <strong style={{ color: residuoDopo > 0 ? T.amber : T.green }}>{fmtEur(residuoDopo)}</strong></div>
          </div>
        </div>

        {/* AZIONI */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Annulla
          </button>
          <button disabled={!valid} onClick={() => onConfirm(tipo, importoNum, scadenzaIso, note)}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: "none",
              background: valid ? "linear-gradient(135deg, #28A0A0 0%, #1A7A7A 100%)" : T.gray,
              color: "#fff", fontSize: 13, fontWeight: 800, cursor: valid ? "pointer" : "not-allowed",
              opacity: valid ? 1 : 0.6 }}>
            CREA FATTURA · {fmtEur(importoNum)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MODAL MARCA PAGATA =====
function ModalMarcaPagata({ fattura, fmtEur, onCancel, onConfirm }: {
  fattura: Fattura;
  fmtEur: (n: number) => string;
  onCancel: () => void;
  onConfirm: (metodo: string) => void;
}) {
  const [metodo, setMetodo] = useState<string>("Bonifico");
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 18, width: "100%", maxWidth: 360, padding: "20px 18px" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: T.green, letterSpacing: 0.8 }}>MARCA COME PAGATA</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: T.text, marginTop: 3, marginBottom: 4 }}>
          {TIPO_LABEL[fattura.tipo]} n.{fattura.numero}
        </div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Importo <strong style={{ color: T.green }}>{fmtEur(fattura.importo)}</strong></div>

        <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 6 }}>METODO PAGAMENTO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
          {["Bonifico", "Contanti", "Assegno", "Carta", "POS", "Altro"].map(m => {
            const active = metodo === m;
            return (
              <div key={m} onClick={() => setMetodo(m)}
                style={{ padding: "10px 6px", borderRadius: 8, textAlign: "center" as any, cursor: "pointer",
                  background: active ? T.green : T.card, color: active ? "#fff" : T.text,
                  border: `1.5px solid ${active ? T.green : T.bdr}`, fontSize: 12, fontWeight: 700 }}>
                {m}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={() => onConfirm(metodo)}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: T.green, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            ✓ CONFERMA PAGAMENTO
          </button>
        </div>
      </div>
    </div>
  );
}


// ===== MODAL INVIA FATTURA AL CLIENTE =====
function ModalInviaFattura({ fattura, commessa, aziendaInfo, fmtEur, onClose }: {
  fattura: any;
  commessa?: any;
  aziendaInfo?: any;
  fmtEur: (n: number) => string;
  onClose: () => void;
}) {
  const [inviando, setInviando] = useState<string | null>(null);
  const [inviato, setInviato] = useState(false);

  async function invia(canale: "email" | "whatsapp" | "altro") {
    const fatturaId = fattura.dbId || fattura.id;
    if (!fatturaId || String(fatturaId).startsWith("fat_")) {
      alert("Fattura non persistita su DB, impossibile inviare");
      return;
    }
    const aziendaId = (typeof window !== "undefined" && (sessionStorage.getItem("mastro:aziendaId") || localStorage.getItem("mastro:aziendaId")))
      || commessa?.azienda_id
      || aziendaInfo?.id
      || "ccca51c1-656b-4e7c-a501-55753e20da29";
    setInviando(canale);
    try {
      const r = await fetch("/api/fatture/invia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aziendaId, fatturaId, canale }),
      });
      const j = await r.json();
      if (!r.ok) {
        alert("Errore invio: " + (j.error || "sconosciuto"));
        setInviando(null);
        return;
      }
      setInviato(true);

      // Apri canale fisico in base alla scelta
      const importoTot = Number(fattura.totale || fattura.importo) || 0;
      const messaggio = `Ciao, ti ho inviato la fattura ${fattura.numero || ""} per EUR ${fmtEur(importoTot)} relativa alla commessa ${commessa?.code || ""}. Per pagamento bonifico: IBAN ${aziendaInfo?.iban || "(da inserire)"}.`;
      if (canale === "whatsapp") {
        const tel = (commessa?.telefono || "").replace(/[^0-9+]/g, "");
        if (tel) {
          window.open(`https://wa.me/${tel.replace(/^\+/, "")}?text=${encodeURIComponent(messaggio)}`, "_blank");
        }
      } else if (canale === "email") {
        const email = commessa?.email || "";
        if (email) {
          window.open(`mailto:${email}?subject=${encodeURIComponent("Fattura " + (fattura.numero || ""))}&body=${encodeURIComponent(messaggio)}`, "_blank");
        }
      }

      setTimeout(() => { onClose(); }, 1200);
    } catch (e: any) {
      alert("Errore invio: " + (e?.message || "sconosciuto"));
      setInviando(null);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 18, width: "100%", maxWidth: 380, padding: "22px 20px" }}>

        {inviato ? (
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#D8EBDF", color: "#1F5A3F",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 14, fontSize: 28
            }}>OK</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Fattura inviata</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 6 }}>
              Stato: <strong>inviata</strong>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 900, color: T.acc, letterSpacing: 0.8 }}>FATTURA CREATA</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: T.text, marginTop: 3 }}>
              {fattura.numero || fattura.numeroFull || "BOZZA"}
            </div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>
              {fmtEur(Number(fattura.totale || fattura.importo) || 0)} - {commessa?.cliente || "cliente"}
            </div>

            <div style={{ marginTop: 16, padding: "10px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginBottom: 4 }}>STATO</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>Bozza - non ancora inviata al cliente</div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 900, color: T.sub, letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>INVIA AL CLIENTE</div>

            <button disabled={inviando !== null} onClick={() => invia("email")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.text, fontSize: 13, fontWeight: 700, cursor: inviando ? "wait" : "pointer", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>@</span>
              <span style={{ flex: 1, textAlign: "left" }}>{inviando === "email" ? "Invio email..." : "Invia via Email"}</span>
            </button>

            <button disabled={inviando !== null} onClick={() => invia("whatsapp")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.text, fontSize: 13, fontWeight: 700, cursor: inviando ? "wait" : "pointer", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>WA</span>
              <span style={{ flex: 1, textAlign: "left" }}>{inviando === "whatsapp" ? "Invio WhatsApp..." : "Invia via WhatsApp"}</span>
            </button>

            <button disabled={inviando !== null} onClick={() => invia("altro")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "none", background: T.bg, color: T.sub, fontSize: 12, fontWeight: 700, cursor: inviando ? "wait" : "pointer", marginBottom: 10 }}>
              {inviando === "altro" ? "Marca come inviata..." : "Marca solo come inviata (no canale)"}
            </button>

            <button onClick={onClose} disabled={inviando !== null}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "none", background: "transparent", color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Resta in bozza, invio dopo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
