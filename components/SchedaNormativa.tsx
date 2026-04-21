// components/SchedaNormativa.tsx
// Scheda normativa contestuale: mostra regole + requisiti + trappole per IVA + Detrazione selezionate
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

type Props = {
  T: any;
  ivaPerc: number;
  detrazione: string;
};

export default function SchedaNormativa({ T, ivaPerc, detrazione }: Props) {
  const [normative, setNormative] = useState<Normativa[]>([]);
  const [openCodice, setOpenCodice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("fiscale_normative")
        .select("*")
        .eq("attivo", true);
      setNormative((data as Normativa[]) || []);
    })();
  }, []);

  // Codici normative correnti in base a selezione
  const ivaCodice = ivaPerc === 4 ? "iva_4" : ivaPerc === 10 ? "iva_10" : "iva_22";
  const detrCodice = detrazione !== "nessuna" ? `detr_${detrazione}` : null;

  const ivaN = normative.find(n => n.codice === ivaCodice);
  const detrN = detrCodice ? normative.find(n => n.codice === detrCodice) : null;
  const cumulN = normative.find(n => n.codice === "cumul_regole");

  // Alert combinazioni sbagliate
  const warn: string[] = [];
  if (ivaPerc === 4 && detrazione !== "nessuna") {
    warn.push("IVA 4% (prima casa nuova costruzione) è raramente compatibile con detrazione ristrutturazione 50/65/75 sullo stesso intervento. Verifica caso.");
  }
  if (ivaPerc === 22 && detrazione !== "nessuna") {
    warn.push("Hai selezionato IVA 22%. Per infissi residenziali di solito si applica IVA 10% (manutenzione straordinaria). Verifica se è corretto.");
  }

  const Card = ({ n, accent }: { n: Normativa; accent: string }) => {
    const isOpen = openCodice === n.codice;
    return (
      <div style={{
        background: "#fff", borderRadius: 10, border: `1.5px solid ${isOpen ? accent : "#E5E5E5"}`,
        marginBottom: 8, overflow: "hidden",
      }}>
        <div onClick={() => setOpenCodice(isOpen ? null : n.codice)} style={{
          padding: "12px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${accent}15`, color: accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 900, flexShrink: 0,
          }}>
            {n.codice.startsWith("iva") ? `${n.codice.split("_")[1]}%` :
              n.codice.startsWith("detr") ? `${n.codice.split("_")[1]}%` : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{n.titolo}</div>
            {n.sottotitolo && <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{n.sottotitolo}</div>}
          </div>
          <span style={{ fontSize: 14, color: T.sub, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
        </div>
        {isOpen && (
          <div style={{ padding: "0 14px 14px", borderTop: `1px solid #E5E5E5`, fontSize: 11, lineHeight: 1.55, color: T.text }}>
            <Section title="Quando si applica" text={n.quando_si_applica} accent={accent} />
            <Section title="Requisiti documentali" text={n.requisiti} accent={accent} />
            {n.massimale && <Section title="Massimale" text={n.massimale} accent={accent} />}
            {n.durata && <Section title="Durata recupero" text={n.durata} accent={accent} />}
            {n.note_operative && <Section title="Note operative" text={n.note_operative} accent="#28A0A0" />}
            {n.avvertenze && <Section title="⚠ Avvertenze" text={n.avvertenze} accent="#DC4444" />}
            {n.riferimento_legge && (
              <div style={{ marginTop: 10, fontSize: 10, color: T.sub, fontStyle: "italic" as any }}>
                Rif: {n.riferimento_legge}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Alert combinazioni */}
      {warn.length > 0 && (
        <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#FFF3E0", border: "1px solid #D08008" }}>
          {warn.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: "#6B4A08", fontWeight: 600 }}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Schede correnti */}
      {ivaN && <Card n={ivaN} accent="#28A0A0" />}
      {detrN && <Card n={detrN} accent="#0D1F1F" />}
      {detrN && cumulN && <Card n={cumulN} accent="#7B6BA5" />}

      {normative.length === 0 && (
        <div style={{ padding: 16, textAlign: "center" as any, fontSize: 11, color: T.sub, fontStyle: "italic" as any }}>
          Caricamento normative...
        </div>
      )}
    </div>
  );
}

function Section({ title, text, accent }: { title: string; text: string; accent: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: accent, marginBottom: 3, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>{title}</div>
      <div style={{ whiteSpace: "pre-wrap" as any, fontSize: 11, color: "#0D1F1F" }}>{text}</div>
    </div>
  );
}
