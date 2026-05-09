// ════════════════════════════════════════════════════════════
// LIB · documento-generator
// Prende template + dati commessa + branding → HTML pronto
// ════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type GenDocInput = {
  template_codice: string;
  azienda_id: string;
  commessa_id?: string;
  variabili: Record<string, string | number | undefined | null>;
};

export type GenDocOutput = {
  html: string;
  css: string;
  formato: string;
  nome_doc: string;
};

const CSS_BASE = `
  @page { size: A4; margin: 20mm 15mm; }
  body { font-family: var(--font, 'Inter'), sans-serif; color: #0F1B2D; font-size: 11pt; line-height: 1.5; }
  .doc { max-width: 180mm; margin: 0 auto; }
  .branding-header { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 2px solid var(--color-primary); margin-bottom: 18px; }
  .branding-header img { max-height: 50px; max-width: 120px; }
  .branding-header .info { font-size: 9pt; color: #64748B; line-height: 1.4; }
  .branding-footer { position: fixed; bottom: 8mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #94A3B8; padding-top: 6px; border-top: 1px solid #E2E8F0; }
  h1 { font-size: 18pt; color: var(--color-primary); margin: 0 0 12px; letter-spacing: -0.4px; }
  h2 { font-size: 13pt; color: var(--color-primary); margin: 18px 0 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
  h3 { font-size: 11pt; color: var(--color-secondary); margin: 12px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  table td, table th { padding: 7px 9px; border-bottom: 1px solid #E2E8F0; font-size: 10pt; }
  table th { background: #F8FAFC; font-weight: 700; color: var(--color-primary); }
  .big { font-size: 14pt; font-weight: 800; color: var(--color-primary); margin: 8px 0; }
  .totali { background: #F8FAFC; padding: 12px; border-radius: 8px; margin: 14px 0; }
  .totali div { display: flex; justify-content: space-between; padding: 3px 0; }
  .bonus { background: #ECFDF5; padding: 12px; border-radius: 8px; border-left: 3px solid var(--color-secondary); margin: 14px 0; }
  .alert { background: #FEF2F2; padding: 10px; border-radius: 8px; border-left: 3px solid #EF4444; color: #7F1D1D; font-weight: 700; margin: 10px 0; }
  .causale { background: #0F1B2D; color: #cbe0f5; padding: 14px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 9pt; white-space: pre-wrap; }
  .firma { margin-top: 30px; font-size: 10pt; }
  .esito { background: #F0FDF4; padding: 12px; border-radius: 8px; color: #065F46; font-weight: 700; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cliente { background: #F8FAFC; padding: 10px; border-radius: 6px; font-size: 10pt; margin: 10px 0; }
`;

function sostituisciVariabili(html: string, vars: Record<string, any>): string {
  return html.replace(/\{\{([\w_]+)\}\}/g, (_m, k) => {
    const v = vars[k];
    if (v === undefined || v === null) return `<span style="color:#94A3B8">[${k}]</span>`;
    return String(v);
  });
}

function buildBrandingHtml(branding: any): string {
  if (!branding) return "";
  const showLogo = branding.mostra_logo_su_documenti && branding.logo_url;
  const showInt = branding.mostra_intestazione && branding.intestazione_html;
  if (!showLogo && !showInt) return "";
  return `<div class="branding-header">
    ${showLogo ? `<img src="${branding.logo_url}" alt="logo"/>` : ""}
    ${showInt ? `<div class="info">${branding.intestazione_html}</div>` : ""}
  </div>`;
}

function buildFooterHtml(branding: any): string {
  if (!branding?.mostra_footer || !branding.footer_html) return "";
  return `<div class="branding-footer">${branding.footer_html}</div>`;
}

export async function generaDocumento(input: GenDocInput): Promise<GenDocOutput | null> {
  // 1. Carica template di sistema
  const { data: tpl, error: e1 } = await supabase
    .from("documenti_template")
    .select("*")
    .eq("codice", input.template_codice)
    .single();
  if (e1 || !tpl) { console.error("template not found", input.template_codice); return null; }

  // 2. Cerca override azienda
  const { data: override } = await supabase
    .from("azienda_documenti_template")
    .select("html_personalizzato,nome_personalizzato")
    .eq("azienda_id", input.azienda_id)
    .eq("codice_template", input.template_codice)
    .eq("attivo", true)
    .maybeSingle();

  // 3. Carica branding azienda
  const { data: branding } = await supabase
    .from("azienda_branding")
    .select("*")
    .eq("azienda_id", input.azienda_id)
    .maybeSingle();

  // 4. Costruisci HTML finale
  let skeleton = override?.html_personalizzato || tpl.html_skeleton || "";
  const brandingHtml = buildBrandingHtml(branding);
  const footerHtml = buildFooterHtml(branding);

  skeleton = skeleton.replace(/\{\{branding\}\}/g, brandingHtml);
  const body = sostituisciVariabili(skeleton, input.variabili) + footerHtml;

  // 5. CSS con colori azienda
  const css = `
    :root {
      --color-primary: ${branding?.colore_primario ?? "#1E3A5F"};
      --color-secondary: ${branding?.colore_secondario ?? "#10B981"};
      --color-accent: ${branding?.colore_accento ?? "#F59E0B"};
      --font: ${branding?.font_principale ?? "Inter"};
    }
    ${CSS_BASE}
  `;

  return {
    html: body,
    css,
    formato: tpl.formato_default || "A4_verticale",
    nome_doc: override?.nome_personalizzato || tpl.nome,
  };
}

export function buildFullPageHtml(out: GenDocOutput): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>${out.nome_doc}</title>
<style>${out.css}</style>
</head>
<body>${out.html}</body>
</html>`;
}

// Apre documento in nuova finestra per stampa/PDF
export async function apriDocumentoStampa(input: GenDocInput): Promise<void> {
  const out = await generaDocumento(input);
  if (!out) { alert("Documento non trovato"); return; }
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) { alert("Popup bloccato. Abilita popup per questo sito."); return; }
  w.document.write(buildFullPageHtml(out));
  w.document.close();
  setTimeout(() => { try { w.print(); } catch {} }, 500);
}
