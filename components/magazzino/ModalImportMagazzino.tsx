"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// Campi target nel DB
const CAMPI_TARGET = [
  { key: "codice", label: "Codice", required: true, aliases: ["codice", "code", "sku", "articolo", "cod", "codice articolo", "codice_articolo"] },
  { key: "nome", label: "Nome / descrizione", required: true, aliases: ["nome", "descrizione", "name", "description", "desc", "articolo", "prodotto"] },
  { key: "tipo", label: "Tipo", required: false, aliases: ["tipo", "categoria", "type", "category", "famiglia"] },
  { key: "unita_misura", label: "UM", required: false, aliases: ["um", "unita", "unita_misura", "unit", "udm", "u.m.", "misura"] },
  { key: "prezzo_acquisto", label: "Prezzo acquisto", required: false, aliases: ["prezzo", "prezzo_acquisto", "costo", "price", "cost", "prezzo acquisto", "prezzo unitario"] },
  { key: "prezzo_vendita", label: "Prezzo vendita", required: false, aliases: ["prezzo_vendita", "vendita", "sell_price", "prezzo vendita"] },
  { key: "scorta_attuale", label: "Scorta attuale", required: false, aliases: ["scorta", "scorta_attuale", "qta", "quantita", "qty", "stock", "giacenza", "disponibile"] },
  { key: "scorta_minima", label: "Scorta minima", required: false, aliases: ["scorta_minima", "minimo", "min_stock", "scorta min", "minimo riordino"] },
  { key: "scaffale", label: "Scaffale", required: false, aliases: ["scaffale", "posizione", "location", "ubicazione", "shelf"] },
  { key: "fornitore_nome", label: "Fornitore", required: false, aliases: ["fornitore", "supplier", "vendor", "produttore", "marca"] },
  { key: "ean", label: "EAN / barcode", required: false, aliases: ["ean", "barcode", "codice_barre", "gtin"] },
];

interface Props {
  aziendaId: string;
  onClose: () => void;
  onDone: () => void;
}

