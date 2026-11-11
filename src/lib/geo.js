// Utilidades de ubicación. La geocodificación usa Nominatim (OpenStreetMap):
// gratuito y sin clave, con un límite de uso razonable (1 petición/segundo).

const NOMINATIM = "https://nominatim.openstreetmap.org";

/** Normaliza para comparar: "Málaga " == "malaga". */
export const normalizeText = (text) =>
  String(text || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "sevilla" -> "Sevilla", "el puerto de santa maría" -> "El Puerto de Santa María". */
export const prettyCity = (text) => {
  const small = new Set(["de", "del", "la", "las", "los", "el", "y", "i"]);
  return String(text || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
};

/** Distancia en km entre dos puntos (fórmula del haversine). */
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 0.35 -> "a 350 m", 1.24 -> "a 1,2 km", 12.6 -> "a 13 km". */
export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `a ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `a ${km.toLocaleString("es-ES", { maximumFractionDigits: 1 })} km`;
  return `a ${Math.round(km)} km`;
}

/** Posición actual del usuario como { lat, lng }. */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      reject,
      { timeout: 10000, maximumAge: 600000 }
    );
  });
}

/** Coordenadas -> nombre de la ciudad. */
export async function cityFromCoords({ lat, lng }) {
  const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=10&accept-language=es&lat=${lat}&lon=${lng}`);
  if (!res.ok) throw new Error("reverse geocoding failed");
  const a = (await res.json())?.address || {};
  return a.city || a.town || a.village || a.municipality || "";
}

/**
 * Dirección + ciudad -> { lat, lng, label } o null si no se encuentra.
 * Prueba primero la dirección completa y, si no, solo la ciudad (ubicación aproximada).
 */
export async function geocodeAddress(address, city) {
  const search = async (q) => {
    const res = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=1&accept-language=es&q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const [hit] = await res.json();
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name } : null;
  };
  const exact = await search(`${address}, ${city}`);
  if (exact) return { ...exact, approximate: false };
  const approx = city ? await search(city) : null;
  return approx ? { ...approx, approximate: true } : null;
}

// ---------------------------------------------------------------------------
// Ubicación elegida en la portada (se recuerda en este navegador)
// ---------------------------------------------------------------------------

const KEY = "eventgo:location";

/** { mode: "all" } | { mode: "near", lat, lng, city } | { mode: "city", city } */
export function loadSavedLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.mode === "city" && saved.city) return saved;
    if (saved?.mode === "near" && Number.isFinite(saved.lat) && Number.isFinite(saved.lng)) return saved;
  } catch {
    // Sin almacenamiento disponible: se empieza con "todas las ciudades".
  }
  return { mode: "all" };
}

export function saveLocation(location) {
  try {
    localStorage.setItem(KEY, JSON.stringify(location));
  } catch {
    // Ignorar: es solo una comodidad.
  }
}
