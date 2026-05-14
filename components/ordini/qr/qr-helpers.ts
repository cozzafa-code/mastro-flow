import { supabase } from "@/lib/supabase";

export interface TokenResult {
  ok: boolean;
  token?: string;
  token_id?: string;
  reused?: boolean;
  url?: string;
  error?: string;
}

export async function generaTokenOrdine(ordineId: string): Promise<TokenResult> {
  try {
    const { data, error } = await supabase.rpc("genera_token_ordine", {
      p_ordine_id: ordineId,
    });
    if (error) {
      console.error("[generaTokenOrdine]", error);
      return { ok: false, error: error.message };
    }
    const result = data as any;
    if (!result?.ok) {
      return { ok: false, error: result?.error || "errore_sconosciuto" };
    }
    const url = buildPortaleUrl(result.token);
    return { ok: true, token: result.token, token_id: result.token_id, reused: result.reused, url };
  } catch (e: any) {
    console.error("[generaTokenOrdine] exception", e);
    return { ok: false, error: e?.message || "errore" };
  }
}

export function buildPortaleUrl(token: string): string {
  if (typeof window === "undefined") return `/o/${token}`;
  return `${window.location.origin}/o/${token}`;
}

// Parse deep-link da QR scansionato
export function parseQrUrl(qrText: string): { token: string | null; rigaCode?: string } {
  try {
    // Possibili formati:
    //   https://app.com/o/abc123
    //   https://app.com/o/abc123/r/VS-3304
    //   /o/abc123
    const cleaned = qrText.trim();
    const m1 = cleaned.match(/\/o\/([a-z0-9]{8,32})(?:\/r\/([^?#]+))?/i);
    if (m1) {
      return { token: m1[1], rigaCode: m1[2] };
    }
    return { token: null };
  } catch {
    return { token: null };
  }
}

// QR SVG inline (no dipendenze - matrix QR generico)
// Per QR vero in produzione usare libreria qrcode-svg, qui placeholder testuale
export function qrCodeSvgPlaceholder(text: string, size = 200): string {
  // Genera un pattern visivo deterministico per il momento
  // In produzione: importare qrcode-svg o react-qr-code
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#fff"/>
    <text x="50" y="48" text-anchor="middle" font-family="monospace" font-size="6" fill="#000">QR CODE</text>
    <text x="50" y="58" text-anchor="middle" font-family="monospace" font-size="4" fill="#666">${text.substring(0, 20)}</text>
  </svg>`;
}
