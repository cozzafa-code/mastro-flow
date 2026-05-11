"use client";
// components/centro/MappaCantieri.tsx
// Mappa Leaflet con pin cantieri colorati per stato materiali
// Usa OpenStreetMap (no API key richiesta)

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Cantiere {
  id: string;
  code: string;
  cliente: string;
  cognome: string | null;
  indirizzo: string | null;
  lat: number;
  lng: number;
  materiali_status: string;
  materiali_perc: number;
}

interface Props {
  aziendaId: string;
  onApriCommessa?: (id: string) => void;
}

export default function MappaCantieri({ aziendaId, onApriCommessa }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Carica Leaflet via CDN (no npm install)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // JS
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Carica dati cantieri
  useEffect(() => {
    if (!aziendaId) return;
    (async () => {
      const { data } = await supabase
        .from('commesse')
        .select('id, code, cliente, cognome, indirizzo, lat, lng, materiali_status, materiali_perc')
        .eq('azienda_id', aziendaId)
        .in('fase', ['ordine','acconto_pagato','produzione','montaggio'])
        .not('lat', 'is', null);
      setCantieri((data || []) as Cantiere[]);
      setLoading(false);
    })();
  }, [aziendaId]);

  // Inizializza mappa quando Leaflet pronto + cantieri caricati
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || cantieri.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    // Distruggi mappa vecchia
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Calcola bounds
    const bounds = L.latLngBounds(cantieri.map(c => [c.lat, c.lng]));
    
    // Crea mappa
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).fitBounds(bounds, { padding: [30, 30] });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Layer markers
    const layer = L.layerGroup().addTo(map);

    cantieri.forEach((c, i) => {
      const col = c.materiali_status === 'completo' ? TEAL :
                  c.materiali_status === 'parziale' ? AMBER :
                  c.materiali_status === 'in_attesa' ? RED : MUTED;

      // Icona custom con numero
      const icon = L.divIcon({
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
          background: ${col}; transform: rotate(-45deg);
          border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "><span style="
          transform: rotate(45deg); color: #fff; font-size: 12px; font-weight: 800;
        ">${i + 1}</span></div>`,
        className: 'custom-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([c.lat, c.lng], { icon }).addTo(layer);

      const popupHtml = `
        <div style="font-family: system-ui; min-width: 180px;">
          <div style="font-size: 13px; font-weight: 700; color: ${TEXT}; margin-bottom: 4px;">
            ${c.code} · ${c.cliente} ${c.cognome || ''}
          </div>
          <div style="font-size: 11px; color: ${MUTED}; margin-bottom: 6px;">
            ${c.indirizzo || 'No indirizzo'}
          </div>
          <div style="background: ${col}22; color: ${col}; font-size: 10px; padding: 3px 8px; border-radius: 4px; display: inline-block; font-weight: 700; margin-bottom: 6px;">
            ${c.materiali_status === 'completo' ? 'PRONTA' : c.materiali_status === 'parziale' ? `PARZ ${c.materiali_perc}%` : c.materiali_status === 'in_attesa' ? 'ATTESA' : 'NO ORD'}
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('mappa-apri', { detail: '${c.id}' }))" style="
            display: block; width: 100%; background: ${TEAL_DEEP}; color: #fff;
            border: none; padding: 6px 10px; border-radius: 5px; font-size: 11px;
            font-weight: 700; cursor: pointer; margin-top: 4px;
          ">Apri commessa →</button>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    mapInstance.current = map;
    markersLayer.current = layer;

    // Listener evento custom dal popup
    const handler = (e: any) => onApriCommessa?.(e.detail);
    window.addEventListener('mappa-apri', handler);
    return () => {
      window.removeEventListener('mappa-apri', handler);
    };
  }, [leafletLoaded, cantieri, onApriCommessa]);

  if (loading) return <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center', color: MUTED, fontSize: 12 }}>Caricamento mappa…</div>;
  if (cantieri.length === 0) return null;

  const stats = {
    pronte: cantieri.filter(c => c.materiali_status === 'completo').length,
    parziali: cantieri.filter(c => c.materiali_status === 'parziale').length,
    attesa: cantieri.filter(c => c.materiali_status === 'in_attesa').length,
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={TEAL_DEEP} strokeWidth={2}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/>
        </svg>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: TEXT, flex: 1 }}>MAPPA CANTIERI LIVE</div>
        <span style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>{cantieri.length} cantieri</span>
      </div>

      <div ref={mapRef} style={{ height: 260, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5EAF0' }} />

      <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 9, color: MUTED, justifyContent: 'center', flexWrap: 'wrap' as const }}>
        <Legend col={TEAL} label={`Pronte (${stats.pronte})`} />
        <Legend col={AMBER} label={`Parziali (${stats.parziali})`} />
        <Legend col={RED} label={`Attesa (${stats.attesa})`} />
      </div>
    </div>
  );
}

function Legend({ col, label }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 10, height: 10, background: col, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }} />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}
