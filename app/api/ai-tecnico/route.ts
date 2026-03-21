// app/api/ai-tecnico/route.ts
// MASTRO AI — RAG tecnico verticale serramenti
// Cerca nel database tecnico Supabase e risponde con dati reali

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Ricerca nel DB tecnico ────────────────────────────────────────────────────

async function cercaNelDatabase(domanda: string): Promise<string> {
  const q = domanda.toLowerCase();
  const risultati: string[] = [];

  // 1. Cerca sistemi profili
  if (q.includes("ideal") || q.includes("energeto") || q.includes("profil") || q.includes("uf") || q.includes("sistem")) {
    const { data } = await supabase
      .from("sistemi_profili")
      .select("nome, uf_val, spessore_telaio_mm, numero_camere, numero_guarnizioni, peso_max_anta_kg, larghezza_max_anta_mm, altezza_max_anta_mm, guarnizione_centrale, bonding_inside, casa_passiva, rinforzo_tipo")
      .order("uf_val");
    if (data?.length) {
      risultati.push("SISTEMI PROFILI DISPONIBILI:\n" + data.map(s =>
        `- ${s.nome}: Uf=${s.uf_val} W/m²K, spessore=${s.spessore_telaio_mm}mm, ${s.numero_camere} camere, ${s.numero_guarnizioni} guarnizioni, peso max anta=${s.peso_max_anta_kg}kg, larghezza max=${s.larghezza_max_anta_mm}mm, altezza max=${s.altezza_max_anta_mm}mm${s.guarnizione_centrale ? ", guarnizione centrale" : ""}${s.bonding_inside ? ", bonding inside" : ""}${s.casa_passiva ? ", CASA PASSIVA" : ""}`
      ).join("\n"));
    }
  }

  // 2. Cerca pannelli porte
  if (q.includes("pannell") || q.includes("porta") || q.includes("up") || q.includes("pirall")) {
    const { data } = await supabase
      .from("pannelli_porte")
      .select("tipo_codice, spessore_mm, up_val, resistenza_termica_rp, isolante")
      .order("up_val");
    if (data?.length) {
      risultati.push("PANNELLI PORTE (PIRALL):\n" + data.map(p =>
        `- ${p.tipo_codice}: spessore=${p.spessore_mm}mm, Up=${p.up_val} W/m²K, Rp=${p.resistenza_termica_rp} m²K/W`
      ).join("\n"));
    }
  }

  // 3. Cerca tessuti schermatura
  if (q.includes("blackout") || q.includes("tessut") || q.includes("schermatura") || q.includes("gtot") || q.includes("detrazione") || q.includes("50%")) {
    const { data } = await supabase
      .from("tessuti_schermatura")
      .select("nome_prodotto, colore, gtot_interno, gtot_esterno, classe_gtot_interno, detrazione_50pct, trasmissione_luce, trasmissione_uv");
    if (data?.length) {
      risultati.push("TESSUTI SCHERMATURA SOLARE:\n" + data.map(t =>
        `- ${t.nome_prodotto} ${t.colore}: gtot interno=${t.gtot_interno} (Classe ${t.classe_gtot_interno}), gtot esterno=${t.gtot_esterno}, luce trasmessa=${t.trasmissione_luce}, UV trasmesso=${t.trasmissione_uv}${t.detrazione_50pct ? ", AMMESSO detrazione 50% (Legge 145/2018)" : ""}`
      ).join("\n"));
    }
  }

  // 4. Cerca lavorazioni
  if (q.includes("lavorazion") || q.includes("cnc") || q.includes("foro") || q.includes("fresatura") || q.includes("scarico") || q.includes("drenaggio")) {
    const { data } = await supabase
      .from("lavorazioni_profili")
      .select("codice, nome, tipo, profilo_target, dim_diametro_mm, dim_larghezza_mm, dim_altezza_mm, obbligatoria, note");
    if (data?.length) {
      risultati.push("LAVORAZIONI CNC:\n" + data.map(l =>
        `- [${l.codice}] ${l.nome} (${l.tipo} su ${l.profilo_target})${l.dim_diametro_mm ? ` Ø${l.dim_diametro_mm}mm` : ""}${l.dim_larghezza_mm ? ` ${l.dim_larghezza_mm}x${l.dim_altezza_mm}mm` : ""}${l.obbligatoria ? " — OBBLIGATORIA" : ""}${l.note ? ` | ${l.note}` : ""}`
      ).join("\n"));
    }
  }

  // 5. Cerca parametri saldatura
  if (q.includes("saldatura") || q.includes("temperatura") || q.includes("fusione") || q.includes("pvc")) {
    const { data } = await supabase
      .from("parametri_saldatura")
      .select("*")
      .single();
    if (data) {
      risultati.push(`PARAMETRI SALDATURA PVC:
- Temperatura piastra: ${data.temperatura_piastra_min_c}°C - ${data.temperatura_piastra_max_c}°C
- Profondità fusione: ${data.profondita_fusione_min_mm} - ${data.profondita_fusione_max_mm} mm per lato
- Tempo riscaldamento: ${data.tempo_riscaldamento_min_s} - ${data.tempo_riscaldamento_max_s} secondi
- Tempo giunzione: ${data.tempo_giunzione_min_s} - ${data.tempo_giunzione_max_s} secondi
- Pressione fusione: ${data.pressione_fusione_nmm2} N/mm²
- Pressione giunzione: ${data.pressione_giunzione_nmm2} N/mm²`);
    }
  }

  // 6. Cerca regole normativa
  if (q.includes("norm") || q.includes("uni") || q.includes("legale") || q.includes("obbligator") || q.includes("vento") || q.includes("condensa") || q.includes("posa")) {
    const { data } = await supabase
      .from("regole_validazione")
      .select("codice_norma, descrizione, severita");
    if (data?.length) {
      risultati.push("REGOLE NORMATIVE:\n" + data.map(r =>
        `- [${r.severita}] ${r.codice_norma}: ${r.descrizione}`
      ).join("\n"));
    }
  }

  // 7. Cerca sequenza lavorazioni
  if (q.includes("sequenza") || q.includes("ordine") || q.includes("produzione") || q.includes("fasi")) {
    const { data } = await supabase
      .from("sequenza_lavorazioni")
      .select("ordine, fase, descrizione, bloccante")
      .order("ordine");
    if (data?.length) {
      risultati.push("SEQUENZA LAVORAZIONI:\n" + data.map(s =>
        `${s.ordine}. ${s.fase.toUpperCase()}: ${s.descrizione}${s.bloccante ? " [BLOCCANTE]" : ""}`
      ).join("\n"));
    }
  }

  // 8. Cerca controlli qualità
  if (q.includes("qualità") || q.includes("collaudo") || q.includes("controllo") || q.includes("planarità") || q.includes("gioco")) {
    const { data } = await supabase
      .from("controlli_qualita")
      .select("controllo, requisito_descrizione, valore_target, tolleranza_mm, unita, metodo_verifica");
    if (data?.length) {
      risultati.push("CONTROLLI QUALITÀ PRE-CONSEGNA:\n" + data.map(c =>
        `- ${c.controllo}: ${c.requisito_descrizione}${c.valore_target ? ` (target: ${c.valore_target}${c.unita}, tolleranza: ±${c.tolleranza_mm}mm)` : ""} — ${c.metodo_verifica}`
      ).join("\n"));
    }
  }

  // 9. Cerca tabella vento
  if (q.includes("vento") || q.includes("altezza") || q.includes("pressione") || q.includes("piano")) {
    const { data } = await supabase
      .from("tabella_vento")
      .select("*")
      .order("altezza_min_m");
    if (data?.length) {
      risultati.push("PRESSIONE VENTO PER ALTEZZA EDIFICIO (UNI EN 12210):\n" + data.map(v =>
        `- ${v.altezza_min_m}-${v.altezza_max_m}m: ${v.pressione_nm2} N/m² (${v.velocita_kmh} km/h)`
      ).join("\n"));
    }
  }

  return risultati.length > 0
    ? risultati.join("\n\n")
    : "Nessun dato specifico trovato nel database tecnico per questa domanda.";
}

