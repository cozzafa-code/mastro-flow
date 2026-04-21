// components/TabFiscale.tsx
// Tab Fiscale completo: IVA + Detrazione + Sconto + Template editabili + Docs cliente + Log comunicazioni
import { useState } from "react";
import { useFiscale, TemplateFiscale } from "../hooks/useFiscale";
import TabFiscaleDocs from "./TabFiscaleDocs";
import SchedaNormativa from "./SchedaNormativa";

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

const TEMPLATE_MAP: Record<string, string> = {
  "50": "checklist_50",
  "65": "checklist_65",
  "75": "checklist_75",
};

const DETR_LABEL: Record<string, string> = {
  "50": "Ristrutt. 50%",
  "65": "Ecobonus 65%",
  "75": "Bonus Barriere 75%",
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

  // Calcolo live: imponibile / IVA / totale / detraibile / costo effettivo
  const imponibile = Number(commessa?.totale_imponibile || commessa?.totale || 0);
  const ivaPerc = pwIvaDefault || 22;
  const iva = imponibile * ivaPerc / 100;
  const totale = imponibile + iva;
  const detrPerc = pwDetr && pwDetr !== "nessuna" ? Number(pwDetr) : 0;
  const detraibile = totale * detrPerc / 100;
  const costoEffettivo = totale - detraibile;

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Template per detrazione corrente
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
    CAUSALE: "",
    DOCS_MANCANTI: "",
    DOCUMENTO: "",
    PROSSIMO_STEP: "",
  };

  const startEdit = (tpl: TemplateFiscale) => {
    setEditingTplId(tpl.id);
    setTplDraft(tpl.testo);
  };

  const saveEdit = async () => {
    if (!editingTplId) return;
    await fiscale.saveTemplate(editingTplId, { testo: tplDraft });
    setEditingTplId(null);
  };

  const sendWhatsApp = (testoRenderizzato: string, tipo: string) => {
    const tel = (commessa?.telefono || "").replace(/[^0-9+]/g, "");
    const num = tel.startsWith("+") ? tel.slice(1) : "39" + tel;
    const url = `https://wa.me/${num}?text=${encodeURIComponent(testoRenderizzato)}`;
    window.open(url, "_blank");
    fiscale.logComunicazione(tipo, "whatsapp", testoRenderizzato, commessa?.telefono || null);
  };

  const sendEmail = (testoRenderizzato: string, oggetto: string, tipo: string) => {
    const email = commessa?.email || "";
    const url = `mailto:${email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testoRenderizzato)}`;
    window.location.href = url;
    fiscale.logComunicazione(tipo, "email", testoRenderizzato, email);
  };

  return (
    <div style={{ padding: "0 12px 20px" }}>

      {/* ===== SETTINGS: IVA + DETRAZIONE + SCONTO ===== */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F", marginBottom: 10 }}>Impostazioni fiscali commessa</div>

        {/* IVA */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>Aliquota IVA</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {[4, 10, 22].map(p => (
              <div key={p} onClick={() => updCM("ivaPerc", p)} style={{
                padding: "10px 6px", borderRadius: 8, cursor: "pointer", textAlign: "center" as any,
                background: pwIvaDefault === p ? "#28A0A0" : "#fff",
                border: `1.5px solid ${pwIvaDefault === p ? "#28A0A0" : T.bdr}`,
                color: pwIvaDefault === p ? "#fff" : T.text,
                fontSize: 13, fontWeight: 800,
              }}>{p}%</div>
            ))}
            <div onClick={() => { const v = prompt("IVA personalizzata (%)", String(pwIvaDefault)); if (v != null) { const n = parseFloat(v); if (!isNaN(n)) updCM("ivaPerc", n); } }} style={{
              padding: "10px 6px", borderRadius: 8, cursor: "pointer", textAlign: "center" as any,
              background: ![4,10,22].includes(pwIvaDefault) ? "#28A0A0" : "#fff",
              border: `1.5px solid ${![4,10,22].includes(pwIvaDefault) ? "#28A0A0" : T.bdr}`,
              color: ![4,10,22].includes(pwIvaDefault) ? "#fff" : T.sub,
              fontSize: 12, fontWeight: 800,
            }}>{![4,10,22].includes(pwIvaDefault) ? `${pwIvaDefault}%` : "Altra"}</div>
          </div>
        </div>

        {/* Detrazione */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>Detrazione fiscale</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {DETRAZIONI_OPT.map(d => (
              <div key={d.id} onClick={() => updCM("detrazione", d.id)} style={{
                padding: "10px 8px", borderRadius: 8, cursor: "pointer", textAlign: "center" as any,
                background: pwDetr === d.id ? "#28A0A0" : "#fff",
                border: `1.5px solid ${pwDetr === d.id ? "#28A0A0" : T.bdr}`,
                color: pwDetr === d.id ? "#fff" : T.text,
                fontSize: 12, fontWeight: 800,
              }}>{d.l}</div>
            ))}
          </div>
        </div>

        {/* Sconto */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>Sconto commerciale</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
            {[0, 5, 10, 15, 20].map(p => (
              <div key={p} onClick={() => updCM("scontoPerc", p)} style={{
                padding: "8px 4px", borderRadius: 8, cursor: "pointer", textAlign: "center" as any,
                background: pwSconto === p ? "#0D1F1F" : "#fff",
                border: `1.5px solid ${pwSconto === p ? "#0D1F1F" : T.bdr}`,
                color: pwSconto === p ? "#fff" : T.text,
                fontSize: 12, fontWeight: 800,
              }}>{p === 0 ? "No" : p + "%"}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== SCHEDA NORMATIVA CONTESTUALE ===== */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F", marginBottom: 10 }}>Scheda normativa applicabile</div>
        <SchedaNormativa T={T} ivaPerc={pwIvaDefault} detrazione={pwDetr} />
      </div>

      {/* ===== CALCOLO LIVE ===== */}
      {imponibile > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0D1F1F, #28A0A0)", borderRadius: 14, padding: 16, marginBottom: 12, color: "#fff" }}>
          <div style={{ fontSize: 10, color: "#ffffff99", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" as any, marginBottom: 8 }}>Riepilogo fiscale</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ opacity: 0.8 }}>Imponibile</span>
            <span style={{ fontWeight: 700 }}>€ {fmt(imponibile)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ opacity: 0.8 }}>IVA {ivaPerc}%</span>
            <span style={{ fontWeight: 700 }}>€ {fmt(iva)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 6, borderTop: "1px solid #ffffff30", marginTop: 6, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>Totale fattura</span>
            <span style={{ fontWeight: 800 }}>€ {fmt(totale)}</span>
          </div>
          {detrPerc > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 10, opacity: 0.85 }}>
                <span>Detraibile {detrPerc}% in 10 anni</span>
                <span>− € {fmt(detraibile)}</span>
              </div>
              <div style={{ marginTop: 8, padding: 10, background: "#ffffff20", borderRadius: 8 }}>
                <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>Costo effettivo cliente</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>€ {fmt(costoEffettivo)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== TEMPLATE COMUNICAZIONE (se detrazione scelta) ===== */}
      {pwDetr !== "nessuna" && currentTpl && (
        <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>Messaggio al cliente</div>
            <div style={{ display: "flex", gap: 4, background: "#EEF8F8", borderRadius: 6, padding: 2 }}>
              <div onClick={() => setTplCanale("whatsapp")} style={{ padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700, background: tplCanale === "whatsapp" ? "#fff" : "transparent", color: tplCanale === "whatsapp" ? "#0D1F1F" : T.sub }}>WhatsApp</div>
              <div onClick={() => setTplCanale("email")} style={{ padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700, background: tplCanale === "email" ? "#fff" : "transparent", color: tplCanale === "email" ? "#0D1F1F" : T.sub }}>Email</div>
            </div>
          </div>

          {editingTplId === currentTpl.id ? (
            <div>
              <textarea value={tplDraft} onChange={e => setTplDraft(e.target.value)} style={{ width: "100%", minHeight: 240, padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit", resize: "vertical" as any, boxSizing: "border-box" as any }} />
              <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>
                Placeholder: {"{CLIENTE}"} {"{NUM_FATTURA}"} {"{DATA_FATTURA}"} {"{CF_BENEFICIARIO}"} {"{PIVA}"} {"{RAGIONE_SOCIALE}"} {"{IBAN}"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={saveEdit} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#28A0A0", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Salva</button>
                <button onClick={() => setEditingTplId(null)} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: "#fff", color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ padding: 10, borderRadius: 8, background: "#F8FBFB", border: `1px solid ${T.bdr}`, fontSize: 11, color: T.text, whiteSpace: "pre-wrap" as any, maxHeight: 220, overflowY: "auto" as any, lineHeight: 1.5 }}>
                {fiscale.renderTemplate(currentTpl.testo, vars)}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                {tplCanale === "whatsapp" ? (
                  <button onClick={() => sendWhatsApp(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.tipo)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#25d366", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    Invia via WhatsApp
                  </button>
                ) : (
                  <button onClick={() => sendEmail(fiscale.renderTemplate(currentTpl.testo, vars), currentTpl.oggetto || `Pratica ${DETR_LABEL[pwDetr]}`, currentTpl.tipo)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#28A0A0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    Invia via Email
                  </button>
                )}
                <button onClick={() => startEdit(currentTpl)} style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: "#fff", color: T.text, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Modifica
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTI CLIENTE ===== */}
      <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F", marginBottom: 10 }}>Documenti cliente</div>
        <TabFiscaleDocs
          T={T} ICO={ICO} I={I}
          detrazione={pwDetr}
          docs={fiscale.docs}
          onUpload={async (file, sotto_categoria) => fiscale.uploadDoc(file, { sotto_categoria, detrazione_rif: pwDetr })}
          onDelete={fiscale.deleteDoc}
          onStato={fiscale.updateDocStato}
        />
      </div>

      {/* ===== COMUNICAZIONI INVIATE ===== */}
      {fiscale.comunicazioni.length > 0 && (
        <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F", marginBottom: 10 }}>Comunicazioni inviate ({fiscale.comunicazioni.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" as any }}>
            {fiscale.comunicazioni.slice(0, 10).map(c => (
              <div key={c.id} style={{ padding: 8, borderRadius: 6, background: "#F8FBFB", border: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#28A0A0", textTransform: "uppercase" as any }}>{c.canale} · {c.template_tipo}</span>
                  <span style={{ fontSize: 9, color: T.sub }}>{new Date(c.inviato_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                  {c.destinatario} · {c.testo_inviato.substring(0, 80)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
