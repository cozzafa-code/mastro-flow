// lib/ferro/officina.ts
// Genera lista officina sezionata: taglio, foratura, saldatura, bulloneria, accessori, trattamenti
import type { FerroConfig, BomResult } from "./types";
import { STRUTTURE } from "./profiles";

export interface OfficinaSection {
  titolo: string;
  righe: { codice: string; nome: string; profilo: string; qta: number; lungU?: number; nota: string }[];
}

export function buildOfficinaList(c: FerroConfig, bom: BomResult): OfficinaSection[] {
  const sections: OfficinaSection[] = [];

  // TAGLIO PROFILI (incluso arcarecci)
  sections.push({
    titolo: "TAGLIO PROFILI",
    righe: [...bom.sections.profili, ...bom.sections.arcarecci].map((it) => ({
      codice: it.codice, nome: it.nome, profilo: it.profilo, qta: it.qta, lungU: it.lungU, nota: it.nota,
    })),
  });

  // FORATURA PIASTRE
  sections.push({
    titolo: "FORATURA PIASTRE",
    righe: bom.sections.piastre.map((it) => ({
      codice: it.codice, nome: it.nome, profilo: it.profilo, qta: it.qta, nota: it.nota,
    })),
  });

  // SALDATURA
  if (bom.sections.saldature.length > 0) {
    sections.push({
      titolo: "SALDATURA",
      righe: bom.sections.saldature.map((it) => ({
        codice: it.codice, nome: it.nome, profilo: it.profilo, qta: it.qta, lungU: it.lungU, nota: it.nota,
      })),
    });
  }

  // BULLONERIA
  if (bom.sections.bulloneria.length > 0) {
    sections.push({
      titolo: "BULLONERIA",
      righe: bom.sections.bulloneria.map((it) => ({
        codice: it.codice, nome: it.nome, profilo: it.profilo, qta: it.qta, nota: it.nota,
      })),
    });
  }

  // ACCESSORI
  if (bom.sections.accessori.length > 0) {
    sections.push({
      titolo: "ACCESSORI",
      righe: bom.sections.accessori.map((it) => ({
        codice: it.codice, nome: it.nome, profilo: it.profilo, qta: it.qta, lungU: it.lungU, nota: it.nota,
      })),
    });
  }

  // TRATTAMENTI
  sections.push({
    titolo: "TRATTAMENTI",
    righe: [
      { codice: "TR01", nome: "Sabbiatura SA 2.5", profilo: "tutti i profili", qta: 1, nota: "prima della verniciatura" },
      { codice: "TR02", nome: "Zincatura/ciclo epossi-poliuretanico", profilo: "spessore 80?m", qta: 1, nota: "anti-corrosione" },
    ],
  });

  return sections;
}
