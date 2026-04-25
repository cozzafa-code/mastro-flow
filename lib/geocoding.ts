/**
 * Geocoding via Nominatim (OpenStreetMap) e routing via OSRM pubblico.
 * Tutto gratis, senza API key. Rate limit Nominatim: 1 req/sec.
 */

export interface LatLon { lat: number; lon: number; }

/**
 * Geocode un indirizzo → coordinate. Ritorna null se non trovato.
 * Usa Nominatim · viewbox = Italia per ridurre falsi positivi.
 */
export async function geocodeAddress(address: string): Promise<LatLon | null> {
  if (!address || address.trim().length < 3) return null;
  try {
    const q = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=it&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "it" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) {
    console.error("[geocode]", e);
    return null;
  }
}

/**
 * Calcola routing ottimizzato tra waypoints via OSRM pubblico.
 * Ritorna polyline coords + distanza km + durata min.
 */
export interface RouteResult {
  coords: [number, number][];   // [lat, lon][]
  distanzaKm: number;
  durataMin: number;
}

export async function getRoute(points: LatLon[]): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  try {
    const coordsStr = points.map((p) => `${p.lon},${p.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]   // GeoJSON e' [lon,lat], Leaflet vuole [lat,lon]
    );
    return {
      coords,
      distanzaKm: Math.round(route.distance / 100) / 10,    // m → km con 1 decimale
      durataMin: Math.round(route.duration / 60),
    };
  } catch (e) {
    console.error("[route]", e);
    return null;
  }
}
