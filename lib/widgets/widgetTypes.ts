// lib/widgets/widgetTypes.ts
// Tipi TypeScript per il sistema widget MASTRO

export type WidgetId =
  | 'pergola'
  | 'cancello'
  | 'persiana'
  | 'boxdoccia'
  | 'zanzariera'
  | 'falegname';

export type WidgetPlan = 'BASE' | 'START' | 'PRO' | 'TITAN';

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  sublabel: string;
  iconSvg: string; // SVG inline path data
  namespace: string; // prefix campi vano (es. "pergola_")
  htmlPath: string;
  minPlan: WidgetPlan;
  defaultHeight?: number; // px del frame quando aperto
}

// Messaggi postMessage scambiati tra Widget (iframe) e Host (React)
export type WidgetMessage =
  // Widget → Host
  | { type: 'widget:ready'; widgetId: WidgetId }
  | { type: 'widget:change'; widgetId: WidgetId; patch: Record<string, any> }
  | { type: 'widget:export'; widgetId: WidgetId; data: WidgetExportData }
  | { type: 'widget:resize'; widgetId: WidgetId; height: number }
  | { type: 'widget:error'; widgetId: WidgetId; error: string }
  // Host → Widget
  | { type: 'host:init'; widgetId: WidgetId; payload: Record<string, any> }
  | { type: 'host:reload'; widgetId: WidgetId; payload: Record<string, any> };

export interface WidgetExportData {
  // Output finale del widget (per preventivo/distinta)
  distinta: Array<{
    codice: string;
    nome: string;
    quantita: number;
    unita: string;
    prezzo_unitario?: number;
    prezzo_totale?: number;
  }>;
  prezzo_totale?: number;
  peso_totale_kg?: number;
  preview_image?: string; // base64 PNG render 3D
  riepilogo?: string; // testo descrittivo per PDF preventivo
}
