import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  X, CalendarDays, Sparkles, ArrowRight, Megaphone, CalendarPlus, TrendingUp, SearchX, Search, Heart, Globe2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, GUEST_EVENT_COLUMNS, EVENT_WITH_VENUE } from "@/lib/supabase";
import { EVENT_CATEGORIES, dateRange, todayISO, formatDate } from "@/lib/events";
import EventCard, { EventCardSkeleton } from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import LocationPicker from "@/components/LocationPicker";
import {
  cityFromCoords, distanceKm, getCurrentPosition, loadSavedLocation, normalizeText, saveLocation,
} from "@/lib/geo";
import useDocumentTitle from "@/lib/useDocumentTitle";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=70";

const WHEN = [
  { id: "all", label: "Cualquier día" },
  { id: "today", label: "Hoy" },
  { id: "tomorrow", label: "Mañana" },
  { id: "weekend", label: "Este finde" },
];

// "Cerca de mí" muestra planes a menos de esta distancia, del más cercano al más lejano.
const NEAR_RADIUS_KM = 50;

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [when, setWhen] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [category, setCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [location, setLocationState] = useState(loadSavedLocation);
  const [followed, setFollowed] = useState(() => new Set());
  const dateInputRef = useRef(null);

  const { toast } = useToast();
  const { user, isAuthenticated, isMerchant } = useAuth();

  const setLocation = (next) => {
    setLocationState(next);
    saveLocation(next);
  };

  useDocumentTitle("Descubre planes cerca de ti");

  // Solo eventos de hoy en adelante, ordenados por fecha.
  // Los invitados solo pueden leer título, fecha y portada (privilegios en supabase/schema.sql).
  useEffect(() => {
    let cancelled = false;
    const query = isAuthenticated
      ? supabase.from("events").select(EVENT_WITH_VENUE).order("date").order("start_time")
      : supabase.from("events").select(GUEST_EVENT_COLUMNS).order("date");

    query.gte("date", todayISO()).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "No se pudieron cargar los eventos",
          description: "Comprueba la conexión con Supabase.",
          className: "error-toast",
        });
      } else {
        setEvents(data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, toast]);

  // Locales que sigue el usuario, para la sección "De tus locales".
  useEffect(() => {
    if (!user) {
      setFollowed(new Set());
      return;
    }
    supabase
      .from("venue_follows")
      .select("venue_id")
      .then(({ data }) => setFollowed(new Set((data || []).map((f) => f.venue_id))));
  }, [user]);

  // Ciudades con planes próximos (para el selector), de más a menos planes.
  const cities = useMemo(() => {
    const counts = new Map();
    events.forEach((e) => {
      const city = e.venue?.city;
      if (!city) return;
      const key = normalizeText(city);
      const prev = counts.get(key);
      counts.set(key, { name: prev?.name || city, count: (prev?.count || 0) + 1 });
    });
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
  }, [events]);

  const followedEvents = useMemo(
    () => events.filter((e) => followed.has(e.venue_id)).slice(0, 8),
    [events, followed]
  );

  // Lista final: [{ event, distance }] filtrada por fecha, categoría, texto y ubicación.
  const filtered = useMemo(() => {
    const q = normalizeText(search);
    const range = dateRange(when, customDate);
    // Sin sesión no hay datos del local: la ubicación solo filtra con sesión iniciada.
    const cityKey = isAuthenticated && location.mode === "city" ? normalizeText(location.city) : null;
    const origin = isAuthenticated && location.mode === "near" ? location : null;

    const list = [];
    for (const e of events) {
      const day = String(e.date).slice(0, 10);
      if (range && (day < range[0] || day > range[1])) continue;
      if (category && e.category !== category) continue;
      const v = e.venue;
      if (q && !normalizeText(`${e.title} ${v?.name || ""} ${v?.address || ""} ${v?.city || ""}`).includes(q)) continue;
      if (cityKey && normalizeText(v?.city) !== cityKey) continue;
      let distance = null;
      if (origin) {
        if (v?.lat == null) continue;
        distance = distanceKm(origin, v);
        if (distance > NEAR_RADIUS_KM) continue;
      }
      list.push({ event: e, distance });
    }
    // Cerca de mí: del más cercano al más lejano (a igual distancia, el más próximo en fecha).
    if (origin) list.sort((a, b) => a.distance - b.distance || String(a.event.date).localeCompare(String(b.event.date)));
    return list;
  }, [events, search, when, customDate, category, location, isAuthenticated]);

  const hasFilters = search || when !== "all" || category;
  const clearFilters = () => {
    setSearch("");
    setWhen("all");
    setCustomDate("");
    setCategory(null);
  };

  const pickDate = (value) => {
    setCustomDate(value);
    setWhen(value ? "custom" : "all");
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  };

  const handleNearMe = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setLocation({ mode: "near", ...pos, city: "" });
      // El nombre de la ciudad es solo para la etiqueta: si falla, no pasa nada.
      cityFromCoords(pos)
        .then((city) => city && setLocation({ mode: "near", ...pos, city }))
        .catch(() => {});
    } catch {
      toast({
        title: "No se pudo acceder a tu ubicación",
        description: "Revisa los permisos del navegador o elige una ciudad.",
        className: "error-toast",
      });
    } finally {
      setLocating(false);
    }
  };

  const locationTitle =
    location.mode === "near" ? " cerca de ti" : location.mode === "city" ? ` en ${location.city}` : "";

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="page pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-ink text-white shadow-lift">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" fetchpriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

          <div className="relative px-6 py-14 sm:px-12 sm:py-20 lg:py-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Tardeo · Directos · DJ · Noche
              </span>
              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                Tu plan de hoy, <span className="text-accent">a un toque.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-white/70 sm:text-lg">
                Descubre qué se cuece en los bares y locales de tu ciudad y sal con el plan hecho.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 sm:mt-10"
            >
              {isAuthenticated ? (
                <div className="grid max-w-2xl gap-1 rounded-2xl bg-white p-1.5 text-ink shadow-lift sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:divide-x sm:divide-line">
                  <LocationPicker
                    location={location}
                    cities={cities}
                    onChange={setLocation}
                    onNearMe={handleNearMe}
                    locating={locating}
                  />
                  <div className="flex items-center gap-2 border-t border-line px-3 py-1 sm:border-t-0">
                    <Search className="h-5 w-5 shrink-0 text-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Busca un plan o un local"
                      aria-label="Buscar plan o local"
                      className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted sm:text-base"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="rounded-full p-1.5 text-muted hover:bg-canvas" aria-label="Borrar búsqueda">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Link to="/auth" className="btn-primary btn-lg">
                    Crear cuenta gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#planes" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/15">
                    Ver planes
                  </a>
                </div>
              )}

              {!loading && events.length > 0 && (
                <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/60">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  {events.length} {events.length === 1 ? "plan próximo" : "planes próximos"} publicados
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------- FILTROS ---------- */}
      <section id="planes" className="page mt-10 scroll-mt-20 space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {WHEN.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => { setWhen(w.id); setCustomDate(""); }}
              className={`chip ${when === w.id ? "chip-active" : ""}`}
              aria-pressed={when === w.id}
            >
              {w.label}
            </button>
          ))}
          <button
            type="button"
            onClick={openDatePicker}
            className={`chip relative ${when === "custom" ? "chip-active" : ""}`}
            aria-pressed={when === "custom"}
          >
            <CalendarDays className="h-4 w-4" />
            {when === "custom" && customDate ? formatDate(customDate, { day: "numeric", month: "short" }) : "Elegir fecha"}
            <input
              ref={dateInputRef}
              type="date"
              min={todayISO()}
              value={customDate}
              onChange={(e) => pickDate(e.target.value)}
              className="pointer-events-none absolute inset-0 opacity-0"
              tabIndex={-1}
              aria-label="Elegir fecha"
            />
          </button>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {EVENT_CATEGORIES.map(({ id, Icon }) => {
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(active ? null : id)}
                className={`chip ${active ? "!border-accent !bg-accent-soft !text-accent" : ""}`}
                aria-pressed={active}
              >
                <Icon className={`h-4 w-4 ${active ? "text-accent" : "text-muted"}`} />
                {id}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- DE TUS LOCALES ---------- */}
      {followedEvents.length > 0 && (
        <section className="page mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 fill-accent text-accent" />
            <h2 className="section-title !text-2xl">De tus locales</h2>
          </div>
          <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
            {followedEvents.map((event) => (
              <div key={event.id} className="w-64 shrink-0 snap-start sm:w-72">
                <EventCard event={event} showCity />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- LISTADO ---------- */}
      <section className="page mt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Próximos planes{isAuthenticated ? locationTitle : ""}</h2>
            <p className="mt-1 text-sm text-muted">
              {loading
                ? "Buscando planes..."
                : `${filtered.length} ${filtered.length === 1 ? "evento" : "eventos"}${
                    location.mode === "near" && isAuthenticated ? ` a menos de ${NEAR_RADIUS_KM} km` : ""
                  }`}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost btn-sm text-muted">
              <X className="h-3.5 w-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ event, distance }, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
              >
                <EventCard
                  event={event}
                  limited={!isAuthenticated}
                  eager={index < 3}
                  distance={distance}
                  showCity={location.mode !== "city"}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title={
              events.length === 0
                ? "Aún no hay planes publicados"
                : location.mode === "city" && isAuthenticated
                  ? `Aún no hay planes en ${location.city}`
                  : location.mode === "near" && isAuthenticated
                    ? "No hay planes cerca de ti"
                    : "Nada por aquí"
            }
            text={
              events.length === 0
                ? "Vuelve pronto: los locales publican nuevos eventos cada semana."
                : location.mode !== "all" && isAuthenticated
                  ? "Prueba con otro día, otra categoría o mira en todas las ciudades."
                  : "Prueba con otro día u otra categoría."
            }
          >
            <div className="flex flex-wrap justify-center gap-2">
              {hasFilters && (
                <button onClick={clearFilters} className="btn-outline">Limpiar filtros</button>
              )}
              {location.mode !== "all" && isAuthenticated && events.length > 0 && (
                <button onClick={() => setLocation({ mode: "all" })} className="btn-dark">
                  <Globe2 className="h-4 w-4" />
                  Ver todas las ciudades
                </button>
              )}
            </div>
          </EmptyState>
        )}
      </section>

      {/* ---------- CTA COMERCIANTES ---------- */}
      <section className="page mt-20">
        <div className="glow-bg grid gap-8 overflow-hidden rounded-[28px] p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">Para bares y locales</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Haz que tu local sea el plan del día.</h2>
            <p className="mt-3 max-w-md text-white/70">
              Publica tus eventos en un minuto y llega a la gente que busca justo lo que ofreces.
            </p>
            <div className="mt-7">
              {isMerchant ? (
                <Link to="/comerciante" className="btn-primary btn-lg">
                  Ir a mi panel <ArrowRight className="h-4 w-4" />
                </Link>
              ) : !isAuthenticated ? (
                <Link to="/auth" className="btn-primary btn-lg">
                  Registrar mi local <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="text-sm text-white/60">Tu cuenta es de cliente. Para publicar, crea una cuenta de comerciante.</p>
              )}
            </div>
          </div>

          <ul className="space-y-3">
            {[
              { Icon: CalendarPlus, title: "Publica en segundos", text: "Tipo de plan, fecha, horario y una foto." },
              { Icon: Megaphone, title: "Promociona tu local", text: "Perfil propio con todos tus eventos." },
              { Icon: TrendingUp, title: "Mide el interés", text: "Consulta cuántas personas ven tus planes." },
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                  <Icon className="h-5 w-5 text-accent" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/60">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
