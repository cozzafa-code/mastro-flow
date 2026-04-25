"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { TIPO_COLORE, type AgendaEvento } from "@/hooks/useAgenda";
import { getRoute, type RouteResult } from "@/lib/geocoding";

// Leaflet va caricato solo client-side (no SSR · usa window)
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

interface Props {
  eventi: AgendaEvento[];
}

export function MappaLeaflet({ eventi }: Props) {
  const [LIcons, setLIcons] = useState<any>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Filtro solo eventi con coordinate
  const eventiConCoord = useMemo(
    () => eventi.filter((e) => e.lat != null && e.lon != null),
    [eventi]
  );

  // Centro mappa: media coords o Cosenza default
  const center = useMemo<[number, number]>(() => {
    if (eventiConCoord.length === 0) return [39.2986, 16.2531];
    const avgLat = eventiConCoord.reduce((s, e) => s + (e.lat ?? 0), 0) / eventiConCoord.length;
    const avgLon = eventiConCoord.reduce((s, e) => s + (e.lon ?? 0), 0) / eventiConCoord.length;
    return [avgLat, avgLon];
  }, [eventiConCoord]);

  // Carico Leaflet + creo icone custom solo client-side
  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!mounted) return;

      // Fix icone default Leaflet (Webpack non trova le immagini)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Crea icone divIcon custom per ogni tipo evento (cerchio colorato + numero)
      const makeDivIcon = (color: string, label: string) => L.divIcon({
        className: "agenda-marker",
        html: `<div style="
          width:30px;height:30px;border-radius:50%;
          background:${color};
          border:3px solid #fff;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:900;font-size:11px;font-family:Inter,system-ui,sans-serif;
        ">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
      });

      setLIcons({ L, makeDivIcon });
    })();
    return () => { mounted = false; };
  }, []);

  // Calcolo route quando cambia il set di eventi
  useEffect(() => {
    if (eventiConCoord.length < 2) { setRoute(null); return; }
    setLoadingRoute(true);
    const points = eventiConCoord
      .sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio))
      .map((e) => ({ lat: e.lat!, lon: e.lon! }));
    getRoute(points).then((r) => {
      setRoute(r);
      setLoadingRoute(false);
    });
  }, [eventiConCoord]);

  if (!LIcons) {
    // skeleton durante load
    return (
      <div style={{
        width: "100%", height: 240, borderRadius: 14,
        background: "linear-gradient(135deg, #C8E4E4 0%, #8FB8B8 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#1E8080",
        boxShadow: "0 4px 14px rgba(13,31,31,0.08)",
      }}>Carico mappa...</div>
    );
  }

  // Sort eventi per orario per numerare i pin in ordine
  const sortedEv = [...eventiConCoord].sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio));

  return (
    <div style={{
      width: "100%", height: 240, borderRadius: 14, overflow: "hidden",
      boxShadow: "0 4px 14px rgba(13,31,31,0.08)",
      position: "relative",
    }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polyline percorso */}
        {route && (
          <Polyline
            positions={route.coords}
            pathOptions={{ color: "#1E8080", weight: 4, opacity: 0.85, dashArray: "6, 6" }}
          />
        )}

        {/* Markers eventi */}
        {sortedEv.map((ev, i) => {
          const c = TIPO_COLORE[ev.tipo].fg;
          const icon = LIcons.makeDivIcon(c, String(i + 1));
          return (
            <Marker key={ev.id} position={[ev.lat!, ev.lon!]} icon={icon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, color: c, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {ev.tipo}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#0F2525", marginTop: 2 }}>
                    {ev.titolo}
                  </div>
                  {ev.cliente && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>
                      {ev.cliente}
                    </div>
                  )}
                  {ev.luogo && (
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#5A7878", marginTop: 3 }}>
                      📍 {ev.luogo}
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#1E8080", marginTop: 3 }}>
                    {ev.ora_inizio.slice(0,5)} - {ev.ora_fine.slice(0,5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Loading badge */}
      {loadingRoute && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          padding: "5px 9px", borderRadius: 7,
          background: "rgba(40,160,160,0.95)", color: "#fff",
          fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
        }}>Calcolo percorso...</div>
      )}

      {/* Info distanza/tempo da OSRM */}
      {route && !loadingRoute && (
        <div style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 1000,
          padding: "6px 10px", borderRadius: 8,
          background: "rgba(13,31,31,0.92)", color: "#fff",
          fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
          backdropFilter: "blur(8px)",
          display: "flex", gap: 10,
          boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
        }}>
          <span>{route.distanzaKm} km</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{Math.floor(route.durataMin / 60)}h {route.durataMin % 60}m</span>
        </div>
      )}
    </div>
  );
}
