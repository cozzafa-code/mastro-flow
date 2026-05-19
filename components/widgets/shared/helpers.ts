"use client";

/* ────────────────────────────────────────────────────────────
   MINI-APP HELPERS · MASTRO
   Funzioni pure condivise da tutti i widget mini-app.
   Nessuna dipendenza React. Tutto deterministico.
   ──────────────────────────────────────────────────────────── */

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const pick = (obj: any, ...keys: string[]) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

export const hhmm = (s?: string) => {
  if (!s) return "";
  const t = String(s);
  if (t.length >= 5 && t.includes(":")) return t.slice(0, 5);
  return t;
};

/* Format Euro: 12380 → "€12.380", 12380.50 → "€12.380,50" */
export const eur = (n: number, opts?: { compact?: boolean }) => {
  if (!isFinite(n)) return "€0";
  if (opts?.compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000) return "€" + (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
    return "€" + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + "k";
  }
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const intp = Math.floor(abs).toLocaleString("it-IT");
  const dec = (abs % 1).toFixed(2).slice(2);
  if (dec === "00") return `${sign}€${intp}`;
  return `${sign}€${intp},${dec}`;
};

/* Format relativo: "ora", "5m fa", "2h fa", "3g fa" */
export const formatRelative = (date: string | Date | undefined): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) {
    // futuro
    const abs = -diffMs;
    if (abs < 60_000) return "tra poco";
    if (abs < 3_600_000) return `tra ${Math.round(abs / 60_000)}m`;
    if (abs < 86_400_000) return `tra ${Math.round(abs / 3_600_000)}h`;
    return `tra ${Math.round(abs / 86_400_000)}g`;
  }
  if (diffMs < 60_000) return "ora";
  if (diffMs < 3_600_000) return `${Math.round(diffMs / 60_000)}m fa`;
  if (diffMs < 86_400_000) return `${Math.round(diffMs / 3_600_000)}h fa`;
  if (diffMs < 7 * 86_400_000) return `${Math.round(diffMs / 86_400_000)}g fa`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
};

/* Format giorno: "Oggi", "Ieri", "Domani", "Lun 28 Apr" */
export const formatGiorno = (iso: string): string => {
  if (!iso) return "";
  const td = todayISO();
  const d = new Date(iso);
  if (iso === td) return "Oggi";
  const ieri = new Date();
  ieri.setDate(ieri.getDate() - 1);
  if (iso === ieri.toISOString().slice(0, 10)) return "Ieri";
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  if (iso === domani.toISOString().slice(0, 10)) return "Domani";
  const giorni = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const mesi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return `${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]}`;
};

/* Countdown verso un timestamp futuro (today + HH:MM). Null se passato/non oggi. */
export const minutiFinoA = (iso: string, ora: string): number | null => {
  if (!iso || !ora) return null;
  if (iso !== todayISO()) return null;
  const [h, m] = ora.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diff = target.getTime() - Date.now();
  if (diff < 0) return null;
  return Math.round(diff / 60000);
};

export const formatCountdown = (min: number | null): string => {
  if (min === null) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const mm = min % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
};

/* Link helpers — sempre safe (return # se input invalido) */
export const telLnk = (n?: string): string => {
  if (!n) return "#";
  return `tel:${String(n).replace(/[^\d+]/g, "")}`;
};

export const waLnk = (n?: string, msg?: string): string => {
  if (!n) return "#";
  const num = String(n).replace(/\D/g, "");
  if (!num) return "#";
  const q = msg ? `?text=${encodeURIComponent(msg)}` : "";
  return `https://wa.me/${num}${q}`;
};

export const mapsLnk = (addr?: string): string => {
  if (!addr) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
};

export const mailLnk = (em?: string, subj?: string, body?: string): string => {
  if (!em) return "#";
  const params: string[] = [];
  if (subj) params.push(`subject=${encodeURIComponent(subj)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${em}${params.length ? "?" + params.join("&") : ""}`;
};

/* Stop propagation helper per bottoni dentro card cliccabili */
export const stopProp = (e: any) => {
  e.stopPropagation();
};

/* Apri URL in nuova tab safe */
export const openUrl = (url: string) => {
  if (!url || url === "#") return;
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

/* Vai a tel: su mobile, chiama in-app */
export const callTel = (n?: string) => {
  const url = telLnk(n);
  if (url === "#") return;
  if (typeof window !== "undefined") window.location.href = url;
};

/* Apri WhatsApp con messaggio precompilato */
export const sendWa = (n?: string, msg?: string) => {
  const url = waLnk(n, msg);
  if (url === "#") return;
  openUrl(url);
};

/* Cliente lookup helper: estrae nome + telefono + email da una commessa o cliente */
export interface ClienteInfo {
  nome: string;
  telefono: string;
  email: string;
  indirizzo: string;
}
export const clienteFromCommessa = (cm: any, fornitori?: any[]): ClienteInfo => {
  return {
    nome: pick(cm, "cliente", "client_name", "nome_cliente", "persona") || "",
    telefono: pick(cm, "telefono", "phone", "cell", "cellulare") || "",
    email: pick(cm, "email", "mail") || "",
    indirizzo: pick(cm, "indirizzo", "address", "luogo", "via") || "",
  };
};

/* Conta giorni dal/al */
export const giorniDa = (iso?: string): number => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
};

export const giorniA = (iso?: string): number => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

/* Sort helpers */
export const byDateDesc = (k: string) => (a: any, b: any) =>
  String(pick(b, k) || "").localeCompare(String(pick(a, k) || ""));

export const byDateAsc = (k: string) => (a: any, b: any) =>
  String(pick(a, k) || "").localeCompare(String(pick(b, k) || ""));

/* Genera template messaggio sollecito */
export const templateSollecitoFirma = (nomeCliente: string, oggetto: string): string =>
  `Buongiorno ${nomeCliente}, le ricordo che è in attesa la sua firma per ${oggetto}. ` +
  `Quando ha un attimo può confermarmi? Grazie!`;

export const templateSollecitoPagamento = (nomeCliente: string, importo: string, scadenza: string): string =>
  `Buongiorno ${nomeCliente}, le ricordo gentilmente il pagamento di ${importo} ` +
  `con scadenza ${scadenza}. Grazie per l'attenzione.`;

export const templateConferma = (nomeCliente: string, evento: string, ora: string): string =>
  `Buongiorno ${nomeCliente}, le confermo l'appuntamento di ${evento} alle ore ${ora}. A presto!`;
