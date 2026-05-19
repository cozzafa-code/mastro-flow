// ════════════════════════════════════════════════════════════
// DOCUMENT BUILDER · costruisce template documenti visuali
// ════════════════════════════════════════════════════════════
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Block = {
  id: string;
  tipo: "titolo" | "paragrafo" | "spazio" | "linea" | "tabella" | "variabile" | "firma" | "logo" | "callout";
  contenuto?: string;
  livello?: 1 | 2 | 3;
  variabile?: string;
  align?: "left" | "center" | "right";
  altezza?: number;
};

type Props = {
  azienda_id: string;
  template_codice?: string; // se fornito, modifica template esistente
  onChiudi?: () => void;
};

const VARIABILI_DISPONIBILI = [
  "cliente", "cliente_cf", "cliente_piva", "cliente_indirizzo",
  "commessa_code", "data", "azienda_nome", "azienda_piva",
  "totale", "imponibile", "iva", "totale_imponibile",
  "numero_fattura", "data_sopralluogo", "data_consegna_richiesta",
  "indirizzo", "modalita_pagamento", "tempi_consegna", "garanzia",
];

const TEMPLATE_BLANK: Block[] = [
  { id: "1", tipo: "logo" },
  { id: "2", tipo: "titolo", livello: 1, contenuto: "TITOLO DOCUMENTO", align: "left" },
  { id: "3", tipo: "spazio", altezza: 10 },
  { id: "4", tipo: "paragrafo", contenuto: "Inserisci qui il contenuto del documento..." },
];

