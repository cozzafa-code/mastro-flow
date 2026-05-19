// ════════════════════════════════════════════════════════════
// SETTINGS · BRANDING AZIENDA · logo, colori, header, footer
// ════════════════════════════════════════════════════════════
"use client";
import { useRef } from "react";
import { useAziendaBranding } from "@/hooks/useAziendaBranding";

type Props = { azienda_id: string };

export default function SettingsBranding({ azienda_id }: Props) {
  const { branding, loading, saving, patch, uploadLogo, uploadFirma } = useAziendaBranding(azienda_id);
  const logoRef = useRef<HTMLInputElement>(null);
  const firmaRef = useRef<HTMLInputElement>(null);

  if (loading || !branding) {
    return <div style={{ padding: 24, color: "#94A3B8" }}>Caricamento branding…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 14, maxWidth: 920 }}>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F1B2D", margin: "0 0 4px" }}>Branding azienda</h2>
        <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
          Logo, colori e intestazione vengono applicati automaticamente a tutti i documenti generati.
          {saving && <span style={{ color: "#1E3A5F", marginLeft: 6 }}>· Salvataggio…</span>}
        </p>
      </div>

      {/* LOGO */}
      <Card label="Logo aziendale">
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            width: 120, height: 120, border: "2px dashed #CBD5E1", borderRadius: 12,
            background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Nessun logo</span>
            )}
          </div>
          <div>
            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
              }}
            />
            <button onClick={() => logoRef.current?.click()} style={btnPrimary}>
              📤 Carica logo
            </button>
            {branding.logo_url && (
              <button onClick={() => patch({ logo_url: null })} style={{ ...btnGhost, marginLeft: 6 }}>
                Rimuovi
              </button>
            )}
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
              PNG, JPEG, SVG, WebP · max 5MB
            </div>
          </div>
        </div>
      </Card>

      {/* COLORI */}
      <Card label="Colori">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <ColorPick label="Primario" value={branding.colore_primario} onChange={(v) => patch({ colore_primario: v })} />
          <ColorPick label="Secondario" value={branding.colore_secondario} onChange={(v) => patch({ colore_secondario: v })} />
          <ColorPick label="Accento" value={branding.colore_accento} onChange={(v) => patch({ colore_accento: v })} />
        </div>
      </Card>

      {/* FONT */}
      <Card label="Font documenti">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Font principale"
            value={branding.font_principale}
            onChange={(v) => patch({ font_principale: v })}
            options={["Inter", "Roboto", "Open Sans", "Lato", "Source Sans 3", "Georgia", "Arial"]}
          />
          <Select
            label="Font titoli"
            value={branding.font_titoli}
            onChange={(v) => patch({ font_titoli: v })}
            options={["Inter", "Roboto", "Open Sans", "Lato", "Source Sans 3", "Georgia", "Arial"]}
          />
        </div>
      </Card>

      {/* INTESTAZIONE */}
      <Card label="Intestazione documenti (HTML)">
        <textarea
          value={branding.intestazione_html ?? ""}
          onChange={(e) => patch({ intestazione_html: e.target.value })}
          placeholder="<b>NOME AZIENDA</b><br/>Indirizzo · P.IVA"
          rows={4}
          style={textareaStyle}
        />
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 6 }}>
          Tag HTML supportati: <code>&lt;b&gt;</code>, <code>&lt;br/&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>
        </div>
      </Card>

      {/* FOOTER */}
      <Card label="Footer documenti (HTML)">
        <textarea
          value={branding.footer_html ?? ""}
          onChange={(e) => patch({ footer_html: e.target.value })}
          placeholder="Tel · email · PEC · IBAN"
          rows={2}
          style={textareaStyle}
        />
      </Card>

      {/* DATI AGGIUNTIVI */}
      <Card label="Dati per fatture">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <TextInput label="IBAN" value={branding.iban ?? ""} onChange={(v) => patch({ iban: v })} />
          <TextInput label="Banca" value={branding.banca ?? ""} onChange={(v) => patch({ banca: v })} />
          <TextInput label="PEC" value={branding.pec ?? ""} onChange={(v) => patch({ pec: v })} />
          <TextInput label="Codice destinatario SDI" value={branding.codice_destinatario_sdi ?? ""} onChange={(v) => patch({ codice_destinatario_sdi: v })} />
        </div>
      </Card>

      {/* FIRMA GRAFICA */}
      <Card label="Firma grafica titolare">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 200, height: 80, border: "2px dashed #CBD5E1", borderRadius: 12,
            background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {branding.firma_grafica_url ? (
              <img src={branding.firma_grafica_url} alt="firma" style={{ maxWidth: "100%", maxHeight: "100%" }} />
            ) : (
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Nessuna firma</span>
            )}
          </div>
          <div>
            <input
              ref={firmaRef}
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFirma(f);
              }}
            />
            <button onClick={() => firmaRef.current?.click()} style={btnPrimary}>
              📤 Carica firma
            </button>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
              Scansione firma su sfondo bianco
            </div>
          </div>
        </div>
      </Card>

      {/* OPZIONI VISIBILITÀ */}
      <Card label="Opzioni visibilità">
        <Checkbox label="Mostra logo sui documenti" value={branding.mostra_logo_su_documenti} onChange={(v) => patch({ mostra_logo_su_documenti: v })} />
        <Checkbox label="Mostra intestazione" value={branding.mostra_intestazione} onChange={(v) => patch({ mostra_intestazione: v })} />
        <Checkbox label="Mostra footer" value={branding.mostra_footer} onChange={(v) => patch({ mostra_footer: v })} />
        <Checkbox label="Mostra numero pagina" value={branding.mostra_numero_pagina} onChange={(v) => patch({ mostra_numero_pagina: v })} />
      </Card>

    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────
function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ColorPick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 36, height: 36, padding: 2, border: "1px solid #CBD5E1", borderRadius: 7, cursor: "pointer" }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, padding: "7px 9px", fontSize: 11, fontFamily: "monospace", border: "1px solid #CBD5E1", borderRadius: 7 }} />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 5 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #CBD5E1", borderRadius: 7, background: "#fff" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 5 }}>{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #CBD5E1", borderRadius: 7 }} />
    </label>
  );
}

function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", cursor: "pointer" }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#1E3A5F" }} />
      <span style={{ fontSize: 12, color: "#0F1B2D" }}>{label}</span>
    </label>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  fontSize: 11,
  fontFamily: "monospace",
  border: "1px solid #CBD5E1",
  borderRadius: 7,
  resize: "vertical",
  background: "#FAFAF9",
};

const btnPrimary: React.CSSProperties = {
  padding: "9px 14px",
  background: "#1E3A5F",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "9px 14px",
  background: "#fff",
  color: "#64748B",
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};
