// components/TabFiscaleTemplate.tsx
// Template messaggio cliente + docs auto-generati + docs cliente + log comunicazioni
// Stile unificato Centro Comando / RILIEVO MISURE
import { useState } from "react";
import TabFiscaleDocs from "./TabFiscaleDocs";
import { FISCALE_TOKENS as F, DETR_LABEL, TEMPLATE_MAP } from "../lib/fiscale/tokens";
import type { TemplateFiscale } from "../hooks/useFiscale";

type Props = {
  T: any; ICO: any; I: any;
  fiscale: any;
  commessa: any;
  aziendaInfo: any;
  pwDetr: string;
  tplTipo: string;
  wizardDocs: any[];
};

export default function TabFiscaleTemplate({
  T, ICO, I, fiscale, commessa, aziendaInfo, pwDetr, tplTipo, wizardDocs,
}: Props) {
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplDraft, setTplDraft] = useState("");
  const [tplCanale, setTplCanale] = useState<"whatsapp" | "email">("whatsapp");

  const currentTpl = tplTipo ? fiscale.getTemplate(tplTipo, tplCanale) : null;

  const vars = {
    CLIENTE: commessa?.cliente || "",
    NUM_FATTURA: commessa?.numero_fattura || "___",
    DATA_FATTURA: commessa?.data_fattura || "___",
    CF_BENEFICIARIO: commessa?.cf_cliente || "___",
    PIVA: aziendaInfo?.piva || "___",
    RAGIONE_SOCIALE: aziendaInfo?.ragione_sociale || aziendaInfo?.ragione || aziendaInfo?.denominazione || "",
    IBAN: aziendaInfo?.iban || "___",
    DETRAZIONE: DETR_LABEL[pwDetr] || "",
    CAUSALE: "", DOCS_MANCANTI: "", DOCUMENTO: "", PROSSIMO_STEP: "",
  };

  const startEdit = (tpl: TemplateFiscale) => { setEditingTplId(tpl.id); setTplDraft(tpl.testo); };
  const saveEdit = async () => {
    if (!editingTplId) return;
    await fiscale.saveTemplate(editingTplId, { testo: tplDraft });
    setEditingTplId(null);
  };

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

  const card = {
    background: F.cardBg, borderRadius: F.radius, border: `1px solid ${F.border}`,
    padding: 14, marginBottom: F.spacing,
  };
  const title = { fontSize: 13, fontWeight: 800, color: F.textDark, marginBottom: 12 };
  const btnPrimary = {
    padding: "11px 16px", borderRadius: F.radiusSmall, border: "none",
    background: F.teal, color: "#fff", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit" as any,
  };
  const btnSecondary = {
    padding: "11px 16px", borderRadius: F.radiusSmall,
    background: "#fff", color: F.teal, fontSize: 12, fontWeight: 700,
    border: `1px solid ${F.border}`, cursor: "pointer", fontFamily: "inherit" as any,
  };

  return (
    <>
      {/* ===== TEMPLATE MESSAGGIO ===== */}
      {pwDetr !== "nessuna" && currentTpl && (
        <div style={card}>
          <div style={title}>Messaggio al cliente</div>

          {/* Tab underline WA/Email */}
          <div style={{ display: "flex", borderBottom: `1px solid ${F.border}`, marginBottom: 12 }}>
            {(["whatsapp", "email"] as const).map(c => (
              <div key={c} onClick={() => setTplCanale(c)} style={{
                padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700,
                color: tplCanale === c ? F.teal : F.textSub,
                borderBottom: `2px solid ${tplCanale === c ? F.teal : "transparent"}`,
                textTransform: "capitalize" as any,
                marginBottom: -1,
              }}>{c}</div>
            ))}
          </div>

          {editingTplId === currentTpl.id ? (
            <div>
              <textarea value={tplDraft} onChange={e => setTplDraft(e.target.value)} style={{
                width: "100%", minHeight: 240, padding: 10, borderRadius: F.radiusSmall,
                border: `1px solid ${F.border}`, fontSize: 12, fontFamily: "inherit",
                resize: "vertical" as any, boxSizing: "border-box" as any, color: F.textDark,
              }} />
              <div style={{ fontSize: 10, color: F.textSub, marginTop: 6, lineHeight: 1.5 }}>
                Placeholder: {"{CLIENTE}"} {"{NUM_FATTURA}"} {"{DATA_FATTURA}"} {"{CF_BENEFICIARIO}"} {"{PIVA}"} {"{RAGIONE_SOCIALE}"} {"{IBAN}"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={saveEdit} style={{ ...btnPrimary, flex: 1 }}>Salva</button>
                <button onClick={() => setEditingTplId(null)} style={btnSecondary}>Annulla</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                padding: 12, borderRadius: F.radiusSmall, background: F.lightBg,
                border: `1px solid ${F.border}`,
                fontSize: 11, color: F.textDark, whiteSpace: "pre-wrap" as any,
                maxHeight: 200, overflowY: "auto" as any, lineHeight: 1.55,
              }}>
                {fiscale.renderTemplate(currentTpl.testo, vars)}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {tplCanale === "whatsapp" ? (
                  <button onClick={() => sendWhatsApp(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.tipo)} style={{ ...btnPrimary, flex: 1 }}>
                    Invia WhatsApp
                  </button>
                ) : (
                  <button onClick={() => sendEmail(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.oggetto || `Pratica ${DETR_LABEL[pwDetr]}`, currentTpl.tipo)} style={{ ...btnPrimary, flex: 1 }}>
                    Invia Email
                  </button>
                )}
                <button onClick={() => startEdit(currentTpl)} style={btnSecondary}>Modifica</button>
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
              <DocGenerato key={i} doc={d} />
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
            {fiscale.comunicazioni.slice(0, 10).map((c: any) => (
              <div key={c.id} style={{
                padding: 10, borderRadius: F.radiusSmall, background: F.lightBg,
                border: `1px solid ${F.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: F.teal, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>
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
    </>
  );
}

function DocGenerato({ doc }: { doc: any }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copia = () => {
    navigator.clipboard.writeText(doc.contenuto || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ borderRadius: F.radiusSmall, border: `1px solid ${F.border}`, background: "#fff", overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
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
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" as any,
          }}>
            {copied ? "✓ Copiato" : "Copia testo"}
          </button>
        </div>
      )}
    </div>
  );
}
