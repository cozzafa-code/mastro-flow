// ════════════════════════════════════════════════════════════
// SETTINGS BRANDING · MOBILE
// ════════════════════════════════════════════════════════════
"use client";
import { useRef } from "react";
import { useAziendaBranding } from "@/hooks/useAziendaBranding";

type Props = { azienda_id: string; onClose?: () => void };

export default function SettingsBrandingMobile({ azienda_id, onClose }: Props) {
  const { branding, loading, saving, patch, uploadLogo, uploadFirma } = useAziendaBranding(azienda_id);
  const logoRef = useRef<HTMLInputElement>(null);
  const firmaRef = useRef<HTMLInputElement>(null);

  if (loading || !branding) {
    return <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Caricamento branding…</div>;
  }

  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: "#0F1B2D", color: "#fff", padding: "20px 18px 22px",
        borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.13)", border: "none", color: "#fff",
            width: 32, height: 32, borderRadius: 9, fontSize: 18, marginBottom: 12, cursor: "pointer",
          }}>‹</button>
        )}
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase", marginBottom: 3 }}>
          Personalizzazione
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.6 }}>
          Branding
        </h1>
        <p style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 0", lineHeight: 1.4 }}>
          Logo, colori e intestazione applicati a tutti i documenti.
          {saving && <span style={{ color: "#86EFAC", marginLeft: 6 }}>· salvataggio…</span>}
        </p>
      </div>

      <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* LOGO */}
        <Card label="Logo">
          <div style={{
            width: "100%", height: 130, border: "2px dashed #CBD5E1", borderRadius: 12,
            background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", marginBottom: 9,
          }}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="logo" style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 12, color: "#94A3B8" }}>Nessun logo</span>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => logoRef.current?.click()} style={btnPrimary}>📤 Carica logo</button>
            {branding.logo_url && (
              <button onClick={() => patch({ logo_url: null })} style={btnGhost}>Rimuovi</button>
            )}
          </div>
        </Card>

        {/* COLORI */}
        <Card label="Colori">
          <ColorRow label="Primario" value={branding.colore_primario} onChange={(v) => patch({ colore_primario: v })} />
          <ColorRow label="Secondario" value={branding.colore_secondario} onChange={(v) => patch({ colore_secondario: v })} />
          <ColorRow label="Accento" value={branding.colore_accento} onChange={(v) => patch({ colore_accento: v })} />
        </Card>

        {/* INTESTAZIONE */}
        <Card label="Intestazione documenti">
          <textarea value={branding.intestazione_html ?? ""} onChange={(e) => patch({ intestazione_html: e.target.value })}
            placeholder="<b>NOME AZIENDA</b><br/>Indirizzo · P.IVA"
            rows={4} style={textBig} />
          <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 6 }}>
            HTML: <code>&lt;b&gt;</code> <code>&lt;br/&gt;</code> <code>&lt;i&gt;</code>
          </div>
        </Card>

        {/* FOOTER */}
        <Card label="Footer documenti">
          <textarea value={branding.footer_html ?? ""} onChange={(e) => patch({ footer_html: e.target.value })}
            placeholder="Tel · email · PEC · IBAN"
            rows={2} style={textBig} />
        </Card>

        {/* FONT */}
        <Card label="Font">
          <Field label="Font principale">
            <select value={branding.font_principale} onChange={(e) => patch({ font_principale: e.target.value })} style={inputBig}>
              {["Inter","Roboto","Open Sans","Lato","Source Sans 3","Georgia","Arial"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </Card>

        {/* DATI FATTURE */}
        <Card label="Dati per fatture">
          <Field label="IBAN"><input value={branding.iban ?? ""} onChange={(e) => patch({ iban: e.target.value })} style={inputBig} /></Field>
          <div style={{ height: 8 }} />
          <Field label="Banca"><input value={branding.banca ?? ""} onChange={(e) => patch({ banca: e.target.value })} style={inputBig} /></Field>
          <div style={{ height: 8 }} />
          <Field label="PEC"><input type="email" value={branding.pec ?? ""} onChange={(e) => patch({ pec: e.target.value })} style={inputBig} /></Field>
          <div style={{ height: 8 }} />
          <Field label="Codice destinatario SDI"><input value={branding.codice_destinatario_sdi ?? ""} onChange={(e) => patch({ codice_destinatario_sdi: e.target.value })} style={inputBig} /></Field>
        </Card>

        {/* FIRMA */}
        <Card label="Firma grafica titolare">
          <div style={{
            width: "100%", height: 90, border: "2px dashed #CBD5E1", borderRadius: 12,
            background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", marginBottom: 9,
          }}>
            {branding.firma_grafica_url ? (
              <img src={branding.firma_grafica_url} alt="firma" style={{ maxWidth: "85%", maxHeight: "85%" }} />
            ) : (
              <span style={{ fontSize: 12, color: "#94A3B8" }}>Nessuna firma</span>
            )}
          </div>
          <input ref={firmaRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFirma(f); }} />
          <button onClick={() => firmaRef.current?.click()} style={btnPrimary}>📤 Carica firma</button>
        </Card>

        {/* OPZIONI */}
        <Card label="Opzioni visibilità">
          <BigCheck label="Mostra logo sui documenti" v={branding.mostra_logo_su_documenti} on={(b) => patch({ mostra_logo_su_documenti: b })} />
          <BigCheck label="Mostra intestazione" v={branding.mostra_intestazione} on={(b) => patch({ mostra_intestazione: b })} />
          <BigCheck label="Mostra footer" v={branding.mostra_footer} on={(b) => patch({ mostra_footer: b })} />
          <BigCheck label="Mostra numero pagina" v={branding.mostra_numero_pagina} on={(b) => patch({ mostra_numero_pagina: b })} />
        </Card>

      </div>
    </div>
  );
}

// ─── Components ─────────────────────────────────────────
function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 11 }}>{label}</div>
      {children}
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0" }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: 44, height: 44, padding: 2, border: "1px solid #CBD5E1", borderRadius: 9, cursor: "pointer", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>{value}</div>
      </div>
    </div>
  );
}

function BigCheck({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 11, padding: "11px 0",
      borderBottom: "1px solid #F1F5F9", cursor: "pointer",
    }}>
      <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)}
        style={{ width: 22, height: 22, accentColor: "#1E3A5F" }} />
      <span style={{ fontSize: 13, color: "#0F1B2D", fontWeight: 600 }}>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const inputBig: React.CSSProperties = {
  width: "100%", padding: "11px 12px", fontSize: 13,
  border: "1px solid #CBD5E1", borderRadius: 9, background: "#fff",
  fontFamily: "inherit", color: "#0F1B2D",
  WebkitAppearance: "none",
};
const textBig: React.CSSProperties = { ...inputBig, fontFamily: "monospace", resize: "vertical", minHeight: 80, background: "#FAFAF9" };
const btnPrimary: React.CSSProperties = {
  flex: 1, padding: 12, background: "#1E3A5F", color: "#fff", border: "none",
  borderRadius: 10, fontSize: 12, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "12px 14px", background: "#fff", color: "#64748B",
  border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
};
