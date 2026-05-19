"use client";

import { useState } from "react";
import type { BacklogOrigine } from "@/hooks/useBacklog";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { titolo: string; descrizione?: string; origine: BacklogOrigine; tags?: string[] }) => Promise<any>;
}

const ORIGINI: { v: BacklogOrigine; lbl: string; bg: string; fg: string }[] = [
  { v: "idea",    lbl: "Idea",     bg: "rgba(127,119,221,0.14)", fg: "#3C3489" },
  { v: "roadmap", lbl: "Roadmap",  bg: "rgba(29,158,117,0.14)",  fg: "#04342C" },
  { v: "manuale", lbl: "Task",     bg: "rgba(40,160,160,0.14)",  fg: "#04403B" },
];

export function BacklogQuickAdd({ open, onClose, onCreate }: Props) {
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [origine, setOrigine] = useState<BacklogOrigine>("idea");
  const [tagsRaw, setTagsRaw] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const reset = () => { setTitolo(""); setDescrizione(""); setOrigine("idea"); setTagsRaw(""); };

  const submit = async () => {
    if (!titolo.trim() || saving) return;
    setSaving(true);
    try {
      const tags = tagsRaw.split(/[,\s]+/).map((s) => s.trim().replace(/^#/, "")).filter(Boolean);
      await onCreate({
        titolo: titolo.trim(),
        descrizione: descrizione.trim() || undefined,
        origine,
        tags: tags.length > 0 ? tags : undefined,
      });
      reset();
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10006,
        background: "rgba(13,31,31,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "#F4F6F5",
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: "10px 18px 22px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
          animation: "blQuickUp 0.22s cubic-bezier(.2,.8,.2,1)",
        }}>
        <style>{`@keyframes blQuickUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        <div style={{ margin: "0 auto 14px", height: 4, width: 40, background: "#C8E4E4", borderRadius: 99 }}/>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#3C3489", letterSpacing: -0.3 }}>Aggiungi al backlog</div>
          <button type="button" onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 9, border: 0, cursor: "pointer",
              background: "#fff", boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F2525" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Cosa vuoi non dimenticare?
          </div>
          <input type="text" value={titolo} autoFocus
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="es. Aggiungere campo CAP automatico"
            style={{
              width: "100%", padding: "11px 13px",
              fontSize: 14, fontWeight: 600, color: "#0F2525",
              background: "#fff",
              border: "1px solid rgba(200,228,228,0.6)",
              borderRadius: 12, outline: "none",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              fontFamily: "inherit",
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submit(); }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Tipo
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {ORIGINI.map((o) => {
              const active = origine === o.v;
              return (
                <button key={o.v} type="button" onClick={() => setOrigine(o.v)}
                  style={{
                    padding: "9px 6px", borderRadius: 11, border: 0, cursor: "pointer",
                    background: active ? o.bg : "#fff",
                    color: active ? o.fg : "#5A7878",
                    boxShadow: active ? `0 2px 6px rgba(13,31,31,0.06), inset 0 0 0 1px ${o.fg}33` : "0 1px 3px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
                    fontSize: 11, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
                    fontFamily: "inherit",
                  }}>{o.lbl}</button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Tag · separati da virgola o spazio · opzionale
          </div>
          <input type="text" value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="#mastro #marketing"
            style={{
              width: "100%", padding: "10px 12px",
              fontSize: 13, fontWeight: 600, color: "#0F2525",
              background: "#fff",
              border: "1px solid rgba(200,228,228,0.6)",
              borderRadius: 12, outline: "none",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Note · opzionale
          </div>
          <textarea value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="dettagli, link, idee..."
            rows={3}
            style={{
              width: "100%", padding: "10px 12px",
              fontSize: 13, fontWeight: 500, color: "#0F2525",
              background: "#fff",
              border: "1px solid rgba(200,228,228,0.6)",
              borderRadius: 12, outline: "none",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
          <button type="button" onClick={onClose}
            style={{
              padding: "12px 8px", borderRadius: 12, border: 0, cursor: "pointer",
              fontSize: 12.5, fontWeight: 900, color: "#5A7878",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
              fontFamily: "inherit",
            }}>Annulla</button>
          <button type="button" onClick={submit} disabled={!titolo.trim() || saving}
            style={{
              padding: "12px 8px", borderRadius: 12, border: 0,
              cursor: !titolo.trim() || saving ? "not-allowed" : "pointer",
              fontSize: 12.5, fontWeight: 900, color: "#fff", letterSpacing: 0.3,
              background: !titolo.trim() || saving
                ? "rgba(127,119,221,0.4)"
                : "linear-gradient(145deg, #B5B0EE, #7F77DD)",
              boxShadow: !titolo.trim() || saving ? "none" : "0 6px 16px rgba(127,119,221,0.4), inset 0 -3px 0 rgba(0,0,0,0.08)",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {saving ? "Salvo..." : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Aggiungi al backlog
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
