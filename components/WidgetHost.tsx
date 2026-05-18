'use client';
// components/WidgetHost.tsx
// Componente generico che monta un widget MASTRO in un iframe

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WidgetId, WidgetMeta, WidgetExportData } from '@/lib/widgets/widgetTypes';
import { getWidget, extractWidgetData } from '@/lib/widgets/widgetRegistry';
import { isWidgetMessage, sendToWidget } from '@/lib/widgets/widgetBridge';

interface Props {
  widgetId: WidgetId;
  vano: any;
  onChange: (patch: Record<string, any>) => void;
  onExport?: (data: WidgetExportData) => void;
  height?: number;
}

export default function WidgetHost({
  widgetId,
  vano,
  onChange,
  onExport,
  height,
}: Props) {
  const widget: WidgetMeta = getWidget(widgetId);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number>(
    height || widget.defaultHeight || 700
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Refs stabili per evitare di ri-creare il listener ad ogni render
  // FIX: senza questo, onChange (ricreato ad ogni render del parent) causava
  // remount del listener perdendo il messaggio widget:ready
  const onChangeRef = useRef(onChange);
  const onExportRef = useRef(onExport);
  const vanoRef = useRef(vano);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { onExportRef.current = onExport; });
  useEffect(() => { vanoRef.current = vano; });

  // Invia init al widget
  const sendInit = useCallback(() => {
    const data = extractWidgetData(vanoRef.current?.dati || {}, widget);
    sendToWidget(iframeRef.current, {
      type: 'host:init',
      widgetId,
      payload: data,
    } as any);
  }, [widget, widgetId]);

  // Listener messaggi: registrato UNA SOLA VOLTA per widgetId, mai rimontato
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!isWidgetMessage(e.data)) return;
      if (e.data.widgetId !== widgetId) return;

      switch (e.data.type) {
        case 'widget:ready':
          setReady(true);
          break;
        case 'widget:change':
          if (e.data.patch && typeof onChangeRef.current === 'function') {
            onChangeRef.current(e.data.patch);
          }
          break;
        case 'widget:export':
          if (onExportRef.current && e.data.data) onExportRef.current(e.data.data);
          break;
        case 'widget:resize':
          if (e.data.height && e.data.height > 200 && e.data.height < 4000) {
            setIframeHeight(e.data.height);
          }
          break;
        case 'widget:error':
          setErrorMsg(e.data.error || 'Errore widget');
          break;
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [widgetId]); // SOLO widgetId. onChange/onExport via ref.

  // Quando ready === true, manda init
  useEffect(() => {
    if (ready) sendInit();
  }, [ready, sendInit]);

  // Quando vano cambia da fuori (es. caricamento iniziale o reload), reinvia
  useEffect(() => {
    if (!ready) return;
    sendInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vano?.id]);

  // FIX FALLBACK: se l'iframe carica e per qualche motivo non riceviamo widget:ready
  // entro 3 secondi, forziamo lo stato ready (l'iframe e' caricato comunque)
  const onIframeLoad = useCallback(() => {
    setTimeout(() => {
      setReady((prev) => {
        if (!prev) {
          if (typeof console !== 'undefined') {
            console.warn('[WidgetHost] forzato ready dopo iframe load (timeout 3s)');
          }
          return true;
        }
        return prev;
      });
    }, 3000);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        background: '#0D1F1F',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #156060',
        position: 'relative',
      }}
    >
      {!ready && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#28A0A0',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            zIndex: 10,
            background: '#0D1F1F',
            pointerEvents: 'none',
          }}
        >
          Caricamento configuratore…
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            background: '#DC4444',
            color: '#fff',
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Errore: {errorMsg}
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={widget.htmlPath}
        title={widget.label}
        onLoad={onIframeLoad}
        style={{
          width: '100%',
          height: iframeHeight,
          border: 'none',
          display: 'block',
          background: '#0D1F1F',
        }}
      />
    </div>
  );
}
