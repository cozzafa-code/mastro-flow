// components/SchedaNormativa.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const F = {
  darkBg: "#0D1F1F", teal: "#28A0A0", lightBg: "#EEF8F8",
  border: "#C8E4E4", textDark: "#0D1F1F", textSub: "#6A8484",
  warn: "#D08008", danger: "#DC4444",
};

type Normativa = {
  id: string;
  categoria: string;
  codice: string;
  titolo: string;
  sottotitolo: string | null;
  quando_si_applica: string;
  requisiti: string;
  massimale: string | null;
  durata: string | null;
  riferimento_legge: string | null;
  note_operative: string | null;
  avvertenze: string | null;
};

type Props = { T: any; ivaPerc: number; detrazione: string };

export default function SchedaNormativa({ ivaPerc, detrazione }: Props) {
  const [normative, setNormative] = useState<Normativa[]>([]);
  const [openCodice, setOpenCodice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("fiscale_normative").select("*").eq("attivo", true);
      setNormative((data as Normativa[]) || []);
    })();
  }, []);

  const ivaCodice = ivaPerc === 4 ? "iva_4" : ivaPerc === 10 ? "iva_10" : "iva_22";
  const detrCodice = detrazione !== "nessuna" ? `detr_${detrazione}` : null;

  const ivaN = normative.find(n => n.codice === ivaCodice);
  const detrN = detrCodice ? normative.find(n => n.codice === detrCodice) : null;
  const cumulN = normative.find(n => n.codice === "cumul_regole");

  const warn: string[] = [];
  if (ivaPerc === 4 && detrazione !== "nessuna") {
    warn.push("IVA 4% è compatibile con detrazione solo in casi specifici di nuova costruzione. Verifica con commercialista.");
  }
  if (ivaPerc === 22 && detrazione !== "nessuna") {
    warn.push("Hai selezionato IVA 22%. Per infissi residenziali di solito si applica IVA 10% (manutenzione straordinaria). Verifica se è corretto.");
  }

  const Card = ({ n }: { n: Normativa }) => {
    const isOpen = openCodice === n.codice;
    const code = n.codice.startsWith("iva") ? `${n.codice.split("_")[1]}%` :
                 n.codice.startsWith("detr") ? `${n.codice.split("_")[1]}%` : "i";
    return (
      <div style={{
        background: "#fff", borderRadius: 10,
        border: `1px solid ${isOpen ? F.teal : F.border}`,
        marginBottom: 6, overflow: "hidden", transition: "border-color .15s",
      }}>
        <div onClick={() => setOpenCodice(isOpen ? null : n.codice)} style={{
          padding: "11px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: F.lightBg, color: F.teal,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, flexShrink: 0, letterSpacing: "-0.3px",
          }}>
            {code}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: F.textDark }}>{n.titolo}</div>
            {n.sottotitolo && (
              <div style={{ fontSize: 10, color: F.textSub, marginTop: 1, fontWeight: 500 }}>
                {n.sottotitolo}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 14, color: F.textSub,
            transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s",
          }}>›</span>
        </div>
        {isOpen && (
          <div style={{
            padding: "12px", borderTop: `1px solid ${F.border}`,
            background: F.lightBg, fontSize: 11, lineHeight: 1.55,
          }}>
            <Section label="Quando si applica" text={n.quando_si_applica} />
            <Section label="Requisiti documentali" text={n.requisiti} />
            {n.massimale && <Section label="Massimale" text={n.massimale} />}
            {n.durata && <Section label="Durata recupero" text={n.durata} />}
            {n.note_operative && <Section label="Note operative" text={n.note_operative} />}
            {n.avvertenze && <Section label="Avvertenze" text={n.avvertenze} warn />}
            {n.riferimento_legge && (
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: `1px solid ${F.border}`,
                fontSize: 9, color: F.textSub, fontStyle: "italic" as any,
              }}>
                Riferimento: {n.riferimento_legge}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {warn.length > 0 && warn.map((w, i) => (
        <div key={i} style={{
          marginBottom: 8, padding: "10px 12px", borderRadius: 8,
          background: "#FFF4E0", border: `1px solid ${F.warn}40`,
          fontSize: 11, color: "#6B4A08", lineHeight: 1.5, fontWeight: 600,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <span style={{ color: F.warn, fontWeight: 900 }}>⚠</span>
          <span>{w}</span>
        </div>
      ))}

      {ivaN && <Card n={ivaN} />}
      {detrN && <Card n={detrN} />}
      {detrN && cumulN && <Card n={cumulN} />}

      {normative.length === 0 && (
        <div style={{ padding: "16px 10px", textAlign: "center" as any, fontSize: 11, color: F.textSub, fontStyle: "italic" as any }}>
          Caricamento normative…
        </div>
      )}
    </div>
  );
}

function Section({ label, text, warn }: { label: string; text: string; warn?: boolean }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontSize: 9, fontWeight: 800,
        color: warn ? F.danger : F.teal,
        marginBottom: 3, textTransform: "uppercase" as any, letterSpacing: "0.6px",
      }}>
        {warn && "⚠ "}{label}
      </div>
      <div style={{ whiteSpace: "pre-wrap" as any, fontSize: 11, color: F.textDark }}>
        {text}
      </div>
    </div>
  );
}
