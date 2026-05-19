"use client";

import { useEffect, useState, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { TIPO_COLORE, type AgendaEvento } from "@/hooks/useAgenda";
import { getRouteGoogle, type RouteResult } from "@/lib/geocoding-google";

interface Props {
  eventi: AgendaEvento[];
}

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function MappaGoogle({ eventi }: Props) {
  if (!KEY) {
    return (
      <div style={{
        height: 240, borderRadius: 14,
        background: "rgba(220,68,68,0.08)",
        border: "1px solid rgba(220,68,68,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, textAlign: "center",
        fontSize: 11, fontWeight: 800, color: "#7F1D1D",
      }}>
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY mancante in .env
      </div>
    );
  }

  return (
    <APIProvider apiKey={KEY} libraries={["marker", "places"]}>
      <MappaInner eventi={eventi} />
    </APIProvider>
  );
}

function MappaInner({ eventi }: Props) {
  const eventiConCoord = useMemo(
    () => eventi.filter((e) => e.lat != null && e.lon != null),
    [eventi]
  );

  const sortedEv = useMemo(
    () => [...eventiConCoord].sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio)),
    [eventiConCoord]
  );

  const center = useMemo(() => {
    if (eventiConCoord.length === 0) return { lat: 39.2986, lng: 16.2531 };
    const avgLat = eventiConCoord.reduce((s, e) => s + (e.lat ?? 0), 0) / eventiConCoord.length;
    const avgLon = eventiConCoord.reduce((s, e) => s + (e.lon ?? 0), 0) / eventiConCoord.length;
    return { lat: avgLat, lng: avgLon };
  }, [eventiConCoord]);

  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div style={{
      width: "100%", height: 240, borderRadius: 14, overflow: "hidden",
      boxShadow: "0 4px 14px rgba(13,31,31,0.08)",
      position: "relative",
    }}>
      <Map
        mapId="mastro-agenda-map"
        defaultCenter={center}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
        clickableIcons={false}
        style={{ width: "100%", height: "100%" }}
      >
        {sortedEv.map((ev, i) => {
          const c = TIPO_COLORE[ev.tipo].fg;
          return (
            <AdvancedMarker
              key={ev.id}
              position={{ lat: ev.lat!, lng: ev.lon! }}
              onClick={() => setOpenId(ev.id)}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: c,
                border: "3px solid #fff",
                boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: 11,
                fontFamily: "Inter, system-ui, sans-serif",
              }}>{i + 1}</div>
            </AdvancedMarker>
          );
        })}

        {sortedEv.map((ev) => (
          openId === ev.id && (
            <InfoWindow
              key={"info-" + ev.id}
              position={{ lat: ev.lat!, lng: ev.lon! }}
              onCloseClick={() => setOpenId(null)}
              pixelOffset={[0, -30]}
            >
              <div style={{ minWidth: 160, padding: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: TIPO_COLORE[ev.tipo].fg, letterSpacing: 0.5, textTransform: "uppercase" }}>
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
                    {ev.luogo}
                  </div>
                )}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#1E8080", marginTop: 3 }}>
                  {ev.ora_inizio.slice(0, 5)} - {ev.ora_fine.slice(0, 5)}
                </div>
              </div>
            </InfoWindow>
          )
        ))}

        <RouteOverlay eventi={sortedEv} />
      </Map>
    </div>
  );
}

/**
 * Disegna la polyline del route via Google Directions sopra la mappa.
 * Usa google.maps.Polyline direttamente per controllo stile.
 */
function RouteOverlay({ eventi }: { eventi: AgendaEvento[] }) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [info, setInfo] = useState<{ km: number; min: number } | null>(null);

  useEffect(() => {
    if (eventi.length < 2) { setRoute(null); return; }
    const points = eventi.map((e) => ({ lat: e.lat!, lon: e.lon! }));
    getRouteGoogle(points).then((r) => {
      setRoute(r);
      if (r) setInfo({ km: r.distanzaKm, min: r.durataMin });
    });
  }, [eventi]);

  useEffect(() => {
    if (!map || !route || !routesLib) return;

    // Rimuovi polyline precedente
    if (polyline) polyline.setMap(null);

    const path = route.coords.map(([lat, lon]) => ({ lat, lng: lon }));
    const newPoly = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#1E8080",
      strokeOpacity: 0,
      strokeWeight: 4,
      icons: [{
        icon: {
          path: "M 0,-1 0,1",
          strokeOpacity: 0.85,
          strokeColor: "#1E8080",
          strokeWeight: 4,
          scale: 4,
        },
        offset: "0",
        repeat: "12px",
      }],
    });
    newPoly.setMap(map);
    setPolyline(newPoly);

    return () => { newPoly.setMap(null); };
  }, [map, route, routesLib]);

  if (!info) return null;
  return (
    <div style={{
      position: "absolute", bottom: 10, left: 10, zIndex: 5,
      padding: "6px 10px", borderRadius: 8,
      background: "rgba(13,31,31,0.92)", color: "#fff",
      fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
      backdropFilter: "blur(8px)",
      display: "flex", gap: 10,
      boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
      pointerEvents: "none",
    }}>
      <span>{info.km} km</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>{Math.floor(info.min / 60)}h {info.min % 60}m</span>
    </div>
  );
}