export default function DocumentBuilder({ azienda_id, template_codice, onChiudi }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(TEMPLATE_BLANK);
  const [nome, setNome] = useState("Nuovo template");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!template_codice) return;
    (async () => {
      const { data } = await supabase
        .from("azienda_documenti_template")
        .select("*")
        .eq("azienda_id", azienda_id)
        .eq("codice_template", template_codice)
        .maybeSingle();
      if (data?.builder_config?.blocks) {
        setBlocks(data.builder_config.blocks);
        setNome(data.nome_personalizzato ?? template_codice);
      }
    })();
  }, [azienda_id, template_codice]);

  function addBlock(tipo: Block["tipo"]) {
    const newBlock: Block = {
      id: String(Date.now()),
      tipo,
      contenuto: tipo === "titolo" ? "Nuovo titolo" : tipo === "paragrafo" ? "Nuovo paragrafo" : "",
      livello: tipo === "titolo" ? 2 : undefined,
      align: "left",
      altezza: tipo === "spazio" ? 10 : undefined,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedId(newBlock.id);
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  }

  function deleteBlock(id: string) {
    setBlocks(blocks.filter(b => b.id !== id));
    setSelectedId(null);
  }

  function moveBlock(id: string, dir: "up" | "down") {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setBlocks(next);
  }

  async function salvaTemplate() {
    if (!template_codice) { alert("Seleziona un template di base prima di salvare"); return; }
    setSaving(true);
    const html = blocksToHtml(blocks);
    await supabase.from("azienda_documenti_template").upsert({
      azienda_id,
      codice_template: template_codice,
      nome_personalizzato: nome,
      html_personalizzato: html,
      builder_config: { blocks },
      attivo: true,
    }, { onConflict: "azienda_id,codice_template" });
    setSaving(false);
    alert("Template salvato!");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F7F7F5" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 11, padding: "12px 16px",
        background: "#fff", borderBottom: "1px solid #E2E8F0",
      }}>
        {onChiudi && (
          <button onClick={onChiudi} style={{ background: "none", border: "none", fontSize: 20, color: "#64748B", cursor: "pointer" }}>←</button>
        )}
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          style={{ flex: 1, padding: "8px 11px", fontSize: 14, fontWeight: 700, border: "1px solid #E2E8F0", borderRadius: 7 }} />
        <button onClick={() => setPreviewMode(!previewMode)} style={btnGhost}>
          {previewMode ? "✏️ Modifica" : "👁️ Anteprima"}
        </button>
        <button onClick={salvaTemplate} disabled={saving} style={btnPrimary}>
          {saving ? "Salvo…" : "💾 Salva"}
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar blocchi disponibili */}
        {!previewMode && (
          <div style={{
            width: 200, background: "#fff", borderRight: "1px solid #E2E8F0",
            padding: 12, overflowY: "auto",
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              Blocchi
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <BlockButton icon="H" label="Titolo" onClick={() => addBlock("titolo")} />
              <BlockButton icon="¶" label="Paragrafo" onClick={() => addBlock("paragrafo")} />
              <BlockButton icon="—" label="Spazio" onClick={() => addBlock("spazio")} />
              <BlockButton icon="―" label="Linea" onClick={() => addBlock("linea")} />
              <BlockButton icon="▦" label="Tabella" onClick={() => addBlock("tabella")} />
              <BlockButton icon="$" label="Variabile" onClick={() => addBlock("variabile")} />
              <BlockButton icon="✍" label="Firma" onClick={() => addBlock("firma")} />
              <BlockButton icon="🖼" label="Logo" onClick={() => addBlock("logo")} />
              <BlockButton icon="!" label="Callout" onClick={() => addBlock("callout")} />
            </div>

            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", margin: "16px 0 8px" }}>
              Variabili
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontFamily: "monospace" }}>
              {VARIABILI_DISPONIBILI.map(v => (
                <div key={v} style={{ padding: "4px 7px", background: "#F8FAFC", borderRadius: 4, color: "#1E3A5F", fontWeight: 600 }}>
                  {`{{${v}}}`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas centrale (foglio A4) */}
        <div style={{ flex: 1, overflowY: "auto", padding: 30, background: "#E5E5E5" }}>
          <div style={{
            background: "#fff", maxWidth: 720, margin: "0 auto",
            minHeight: 1000, padding: 40, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            borderRadius: 4,
          }}>
            {blocks.map(b => (
              <BlockRender
                key={b.id}
                block={b}
                selected={selectedId === b.id}
                preview={previewMode}
                onClick={() => !previewMode && setSelectedId(b.id)}
              />
            ))}
            {blocks.length === 0 && !previewMode && (
              <div style={{ textAlign: "center", color: "#94A3B8", padding: 40 }}>
                Aggiungi blocchi dalla sidebar →
              </div>
            )}
          </div>
        </div>

        {/* Sidebar destra · proprietà blocco selezionato */}
        {!previewMode && selectedId && (
          <div style={{
            width: 240, background: "#fff", borderLeft: "1px solid #E2E8F0",
            padding: 12, overflowY: "auto",
          }}>
            <BlockProperties
              block={blocks.find(b => b.id === selectedId)!}
              onUpdate={(p) => updateBlock(selectedId, p)}
              onDelete={() => deleteBlock(selectedId)}
              onMoveUp={() => moveBlock(selectedId, "up")}
              onMoveDown={() => moveBlock(selectedId, "down")}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Render block ─────────────────────────────────────────
function BlockRender({ block, selected, preview, onClick }: { block: Block; selected: boolean; preview: boolean; onClick: () => void }) {
  const wrapStyle: React.CSSProperties = {
    border: !preview && selected ? "2px solid #1E3A5F" : "2px solid transparent",
    borderRadius: 4,
    padding: 4,
    margin: "4px -4px",
    cursor: preview ? "default" : "pointer",
    position: "relative",
  };

  if (block.tipo === "titolo") {
    const sizes = { 1: 22, 2: 16, 3: 13 };
    const Tag = `h${block.livello ?? 2}` as any;
    return (
      <div onClick={onClick} style={wrapStyle}>
        <Tag style={{
          margin: 0, fontSize: sizes[block.livello ?? 2],
          fontWeight: 800, color: "#1E3A5F",
          textAlign: block.align,
          letterSpacing: -0.3,
        }}>
          {block.contenuto || "Titolo"}
        </Tag>
      </div>
    );
  }

  if (block.tipo === "paragrafo") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, textAlign: block.align ?? "left", color: "#0F1B2D" }}>
          {block.contenuto || "Paragrafo..."}
        </p>
      </div>
    );
  }

  if (block.tipo === "spazio") {
    return <div onClick={onClick} style={{ ...wrapStyle, height: block.altezza ?? 10 }} />;
  }

  if (block.tipo === "linea") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <hr style={{ border: "none", borderTop: "1px solid #CBD5E1", margin: 0 }} />
      </div>
    );
  }

  if (block.tipo === "tabella") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr><th style={tdh}>Voce</th><th style={tdh}>Q.tà</th><th style={tdh}>Prezzo</th></tr>
          </thead>
          <tbody>
            <tr><td style={td}>Esempio riga</td><td style={td}>1</td><td style={td}>€ 100</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (block.tipo === "variabile") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <span style={{
          display: "inline-block", padding: "3px 9px", background: "#DBEAFE", color: "#1E3A5F",
          fontFamily: "monospace", fontSize: 11, fontWeight: 700, borderRadius: 5,
        }}>
          {`{{${block.variabile ?? "cliente"}}}`}
        </span>
      </div>
    );
  }

  if (block.tipo === "firma") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <div style={{ marginTop: 30, fontSize: 11, color: "#64748B" }}>
          Firma {block.contenuto ?? "cliente"}: ________________
        </div>
      </div>
    );
  }

  if (block.tipo === "logo") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <div style={{
          padding: "12px 0", borderBottom: "2px solid #1E3A5F", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 80, height: 50, background: "#F1F5F9", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: "#94A3B8", fontWeight: 700,
          }}>LOGO</div>
          <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4 }}>
            <b>NOME AZIENDA</b><br/>Indirizzo · P.IVA
          </div>
        </div>
      </div>
    );
  }

  if (block.tipo === "callout") {
    return (
      <div onClick={onClick} style={wrapStyle}>
        <div style={{
          background: "#FEF2F2", padding: 10, borderRadius: 7,
          borderLeft: "3px solid #EF4444", color: "#7F1D1D", fontWeight: 700, fontSize: 11,
        }}>
          {block.contenuto || "⚠️ Avviso importante"}
        </div>
      </div>
    );
  }

  return null;
}

