import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Falla pronto y con un mensaje claro si falta el .env (o las variables en Vercel).
  throw new Error("Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellénalo.");
}

// La anon key es pública por diseño: la seguridad la ponen las reglas de supabase/schema.sql.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const COVERS_BUCKET = "event-covers";

/** Columnas que un invitado puede leer de `events` (ver privilegios en schema.sql). */
export const GUEST_EVENT_COLUMNS = "id, title, date, cover_path";

/** Evento completo con los datos básicos de su local. */
export const EVENT_WITH_VENUE = "*, venue:venues(id, name, address)";
