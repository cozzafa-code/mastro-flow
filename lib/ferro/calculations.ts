// lib/ferro/calculations.ts
// Motore BOM: genera distinta materiali completa
import type { FerroConfig, BomResult, BomItem, BomSection } from "./types";
import { autoPiastraBase, autoBulloni, autoTassello, autoTassChim, autoSaldature } from "./rules";
import { geom } from "./geometry";
import { STRUTTURE } from "./profiles";

export function buildBOM(c: FerroConfig): BomResult {
  const { tipo, larghezza: W, lunghezza: L, hgronda: Hg, hcolmo: Hc, campate, arcarecci } = c;
  const g = geom(c);
  const piastra = autoPiastraBase(c);
  const bull = autoBulloni(c);
  const tass = autoTassello(c);
  const tassMuro = autoTassChim();
  const sald = autoSaldature(c);

  const profili: BomItem[] = [];
  const piastre: BomItem[] = [];
  const bullonerie: BomItem[] = [];
  const saldature: BomItem[] = [];
  const accessori: BomItem[] = [];

  // PROFILI per tipo struttura
  if (tipo === "mono") {
    profili.push(
      mkP("P01", "Pilastro fronte", c.pilastro.name, campate + 1, Hg, c.pilastro.kgm, c.pilastro.eurm, "taglio dritto"),
      mkP("P02", "Pilastro retro",  c.pilastro.name, campate + 1, Hc, c.pilastro.kgm, c.pilastro.eurm, "taglio dritto"),
      mkP("T01", "Trave inclinata", c.trave.name, campate + 1, g.lungT, c.trave.kgm, c.trave.eurm, "taglio inclinato " + g.ang + "? entrambi i lati"),
      mkA("A01", "Arcareccio", c.arcareccio.name, arcarecci, L, c.arcareccio.kgm, c.arcareccio.eurm, "da spezzonare in officina"),
    );
  } else if (tipo === "doppia") {
    profili.push(
      mkP("P01", "Pilastro laterale", c.pilastro.name, 2 * (campate + 1), Hg, c.pilastro.kgm, c.pilastro.eurm, "taglio dritto"),
      mkP("T01", "Falda destra",     c.trave.name, campate + 1, g.falda, c.trave.kgm, c.trave.eurm, "taglio " + g.ang + "? estremit?"),
      mkP("T02", "Falda sinistra",   c.trave.name, campate + 1, g.falda, c.trave.kgm, c.trave.eurm, "taglio " + g.ang + "? estremit?"),
      mkA("A01", "Arcareccio falda", c.arcareccio.name, 2 * arcarecci, L, c.arcareccio.kgm, c.arcareccio.eurm, "da spezzonare"),
    );
  } else if (tipo === "capannone") {
    profili.push(
      mkP("P01", "Pilastro capriata", c.pilastro.name, 2 * (campate + 1), Hg, c.pilastro.kgm, c.pilastro.eurm, "taglio dritto + piastra saldata"),
      mkP("T01", "Trave capriata",    c.trave.name, 2 * (campate + 1), g.falda, c.trave.kgm, c.trave.eurm, "inclinata " + g.ang + "?"),
      mkP("T02", "Catena tirante",    "UPN 100", campate + 1, W, 10.6, 8.40, "tirante orizzontale capriata"),
      mkA("A01", "Arcareccio falda", c.arcareccio.name, 2 * arcarecci, L, c.arcareccio.kgm, c.arcareccio.eurm, "da spezzonare"),
    );
  } else if (tipo === "pensilina") {
    profili.push(
      mkP("M01", "Mensola sbalzo",   c.trave.name, campate, g.lungT, c.trave.kgm, c.trave.eurm, "fissaggio piastra a parete"),
      mkP("TR01", "Tirante diagonale", "Tub. 50x50x3", campate, g.lungT, 4.4, 3.50, "asola di registro estremit?"),
      mkA("A01", "Arcareccio", c.arcareccio.name, arcarecci, L, c.arcareccio.kgm, c.arcareccio.eurm, "da spezzonare"),
    );
  } else if (tipo === "pergola") {
    profili.push(
      mkP("P01", "Pilastro pergola",   c.pilastro.name, 2 * (campate + 1), Hg, c.pilastro.kgm, c.pilastro.eurm, "taglio dritto"),
      mkP("T01", "Trave perimetrale", c.trave.name, 2, L, c.trave.kgm, c.trave.eurm, "lato lungo"),
      mkP("T02", "Trave testata",     c.trave.name, campate + 1, W, c.trave.kgm, c.trave.eurm, "lato corto"),
      mkA("A01", "Listello superiore", c.arcareccio.name, arcarecci, L, c.arcareccio.kgm, c.arcareccio.eurm, "distribuzione costante"),
    );
  }

  // PIASTRE
  const totPil = profili.filter((p) => p.id.startsWith("P") || p.id === "M01").reduce((a, b) => a + b.qta, 0);
  if (STRUTTURE[tipo].fixType === "terra") {
    piastre.push(mkPiastra("PB01", "Piastra base pilastro",
      "Lamiera " + piastra.dim + "x" + piastra.dim + "x" + piastra.sp,
      totPil, piastra.dim, piastra.kg, piastra.eur,
      piastra.fori + " fori ?" + piastra.foroD + " ? interasse " + piastra.interasse + "x" + piastra.interasse + " ? bull. " + piastra.bullone));
  } else {
    piastre.push(mkPiastra("PB01", "Piastra murale", "Lamiera 200x300x10",
      totPil * 2, 200, 4.71, 6.50,
      "4 fori ?18 ? barre " + tassMuro.tipo));
  }

  // CONTROVENTI per strutture pesanti
  if (tipo === "mono" || tipo === "doppia" || tipo === "capannone") {
    const lungCV = Math.round(Math.sqrt(Hg * Hg + Math.pow(L / campate, 2)));
    const cvProf = tipo === "capannone" ? "Piatto 60x10" : "Piatto 50x8";
    const cvKg = tipo === "capannone" ? 4.71 : 3.14;
    const cvEur = tipo === "capannone" ? 3.80 : 2.50;
    profili.push(mkP("C01", "Controvento", cvProf, 4, lungCV, cvKg, cvEur, "fori ?" + (tipo === "capannone" ? "16" : "14") + " estremit?"));
  }

  // BULLONERIA
  if (c.collegamento === "bullonato" || c.collegamento === "misto") {
    if (STRUTTURE[tipo].fixType === "terra") {
      bullonerie.push(mkBull("B01", "Tassello/tirafondo base", tass.tipo,
        totPil * piastra.fori, tass.kg, tass.eur,
        c.fixTerra === "tirafondi" ? "tirafondi annegati"
          : c.fixTerra === "annegato" ? "pilastro annegato"
          : "tasselli meccanici/chimici"));
    } else {
      bullonerie.push(mkBull("B01", "Tassello chimico muro", tassMuro.tipo,
        totPil * 2 * 4, tassMuro.kg, tassMuro.eur, "iniettato, indurimento 24h"));
    }
    const nodiPilTrave = (tipo === "mono" || tipo === "doppia" || tipo === "capannone")
      ? 2 * (campate + 1)
      : tipo === "pergola" ? (campate + 1) * 2 : 0;
    if (nodiPilTrave > 0) {
      bullonerie.push(mkBull("B02", "Bulloni nodo trave-pilastro",
        bull.tipo + " cl." + bull.classe,
        nodiPilTrave * 4, bull.kg, bull.eur, "4 per nodo ? serraggio coppia"));
    }
  }

  // SALDATURE
  if (c.collegamento === "saldato" || c.collegamento === "misto") {
    saldature.push(mkSald("S01", "Saldatura piastra-pilastro", "Cordone " + sald.simbolo,
      totPil, sald.lung,
      "cordone d'angolo a tutto giro ? " + sald.metodo + " ? spessore " + sald.spessore + "mm"));
    if (c.collegamento === "saldato") {
      const nNodi = (tipo === "capannone" || tipo === "doppia") ? 2 * (campate + 1)
        : tipo === "mono" ? 2 * (campate + 1) : 0;
      if (nNodi > 0) {
        saldature.push(mkSald("S02", "Saldatura trave-pilastro", "Cordone a4",
          nNodi, 280, "cordone d'angolo continuo ? MAG ? spessore 4mm"));
      }
    }
  }

  // ACCESSORI
  const nFazz = profili.filter((p) => p.id.startsWith("T") || p.id === "M01").reduce((a, b) => a + b.qta, 0) * 2;
  accessori.push(mkAcc("AC01", "Squadrette/fazzoletti", "Lamiera 6mm",
    nFazz, 150, 1.05, 2.40, "irrigidimento nodi"));
  if (tipo === "capannone" || tipo === "doppia") {
    accessori.push(mkAcc("AC02", "Piastra giunto colmo", "Lamiera 250x250x10",
      campate + 1, 250, 4.91, 6.80, "unione due falde al colmo"));
  }

  // FINALIZE: peso/costo gi? calcolati nei mk*, solo aggregazione
  const all: BomItem[] = [...profili, ...piastre, ...bullonerie, ...saldature, ...accessori];
  const totPeso = +all.reduce((a, b) => a + (b.peso || 0), 0).toFixed(1);
  const totCosto = +all.reduce((a, b) => a + (b.costo || 0), 0).toFixed(2);
  const oreStimate = Math.max(3, Math.round(totPeso / 25));
  const manodopera = +(oreStimate * 35).toFixed(2);
  const totGen = +(totCosto + manodopera).toFixed(2);

  const sections: Record<BomSection, BomItem[]> = {
    profili: profili.filter((p) => p.sezione === "profili"),
    arcarecci: profili.filter((p) => p.sezione === "arcarecci"),
    piastre,
    bulloneria: bullonerie,
    saldature,
    accessori,
  };

  return {
    items: all,
    sections,
    totals: { totPeso, totCosto, oreStimate, manodopera, totGen },
    config: { piastra, bull, tass, tassMuro, sald, geom: g },
  };
}

