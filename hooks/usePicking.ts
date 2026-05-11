"use client";
// hooks/usePicking.ts
// Picking list ottimizzato per scaffale + Error Engine

import { useMemo } from "react";
import type { CaricoArticolo, Carico } from "./useFurgoni";

export interface PickingStop {
  scaffale: string;
  zona: string;
  articoli: CaricoArticolo[];
  totale_pz: number;
  tutti_verificati: boolean;
  tutti_caricati: boolean;
}

export interface ErroreBloccante {
  severity: 'block' | 'warn';
  code: string;
  message: string;
  articolo_id?: string;
}

const ZONA_DI_SCAFFALE: Record<string, string> = {
  A: 'vetri', B: 'profili', C: 'ferramenta', D: 'motori/accessori', E: 'kit_posa',
};

function zonaFromScaffale(sc: string | null): string {
  if (!sc) return 'altro';
  const first = sc.charAt(0).toUpperCase();
  return ZONA_DI_SCAFFALE[first] || 'altro';
}

// Ordine ottimale di pickup: A (entrata vetri pesanti) → B → C → D → E (uscita verso carico)
const ORDINE_SCAFFALI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'E3'];

export function usePicking(articoli: CaricoArticolo[]) {
  return useMemo(() => {
    // Raggruppa per scaffale
    const byScaff: Record<string, CaricoArticolo[]> = {};
    articoli.forEach(a => {
      const sc = a.scaffale_origine || 'NO_POS';
      if (!byScaff[sc]) byScaff[sc] = [];
      byScaff[sc].push(a);
    });

    // Costruisci stops ordinati per percorso ottimale
    const stops: PickingStop[] = Object.entries(byScaff).map(([scaff, arts]) => ({
      scaffale: scaff,
      zona: zonaFromScaffale(scaff),
      articoli: arts,
      totale_pz: arts.reduce((s, a) => s + Number(a.quantita), 0),
      tutti_verificati: arts.every(a => a.verificato),
      tutti_caricati: arts.every(a => a.caricato),
    }));

    // Ordina secondo percorso ottimale
    stops.sort((a, b) => {
      const idxA = ORDINE_SCAFFALI.indexOf(a.scaffale);
      const idxB = ORDINE_SCAFFALI.indexOf(b.scaffale);
      if (idxA === -1 && idxB === -1) return a.scaffale.localeCompare(b.scaffale);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return stops;
  }, [articoli]);
}

// ERROR ENGINE: validazioni bloccanti pre-partenza
export function useErrorEngine(carico: Carico | null, articoli: CaricoArticolo[]): ErroreBloccante[] {
  return useMemo(() => {
    if (!carico) return [];
    const errors: ErroreBloccante[] = [];

    // 1. BLOCK: articoli mancanti (qta dichiarata ma non verificati)
    const nonVerif = articoli.filter(a => !a.verificato);
    nonVerif.forEach(a => {
      errors.push({
        severity: 'block',
        code: 'NOT_VERIFIED',
        message: `${a.articolo_descrizione} (${a.quantita} pz) NON verificato`,
        articolo_id: a.id,
      });
    });

    // 2. BLOCK: articoli verificati ma non caricati
    const nonCar = articoli.filter(a => a.verificato && !a.caricato);
    nonCar.forEach(a => {
      errors.push({
        severity: 'warn',
        code: 'NOT_LOADED',
        message: `${a.articolo_descrizione} verificato ma NON caricato`,
        articolo_id: a.id,
      });
    });

    // 3. BLOCK: doppia assegnazione articolo (stesso QR su 2 carichi)
    // Simulazione: cerco QR duplicati nello stesso carico (logica reale richiederebbe query DB)
    const qrSeen: Record<string, number> = {};
    articoli.forEach(a => {
      if (a.qr_code) qrSeen[a.qr_code] = (qrSeen[a.qr_code] || 0) + 1;
    });
    Object.entries(qrSeen).forEach(([qr, n]) => {
      if (n > 1) errors.push({
        severity: 'block',
        code: 'DUP_QR',
        message: `QR ${qr} presente ${n} volte nel carico - duplicato`,
      });
    });

    // 4. WARN: categoria mancante critica (vetri o telai o motori)
    const cats = new Set(articoli.map(a => a.categoria));
    const commesseIds = new Set(articoli.map(a => a.commessa_id).filter(Boolean));
    commesseIds.forEach(cmId => {
      const articoliCm = articoli.filter(a => a.commessa_id === cmId);
      const catsCm = new Set(articoliCm.map(a => a.categoria));
      const cmCode = articoliCm[0]?.commessa_code || cmId;
      // Se c'è telai ma manca vetri → warning
      if (catsCm.has('telai') && !catsCm.has('vetri')) {
        errors.push({
          severity: 'warn',
          code: 'NO_VETRI',
          message: `${cmCode}: telai presenti ma manca VETRI nel carico`,
        });
      }
      if (catsCm.has('ante') && !catsCm.has('ferramenta')) {
        errors.push({
          severity: 'warn',
          code: 'NO_FERRAMENTA',
          message: `${cmCode}: ante presenti ma manca FERRAMENTA nel carico`,
        });
      }
    });

    // 5. BLOCK: peso sopra capacità furgone
    const totWeight = articoli.reduce((s, a) => s + (Number(a.peso_kg) || 0) * Number(a.quantita), 0);
    const capacita = Number((carico as any).furgone_capacita_kg) || 1500;
    if (totWeight > capacita) {
      errors.push({
        severity: 'block',
        code: 'OVERWEIGHT',
        message: `Sovrappeso: ${totWeight}kg > ${capacita}kg max furgone`,
      });
    }

    return errors;
  }, [carico, articoli]);
}
