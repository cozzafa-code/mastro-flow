// components/TabFiscaleDocs.tsx
import { useRef, useState } from "react";
import type { DocFiscale } from "../hooks/useFiscale";

const F = {
  darkBg: "#0D1F1F", teal: "#28A0A0", lightBg: "#EEF8F8",
  cardBg: "#FFFFFF", border: "#C8E4E4", textDark: "#0D1F1F", textSub: "#6A8484",
};

type Props = {
  T: any; ICO: any; I: any;
  detrazione: string;
  docs: DocFiscale[];
  onUpload: (file: File, sotto_categoria: string) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onStato: (id: string, stato: string) => Promise<any>;
};

const DOCS_REQUIRED: Record<string, { key: string; label: string; obbligatorio: boolean; info?: string }[]> = {
  "50": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Causale art.16-bis DPR 917/86" },
    { key: "fattura", label: "Fattura intestata al proprietario", obbligatorio: true },
    { key: "cf_proprietario", label: "Codice fiscale proprietario", obbligatorio: true },
    { key: "enea", label: "Comunicazione ENEA", obbligatorio: false, info: "Solo se migliora classe energetica · 90gg" },
  ],
  "65": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Causale Legge 296/2006" },
    { key: "fattura", label: "Fattura al beneficiario", obbligatorio: true },
    { key: "scheda_tecnica", label: "Scheda tecnica infissi con Uw", obbligatorio: true, info: "Fornita da te" },
    { key: "asseverazione", label: "Asseverazione tecnico", obbligatorio: true, info: "Geometra/ing/arch" },
    { key: "enea", label: "Trasmissione ENEA", obbligatorio: true, info: "Obbligatoria entro 90gg" },
    { key: "ape", label: "APE pre e post", obbligatorio: false },
  ],
  "75": [
    { key: "bonifico_parlante", label: "Bonifico parlante", obbligatorio: true, info: "Causale art.119-ter DL 34/2020" },
    { key: "fattura", label: "Fattura con descrizione DM 236/89", obbligatorio: true },
    { key: "dichiarazione_conformita", label: "Dichiarazione conformità DM 236/89", obbligatorio: true, info: "Preparata da te" },
    { key: "cila_scia", label: "CILA/SCIA al Comune", obbligatorio: false, info: "Solo se richiesta" },
  ],
};

export default function TabFiscaleDocs({ detrazione, docs, onUpload, onDelete, onStato }: Props) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingKey, setPendingKey] = useState<string>("");

  if (detrazione === "nessuna" || !DOCS_REQUIRED[detrazione]) {
    return (
      <div style={{
        padding: "20px 10px", textAlign: "center" as any, color: F.textSub,
        fontSize: 12, fontStyle: "italic" as any,
      }}>
        Seleziona una detrazione per vedere i documenti richiesti
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

  const triggerUpload = (key: string) => { setPendingKey(key); fileRef.current?.click(); };
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
      {/* Progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: F.teal, textTransform: "uppercase" as any, letterSpacing: "0.5px" }}>
            Pratica {detrazione}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: pct === 100 ? F.teal : F.textSub }}>
            {completed}/{total} · {pct}%
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: F.lightBg, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: pct === 100 ? F.teal : `${F.teal}99`,
            transition: "width .3s",
          }} />
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {required.map(req => {
          const doc = docs.find(d => d.sotto_categoria === req.key);
          const caricato = !!doc;
          const verificato = doc?.stato === "verificato";

          return (
            <div key={req.key} style={{
              padding: 12, borderRadius: 10,
              border: `1px solid ${verificato ? F.teal : caricato ? `${F.teal}60` : F.border}`,
              background: caricato ? F.lightBg : "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: verificato ? F.teal : caricato ? `${F.teal}22` : "#E5EBEB",
                  color: verificato ? "#fff" : caricato ? F.teal : "#9AABAB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900, border: caricato && !verificato ? `1.5px solid ${F.teal}` : "none",
                }}>
                  {verificato ? "✓" : caricato ? "•" : ""}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: F.textDark }}>
                    {req.label}
                    {req.obbligatorio && <span style={{ color: F.teal, marginLeft: 4 }}>*</span>}
                  </div>
                  {req.info && (
                    <div style={{ fontSize: 10, color: F.textSub, marginTop: 2, fontWeight: 500 }}>
                      {req.info}
                    </div>
                  )}

                  {caricato && doc && (
                    <div style={{
                      marginTop: 8, padding: "8px 10px", background: "#fff",
                      borderRadius: 6, border: `1px solid ${F.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: F.textSub, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                          {doc.nome}
                        </span>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" style={{
                            fontSize: 10, color: F.teal, fontWeight: 800,
                            textDecoration: "none", padding: "3px 8px",
                            border: `1px solid ${F.teal}`, borderRadius: 4,
                          }}>APRI</a>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {!verificato ? (
                          <button onClick={() => onStato(doc.id, "verificato")} style={{
                            padding: "5px 10px", borderRadius: 5, border: "none",
                            background: F.teal, color: "#fff", fontSize: 10, fontWeight: 800,
                            cursor: "pointer", fontFamily: "inherit" as any,
                          }}>Verifica</button>
                        ) : (
                          <button onClick={() => onStato(doc.id, "caricato")} style={{
                            padding: "5px 10px", borderRadius: 5,
                            border: `1px solid ${F.border}`, background: "#fff",
                            color: F.textSub, fontSize: 10, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit" as any,
                          }}>Annulla verifica</button>
                        )}
                        <button onClick={() => { if (confirm("Eliminare il documento?")) onDelete(doc.id); }} style={{
                          padding: "5px 10px", borderRadius: 5,
                          border: `1px solid ${F.border}`, background: "#fff",
                          color: F.textSub, fontSize: 10, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit" as any,
                        }}>Elimina</button>
                      </div>
                    </div>
                  )}

                  {!caricato && (
                    <button onClick={() => triggerUpload(req.key)} disabled={uploadingKey === req.key} style={{
                      marginTop: 8, padding: "7px 12px", borderRadius: 6,
                      border: `1px solid ${F.teal}`, background: "#fff", color: F.teal,
                      fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" as any,
                    }}>
                      {uploadingKey === req.key ? "Caricamento…" : "+ Carica"}
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
