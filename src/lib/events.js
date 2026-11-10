import { PartyPopper, Martini, Music, Palette, Sunset, Moon } from "lucide-react";
import pb from "@/lib/pocketbase";

// `id` debe coincidir exactamente con los valores del campo `category` en PocketBase.
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
  "https://images.unsplash.com/photo-1665220509244-fe8459807991?auto=format&fit=crop&w=1200&q=70";

/** "2026-12-20 00:00:00.000Z" -> "2026-12-20" (formato de <input type="date">). */
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

/** Partes para la "etiqueta de calendario" de las tarjetas: { day: "20", month: "dic" }. */
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

/**
 * Formatea la fecha sin pasar por zonas horarias: el evento del día 20 se
 * muestra como día 20 en cualquier parte del mundo.
 */
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

/** URL de la portada. `thumb` pide a PocketBase una versión reducida (ver migración). */
export const coverUrl = (event, thumb = "640x360") =>
  event?.cover ? pb.files.getURL(event, event.cover, { thumb }) : FALLBACK_COVER;

const FIELD_LABELS = {
  email: "El email",
  password: "La contraseña",
  passwordConfirm: "La confirmación de contraseña",
  name: "El nombre",
  business_name: "El nombre del negocio",
  title: "El título",
  date: "La fecha",
  venue: "El local",
  cover: "La imagen",
  address: "La dirección",
  website: "La web",
  start_time: "La hora de inicio",
  end_time: "La hora de fin",
};

const CODE_MESSAGES = {
  validation_not_unique: "ya está en uso",
  validation_required: "es obligatorio",
  validation_length_out_of_range: "tiene una longitud no válida",
  validation_length_too_short: "es demasiado corto",
  validation_length_too_long: "es demasiado largo",
  validation_is_email: "no es válido",
  validation_invalid_email: "no es válido",
  validation_invalid_url: "no es una dirección web válida",
  validation_is_url: "no es una dirección web válida",
  validation_file_size_limit: "supera los 5 MB",
  validation_invalid_mime_type: "debe ser una imagen JPG, PNG, WEBP o GIF",
  validation_values_mismatch: "no coincide",
  validation_invalid_format: "tiene un formato no válido",
};

/** Mensaje legible a partir de un error de PocketBase. */
export const errorMessage = (err, fallback = "Inténtalo de nuevo.") => {
  const fields = err?.response?.data || err?.data?.data;
  if (fields && typeof fields === "object") {
    const first = Object.entries(fields)[0];
    if (first) {
      const [field, info] = first;
      const label = FIELD_LABELS[field] || field;
      const text = CODE_MESSAGES[info?.code] || info?.message || "no es válido";
      return `${label} ${text}.`;
    }
  }
  if (err?.status === 0) return "No hay conexión con el servidor.";
  if (err?.status === 403 || err?.status === 404) return "No tienes permiso para hacer esto.";
  return err?.message || fallback;
};
