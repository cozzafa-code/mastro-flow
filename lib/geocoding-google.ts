/**
 * Geocoding e routing via Google Maps Platform.
 * Richiede env NEXT_PUBLIC_GOOGLE_MAPS_API_KEY abilitata per:
 *   - Geocoding API
 *   - Directions API
 */

export interface LatLon { lat: number; lon: number; }

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/**
 * Geocode indirizzo -> coordinate via Google Geocoding API.
 * Region IT per ridurre falsi positivi.
 */
export async function geocodeAddressGoogle(address: string): Promise<LatLon | null> {
  if (!address || address.trim().length < 3) return null;
  if (!KEY) {
    console.warn("[geocodeGoogle] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY mancante");
    return null;
  }
  try {
    const q = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&region=it&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lon: loc.lng };
  } catch (e) {
    console.error("[geocodeGoogle]", e);
    return null;
  }
}

/**
 * Routing ottimizzato Google Directions.
 * Ritorna polyline decoded in lat/lon + distanza km + durata min.
 */
export interface RouteResult {
  coords: [number, number][];   // [lat, lon][]
  distanzaKm: number;
  durataMin: number;
}

export async function getRouteGoogle(points: LatLon[]): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  if (!KEY) return null;
  try {
    const origin = `${points[0].lat},${points[0].lon}`;
    const destination = `${points[points.length - 1].lat},${points[points.length - 1].lon}`;
    const waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lon}`).join("|");
    const wpParam = waypoints ? `&waypoints=optimize:false|${waypoints}` : "";
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${wpParam}&mode=driving&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.[0]) return null;
    const route = data.routes[0];

    // Decode polyline
    const coords = decodePolyline(route.overview_polyline.points);

    // Somma km e durata di tutti i leg
    let distM = 0, durS = 0;
    for (const leg of route.legs) {
      distM += leg.distance.value;
      durS += leg.duration.value;
    }

    return {
      coords,
      distanzaKm: Math.round(distM / 100) / 10,
      durataMin: Math.round(durS / 60),
    };
  } catch (e) {
    console.error("[routeGoogle]", e);
    return null;
  }
}

/**
 * Google encoded polyline -> array di [lat, lon].
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
