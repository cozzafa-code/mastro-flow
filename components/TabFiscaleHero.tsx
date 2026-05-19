// components/TabFiscaleHero.tsx
// Hero dark card con 2 bottoni integrati (stile Centro Comando / RILIEVO MISURE)
import { FISCALE_TOKENS as F } from "../lib/fiscale/tokens";

type Props = {
  wizardMotivazione: string;
  pdfGenerating: boolean;
  pdfMsg: string | null;
  hasPratica: boolean;
  onAvviaWizard: () => void;
  onGeneraPDF: () => void;
};

export default function TabFiscaleHero({
  wizardMotivazione, pdfGenerating, pdfMsg, hasPratica,
  onAvviaWizard, onGeneraPDF,
}: Props) {
  const btnOnDark = {
    padding: "10px 14px", borderRadius: F.radiusSmall,
    background: F.teal, color: "#fff", fontSize: 12, fontWeight: 700,
    border: "none", cursor: "pointer", fontFamily: "inherit" as any,
  };
  const btnOnDarkOutlined = {
    padding: "10px 14px", borderRadius: F.radiusSmall,
    background: "transparent", color: "#fff", fontSize: 12, fontWeight: 700,
    border: `1px solid #ffffff40`, cursor: (pdfGenerating || !hasPratica) ? "not-allowed" as any : "pointer" as any,
    opacity: (pdfGenerating || !hasPratica) ? 0.5 : 1,
    fontFamily: "inherit" as any,
  };

  return (
    <div style={{
      background: F.darkBg, borderRadius: F.radius, padding: 16,
      marginBottom: F.spacing, color: "#fff",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: F.teal, letterSpacing: "0.7px",
        textTransform: "uppercase", marginBottom: 4,
      }}>
        Pratica fiscale
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.2px", marginBottom: 12 }}>
        {wizardMotivazione ? "Configurazione attiva" : "Wizard · 5 domande"}
      </div>
      {wizardMotivazione && (
        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.55, marginBottom: 12 }}>
          {wizardMotivazione}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={onAvviaWizard} style={btnOnDark}>
          {wizardMotivazione ? "Rifai wizard" : "Avvia wizard"}
        </button>
        <button onClick={onGeneraPDF} disabled={pdfGenerating || !hasPratica} style={btnOnDarkOutlined}>
          {pdfGenerating ? "Generazione…" : "Genera PDF"}
        </button>
      </div>
      {pdfMsg && (
        <div style={{
          marginTop: 10, fontSize: 11,
          color: pdfMsg.startsWith("✓") ? "#8FE3C2" : "#FFB0B0",
        }}>
          {pdfMsg}
        </div>
      )}
    </div>
  );
}
