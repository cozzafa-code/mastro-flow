// lib/widgets/widgetRegistry.ts
// Registry centralizzato di tutti i widget MASTRO

import type { WidgetId, WidgetMeta } from './widgetTypes';

export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  pergola: {
    id: 'pergola',
    label: 'Verande e Pergole',
    sublabel: 'Strutture esterne con copertura',
    iconSvg:
      'M3 12l9-9 9 9M5 10v10h14V10', // casa con tetto
    namespace: 'pergola_',
    htmlPath: '/widgets/pergola/index.html',
    minPlan: 'PRO',
    defaultHeight: 720,
  },
  cancello: {
    id: 'cancello',
    label: 'Cancelli e Recinzioni',
    sublabel: 'Cancelli battenti, scorrevoli, manuali e automatici',
    iconSvg: 'M4 4v16M20 4v16M4 12h16',
    namespace: 'cancello_',
    htmlPath: '/widgets/cancello/index.html',
    minPlan: 'PRO',
    defaultHeight: 700,
  },
  persiana: {
    id: 'persiana',
    label: 'Persiane',
    sublabel: 'Persiane in legno, alluminio, blindate',
    iconSvg: 'M5 4h14v16H5zM5 9h14M5 14h14M5 19h14',
    namespace: 'persiana_',
    htmlPath: '/widgets/persiana/index.html',
    minPlan: 'START',
    defaultHeight: 650,
  },
  boxdoccia: {
    id: 'boxdoccia',
    label: 'Box Doccia',
    sublabel: 'Cabine doccia su misura',
    iconSvg: 'M4 4h16v16H4zM4 8h16',
    namespace: 'boxdoccia_',
    htmlPath: '/widgets/boxdoccia/index.html',
    minPlan: 'START',
    defaultHeight: 650,
  },
  zanzariera: {
    id: 'zanzariera',
    label: 'Zanzariere',
    sublabel: 'Zanzariere a rullo, plissè, fisse',
    iconSvg: 'M4 4h16v16H4zM4 8h16M8 4v16M16 4v16',
    namespace: 'zanzariera_',
    htmlPath: '/widgets/zanzariera/index.html',
    minPlan: 'BASE',
    defaultHeight: 600,
  },
  falegname: {
    id: 'falegname',
    label: 'Falegnameria',
    sublabel: 'Mobili, scaffali, arredi su misura',
    iconSvg: 'M4 4h16v8H4zM4 12h16v8H4z',
    namespace: 'falegname_',
    htmlPath: '/widgets/falegname/index.html',
    minPlan: 'PRO',
    defaultHeight: 700,
  },
};

export function getWidget(id: WidgetId): WidgetMeta {
  return WIDGETS[id];
}

// Estrae il subset di vano.dati relativo al widget (campi con prefisso namespace)
export function extractWidgetData(
  vanoData: Record<string, any>,
  widget: WidgetMeta
): Record<string, any> {
  const out: Record<string, any> = {};
  if (!vanoData) return out;
  const ns = widget.namespace;
  for (const [k, v] of Object.entries(vanoData)) {
    if (k.startsWith(ns)) out[k] = v;
  }
  return out;
}
