"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  aziendaId: string;
  ordineId: string;
  onConferma: (ddt: { numero: string; data: string; fotoUrls: string[]; fatturaNumero?: string; note?: string }) => void;
}

export default function DDTFooter({ aziendaId, ordineId, onConferma }: Props) {
  const [numero, setNumero] = useState("");
  const [data, setData] = useState(new Date().toISOString().substring(0, 10));
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [fattura, setFattura] = useState("");
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSubmit = numero.trim().length > 0 && data.length > 0;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (fotos.length + files.length > 3) {
      alert("Max 3 foto DDT");
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = aziendaId + "/" + ordineId + "/ddt_" + Date.now() + "_" + i + "." + ext;
      const { data: up, error } = await supabase.storage.from("ddt").upload(fileName, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        console.error("[upload DDT]", error);
        alert("Errore upload foto: " + error.message);
        continue;
      }
      const { data: pub } = supabase.storage.from("ddt").getPublicUrl(up.path);
      newUrls.push(pub.publicUrl);
    }
    setFotos((prev) => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFoto(i: number) {
    setFotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  const labelFoto = "Foto DDT (" + fotos.length + "/3)";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#fff", borderTop: "1px solid #E0E5EE",
      padding: "14px 16px 100px",
      boxShadow: "0 -8px 24px rgba(0,0,0,0.12)", zIndex: 50,
      maxHeight: "60vh", overflowY: "auto"
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Field label="DDT n" req>
          <input value={numero} onChange={(e) => setNumero(e.target.value)}
            placeholder="es. 2245/2026" style={inputStyle} />
        </Field>
        <Field label="Data DDT" req>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            style={inputStyle} />
        </Field>
      </div>

      {fotos.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {fotos.map((u, i) => (
            <div key={i} style={{
              position: "relative", width: 60, height: 60, borderRadius: 8,
              overflow: "hidden", background: "#F4F6FA"
            }}>
              <img src={u} alt="DDT" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div onClick={() => removeFoto(i)} style={{
                position: "absolute", top: 2, right: 2, width: 18, height: 18,
                background: "#C44545", color: "#fff", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, cursor: "pointer"
              }}>x</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple
          onChange={handleFileChange} style={{ display: "none" }} />
        <div onClick={() => fileInputRef.current?.click()} style={{
          flex: 1, padding: 9, background: uploading ? "#FBF0DC" : "#F4F6FA",
          border: "1.5px solid #E0E5EE", borderRadius: 8,
          fontSize: 11, fontWeight: 700, color: uploading ? "#8B6926" : "#5A6478",
          textAlign: "center", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 5, cursor: uploading ? "wait" : "pointer"
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {uploading ? "Caricamento..." : labelFoto}
        </div>
        <div onClick={() => setShowExtra(!showExtra)} style={{
          flex: 1, padding: 9, background: showExtra ? "#1A2A47" : "#F4F6FA",
          border: "1.5px solid " + (showExtra ? "#1A2A47" : "#E0E5EE"),
          borderRadius: 8, fontSize: 11, fontWeight: 700,
          color: showExtra ? "#fff" : "#5A6478",
          textAlign: "center", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 5, cursor: "pointer"
        }}>
          + Fattura/Note
        </div>
      </div>

      {showExtra && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          <Field label="Fattura n">
            <input value={fattura} onChange={(e) => setFattura(e.target.value)}
              placeholder="opzionale, puo arrivare dopo" style={inputStyle} />
          </Field>
          <Field label="Note ricezione">
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              rows={2} placeholder="..." style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
          </Field>
        </div>
      )}

      <div onClick={() => { if (canSubmit) onConferma({ numero, data, fotoUrls: fotos, fatturaNumero: fattura || undefined, note: note || undefined }); }}
        style={{
          width: "100%", padding: 14,
          background: canSubmit ? "linear-gradient(180deg,#28A0A0 0%,#1a6b6b 100%)" : "#C8D1E0",
          color: "#fff", border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 800, letterSpacing: "0.7px",
          textTransform: "uppercase",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: canSubmit ? "0 4px 12px rgba(40,160,160,0.35)" : "none",
          cursor: canSubmit ? "pointer" : "not-allowed"
        }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Conferma ricezione + Carico
      </div>
    </div>
  );
}

function Field({ label, req, children }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: "0.7px",
        color: "#5A6478", textTransform: "uppercase", marginBottom: 4
      }}>
        {label} {req && <span style={{ color: "#C44545" }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: any = {
  padding: "9px 10px", background: "#F4F6FA",
  border: "1.5px solid #E0E5EE", borderRadius: 8,
  fontSize: 13, fontWeight: 600, color: "#1A2A47",
  fontFamily: "inherit", width: "100%"
};
