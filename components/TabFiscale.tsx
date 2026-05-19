// components/TabFiscale.tsx
// Tab Fiscale — stile unificato Centro Comando / RILIEVO MISURE
import { useState } from "react";
import { useFiscale } from "../hooks/useFiscale";
import TabFiscaleDocs from "./TabFiscaleDocs";
import SchedaNormativa from "./SchedaNormativa";
import WizardFiscale from "./WizardFiscale";
import TabFiscaleHero from "./TabFiscaleHero";
import TabFiscaleTemplate from "./TabFiscaleTemplate";
import { FISCALE_TOKENS as F, DETR_LABEL, TEMPLATE_MAP } from "../lib/fiscale/tokens";

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

export default function TabFiscale({
  T, ICO, I, commessa, aziendaInfo, DETRAZIONI_OPT,
  updCM, pwIvaDefault, pwDetr, pwSconto,
}: Props) {
  const aziendaId = aziendaInfo?.id || "ccca51c1-656b-4e7c-a501-55753e20da29";
  const fiscale = useFiscale(commessa?.id || null, aziendaId);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardDocs, setWizardDocs] = useState<any[]>([]);
  const [wizardMotivazione, setWizardMotivazione] = useState<string>("");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);

  const imponibile = Number(commessa?.totale_imponibile || commessa?.totale || 0);
  const ivaPerc = pwIvaDefault || 22;
  const iva = imponibile * ivaPerc / 100;
  const totale = imponibile + iva;
  const detrPerc = pwDetr && pwDetr !== "nessuna" ? Number(pwDetr) : 0;
  const detraibile = totale * detrPerc / 100;
  const costoEffettivo = totale - detraibile;

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tplTipo = TEMPLATE_MAP[pwDetr] || "";

  const generaPDF = async () => {
    if (!fiscale.pratica?.id) { setPdfMsg("Completa prima il wizard"); return; }
    setPdfGenerating(true);
    setPdfMsg(null);
    try {
      const res = await fetch("/api/fiscale/pdf/genera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praticaId: fiscale.pratica.id }),
      });
      const j = await res.json();
      if (j.ok) { setPdfMsg(`✓ ${j.urls?.length || 0} PDF generati`); fiscale.reload?.(); }
      else setPdfMsg(`✗ ${j.error || "errore generazione"}`);
    } catch (e: any) {
      setPdfMsg(`✗ ${e.message || "errore rete"}`);
    } finally {
      setPdfGenerating(false);
      setTimeout(() => setPdfMsg(null), 4000);
    }
  };

  const card = {
    background: F.cardBg, borderRadius: F.radius, border: `1px solid ${F.border}`,
    padding: 14, marginBottom: F.spacing,
  };
  const label = {
    fontSize: 10, fontWeight: 700, color: F.teal, marginBottom: 6,
    textTransform: "uppercase" as any, letterSpacing: "0.6px",
  };
  const title = {
    fontSize: 13, fontWeight: 800, color: F.textDark, marginBottom: 12,
  };

  return (
    <div style={{ padding: "0 12px 20px", background: F.lightBg, minHeight: "100%" }}>

      <TabFiscaleHero
        wizardMotivazione={wizardMotivazione}
        pdfGenerating={pdfGenerating}
        pdfMsg={pdfMsg}
        hasPratica={!!fiscale.pratica?.id}
        onAvviaWizard={() => setShowWizard(true)}
        onGeneraPDF={generaPDF}
      />

      {/* ===== SETTINGS ===== */}
      <div style={card}>
        <div style={title}>Impostazioni fiscali</div>
        <Chips label="Aliquota IVA" cols={4}>
          {[4, 10, 22].map(p => (
            <Chip key={p} selected={pwIvaDefault === p} onClick={() => updCM("ivaPerc", p)}>{p}%</Chip>
          ))}
          <Chip
            selected={![4,10,22].includes(pwIvaDefault)}
            onClick={() => { const v = prompt("IVA personalizzata (%)", String(pwIvaDefault)); if (v != null) { const n = parseFloat(v); if (!isNaN(n)) updCM("ivaPerc", n); } }}
          >
            {![4,10,22].includes(pwIvaDefault) ? `${pwIvaDefault}%` : "Altra"}
          </Chip>
        </Chips>

        <Chips label="Detrazione fiscale" cols={2} pad="12px 8px">
          {DETRAZIONI_OPT.map(d => (
            <Chip key={d.id} selected={pwDetr === d.id} onClick={() => updCM("detrazione", d.id)}>{d.l}</Chip>
          ))}
        </Chips>

        <Chips label="Sconto commerciale" cols={5} pad="9px 4px" last>
          {[0, 5, 10, 15, 20].map(p => (
            <Chip key={p} selected={pwSconto === p} onClick={() => updCM("scontoPerc", p)}>{p === 0 ? "No" : p + "%"}</Chip>
          ))}
        </Chips>
      </div>

      {/* ===== CALCOLO LIVE ===== */}
      {imponibile > 0 && (
        <div style={{ ...card, background: F.darkBg, border: "none", color: "#fff" }}>
          <div style={{ ...label, color: F.teal, marginBottom: 10 }}>Riepilogo</div>
          <Row k="Imponibile" v={`€ ${fmt(imponibile)}`} />
          <Row k={`IVA ${ivaPerc}%`} v={`€ ${fmt(iva)}`} />
          <div style={{ height: 1, background: "#ffffff18", margin: "8px 0" }} />
          <Row k="Totale fattura" v={`€ ${fmt(totale)}`} big />
          {detrPerc > 0 && (
            <>
              <Row k={`Detraibile ${detrPerc}%`} v={`− € ${fmt(detraibile)}`} faded />
              <div style={{
                marginTop: 12, padding: 12, background: "#ffffff12",
                borderRadius: F.radiusSmall, border: `1px solid ${F.teal}60`,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, textTransform: "uppercase" as any, letterSpacing: "0.7px", marginBottom: 3 }}>
                  Costo effettivo cliente
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
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
        <SchedaNormativa T={T} ivaPerc={pwIvaDefault} detrazione={pwDetr} commessa={commessa} azienda={aziendaInfo} />
      </div>

      {/* ===== TEMPLATE + DOCS GENERATI + DOCS CLIENTE + LOG ===== */}
      <TabFiscaleTemplate
        T={T} ICO={ICO} I={I}
        fiscale={fiscale}
        commessa={commessa}
        aziendaInfo={aziendaInfo}
        pwDetr={pwDetr}
        tplTipo={tplTipo}
        wizardDocs={wizardDocs}
      />

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
              onDecisione={(dec, _inp) => {
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

// ───── Helpers ─────
function Row({ k, v, big, faded }: { k: string; v: string; big?: boolean; faded?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontSize: big ? 13 : 11, opacity: faded ? 0.7 : 0.85, fontWeight: big ? 700 : 500 }}>{k}</span>
      <span style={{ fontSize: big ? 15 : 12, fontWeight: big ? 800 : 700 }}>{v}</span>
    </div>
  );
}

function Chips({ label, cols, pad, last, children }: { label: string; cols: number; pad?: string; last?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: last ? 0 : 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: F.teal, marginBottom: 6, textTransform: "uppercase" as any, letterSpacing: "0.6px" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }} data-pad={pad}>{children}</div>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClick} style={{
      padding: "11px 6px", borderRadius: F.radiusSmall, cursor: "pointer",
      textAlign: "center", fontSize: 13, fontWeight: 700,
      background: selected ? F.teal : F.lightBg,
      color: selected ? "#fff" : F.textDark,
      border: `1px solid ${selected ? F.teal : F.border}`,
      transition: "all .15s",
    }}>{children}</div>
  );
}
