// lib/ferro/details/index.ts
// Dispatcher: ritorna i dettagli costruttivi giusti in base al tipo struttura
import type { FerroConfig, BomResult } from "../types";
import { STRUTTURE } from "../profiles";
import { detailPiastraBase } from "./piastra-base";
import { detailPiastraMurale } from "./piastra-murale";
import { detailNodoTravePilastro } from "./nodo-trave-pilastro";
import { detailNodoCapriata } from "./nodo-capriata";
import { detailNodoCatena } from "./nodo-catena";
import { detailArcarecciTrave } from "./arcareccio-trave";
import { detailNodoMuroMensola } from "./nodo-muro-mensola";
import { detailTiranteDiagonale } from "./tirante-diagonale";
import { detailListelliPergola } from "./listelli-pergola";
import { detailSimboloCollegamento } from "./simbolo-collegamento";

export interface DettaglioCard { letter: string; titolo: string; svgMarkup: string; note: string; }

export function buildDettagliCard(c: FerroConfig, bom: BomResult): DettaglioCard[] {
  const fixType = STRUTTURE[c.tipo].fixType;
  const { piastra, bull, tass, tassMuro, sald, geom } = bom.config;
  const interArc = Math.round(c.larghezza / Math.max(1, c.arcarecci - 1));
  const interLis = Math.round(c.lunghezza / Math.max(1, c.arcarecci - 1));
  const cards: DettaglioCard[] = [];

  // Card A: piastra base o murale
  if (fixType === "terra") cards.push(detailPiastraBase(piastra, bull, tass, c.fixTerra));
  else cards.push(detailPiastraMurale(tassMuro));

  // Card B/C in base al tipo
  if (c.tipo === "mono" || c.tipo === "doppia") {
    cards.push(detailNodoTravePilastro(bull, sald, c.collegamento, geom.ang));
    cards.push(detailArcarecciTrave(interArc));
  } else if (c.tipo === "capannone") {
    cards.push(detailNodoCapriata(bull));
    cards.push(detailNodoCatena(bull));
    cards.push(detailArcarecciTrave(interArc));
  } else if (c.tipo === "pensilina") {
    cards.push(detailNodoMuroMensola(tassMuro));
    cards.push(detailTiranteDiagonale(bull));
  } else if (c.tipo === "pergola") {
    cards.push(detailNodoTravePilastro(bull, sald, c.collegamento, 0));
    cards.push(detailListelliPergola(bull, interLis));
  }

  // Card D: simbolo collegamento (sempre)
  cards.push(detailSimboloCollegamento(bull, sald, c.collegamento));

  return cards;
}
