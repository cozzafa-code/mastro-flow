"use client";
// @ts-nocheck
// MASTRO — ProfiloSezioneUploader.tsx
// Carica un DXF profilo, mostra preview SVG, salva in archivio

import { useState, useRef, useCallback } from "react";

const AMBER = "#D08008", GREEN = "#1A9E73", RED = "#DC4444", BLUE = "#3B7FE0";
const BG = "#F2F1EC", BDR = "#E5E3DC", TXT = "#1A1A1C", SUB = "#6B7280";
const FM = "'JetBrains Mono', monospace";

const TIPI = ["telaio", "anta", "traverso", "zoccolo", "montante", "anta_porta"] as const;
type TipoProfilo = typeof TIPI[number];

interface ProfiloSezioneUploaderProps {
  onSaved?: (profilo: any) => void;
  onClose?: () => void;
}

// ── Parser DXF → SVG path (client-side per preview) ───────────
function parseDxfClientSide(dxfText: string): { path: string; viewBox: string; w: number; h: number } {
  const lines = dxfText.split(/\r?\n/).map(l => l.trim());
  const pts: Array<{ x: number; y: number }> = [];
  const segs: string[] = [];
  let i = 0;
  const num = (s: string) => parseFloat(s) || 0;

  while (i < lines.length) {
    const code = lines[i];
    const val  = lines[i + 1] || "";

    if (code === "0" && val === "LINE") {
      i += 2;
      let sx = 0, sy = 0, ex = 0, ey = 0;
      while (i < lines.length && lines[i] !== "0") {
        if (lines[i] === "10") sx = num(lines[i + 1]);
        if (lines[i] === "20") sy = num(lines[i + 1]);
        if (lines[i] === "11") ex = num(lines[i + 1]);
        if (lines[i] === "21") ey = num(lines[i + 1]);
        i += 2;
      }
      pts.push({ x: sx, y: sy }, { x: ex, y: ey });
      segs.push(`LINE:${sx},${sy},${ex},${ey}`);
      continue;
    }

    if (code === "0" && (val === "LWPOLYLINE" || val === "POLYLINE")) {
      i += 2;
      const polyPts: Array<{ x: number; y: number }> = [];
      let closed = false, cx = 0, cy = 0;
      while (i < lines.length && lines[i] !== "0") {
        if (lines[i] === "70" && (parseInt(lines[i + 1]) & 1)) closed = true;
        if (lines[i] === "10") cx = num(lines[i + 1]);
        if (lines[i] === "20") { cy = num(lines[i + 1]); polyPts.push({ x: cx, y: cy }); }
        i += 2;
      }
      polyPts.forEach(p => pts.push(p));
      segs.push(`POLY:${JSON.stringify(polyPts)}:${closed}`);
      continue;
    }

    if (code === "0" && val === "ARC") {
      i += 2;
      let acx = 0, acy = 0, ar = 0, a1 = 0, a2 = 360;
      while (i < lines.length && lines[i] !== "0") {
        if (lines[i] === "10") acx = num(lines[i + 1]);
        if (lines[i] === "20") acy = num(lines[i + 1]);
        if (lines[i] === "40") ar  = num(lines[i + 1]);
        if (lines[i] === "50") a1  = num(lines[i + 1]);
        if (lines[i] === "51") a2  = num(lines[i + 1]);
        i += 2;
      }
      pts.push({ x: acx - ar, y: acy - ar }, { x: acx + ar, y: acy + ar });
      segs.push(`ARC:${acx},${acy},${ar},${a1},${a2}`);
      continue;
    }

    i++;
  }

  if (pts.length === 0) return { path: "", viewBox: "0 0 100 100", w: 100, h: 100 };

  const allX = pts.map(p => p.x), allY = pts.map(p => p.y);
  const minX = Math.min(...allX), minY = Math.min(...allY);
  const W = Math.max(...allX) - minX, H = Math.max(...allY) - minY;
  const tx = (x: number) => +(x - minX).toFixed(2);
  const ty = (y: number) => +(H - (y - minY)).toFixed(2); // flipY

  const pathParts: string[] = [];
  for (const seg of segs) {
    if (seg.startsWith("LINE:")) {
      const [sx, sy, ex, ey] = seg.slice(5).split(",").map(Number);
      pathParts.push(`M ${tx(sx)} ${ty(sy)} L ${tx(ex)} ${ty(ey)}`);
    } else if (seg.startsWith("POLY:")) {
      const parts = seg.split(":");
      const polyPts: Array<{ x: number; y: number }> = JSON.parse(parts[1]);
      const closed = parts[2] === "true";
      if (polyPts.length < 2) continue;
      const d = [`M ${tx(polyPts[0].x)} ${ty(polyPts[0].y)}`];
      polyPts.slice(1).forEach(p => d.push(`L ${tx(p.x)} ${ty(p.y)}`));
      if (closed) d.push("Z");
      pathParts.push(d.join(" "));
    } else if (seg.startsWith("ARC:")) {
      const [acx, acy, ar, a1, a2] = seg.slice(4).split(",").map(Number);
      const d2r = (d: number) => (d * Math.PI) / 180;
      const sx2 = acx + ar * Math.cos(d2r(a1)), sy2 = acy + ar * Math.sin(d2r(a1));
      const ex2 = acx + ar * Math.cos(d2r(a2)), ey2 = acy + ar * Math.sin(d2r(a2));
      let sweep = a2 - a1; if (sweep < 0) sweep += 360;
      const la = sweep > 180 ? 1 : 0;
      pathParts.push(`M ${tx(sx2)} ${ty(sy2)} A ${ar} ${ar} 0 ${la} 0 ${tx(ex2)} ${ty(ey2)}`);
    }
  }

  return { path: pathParts.join(" "), viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, w: W, h: H };
}

