// components/TabFiscaleDocs.tsx
// Checklist documenti cliente + upload + stato
import { useRef, useState } from "react";
import type { DocFiscale } from "../hooks/useFiscale";

type Props = {
  T: any; ICO: any; I: any;
  detrazione: string;     // "nessuna" | "50" | "65" | "75"
  docs: DocFiscale[];
  onUpload: (file: File, sotto_categoria: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onStato: (id: string, stato: string) => Promise<any>;
};

// Documenti richiesti per ciascuna detrazione
const DOCS_REQUIRED: Record<string, { key: string; label: string; obbligatorio: boolean; info?: string }[]> = {
  "50": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Con causale specifica art.16-bis DPR 917/86" },
    { key: "fattura", label: "Fattura intestata al proprietario", obbligatorio: true },
    { key: "cf_proprietario", label: "Codice fiscale proprietario", obbligatorio: true },
    { key: "enea", label: "Comunicazione ENEA (se migliora classe)", obbligatorio: false, info: "Entro 90gg fine lavori" },
  ],
  "65": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Causale Legge 296/2006" },
    { key: "fattura", label: "Fattura al beneficiario", obbligatorio: true },
    { key: "scheda_tecnica", label: "Scheda tecnica infissi con Uw", obbligatorio: true, info: "Fornita da te" },
    { key: "asseverazione", label: "Asseverazione tecnico abilitato", obbligatorio: true, info: "Geometra/ing/arch" },
    { key: "enea", label: "Trasmissione ENEA", obbligatorio: true, info: "OBBLIGATORIA entro 90gg" },
    { key: "ape", label: "APE pre e post (se richiesto)", obbligatorio: false },
  ],
  "75": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Causale art.119-ter DL 34/2020" },
    { key: "fattura", label: "Fattura con descrizione DM 236/89", obbligatorio: true },
    { key: "dichiarazione_conformita", label: "Dichiarazione conformità DM 236/89", obbligatorio: true, info: "Preparata da te" },
    { key: "cila_scia", label: "CILA/SCIA al Comune", obbligatorio: false, info: "Solo se richiesta" },
  ],
};

export default function TabFiscaleDocs({ T, ICO, I, detrazione, docs, onUpload, onDelete, onStato }: Props) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingKey, setPendingKey] = useState<string>("");

  if (detrazione === "nessuna" || !DOCS_REQUIRED[detrazione]) {
    return (
      <div style={{ padding: 20, textAlign: "center" as any, color: T.sub, fontSize: 12, fontStyle: "italic" }}>
        Seleziona una detrazione per vedere i documenti richiesti.
      </div>
    );
  }

  const required = DOCS_REQUIRED[detrazione];
  const total = required.length;
  const completed = required.filter(r => {
    const doc = docs.find(d => d.sotto_categoria === r.key);
    return doc && (doc.stato === "caricato" || doc.stato === "verificato");
  }).length;
  const pct = Math.round((completed / total) * 100);

  const triggerUpload = (key: string) => {
    setPendingKey(key);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !pendingKey) return;
    setUploadingKey(pendingKey);
    await onUpload(file, pendingKey);
    setUploadingKey(null);
    setPendingKey("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Pratica {detrazione}%</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? "#28A0A0" : T.sub }}>{completed}/{total} · {pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#EEF8F8", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#28A0A0" : "#28A0A099", transition: "width .3s" }} />
        </div>
      </div>

      {/* Lista documenti */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {required.map(req => {
          const doc = docs.find(d => d.sotto_categoria === req.key);
          const caricato = !!doc;
          const verificato = doc?.stato === "verificato";

          return (
            <div key={req.key} style={{
              padding: 12, borderRadius: 10, border: `1.5px solid ${caricato ? (verificato ? "#28A0A0" : "#C8E4E4") : "#E5E5E5"}`,
              background: caricato ? "#F4F9F9" : "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                {/* Check icon */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: verificato ? "#28A0A0" : caricato ? "#28A0A033" : "#E5E5E5",
                  color: verificato ? "#fff" : caricato ? "#28A0A0" : "#999",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900, marginTop: 1,
                }}>
                  {verificato ? "✓" : caricato ? "•" : ""}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                    {req.label}
                    {req.obbligatorio && <span style={{ color: "#DC4444", marginLeft: 4 }}>*</span>}
                  </div>
                  {req.info && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{req.info}</div>}

                  {caricato && doc && (
                    <div style={{ marginTop: 6, padding: "6px 8px", background: "#fff", borderRadius: 6, border: `1px solid ${T.bdr}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: T.sub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📎 {doc.nome}
                        </span>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#28A0A0", fontWeight: 700, textDecoration: "none" }}>APRI</a>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        {!verificato && (
                          <button onClick={() => onStato(doc.id, "verificato")} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#28A0A0", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            ✓ Verifica
                          </button>
                        )}
                        {verificato && (
                          <button onClick={() => onStato(doc.id, "caricato")} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: "#fff", color: T.sub, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            Annulla verifica
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Eliminare il documento?")) onDelete(doc.id); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: "#fff", color: "#DC4444", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}

                  {!caricato && (
                    <button onClick={() => triggerUpload(req.key)} disabled={uploadingKey === req.key} style={{
                      marginTop: 6, padding: "6px 10px", borderRadius: 6,
                      border: `1px solid #28A0A0`, background: "#fff", color: "#28A0A0",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {uploadingKey === req.key ? "Caricamento..." : "+ Carica documento"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="application/pdf,image/*" onChange={handleFileChange} style={{ display: "none" }} />
    </div>
  );
}
