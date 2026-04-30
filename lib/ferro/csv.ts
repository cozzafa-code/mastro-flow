// lib/ferro/csv.ts
// Export CSV completo della distinta
import type { FerroConfig, BomResult } from "./types";
import { STRUTTURE } from "./profiles";

export function buildCSV(c: FerroConfig, bom: BomResult, meta?: { progetto?: string; cliente?: string }): string {
  const fixLabel = STRUTTURE[c.tipo].fixType === "terra" ? c.fixTerra : c.fixMuro;
  const lines: string[] = [];

  lines.push("STRUTTURA;" + STRUTTURE[c.tipo].label);
  if (meta?.progetto) lines.push("PROGETTO;" + meta.progetto);
  if (meta?.cliente)  lines.push("CLIENTE;" + meta.cliente);
  lines.push("COLLEGAMENTO;" + c.collegamento);
  lines.push("FISSAGGIO;" + fixLabel);
  lines.push("DIMENSIONI;" + c.larghezza + "x" + c.lunghezza + " H " + c.hgronda + "/" + c.hcolmo);
  lines.push("");
  lines.push("CODICE;ELEMENTO;PROFILO;QTA;LUNG_mm;TOT_mm;PESO_kg;COSTO_EUR;NOTE");

  bom.items.forEach((it) => {
    lines.push([
      it.codice, it.nome, it.profilo, it.qta,
      it.lungU || "-", it.lungTot || "-",
      it.peso, it.costo.toFixed(2), it.nota,
    ].join(";"));
  });

  lines.push("");
  lines.push(";;;;;;PESO TOT;" + bom.totals.totPeso + " kg");
  lines.push(";;;;;;MATERIALE;" + bom.totals.totCosto.toFixed(2));
  lines.push(";;;;;;ORE OFFICINA;" + bom.totals.oreStimate);
  lines.push(";;;;;;MANODOPERA;" + bom.totals.manodopera.toFixed(2));
  lines.push(";;;;;;TOTALE;" + bom.totals.totGen.toFixed(2));

  return lines.join("\n");
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