export default function ModalImportMagazzino({ aziendaId, onClose, onDone }: Props) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // db_field -> csv_header
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // PARSING FILE
  // ============================================================

  const handleFile = async (file: File) => {
    setErr(null);
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    try {
      let parsedRows: any[] = [];
      let parsedHeaders: string[] = [];

      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const { headers: h, rows: r } = parseCSV(text);
        parsedHeaders = h;
        parsedRows = r;
      } else if (ext === "xlsx" || ext === "xls") {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
        if (json.length === 0) throw new Error("Foglio vuoto");
        parsedHeaders = (json[0] as string[]).map(h => String(h || "").trim());
        parsedRows = json.slice(1).map(r => {
          const obj: Record<string, any> = {};
          parsedHeaders.forEach((h, i) => { obj[h] = r[i] ?? ""; });
          return obj;
        }).filter(r => Object.values(r).some(v => v !== "" && v !== null && v !== undefined));
      } else if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("JSON deve essere un array di oggetti");
        if (data.length === 0) throw new Error("JSON vuoto");
        parsedHeaders = Object.keys(data[0]);
        parsedRows = data;
      } else {
        throw new Error(`Formato .${ext} non supportato. Usa CSV, XLSX o JSON.`);
      }

      if (parsedRows.length === 0) throw new Error("File senza righe dati");

      setHeaders(parsedHeaders);
      setRows(parsedRows);

      // Auto-mapping intelligente
      const autoMap: Record<string, string> = {};
      for (const t of CAMPI_TARGET) {
        for (const h of parsedHeaders) {
          const hLow = h.toLowerCase().trim();
          if (t.aliases.some(a => hLow === a || hLow.includes(a) || a.includes(hLow))) {
            if (!Object.values(autoMap).includes(h)) {
              autoMap[t.key] = h;
              break;
            }
          }
        }
      }
      setMapping(autoMap);
      setStep("mapping");
    } catch (e: any) {
      setErr(e.message || "Errore parsing file");
    }
  };

  // ============================================================
  // IMPORT FINALE
  // ============================================================

  const eseguiImport = async () => {
    if (!mapping.codice || !mapping.nome) {
      setErr("Mappatura Codice e Nome obbligatoria");
      return;
    }
    setStep("importing");
    setErr(null);

    const righeMappate = rows.map(row => {
      const out: Record<string, any> = {};
      for (const [dbKey, csvKey] of Object.entries(mapping)) {
        if (csvKey && row[csvKey] !== undefined) {
          out[dbKey] = String(row[csvKey] ?? "").trim();
        }
      }
      return out;
    }).filter(r => r.codice);

    try {
      // Chunking: 500 righe alla volta per evitare timeout
      const chunkSize = 500;
      const totaleChunks = Math.ceil(righeMappate.length / chunkSize);
      let totCreati = 0, totAggiornati = 0;
      const tuttiErrori: any[] = [];

      for (let i = 0; i < totaleChunks; i++) {
        const chunk = righeMappate.slice(i * chunkSize, (i + 1) * chunkSize);
        const { data, error } = await supabase.rpc("magazzino_import_bulk", { p_righe: chunk });
        if (error) throw new Error(error.message);
        if (data?.ok) {
          totCreati += data.creati || 0;
          totAggiornati += data.aggiornati || 0;
          if (Array.isArray(data.errori)) tuttiErrori.push(...data.errori);
        }
      }

      setResult({
        creati: totCreati,
        aggiornati: totAggiornati,
        errori: tuttiErrori,
        totale: righeMappate.length,
      });
      setStep("done");
    } catch (e: any) {
      setErr(e.message || "Errore import");
      setStep("preview");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 520, maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
          color: "#fff", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
              IMPORT MAGAZZINO
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {step === "upload" && "Carica file"}
              {step === "mapping" && "Mappa colonne"}
              {step === "preview" && `Conferma · ${rows.length} righe`}
              {step === "importing" && "Importazione in corso..."}
              {step === "done" && "Completato"}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {err && (
            <div style={{
              padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
              background: "#FCE3E3", color: RED, marginBottom: 10,
              fontWeight: 700, borderLeft: `3px solid ${RED}`,
            }}>{err}</div>
          )}

          {step === "upload" && (
            <>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                style={{
                  border: `2px dashed ${dragOver ? TEAL : "#D8DEE5"}`,
                  borderRadius: 14, padding: "30px 20px",
                  textAlign: "center", cursor: "pointer",
                  background: dragOver ? "rgba(40,160,160,0.08)" : "#fff",
                  marginBottom: 14,
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 11px",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginBottom: 5 }}>
                  Trascina qui il file
                </div>
                <div style={{ fontSize: 11, color: MUTED }}>
                  oppure clicca per scegliere
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 8, fontWeight: 600 }}>
                  CSV · XLSX · XLS · JSON · TXT
                </div>
                <input
                  ref={inputRef} type="file"
                  accept=".csv,.xlsx,.xls,.json,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              <div style={{
                background: "#fff", borderRadius: 10, padding: 12,
                border: "1px solid #E5EAF0", fontSize: 11, lineHeight: 1.6, color: NAVY,
              }}>
                <div style={{ fontWeight: 800, color: TEAL, marginBottom: 6, fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Suggerimenti
                </div>
                <div><b>Excel</b>: salva il foglio come .xlsx o esporta CSV (UTF-8)</div>
                <div><b>Prima riga</b>: deve contenere i nomi colonna</div>
                <div><b>UPSERT</b>: articoli esistenti (stesso codice) verranno aggiornati</div>
                <div><b>Colonne minime</b>: <i>Codice + Nome</i> (le altre opzionali)</div>
              </div>

              {/* Template scaricabile */}
              <button onClick={scaricaTemplate} style={{
                width: "100%", marginTop: 11, padding: 11,
                background: "#fff", color: TEAL, border: `1.5px solid ${TEAL}`,
                borderRadius: 9, fontSize: 11, fontWeight: 800,
                letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Scarica template CSV
              </button>
            </>
          )}

          {step === "mapping" && (
            <>
              <div style={{
                background: "#E3EDF9", borderLeft: `3px solid #2D5A8C`,
                padding: "9px 11px", borderRadius: 8, marginBottom: 11,
                fontSize: 11, color: "#2D5A8C",
              }}>
                File: <b>{fileName}</b> · {rows.length} righe rilevate
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 11 }}>
                Verifica e aggiusta la corrispondenza tra colonne file e campi magazzino.
              </div>

              {CAMPI_TARGET.map(t => (
                <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: NAVY }}>
                    {t.label} {t.required && <span style={{ color: RED }}>*</span>}
                  </div>
                  <select
                    value={mapping[t.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [t.key]: e.target.value })}
                    style={{
                      flex: 1.3, padding: "8px 10px",
                      border: `1px solid ${t.required && !mapping[t.key] ? RED : "#D8DEE5"}`,
                      borderRadius: 7, fontSize: 11.5, color: NAVY, fontWeight: 600,
                      outline: "none", background: "#fff",
                    }}
                  >
                    <option value="">-- ignora --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </>
          )}

          {step === "preview" && (
            <>
              <div style={{
                background: "#FBF0DC", borderLeft: `3px solid ${AMBER}`,
                padding: "9px 11px", borderRadius: 8, marginBottom: 11,
                fontSize: 11, color: "#8B6926", fontWeight: 700,
              }}>
                Anteprima prime 5 righe · {rows.length} totali · gli articoli esistenti saranno aggiornati
              </div>
              <div style={{
                background: "#fff", borderRadius: 9, padding: 10,
                border: "1px solid #E5EAF0", marginBottom: 10,
                fontSize: 10, overflowX: "auto",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                  <thead>
                    <tr>
                      {Object.entries(mapping).filter(([_,v]) => v).map(([k]) => (
                        <th key={k} style={{
                          padding: "5px 9px", textAlign: "left",
                          fontSize: 9, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: 0.3,
                          borderBottom: `1px solid ${TEAL}`,
                        }}>{CAMPI_TARGET.find(c => c.key === k)?.label || k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        {Object.entries(mapping).filter(([_,v]) => v).map(([k, csvKey]) => (
                          <td key={k} style={{
                            padding: "5px 9px", fontSize: 10.5,
                            color: NAVY, fontWeight: 600,
                            borderBottom: "1px solid #F1F4F7",
                          }}>{String(r[csvKey] ?? "—").substring(0, 30)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {step === "importing" && (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{
                width: 50, height: 50, border: `4px solid #E5EAF0`,
                borderTopColor: TEAL, borderRadius: "50%",
                margin: "0 auto 14px", animation: "spin 1s linear infinite",
              }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                Sto importando {rows.length} articoli...
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {step === "done" && result && (
            <>
              <div style={{
                background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`,
                color: "#fff", borderRadius: 13, padding: 18,
                marginBottom: 11, textAlign: "center",
              }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Import completato</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
                  {result.totale} righe processate
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 11 }}>
                <StatBox label="Creati" value={result.creati} color={GREEN} />
                <StatBox label="Aggiornati" value={result.aggiornati} color={TEAL} />
                <StatBox label="Errori" value={result.errori.length} color={result.errori.length > 0 ? RED : MUTED} />
              </div>

              {result.errori.length > 0 && (
                <div style={{
                  background: "#fff", borderRadius: 9, padding: 11,
                  border: `1px solid ${RED}`, fontSize: 10.5,
                  maxHeight: 150, overflowY: "auto",
                }}>
                  <div style={{ fontWeight: 800, color: RED, marginBottom: 6 }}>
                    {result.errori.length} righe con errori:
                  </div>
                  {result.errori.slice(0, 10).map((e: any, i: number) => (
                    <div key={i} style={{
                      padding: "4px 0", borderBottom: "1px solid #F1F4F7",
                      color: NAVY,
                    }}>
                      <b>{e.codice || "(senza codice)"}</b>: {e.errore}
                    </div>
                  ))}
                  {result.errori.length > 10 && (
                    <div style={{ marginTop: 6, color: MUTED, fontSize: 9.5 }}>
                      ...e altri {result.errori.length - 10}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA Footer */}
        <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0", display: "flex", gap: 8 }}>
          {step === "mapping" && (
            <>
              <button onClick={() => setStep("upload")} style={btnSecondary}>← Cambia file</button>
              <button
                onClick={() => setStep("preview")}
                disabled={!mapping.codice || !mapping.nome}
                style={!mapping.codice || !mapping.nome ? btnPrimaryDisabled : btnPrimary}
              >
                Anteprima →
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("mapping")} style={btnSecondary}>← Modifica mapping</button>
              <button onClick={eseguiImport} style={btnPrimary}>IMPORTA {rows.length} RIGHE</button>
            </>
          )}
          {step === "done" && (
            <button onClick={() => { onDone(); onClose(); }} style={btnPrimary}>FATTO</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function parseCSV(text: string): { headers: string[]; rows: Record<string, any>[] } {
  // Rileva separatore (; per Excel italiano, , per standard)
  const firstLine = text.split(/\r?\n/)[0];
  const sep = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === sep && !inQ) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });

  return { headers, rows };
}

function scaricaTemplate() {
  const csv = [
    "codice;nome;tipo;um;prezzo_acquisto;prezzo_vendita;scorta_attuale;scorta_minima;fornitore;scaffale;ean",
    "FER-CER-MAICO-RC2;Cerniera Maico RC2;ferramenta;pz;87.00;120.00;30;50;Maico;A-01;",
    "PRF-PVC-70-BIA;Profilo PVC 70 Bianco 6.5m;profilo;ml;28.50;45.00;120;50;Schuco;B-02;",
    "VTR-4-16-4-LOWE;Vetro 4-16-4 basso emissivo;vetro;mq;48.00;85.00;5.4;3;Saint-Gobain;C-03;",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-magazzino.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#F7F9FB", padding: "9px 5px", borderRadius: 8,
      textAlign: "center", borderTop: `2px solid ${color}`,
    }}>
      <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, color }}>{value}</div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1, padding: 13,
  background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
  color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
  letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer",
};
const btnPrimaryDisabled: React.CSSProperties = { ...btnPrimary, background: "#D8DEE5", cursor: "not-allowed" };
const btnSecondary: React.CSSProperties = {
  padding: "13px 14px", background: "#fff",
  color: MUTED, borderRadius: 10, fontSize: 11, fontWeight: 800,
  letterSpacing: 0.4, textTransform: "uppercase",
  border: "1px solid #D8DEE5", cursor: "pointer",
};
