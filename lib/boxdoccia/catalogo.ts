import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FornitorePiatto = {
  id: string;
  brand: string;
  model: string;
  mat: string;
  col: string;
  prezzo_listino?: number;
  sconto?: number;
  certificato_url?: string;
  scheda_tecnica_url?: string;
  fornitore_email?: string;
  fornitore_tel?: string;
  note?: string;
  attivo: boolean;
};

export const MATERIALI = [
  { id: "effpietra", nome: "Effetto pietra" },
  { id: "ceramica", nome: "Ceramica" },
  { id: "marmoresina", nome: "Marmo-resina" },
  { id: "acrilico", nome: "Acrilico" },
  { id: "resina", nome: "Resina" },
  { id: "stoneulti", nome: "Stone Ultra" },
  { id: "mineralm", nome: "Mineral Marmo" },
];

export const COLORI = [
  { id: "bianco", nome: "Bianco", hex: "#F8F8F8" },
  { id: "grigio", nome: "Grigio", hex: "#9A9A9A" },
  { id: "antracite", nome: "Antracite", hex: "#383838" },
  { id: "sabbia", nome: "Sabbia", hex: "#CFC09A" },
  { id: "tortora", nome: "Tortora", hex: "#A89888" },
  { id: "creta", nome: "Creta", hex: "#9C8B7A" },
  { id: "nero", nome: "Nero", hex: "#0A0A0A" },
];

export async function loadPiatti(azienda_id: string): Promise<FornitorePiatto[]> {
  const { data } = await supabase
    .from("boxdoccia_catalogo_piatti")
    .select("*")
    .eq("azienda_id", azienda_id)
    .order("brand", { ascending: true });
  return data || [];
}

export async function savePiatto(p: FornitorePiatto, azienda_id: string) {
  const payload = { ...p, azienda_id };
  if (p.id) {
    return supabase.from("boxdoccia_catalogo_piatti").update(payload).eq("id", p.id);
  }
  const newId = crypto.randomUUID();
  return supabase.from("boxdoccia_catalogo_piatti").insert({ ...payload, id: newId });
}

export async function deletePiatto(id: string) {
  return supabase.from("boxdoccia_catalogo_piatti").delete().eq("id", id);
}

export async function togglePiattoAttivo(id: string, attivo: boolean) {
  return supabase
    .from("boxdoccia_catalogo_piatti")
    .update({ attivo: !attivo })
    .eq("id", id);
}

export async function importPiattiCSV(file: File, azienda_id: string) {
  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, count: 0 };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const obj: Record<string, unknown> = { azienda_id, attivo: true };
    headers.forEach((h, i) => {
      if (h === "id" && cells[i]) obj.id = cells[i];
      else if (h === "brand") obj.brand = cells[i];
      else if (h === "model") obj.model = cells[i];
      else if (h === "mat") obj.mat = cells[i];
      else if (h === "col") obj.col = cells[i];
      else if (h === "prezzo_listino") obj.prezzo_listino = parseFloat(cells[i]) || 0;
      else if (h === "sconto") obj.sconto = parseFloat(cells[i]) || 0;
      else if (h === "fornitore_email") obj.fornitore_email = cells[i];
    });
    if (!obj.id) obj.id = crypto.randomUUID();
    return obj;
  });
  if (rows.length > 0) {
    await supabase.from("boxdoccia_catalogo_piatti").upsert(rows);
  }
  return { ok: true, count: rows.length };
}