// =============================================================
// Helpers di costruzione BomItem
// =============================================================

function mkP(id: string, nome: string, profilo: string, qta: number, lungU: number, kgm: number, eurm: number, nota: string): BomItem {
  const lungTot = qta * lungU;
  const peso = +(lungTot / 1000 * kgm).toFixed(2);
  const costo = +(lungTot / 1000 * eurm).toFixed(2);
  return { id, codice: id, nome, profilo, qta, lungU, lungTot, kgm, eurm, peso, costo, nota, sezione: "profili" };
}

function mkA(id: string, nome: string, profilo: string, qta: number, lungU: number, kgm: number, eurm: number, nota: string): BomItem {
  const item = mkP(id, nome, profilo, qta, lungU, kgm, eurm, nota);
  item.sezione = "arcarecci";
  return item;
}

function mkPiastra(id: string, nome: string, profilo: string, qta: number, lungU: number, kgU: number, eurU: number, nota: string): BomItem {
  const peso = +(qta * kgU).toFixed(2);
  const costo = +(qta * eurU).toFixed(2);
  return { id, codice: id, nome, profilo, qta, lungU, lungTot: qta * lungU, peso, costo, nota, sezione: "piastre" };
}

function mkBull(id: string, nome: string, profilo: string, qta: number, kgU: number, eurU: number, nota: string): BomItem {
  const peso = +(qta * kgU).toFixed(2);
  const costo = +(qta * eurU).toFixed(2);
  return { id, codice: id, nome, profilo, qta, lungU: 0, lungTot: 0, peso, costo, nota, sezione: "bulloneria" };
}

function mkSald(id: string, nome: string, profilo: string, qta: number, lungU: number, nota: string): BomItem {
  return { id, codice: id, nome, profilo, qta, lungU, lungTot: qta * lungU, peso: 0, costo: 0, nota, sezione: "saldature" };
}

function mkAcc(id: string, nome: string, profilo: string, qta: number, lungU: number, kgU: number, eurU: number, nota: string): BomItem {
  const peso = +(qta * kgU).toFixed(2);
  const costo = +(qta * eurU).toFixed(2);
  return { id, codice: id, nome, profilo, qta, lungU, lungTot: qta * lungU, peso, costo, nota, sezione: "accessori" };
}
