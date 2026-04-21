// components/TabFiscale.tsx
// Tab Fiscale — layout fliwoX uniforme
import { useState } from "react";
import { useFiscale, TemplateFiscale } from "../hooks/useFiscale";
import TabFiscaleDocs from "./TabFiscaleDocs";
import SchedaNormativa from "./SchedaNormativa";
import WizardFiscale from "./WizardFiscale";

type Props = {
  T: any; ICO: any; I: any;
  commessa: any;
  aziendaInfo: any;
  DETRAZIONI_OPT: { id: string; l: string }[];
  updCM: (field: string, value: any) => void;
  pwIvaDefault: number;
  pwDetr: string;
  pwSconto: number;
};

const TEMPLATE_MAP: Record<string, string> = { "50": "checklist_50", "65": "checklist_65", "75": "checklist_75" };
const DETR_LABEL: Record<string, string> = { "50": "Ristrutt. 50%", "65": "Ecobonus 65%", "75": "Bonus Barriere 75%" };

// Tokens fliwoX locali
const F = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  radius: 14,
  radiusSmall: 10,
  spacing: 10,
};

export default function TabFiscale({
  T, ICO, I, commessa, aziendaInfo, DETRAZIONI_OPT,
  updCM, pwIvaDefault, pwDetr, pwSconto,
}: Props) {
  const aziendaId = aziendaInfo?.id || "ccca51c1-656b-4e7c-a501-55753e20da29";
  const fiscale = useFiscale(commessa?.id || null, aziendaId);

  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplDraft, setTplDraft] = useState("");
  const [tplCanale, setTplCanale] = useState<"whatsapp" | "email">("whatsapp");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardDocs, setWizardDocs] = useState<any[]>([]);
  const [wizardMotivazione, setWizardMotivazione] = useState<string>("");

  const imponibile = Number(commessa?.totale_imponibile || commessa?.totale || 0);
  const ivaPerc = pwIvaDefault || 22;
  const iva = imponibile * ivaPerc / 100;
  const totale = imponibile + iva;
  const detrPerc = pwDetr && pwDetr !== "nessuna" ? Number(pwDetr) : 0;
  const detraibile = totale * detrPerc / 100;
  const costoEffettivo = totale - detraibile;

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tplTipo = TEMPLATE_MAP[pwDetr] || "";
  const currentTpl = tplTipo ? fiscale.getTemplate(tplTipo, tplCanale) : null;

  const vars = {
    CLIENTE: commessa?.cliente || "",
    NUM_FATTURA: commessa?.numero_fattura || "___",
    DATA_FATTURA: commessa?.data_fattura || "___",
    CF_BENEFICIARIO: commessa?.cf_cliente || "___",
    PIVA: aziendaInfo?.piva || "___",
    RAGIONE_SOCIALE: aziendaInfo?.ragione_sociale || aziendaInfo?.denominazione || "",
    IBAN: aziendaInfo?.iban || "___",
    DETRAZIONE: DETR_LABEL[pwDetr] || "",
    CAUSALE: "", DOCS_MANCANTI: "", DOCUMENTO: "", PROSSIMO_STEP: "",
  };

  const startEdit = (tpl: TemplateFiscale) => { setEditingTplId(tpl.id); setTplDraft(tpl.testo); };
  const saveEdit = async () => { if (!editingTplId) return; await fiscale.saveTemplate(editingTplId, { testo: tplDraft }); setEditingTplId(null); };

  const sendWhatsApp = (testo: string, tipo: string) => {
    const tel = (commessa?.telefono || "").replace(/[^0-9+]/g, "");
    const num = tel.startsWith("+") ? tel.slice(1) : "39" + tel;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(testo)}`, "_blank");
    fiscale.logComunicazione(tipo, "whatsapp", testo, commessa?.telefono || null);
  };

  const sendEmail = (testo: string, oggetto: string, tipo: string) => {
    const email = commessa?.email || "";
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`;
    fiscale.logComunicazione(tipo, "email", testo, email);
  };

  // Stili uniformi
  const card = {
    background: F.cardBg, borderRadius: F.radius, border: `1px solid ${F.border}`,
    padding: 14, marginBottom: F.spacing,
  };
  const label = {
    fontSize: 10, fontWeight: 800, color: F.teal, marginBottom: 6,
    textTransform: "uppercase" as any, letterSpacing: "0.6px",
  };
  const title = {
    fontSize: 13, fontWeight: 800, color: F.textDark, marginBottom: 12,
  };
  const chip = (selected: boolean) => ({
    padding: "11px 6px", borderRadius: F.radiusSmall, cursor: "pointer",
    textAlign: "center" as any, fontSize: 13, fontWeight: 800,
    background: selected ? F.teal : F.lightBg,
    color: selected ? "#fff" : F.textDark,
    border: `1px solid ${selected ? F.teal : "transparent"}`,
    transition: "all .15s",
  });

  return (
    <div style={{ padding: "0 12px 20px", background: F.lightBg, minHeight: "100%" }}>

      {/* ===== HERO WIZARD ===== */}
      <div onClick={() => setShowWizard(true)} style={{
        background: `linear-gradient(135deg, ${F.darkBg} 0%, ${F.teal} 100%)`,
        borderRadius: F.radius, padding: 18, marginBottom: F.spacing,
        color: "#fff", cursor: "pointer",
        boxShadow: "0 6px 18px rgba(40,160,160,0.22)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "#ffffff22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>⚡</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.2px" }}>Pratica fiscale automatica</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>Rispondi a 5 domande · MASTRO configura tutto</div>
          </div>
          <span style={{ fontSize: 20, opacity: 0.9 }}>→</span>
        </div>
      </div>

      {/* Motivazione wizard (se applicato) */}
      {wizardMotivazione && (
        <div style={{ ...card, borderLeft: `3px solid ${F.teal}`, background: "#F4F9F9" }}>
          <div style={{ ...label, marginBottom: 4 }}>✓ Configurato</div>
          <div style={{ fontSize: 11, color: F.textDark, lineHeight: 1.5 }}>{wizardMotivazione}</div>
        </div>
      )}

      {/* ===== SETTINGS ===== */}
      <div style={card}>
        <div style={title}>Impostazioni fiscali</div>

        <div style={{ marginBottom: 14 }}>
          <div style={label}>Aliquota IVA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[4, 10, 22].map(p => (
              <div key={p} onClick={() => updCM("ivaPerc", p)} style={chip(pwIvaDefault === p)}>{p}%</div>
            ))}
            <div onClick={() => { const v = prompt("IVA personalizzata (%)", String(pwIvaDefault)); if (v != null) { const n = parseFloat(v); if (!isNaN(n)) updCM("ivaPerc", n); } }}
                 style={chip(![4,10,22].includes(pwIvaDefault))}>
              {![4,10,22].includes(pwIvaDefault) ? `${pwIvaDefault}%` : "Altra"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={label}>Detrazione fiscale</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {DETRAZIONI_OPT.map(d => (
              <div key={d.id} onClick={() => updCM("detrazione", d.id)} style={{ ...chip(pwDetr === d.id), padding: "12px 8px", fontSize: 12 }}>
                {d.l}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={label}>Sconto commerciale</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {[0, 5, 10, 15, 20].map(p => (
              <div key={p} onClick={() => updCM("scontoPerc", p)} style={{ ...chip(pwSconto === p), padding: "9px 4px", fontSize: 12 }}>
                {p === 0 ? "No" : p + "%"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CALCOLO LIVE ===== */}
      {imponibile > 0 && (
        <div style={{
          ...card, background: F.darkBg, border: "none", color: "#fff",
        }}>
          <div style={{ ...label, color: "#7FC5C5", marginBottom: 10 }}>Riepilogo</div>
          <Row k="Imponibile" v={`€ ${fmt(imponibile)}`} />
          <Row k={`IVA ${ivaPerc}%`} v={`€ ${fmt(iva)}`} />
          <div style={{ height: 1, background: "#ffffff18", margin: "8px 0" }} />
          <Row k="Totale fattura" v={`€ ${fmt(totale)}`} big />
          {detrPerc > 0 && (
            <>
              <Row k={`Detraibile ${detrPerc}%`} v={`− € ${fmt(detraibile)}`} faded />
              <div style={{
                marginTop: 12, padding: 12, background: "#ffffff18",
                borderRadius: F.radiusSmall, border: `1px solid ${F.teal}60`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.8, textTransform: "uppercase" as any, letterSpacing: "0.7px", marginBottom: 3 }}>
                  Costo effettivo cliente
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
                  € {fmt(costoEffettivo)}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== SCHEDA NORMATIVA ===== */}
      <div style={card}>
        <div style={title}>Scheda normativa</div>
        <SchedaNormativa T={T} ivaPerc={pwIvaDefault} detrazione={pwDetr} />
      </div>

      {/* ===== TEMPLATE MESSAGGIO ===== */}
      {pwDetr !== "nessuna" && currentTpl && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: F.textDark }}>Messaggio al cliente</div>
            <div style={{ display: "flex", background: F.lightBg, borderRadius: 6, padding: 2 }}>
              {(["whatsapp", "email"] as const).map(c => (
                <div key={c} onClick={() => setTplCanale(c)} style={{
                  padding: "5px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 800,
                  background: tplCanale === c ? "#fff" : "transparent",
                  color: tplCanale === c ? F.textDark : F.textSub,
                  textTransform: "capitalize" as any,
                }}>{c}</div>
              ))}
            </div>
          </div>

          {editingTplId === currentTpl.id ? (
            <div>
              <textarea value={tplDraft} onChange={e => setTplDraft(e.target.value)} style={{
                width: "100%", minHeight: 240, padding: 10, borderRadius: 8,
                border: `1px solid ${F.border}`, fontSize: 12, fontFamily: "inherit",
                resize: "vertical" as any, boxSizing: "border-box" as any, color: F.textDark,
              }} />
              <div style={{ fontSize: 10, color: F.textSub, marginTop: 6, lineHeight: 1.5 }}>
                Placeholder: {"{CLIENTE}"} {"{NUM_FATTURA}"} {"{DATA_FATTURA}"} {"{CF_BENEFICIARIO}"} {"{PIVA}"} {"{RAGIONE_SOCIALE}"} {"{IBAN}"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={saveEdit} style={{
                  flex: 1, padding: 11, borderRadius: 8, border: "none",
                  background: F.teal, color: "#fff", fontSize: 12, fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit" as any,
                }}>Salva</button>
                <button onClick={() => setEditingTplId(null)} style={{
                  padding: "11px 14px", borderRadius: 8, border: `1px solid ${F.border}`,
                  background: "#fff", color: F.textSub, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit" as any,
                }}>Annulla</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                padding: 12, borderRadius: 8, background: F.lightBg,
                fontSize: 11, color: F.textDark, whiteSpace: "pre-wrap" as any,
                maxHeight: 200, overflowY: "auto" as any, lineHeight: 1.55,
              }}>
                {fiscale.renderTemplate(currentTpl.testo, vars)}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {tplCanale === "whatsapp" ? (
                  <button onClick={() => sendWhatsApp(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.tipo)} style={{
                    flex: 1, padding: 12, borderRadius: 8, border: "none",
                    background: F.darkBg, color: "#fff", fontSize: 12, fontWeight: 800,
                    cursor: "pointer", fontFamily: "inherit" as any,
                  }}>Invia WhatsApp</button>
                ) : (
                  <button onClick={() => sendEmail(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.oggetto || `Pratica ${DETR_LABEL[pwDetr]}`, currentTpl.tipo)} style={{
                    flex: 1, padding: 12, borderRadius: 8, border: "none",
                    background: F.darkBg, color: "#fff", fontSize: 12, fontWeight: 800,
                    cursor: "pointer", fontFamily: "inherit" as any,
                  }}>Invia Email</button>
                )}
                <button onClick={() => startEdit(currentTpl)} style={{
                  padding: "12px 14px", borderRadius: 8, border: `1px solid ${F.border}`,
                  background: "#fff", color: F.textDark, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit" as any,
                }}>Modifica</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTI WIZARD ===== */}
      {wizardDocs.length > 0 && wizardDocs.filter((d: any) => d.contenuto).length > 0 && (
        <div style={card}>
          <div style={title}>Documenti auto-generati</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {wizardDocs.filter((d: any) => d.contenuto).map((d: any, i: number) => (
              <DocGenerato key={i} doc={d} F={F} />
            ))}
          </div>
        </div>
      )}

      {/* ===== DOCUMENTI CLIENTE ===== */}
      <div style={card}>
        <div style={title}>Documenti cliente</div>
        <TabFiscaleDocs
          T={T} ICO={ICO} I={I}
          detrazione={pwDetr}
          docs={fiscale.docs}
          onUpload={async (file, sc) => fiscale.uploadDoc(file, { sotto_categoria: sc, detrazione_rif: pwDetr })}
          onDelete={fiscale.deleteDoc}
          onStato={fiscale.updateDocStato}
        />
      </div>

      {/* ===== COMUNICAZIONI LOG ===== */}
      {fiscale.comunicazioni.length > 0 && (
        <div style={card}>
          <div style={title}>Storico comunicazioni · {fiscale.comunicazioni.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" as any }}>
            {fiscale.comunicazioni.slice(0, 10).map(c => (
              <div key={c.id} style={{
                padding: 10, borderRadius: 8, background: F.lightBg,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: F.teal, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>
                    {c.canale} · {c.template_tipo.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 9, color: F.textSub }}>
                    {new Date(c.inviato_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: F.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                  {c.destinatario || "—"} · {(c.testo_inviato || "").substring(0, 90)}…
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== WIZARD MODAL ===== */}
      {showWizard && (
        <div onClick={() => setShowWizard(false)} style={{
          position: "fixed" as any, inset: 0, background: "#0D1F1FCC", zIndex: 9999,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", width: "100%", maxWidth: 560, maxHeight: "92vh",
            overflowY: "auto" as any, borderRadius: "16px 16px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          }}>
            <WizardFiscale
              T={T}
              commessa={commessa}
              aziendaInfo={aziendaInfo}
              onClose={() => setShowWizard(false)}
              onDecisione={(dec, inp) => {
                updCM("ivaPerc", dec.iva);
                updCM("detrazione", dec.detrazione);
                setWizardDocs(dec.documentiDaGenerare || []);
                setWizardMotivazione(`IVA ${dec.iva}% + ${dec.detrazione === "nessuna" ? "nessuna detrazione" : `detrazione ${dec.detrazionePerc}%`}. ${dec.detrazioneMotivazione.substring(0, 180)}…`);
                setShowWizard(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components ----------------------------------

function Row({ k, v, big, faded }: { k: string; v: string; big?: boolean; faded?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontSize: big ? 13 : 11, opacity: faded ? 0.7 : 0.85, fontWeight: big ? 700 : 500 }}>{k}</span>
      <span style={{ fontSize: big ? 15 : 12, fontWeight: big ? 800 : 700 }}>{v}</span>
    </div>
  );
}

function DocGenerato({ doc, F }: { doc: any; F: any }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copia = () => {
    navigator.clipboard.writeText(doc.contenuto || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${F.border}`, background: "#fff", overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: F.textDark }}>{doc.titolo}</div>
          <div style={{ fontSize: 9, color: F.teal, textTransform: "uppercase" as any, letterSpacing: "0.5px", fontWeight: 700, marginTop: 2 }}>
            {doc.chi === "serramentista" ? "Lo prepari tu" : doc.chi === "cliente" ? "Dal cliente" : "Tecnico esterno"}
          </div>
        </div>
        <span style={{ fontSize: 14, color: F.textSub, transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${F.border}`, padding: 12, background: F.lightBg }}>
          <div style={{
            whiteSpace: "pre-wrap" as any, fontSize: 10, background: "#fff",
            padding: 10, borderRadius: 6, color: F.textDark, lineHeight: 1.5,
            maxHeight: 280, overflowY: "auto" as any, fontFamily: "ui-monospace, monospace" as any,
            border: `1px solid ${F.border}`,
          }}>
            {doc.contenuto}
          </div>
          <button onClick={copia} style={{
            marginTop: 8, padding: "8px 14px", borderRadius: 6, border: "none",
            background: copied ? F.teal : F.darkBg, color: "#fff",
            fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" as any,
          }}>
            {copied ? "✓ Copiato" : "Copia testo"}
          </button>
        </div>
      )}
    </div>
  );
}
