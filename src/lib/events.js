import { PartyPopper, Martini, Music, Palette, Sunset, Moon } from "lucide-react";
import { supabase, COVERS_BUCKET } from "@/lib/supabase";

// `id` debe coincidir exactamente con el CHECK de `events.category` en supabase/schema.sql.
export const EVENT_CATEGORIES = [
  { id: "Fiesta", Icon: PartyPopper },
  { id: "Tardeo Fest", Icon: Martini },
  { id: "Música en Directo", Icon: Music },
  { id: "Arte", Icon: Palette },
  { id: "Tarde", Icon: Sunset },
  { id: "Noche", Icon: Moon },
];

export const categoryIcon = (id) => EVENT_CATEGORIES.find((c) => c.id === id)?.Icon || null;

export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export const FALLBACK_COVER =
  "/img/evento.webp";

/** Valor para <input type="date">: "YYYY-MM-DD". */
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Fecha de hoy en hora local, como "YYYY-MM-DD". */
export const todayISO = () => isoOf(new Date());

/**
 * Rango [desde, hasta] (ambos "YYYY-MM-DD") para los filtros rápidos.
 * "weekend" = de viernes a domingo (si ya es fin de semana, desde hoy).
 */
export const dateRange = (when, customDate) => {
  const now = new Date();
  switch (when) {
    case "today":
      return [isoOf(now), isoOf(now)];
    case "tomorrow": {
      const t = isoOf(addDays(now, 1));
      return [t, t];
    }
    case "weekend": {
      const dow = now.getDay(); // 0 domingo ... 6 sábado
      const start = dow === 0 || dow >= 5 ? now : addDays(now, 5 - dow);
      const end = dow === 0 ? now : addDays(now, 7 - dow);
      return [isoOf(start), isoOf(end)];
    }
    case "custom":
      return customDate ? [customDate, customDate] : null;
    default:
      return null;
  }
};

/** Partes para la "etiqueta de calendario" de las tarjetas: { day: "20", month: "dic", weekday: "dom" }. */
export const dateParts = (value) => {
  const iso = toDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: String(d),
    month: date.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
    weekday: date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
  };
};

/** Formatea la fecha sin pasar por zonas horarias. */
export const formatDate = (value, options = { day: "2-digit", month: "2-digit", year: "numeric" }) => {
  const iso = toDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", options);
};

export const formatTimeRange = (start, end) => {
  if (start && end) return `${start} - ${end}`;
  return start || end || null;
};

/** URL pública de la portada del evento. */
export const coverUrl = (event) =>
  event?.cover_path
    ? supabase.storage.from(COVERS_BUCKET).getPublicUrl(event.cover_path).data.publicUrl
    : FALLBACK_COVER;

// ---------------------------------------------------------------------------
// Errores
// ---------------------------------------------------------------------------

const AUTH_MESSAGES = [
  [/invalid login credentials/i, "Email o contraseña incorrectos."],
  [/user already registered/i, "Ya existe una cuenta con ese email."],
  [/password should be at least/i, "La contraseña es demasiado corta."],
  [/unable to validate email|invalid email|email address .* is invalid/i, "El email no es válido."],
  [/email not confirmed/i, "Confirma tu email antes de iniciar sesión."],
  [/rate limit|too many requests/i, "Demasiados intentos. Espera un momento y vuelve a probar."],
  [/payload too large|exceeded the maximum allowed size/i, "La imagen supera los 5 MB."],
  [/mime type .* is not supported|invalid mime/i, "La imagen debe ser JPG, PNG, WEBP o GIF."],
  [/failed to fetch|networkerror|load failed/i, "No hay conexión con el servidor."],
];

const PG_CODES = {
  "23505": "Eso ya existe.",
  "23503": "No se puede borrar: tiene elementos asociados.",
  "23514": "Algún dato no tiene un formato válido.",
  "23502": "Falta un dato obligatorio.",
  "42501": "No tienes permiso para hacer esto.",
  "22P02": "Algún dato no tiene un formato válido.",
  PGRST116: "No se ha encontrado.",
};

/** Mensaje legible a partir de un error de Supabase (auth, base de datos o almacenamiento). */
export const errorMessage = (err, fallback = "Inténtalo de nuevo.") => {
  if (!err) return fallback;
  if (err.code && PG_CODES[err.code]) return PG_CODES[err.code];
  const text = String(err.message || err.error_description || err);
  if (/row-level security/i.test(text)) return PG_CODES["42501"];
  const match = AUTH_MESSAGES.find(([re]) => re.test(text));
  return match ? match[1] : fallback;
};