// ─── Handler principale ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { domanda, contestoCommessa } = await req.json();

    if (!domanda?.trim()) {
      return NextResponse.json({ error: "Domanda mancante" }, { status: 400 });
    }

    // Cerca nel database tecnico
    const datiDB = await cercaNelDatabase(domanda);

    // Costruisce il prompt con i dati reali
    const system = `Sei MASTRO AI, l'assistente tecnico verticale per serramentisti italiani.
Hai accesso al database tecnico MASTRO con dati reali estratti da certificati di prova e cataloghi fornitori.

REGOLE FONDAMENTALI:
- Rispondi SEMPRE in italiano
- Usa SOLO i dati del DATABASE TECNICO forniti sotto — non inventare valori
- Se un dato non è nel database, dillo chiaramente
- Sii preciso e conciso — il serramentista è in cantiere o in ufficio
- Per errori di normativa usa ⛔, per attenzioni ⚠️, per info ℹ️
- Cita sempre la norma (UNI, DM, Legge) quando rilevante

DATABASE TECNICO MASTRO:
${datiDB}

${contestoCommessa ? `CONTESTO COMMESSA ATTUALE:\n${contestoCommessa}` : ""}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: domanda }],
    });

    const risposta = response.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    return NextResponse.json({ risposta, fonti: datiDB !== "Nessun dato specifico trovato nel database tecnico per questa domanda." ? "Database tecnico MASTRO" : null });

  } catch (error) {
    console.error("AI Tecnico error:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
