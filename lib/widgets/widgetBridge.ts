// lib/widgets/widgetBridge.ts
// Protocollo di comunicazione tra Widget (iframe) e Host (React parent)

import type { WidgetId, WidgetMessage } from './widgetTypes';

export const WIDGET_MESSAGE_PREFIX = 'mastro:widget';

// Verifica che un evento postMessage sia un messaggio MASTRO valido
export function isWidgetMessage(data: any): data is WidgetMessage {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    data.type.startsWith('widget:') &&
    typeof data.widgetId === 'string'
  );
}

export function isHostMessage(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    data.type.startsWith('host:')
  );
}

// Helper Host: invia messaggio a un widget iframe
export function sendToWidget(
  iframe: HTMLIFrameElement | null,
  message: Extract<WidgetMessage, { type: `host:${string}` }>
): void {
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(message, '*');
}

// Helper Widget: invia messaggio al parent host (da usare DENTRO l'HTML del widget)
// Esportato anche come stringa per essere copiato dentro file HTML standalone
export const WIDGET_BRIDGE_INLINE_JS = `
// === MASTRO Widget Bridge (auto-injected) ===
window.MASTRO_WIDGET_ID = window.MASTRO_WIDGET_ID || 'unknown';

window.mastroEmit = function(type, payload) {
  try {
    window.parent.postMessage({
      type: type,
      widgetId: window.MASTRO_WIDGET_ID,
      ...(payload !== undefined ? { patch: payload } : {})
    }, '*');
  } catch(e) { console.warn('mastroEmit failed', e); }
};

window.mastroChange = function(patch) {
  window.mastroEmit('widget:change', patch);
};

window.mastroReady = function() {
  window.parent.postMessage({type:'widget:ready', widgetId: window.MASTRO_WIDGET_ID}, '*');
};

window.mastroExport = function(data) {
  window.parent.postMessage({type:'widget:export', widgetId: window.MASTRO_WIDGET_ID, data: data}, '*');
};

window.mastroResize = function(height) {
  window.parent.postMessage({type:'widget:resize', widgetId: window.MASTRO_WIDGET_ID, height: height}, '*');
};

window.mastroError = function(error) {
  window.parent.postMessage({type:'widget:error', widgetId: window.MASTRO_WIDGET_ID, error: String(error)}, '*');
};

window.addEventListener('message', function(e) {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'host:init' && typeof window.mastroOnInit === 'function') {
    try { window.mastroOnInit(e.data.payload || {}); }
    catch(err) { window.mastroError(err); }
  }
  if (e.data.type === 'host:reload' && typeof window.mastroOnReload === 'function') {
    try { window.mastroOnReload(e.data.payload || {}); }
    catch(err) { window.mastroError(err); }
  }
});
// === Fine bridge ===
`;
