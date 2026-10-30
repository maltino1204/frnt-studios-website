import "server-only";

/** Great-circle distance (haversine). Same formula as SQL public.haversine_km(). */
export const EARTH_RADIUS_KM = 6371.0088;

export interface LatLng {
  lat: number;
  lng: number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rounds to 2 decimals (bookings.distance_km is numeric(6,2)). */
export function roundKm(km: number): number {
  return Math.round(km * 100) / 100;
}

export function isWithinRadius(provider: LatLng, customer: LatLng, radiusKm: number): boolean {
  return haversineKm(provider, customer) <= radiusKm + 1e-9;
}

export function isValidPostalCode(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}
