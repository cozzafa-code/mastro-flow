// ════════════════════════════════════════════════════════════
// DOCUMENT BUILDER · MOBILE
// Lista blocchi verticale con su/giu, niente drag&drop
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
  template_codice?: string;
  onClose?: () => void;
};

const VARIABILI = [
  "cliente", "cliente_cf", "cliente_piva", "cliente_indirizzo",
  "commessa_code", "data", "azienda_nome", "azienda_piva",
  "totale", "imponibile", "iva", "numero_fattura",
  "data_sopralluogo", "indirizzo", "modalita_pagamento", "tempi_consegna", "garanzia",
];

const TEMPLATE_BLANK: Block[] = [
  { id: "1", tipo: "logo" },
  { id: "2", tipo: "titolo", livello: 1, contenuto: "TITOLO DOCUMENTO", align: "left" },
  { id: "3", tipo: "spazio", altezza: 10 },
  { id: "4", tipo: "paragrafo", contenuto: "Inserisci qui il contenuto..." },
];

const BLOCK_TYPES: Array<{ tipo: Block["tipo"]; label: string; icon: string }> = [
  { tipo: "titolo", label: "Titolo", icon: "H" },
  { tipo: "paragrafo", label: "Paragrafo", icon: "¶" },
  { tipo: "spazio", label: "Spazio", icon: "—" },
  { tipo: "linea", label: "Linea", icon: "―" },
  { tipo: "tabella", label: "Tabella", icon: "▦" },
  { tipo: "variabile", label: "Variabile", icon: "$" },
  { tipo: "firma", label: "Firma", icon: "✍" },
  { tipo: "logo", label: "Logo", icon: "🖼" },
  { tipo: "callout", label: "Callout", icon: "!" },
];