const td: React.CSSProperties = { padding: "6px 8px", borderBottom: "1px solid #E2E8F0", fontSize: 10 };
const tdh: React.CSSProperties = { ...td, fontWeight: 700, background: "#F8FAFC", textAlign: "left" };

// ─── Block properties panel ───────────────────────────────
function BlockProperties({ block, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  block: Block;
  onUpdate: (p: Partial<Block>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
        Blocco · {block.tipo}
      </div>

      {(block.tipo === "titolo" || block.tipo === "paragrafo") && (
        <>
          <Field2 label="Contenuto">
            <textarea value={block.contenuto ?? ""} onChange={(e) => onUpdate({ contenuto: e.target.value })}
              rows={4} style={taStyle} />
          </Field2>
          <Field2 label="Allineamento">
            <select value={block.align ?? "left"} onChange={(e) => onUpdate({ align: e.target.value as any })} style={inStyle}>
              <option value="left">Sinistra</option>
              <option value="center">Centro</option>
              <option value="right">Destra</option>
            </select>
          </Field2>
        </>
      )}

      {block.tipo === "titolo" && (
        <Field2 label="Livello">
          <select value={block.livello ?? 2} onChange={(e) => onUpdate({ livello: Number(e.target.value) as any })} style={inStyle}>
            <option value={1}>H1 (grande)</option>
            <option value={2}>H2 (medio)</option>
            <option value={3}>H3 (piccolo)</option>
          </select>
        </Field2>
      )}

      {block.tipo === "spazio" && (
        <Field2 label="Altezza (px)">
          <input type="number" value={block.altezza ?? 10} onChange={(e) => onUpdate({ altezza: Number(e.target.value) })}
            min={2} max={100} style={inStyle} />
        </Field2>
      )}

      {block.tipo === "variabile" && (
        <Field2 label="Variabile">
          <select value={block.variabile ?? "cliente"} onChange={(e) => onUpdate({ variabile: e.target.value })} style={inStyle}>
            {VARIABILI_DISPONIBILI.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field2>
      )}

      {block.tipo === "callout" && (
        <Field2 label="Testo">
          <textarea value={block.contenuto ?? ""} onChange={(e) => onUpdate({ contenuto: e.target.value })}
            rows={3} style={taStyle} />
        </Field2>
      )}

      <div style={{ display: "flex", gap: 5, marginTop: 14 }}>
        <button onClick={onMoveUp} style={btnSm}>↑</button>
        <button onClick={onMoveDown} style={btnSm}>↓</button>
        <div style={{ flex: 1 }} />
        <button onClick={onDelete} style={{ ...btnSm, background: "#FEF2F2", color: "#991B1B", borderColor: "#FCA5A5" }}>🗑</button>
      </div>
    </div>
  );
}

function BlockButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 7, padding: "8px 10px",
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: 7,
      fontSize: 11, fontWeight: 700, color: "#0F1B2D", cursor: "pointer",
      width: "100%", textAlign: "left",
    }}>
      <span style={{ width: 18, height: 18, background: "#F1F5F9", borderRadius: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, color: "#1E3A5F" }}>{icon}</span>
      {label}
    </button>
  );
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── HTML serializer ─────────────────────────────────────
function blocksToHtml(blocks: Block[]): string {
  let html = '<div class="doc">';
  blocks.forEach(b => {
    if (b.tipo === "titolo") {
      const tag = `h${b.livello ?? 2}`;
      html += `<${tag} style="text-align:${b.align ?? "left"}">${b.contenuto ?? ""}</${tag}>`;
    } else if (b.tipo === "paragrafo") {
      html += `<p style="text-align:${b.align ?? "left"}">${b.contenuto ?? ""}</p>`;
    } else if (b.tipo === "spazio") {
      html += `<div style="height:${b.altezza ?? 10}px"></div>`;
    } else if (b.tipo === "linea") {
      html += `<hr/>`;
    } else if (b.tipo === "tabella") {
      html += `<table><tr><th>Voce</th><th>Q.tà</th><th>Prezzo</th></tr></table>`;
    } else if (b.tipo === "variabile") {
      html += `{{${b.variabile ?? "cliente"}}}`;
    } else if (b.tipo === "firma") {
      html += `<div class="firma">Firma ${b.contenuto ?? "cliente"}: ____________</div>`;
    } else if (b.tipo === "logo") {
      html += `{{branding}}`;
    } else if (b.tipo === "callout") {
      html += `<div class="alert">${b.contenuto ?? ""}</div>`;
    }
  });
  html += "</div>";
  return html;
}

const inStyle: React.CSSProperties = { width: "100%", padding: "6px 9px", fontSize: 11, border: "1px solid #CBD5E1", borderRadius: 6 };
const taStyle: React.CSSProperties = { ...inStyle, resize: "vertical", fontFamily: "inherit" };
const btnSm: React.CSSProperties = { padding: "5px 11px", background: "#fff", border: "1px solid #CBD5E1", color: "#0F1B2D", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { padding: "8px 14px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#fff", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" };