// ── UI ─────────────────────────────────────────────────────────
export default function ProfiloSezioneUploader({ onSaved, onClose }: ProfiloSezioneUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dxfFile, setDxfFile]     = useState<File | null>(null);
  const [preview, setPreview]     = useState<{ path: string; viewBox: string; w: number; h: number } | null>(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  // Metadati
  const [nome, setNome]           = useState("");
  const [sistema, setSistema]     = useState("IDEAL_5000");
  const [tipo, setTipo]           = useState<TipoProfilo>("telaio");
  const [codice, setCodice]       = useState("");
  const [largMm, setLargMm]       = useState("");
  const [altMm, setAltMm]         = useState("");

  const onFile = useCallback((f: File) => {
    setDxfFile(f);
    setError(null);
    setSaved(false);
    if (!nome) setNome(f.name.replace(/\.dxf$/i, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseDxfClientSide(text);
      setPreview(parsed);
      if (!largMm) setLargMm(parsed.w.toFixed(1));
      if (!altMm)  setAltMm(parsed.h.toFixed(1));
    };
    reader.readAsText(f);
  }, [nome, largMm, altMm]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.toLowerCase().endsWith(".dxf")) onFile(f);
    else setError("Solo file DXF supportati");
  }, [onFile]);

  const salva = useCallback(async () => {
    if (!dxfFile && !preview) { setError("Carica un file DXF prima"); return; }
    if (!nome.trim())          { setError("Nome obbligatorio"); return; }
    if (!tipo)                 { setError("Tipo obbligatorio"); return; }
    setSaving(true); setError(null);

    try {
      let res: Response;
      if (dxfFile) {
        const form = new FormData();
        form.append("dxf", dxfFile);
        form.append("meta", JSON.stringify({
          nome: nome.trim(), sistema: sistema.trim(), tipo, codice: codice.trim(),
          larghezza_mm: parseFloat(largMm) || 0,
          altezza_mm:   parseFloat(altMm)  || 0,
        }));
        res = await fetch("/api/profili-sezioni", { method: "POST", body: form });
      } else {
        res = await fetch("/api/profili-sezioni", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(), sistema: sistema.trim(), tipo, codice: codice.trim(),
            larghezza_mm: parseFloat(largMm) || 0,
            altezza_mm:   parseFloat(altMm)  || 0,
            svg_path: preview?.path || "",
            svg_viewbox: preview?.viewBox || "",
          }),
        });
      }
      if (!res.ok) throw new Error((await res.json()).error || "Errore salvataggio");
      const data = await res.json();
      setSaved(true);
      onSaved?.(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [dxfFile, preview, nome, sistema, tipo, codice, largMm, altMm, onSaved]);

  const inp = (label: string, value: string, set: (v: string) => void, placeholder = "") => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: SUB, marginBottom: 3 }}>{label}</div>
      <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "6px 10px", border: `1px solid ${BDR}`,
          borderRadius: 6, fontSize: 12, fontFamily: FM, background: BG,
          color: TXT, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%",
      background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BDR}`,
        display: "flex", alignItems: "center", gap: 10, background: "#fff" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>Nuovo profilo sezione</div>
          <div style={{ fontSize: 10, color: SUB, marginTop: 1 }}>Carica DXF → preview SVG → salva in archivio</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ padding: "4px 10px", borderRadius: 5,
            border: `1px solid ${BDR}`, background: "transparent",
            fontSize: 11, color: SUB, cursor: "pointer" }}>Chiudi</button>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Form sinistra */}
        <div style={{ width: 260, flexShrink: 0, padding: 14, borderRight: `1px solid ${BDR}`,
          overflowY: "auto", background: "#fff" }}>

          {/* Drop zone DXF */}
          <div onDrop={onDrop} onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${dxfFile ? GREEN : BDR}`,
              borderRadius: 8, padding: "16px 12px", textAlign: "center",
              cursor: "pointer", marginBottom: 14, background: dxfFile ? GREEN + "08" : BG,
              transition: "all .15s" }}>
            <input ref={fileRef} type="file" accept=".dxf" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <div style={{ fontSize: 20, marginBottom: 4 }}>📐</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: dxfFile ? GREEN : TXT }}>
              {dxfFile ? dxfFile.name : "Trascina DXF qui"}
            </div>
            <div style={{ fontSize: 9, color: SUB, marginTop: 2 }}>
              {dxfFile ? `${(dxfFile.size / 1024).toFixed(1)} KB` : "oppure clicca per sfogliare"}
            </div>
          </div>

          {inp("Nome profilo", nome, setNome, "es. Telaio IDEAL 5000 70mm")}
          {inp("Sistema", sistema, setSistema, "es. IDEAL_5000")}
          {inp("Codice profilo", codice, setCodice, "es. 14XX07+R")}

          {/* Tipo */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: SUB, marginBottom: 3 }}>Tipo</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {TIPI.map(t => (
                <div key={t} onClick={() => setTipo(t)}
                  style={{ padding: "3px 8px", borderRadius: 5, fontSize: 10, cursor: "pointer",
                    border: `1px solid ${tipo === t ? AMBER : BDR}`,
                    background: tipo === t ? AMBER + "15" : "transparent",
                    color: tipo === t ? AMBER : SUB, fontWeight: tipo === t ? 700 : 400 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              {inp("Larghezza mm", largMm, setLargMm, "82")}
            </div>
            <div style={{ flex: 1 }}>
              {inp("Altezza mm", altMm, setAltMm, "70")}
            </div>
          </div>

          {error && (
            <div style={{ padding: "6px 10px", borderRadius: 6, background: RED + "12",
              border: `1px solid ${RED}30`, fontSize: 10, color: RED, marginBottom: 8 }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{ padding: "6px 10px", borderRadius: 6, background: GREEN + "12",
              border: `1px solid ${GREEN}30`, fontSize: 10, color: GREEN, marginBottom: 8 }}>
              Profilo salvato in archivio ✓
            </div>
          )}

          <button onClick={salva} disabled={saving}
            style={{ width: "100%", padding: "9px", borderRadius: 7,
              background: saving ? BDR : AMBER, color: saving ? SUB : "#fff",
              border: "none", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif" }}>
            {saving ? "Salvataggio…" : "Salva in archivio"}
          </button>
        </div>

        {/* Preview destra */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24, background: "#F8F7F2" }}>

          {preview && preview.path ? (
            <>
              <div style={{ fontSize: 10, color: SUB, marginBottom: 12, fontFamily: FM }}>
                Preview sezione — {parseFloat(largMm || "0").toFixed(1)} × {parseFloat(altMm || "0").toFixed(1)} mm
              </div>
              <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${BDR}`,
                padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <svg viewBox={preview.viewBox} width={280} height={280}
                  style={{ display: "block" }}>
                  <path d={preview.path}
                    fill="none" stroke={AMBER} strokeWidth={1.5}
                    strokeLinejoin="round" strokeLinecap="round" />
                  {/* Fill semitrasparente */}
                  <path d={preview.path}
                    fill={AMBER + "12"} stroke="none" />
                </svg>
              </div>
              <div style={{ marginTop: 12, fontSize: 9, color: SUB, fontFamily: FM }}>
                viewBox: {preview.viewBox}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: SUB }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📐</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Carica un file DXF</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>La sezione del profilo apparirà qui</div>
            </div>
          )}

          {/* Info tecnica */}
          {preview && (
            <div style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8,
              background: "#fff", border: `1px solid ${BDR}`,
              display: "flex", gap: 20, fontSize: 10, fontFamily: FM }}>
              <div><span style={{ color: SUB }}>Largh. reale: </span>
                <span style={{ color: TXT, fontWeight: 700 }}>{preview.w.toFixed(1)} mm</span></div>
              <div><span style={{ color: SUB }}>Alt. reale: </span>
                <span style={{ color: TXT, fontWeight: 700 }}>{preview.h.toFixed(1)} mm</span></div>
              <div><span style={{ color: SUB }}>Path: </span>
                <span style={{ color: BLUE }}>{preview.path.length} chars</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