export default function DocumentBuilderMobile({ azienda_id, template_codice, onClose }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(TEMPLATE_BLANK);
  const [nome, setNome] = useState("Nuovo template");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
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
      contenuto: tipo === "titolo" ? "Nuovo titolo" : tipo === "paragrafo" ? "Nuovo paragrafo" : tipo === "callout" ? "⚠️ Avviso" : "",
      livello: tipo === "titolo" ? 2 : undefined,
      align: "left",
      altezza: tipo === "spazio" ? 10 : undefined,
    };
    setBlocks([...blocks, newBlock]);
    setShowAdd(false);
    setEditingId(newBlock.id);
  }

  function update(id: string, p: Partial<Block>) { setBlocks(blocks.map(b => b.id === id ? { ...b, ...p } : b)); }
  function remove(id: string) { setBlocks(blocks.filter(b => b.id !== id)); setEditingId(null); }
  function moveUp(id: string) {
    const idx = blocks.findIndex(b => b.id === id); if (idx <= 0) return;
    const next = blocks.slice(); [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; setBlocks(next);
  }
  function moveDown(id: string) {
    const idx = blocks.findIndex(b => b.id === id); if (idx >= blocks.length - 1) return;
    const next = blocks.slice(); [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; setBlocks(next);
  }

  async function salva() {
    if (!template_codice) { alert("Seleziona un template di base"); return; }
    setSaving(true);
    await supabase.from("azienda_documenti_template").upsert({
      azienda_id, codice_template: template_codice,
      nome_personalizzato: nome, html_personalizzato: blocksToHtml(blocks),
      builder_config: { blocks }, attivo: true,
    }, { onConflict: "azienda_id,codice_template" });
    setSaving(false);
    alert("Template salvato!");
  }

  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: "#0F1B2D", color: "#fff", padding: "18px 16px 18px",
        display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.13)", border: "none", color: "#fff",
            width: 36, height: 36, borderRadius: 9, fontSize: 20, cursor: "pointer", flexShrink: 0,
          }}>‹</button>
        )}
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          style={{
            flex: 1, padding: "9px 11px", fontSize: 13, fontWeight: 700,
            background: "rgba(255,255,255,0.13)", border: "none", color: "#fff",
            borderRadius: 8, WebkitAppearance: "none",
          }} />
        <button onClick={() => setPreviewMode(!previewMode)} style={{
          background: "rgba(255,255,255,0.13)", border: "none", color: "#fff",
          width: 36, height: 36, borderRadius: 9, fontSize: 16, cursor: "pointer", flexShrink: 0,
        }}>{previewMode ? "✏️" : "👁"}</button>
      </div>

      {/* Lista blocchi */}
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {blocks.map((b, i) => (
          <BlockCard
            key={b.id}
            block={b}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            isEditing={editingId === b.id}
            previewMode={previewMode}
            onTap={() => !previewMode && setEditingId(prev => prev === b.id ? null : b.id)}
            onUpdate={(p) => update(b.id, p)}
            onMoveUp={() => moveUp(b.id)}
            onMoveDown={() => moveDown(b.id)}
            onRemove={() => remove(b.id)}
          />
        ))}
      </div>

      {/* + Aggiungi blocco */}
      {!previewMode && (
        <div style={{ padding: "0 12px" }}>
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} style={{
              width: "100%", padding: 14, background: "#fff", border: "1.5px dashed #CBD5E1",
              borderRadius: 11, fontSize: 13, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
            }}>+ Aggiungi blocco</button>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 9 }}>
                Scegli tipo blocco
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {BLOCK_TYPES.map(t => (
                  <button key={t.tipo} onClick={() => addBlock(t.tipo)} style={{
                    padding: "11px 6px", background: "#F8FAFC", border: "1px solid #E2E8F0",
                    borderRadius: 9, fontSize: 11, fontWeight: 700, color: "#0F1B2D", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  }}>
                    <span style={{
                      width: 32, height: 32, background: "#1E3A5F", color: "#fff",
                      borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900,
                    }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAdd(false)} style={{
                width: "100%", marginTop: 9, padding: 9, background: "transparent",
                border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#64748B", cursor: "pointer",
              }}>Annulla</button>
            </div>
          )}
        </div>
      )}

      {/* Variabili helper */}
      {!previewMode && editingId && (
        <div style={{ padding: "10px 12px 0" }}>
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 11, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>
              Variabili disponibili (copia)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {VARIABILI.map(v => (
                <span key={v} onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)}
                  style={{
                    padding: "4px 8px", background: "#F1F5F9", color: "#1E3A5F",
                    fontFamily: "monospace", fontSize: 10, fontWeight: 700, borderRadius: 5, cursor: "pointer",
                  }}>{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SAVE bar */}
      {!previewMode && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, padding: "11px 12px",
          background: "rgba(247,247,245,0.96)", borderTop: "1px solid #E2E8F0",
          backdropFilter: "blur(8px)", zIndex: 5,
        }}>
          <button onClick={salva} disabled={saving} style={{
            width: "100%", padding: 14, background: "#065F46", color: "#fff",
            border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
            textTransform: "uppercase", cursor: saving ? "wait" : "pointer",
            boxShadow: "0 3px 0 0 #064E3B",
          }}>
            {saving ? "Salvataggio…" : "💾 Salva template"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BlockCard ─────────────────────────────────────────
function BlockCard({
  block, isFirst, isLast, isEditing, previewMode,
  onTap, onUpdate, onMoveUp, onMoveDown, onRemove,
}: {
  block: Block; isFirst: boolean; isLast: boolean; isEditing: boolean; previewMode: boolean;
  onTap: () => void;
  onUpdate: (p: Partial<Block>) => void;
  onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 11, overflow: "hidden",
      border: isEditing ? "2px solid #1E3A5F" : "1px solid #E2E8F0",
    }}>
      {/* Preview */}
      <div onClick={onTap} style={{ padding: 12, cursor: previewMode ? "default" : "pointer" }}>
        <BlockPreview block={block} />
      </div>

      {/* Editor inline */}
      {isEditing && !previewMode && (
        <div style={{ background: "#FAFAF9", borderTop: "1px solid #F1F5F9", padding: 11, display: "flex", flexDirection: "column", gap: 8 }}>

          {(block.tipo === "titolo" || block.tipo === "paragrafo" || block.tipo === "callout") && (
            <textarea value={block.contenuto ?? ""} onChange={(e) => onUpdate({ contenuto: e.target.value })}
              rows={3} style={{
                width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #CBD5E1",
                borderRadius: 8, background: "#fff", resize: "vertical", fontFamily: "inherit", color: "#0F1B2D",
                WebkitAppearance: "none",
              }} />
          )}

          {block.tipo === "titolo" && (
            <select value={block.livello ?? 2} onChange={(e) => onUpdate({ livello: Number(e.target.value) as any })}
              style={selBig}>
              <option value={1}>H1 grande</option>
              <option value={2}>H2 medio</option>
              <option value={3}>H3 piccolo</option>
            </select>
          )}

          {(block.tipo === "titolo" || block.tipo === "paragrafo") && (
            <select value={block.align ?? "left"} onChange={(e) => onUpdate({ align: e.target.value as any })}
              style={selBig}>
              <option value="left">Sinistra</option>
              <option value="center">Centro</option>
              <option value="right">Destra</option>
            </select>
          )}

          {block.tipo === "spazio" && (
            <input type="number" value={block.altezza ?? 10} onChange={(e) => onUpdate({ altezza: Number(e.target.value) })}
              min={2} max={100} style={selBig} />
          )}

          {block.tipo === "variabile" && (
            <select value={block.variabile ?? "cliente"} onChange={(e) => onUpdate({ variabile: e.target.value })}
              style={selBig}>
              {VARIABILI.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          )}

          {/* Action bar */}
          <div style={{ display: "flex", gap: 5 }}>
            <button onClick={onMoveUp} disabled={isFirst} style={{ ...btnSquare, opacity: isFirst ? 0.3 : 1 }}>↑</button>
            <button onClick={onMoveDown} disabled={isLast} style={{ ...btnSquare, opacity: isLast ? 0.3 : 1 }}>↓</button>
            <div style={{ flex: 1 }} />
            <button onClick={onRemove} style={{
              padding: "9px 14px", background: "#FEF2F2", color: "#991B1B",
              border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer",
            }}>🗑 Elimina</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  if (block.tipo === "titolo") {
    const sizes: any = { 1: 22, 2: 16, 3: 13 };
    return (
      <div style={{
        fontSize: sizes[block.livello ?? 2], fontWeight: 800, color: "#1E3A5F",
        textAlign: block.align ?? "left", letterSpacing: -0.3, lineHeight: 1.2,
      }}>{block.contenuto || "Titolo"}</div>
    );
  }
  if (block.tipo === "paragrafo") {
    return <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#0F1B2D", textAlign: block.align ?? "left" }}>
      {block.contenuto || "Paragrafo..."}
    </p>;
  }
  if (block.tipo === "spazio") return <div style={{ height: block.altezza ?? 10, background: "repeating-linear-gradient(90deg,#F1F5F9,#F1F5F9 4px,transparent 4px,transparent 8px)", borderRadius: 3 }} />;
  if (block.tipo === "linea") return <hr style={{ border: "none", borderTop: "1px solid #CBD5E1", margin: 0 }} />;
  if (block.tipo === "tabella") return (
    <div style={{ fontSize: 10, color: "#64748B" }}>
      ▦ Tabella<br/>
      <span style={{ fontSize: 9.5, color: "#94A3B8" }}>3 colonne · esempio</span>
    </div>
  );
  if (block.tipo === "variabile") return (
    <span style={{
      display: "inline-block", padding: "5px 11px", background: "#DBEAFE", color: "#1E3A5F",
      fontFamily: "monospace", fontSize: 12, fontWeight: 700, borderRadius: 6,
    }}>{`{{${block.variabile ?? "cliente"}}}`}</span>
  );
  if (block.tipo === "firma") return (
    <div style={{ fontSize: 11, color: "#64748B" }}>Firma {block.contenuto ?? "cliente"}: ____________</div>
  );
  if (block.tipo === "logo") return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderBottom: "2px solid #1E3A5F" }}>
      <div style={{ width: 50, height: 36, background: "#F1F5F9", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#94A3B8", fontWeight: 700 }}>LOGO</div>
      <div style={{ fontSize: 9, color: "#64748B" }}><b>NOME AZIENDA</b><br/>Indirizzo · P.IVA</div>
    </div>
  );
  if (block.tipo === "callout") return (
    <div style={{ background: "#FEF2F2", padding: 9, borderRadius: 7, borderLeft: "3px solid #EF4444", color: "#7F1D1D", fontWeight: 700, fontSize: 12 }}>
      {block.contenuto || "⚠️ Avviso"}
    </div>
  );
  return null;
}

// ─── HTML serializer ────────────────────────────────────
function blocksToHtml(blocks: Block[]): string {
  let html = '<div class="doc">';
  blocks.forEach(b => {
    if (b.tipo === "titolo") html += `<h${b.livello ?? 2} style="text-align:${b.align ?? "left"}">${b.contenuto ?? ""}</h${b.livello ?? 2}>`;
    else if (b.tipo === "paragrafo") html += `<p style="text-align:${b.align ?? "left"}">${b.contenuto ?? ""}</p>`;
    else if (b.tipo === "spazio") html += `<div style="height:${b.altezza ?? 10}px"></div>`;
    else if (b.tipo === "linea") html += `<hr/>`;
    else if (b.tipo === "tabella") html += `<table><tr><th>Voce</th><th>Q.tà</th><th>Prezzo</th></tr></table>`;
    else if (b.tipo === "variabile") html += `{{${b.variabile ?? "cliente"}}}`;
    else if (b.tipo === "firma") html += `<div class="firma">Firma ${b.contenuto ?? "cliente"}: ____________</div>`;
    else if (b.tipo === "logo") html += `{{branding}}`;
    else if (b.tipo === "callout") html += `<div class="alert">${b.contenuto ?? ""}</div>`;
  });
  html += "</div>";
  return html;
}

const selBig: React.CSSProperties = {
  width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #CBD5E1",
  borderRadius: 8, background: "#fff", color: "#0F1B2D", fontFamily: "inherit",
  WebkitAppearance: "none",
};

const btnSquare: React.CSSProperties = {
  width: 44, height: 44, background: "#fff", border: "1px solid #CBD5E1",
  borderRadius: 8, fontSize: 18, fontWeight: 700, color: "#0F1B2D", cursor: "pointer",
};
