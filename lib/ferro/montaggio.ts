// lib/ferro/montaggio.ts
// Genera 7 fasi di montaggio adattive in base al tipo struttura e config
import type { FerroConfig, BomResult } from "./types";
import { STRUTTURE } from "./profiles";

export interface FaseMontaggio { n: number; titolo: string; descrizione: string; }

export function buildMontaggioFasi(c: FerroConfig, bom: BomResult): FaseMontaggio[] {
  const fixType = STRUTTURE[c.tipo].fixType;
  const { piastra, bull, tassMuro } = bom.config;
  const interArc = Math.round(c.larghezza / Math.max(1, c.arcarecci - 1));
  const pendenza = c.tipo === "pergola" ? "0%" : Math.round((c.hcolmo - c.hgronda) / c.larghezza * 100) + "%";

  return [
    {
      n: 1, titolo: "Tracciamento e foratura",
      descrizione: fixType === "terra"
        ? "Tracciare gli assi pilastri sul cordolo. Forare con punta ?" + piastra.foroD + "mm a profondit? " + (piastra.foroD * 5) + "mm per i tasselli. Aspirare i fori."
        : "Tracciare l'asse mensole sul muro. Forare ?18mm a profondit? 130mm. Aspirare e iniettare resina " + tassMuro.tipo + ".",
    },
    {
      n: 2, titolo: "Posa piastre/elementi a terra",
      descrizione: fixType === "terra"
        ? "Posizionare piastra base PB01 (" + piastra.dim + "x" + piastra.dim + "x" + piastra.sp + "). Inserire bulloni " + piastra.bullone + ", livellare con malta espansiva, serrare a coppia " + (parseInt(piastra.bullone.replace("M", "")) * 12) + " Nm."
        : "Posare piastre murali PB01, inserire barre filettate. Aspettare 24h per indurimento resina prima di proseguire.",
    },
    {
      n: 3, titolo: c.tipo === "pensilina" ? "Montaggio mensole" : "Innalzamento pilastri",
      descrizione: c.tipo === "pensilina"
        ? "Montare mensole M01 sulle piastre murali. Avvitare dadi alle barre filettate. Verificare orizzontalit?."
        : "Sollevare pilastri P01/P02 con autogru o muletto. Bullonare alla piastra base. Verificare verticalit? con livella laser. Tolleranza max ?3mm su 3m.",
    },
    {
      n: 4, titolo: c.tipo === "pensilina" ? "Montaggio tiranti" : "Posa travi/capriate",
      descrizione: c.tipo === "pensilina"
        ? "Montare tiranti TR01 dal punto alto del muro all'estremit? mensola. Perno superiore fisso, perno inferiore in asola di registro."
        : "Sollevare travi T01 e bullonare ai pilastri tramite flange. " + (c.tipo === "capannone" ? "Per capannone: prima la catena T02, poi le falde, poi serraggio definitivo. " : "") + "Verificare allineamento prima del serraggio finale.",
    },
    {
      n: 5, titolo: "Controventatura",
      descrizione: c.tipo === "pergola"
        ? "Pergola: nessun controvento principale richiesto. Verificare squadro pianta con misura diagonali."
        : "Montare controventi C01 in piatto sulle campate estreme. Tendere con dadi di registrazione. Squadro perfetto della struttura con misurazione diagonali (tolleranza ?5mm).",
    },
    {
      n: 6, titolo: "Posa arcarecci/listelli",
      descrizione: "Posizionare arcarecci A01 (" + c.arcareccio.name + "). Interasse " + interArc + " mm. Fissaggio con cavallotti a U M10.",
    },
    {
      n: 7, titolo: "Verifica finale",
      descrizione: "Controllo squadro, pendenza " + pendenza + ", serraggio bulloni con chiave dinamometrica. Ritocchi vernice antiruggine sui punti di taglio/foratura/saldatura. Compilare scheda collaudo.",
    },
  ];
}
