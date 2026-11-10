import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, LocateFixed, X, CalendarDays, Sparkles, ArrowRight, Megaphone, CalendarPlus, TrendingUp, SearchX, Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, GUEST_EVENT_COLUMNS, EVENT_WITH_VENUE } from "@/lib/supabase";
import { EVENT_CATEGORIES, dateRange, todayISO, formatDate } from "@/lib/events";
import EventCard, { EventCardSkeleton } from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import useDocumentTitle from "@/lib/useDocumentTitle";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1800&q=70";

const WHEN = [
  { id: "all", label: "Cualquier día" },
  { id: "today", label: "Hoy" },
  { id: "tomorrow", label: "Mañana" },
  { id: "weekend", label: "Este finde" },
];

const normalize = (text) =>
  String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Coordenadas -> nombre de la ciudad (OpenStreetMap, gratuito y sin clave). */
async function cityFromCoords(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=es&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("reverse geocoding failed");
  const a = (await res.json())?.address || {};
  return a.city || a.town || a.village || a.municipality || a.county || "";
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [when, setWhen] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [category, setCategory] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const dateInputRef = useRef(null);

  const { toast } = useToast();
  const { isAuthenticated, isMerchant } = useAuth();

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

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    const range = dateRange(when, customDate);
    return events.filter((e) => {
      const day = String(e.date).slice(0, 10);
      if (range && (day < range[0] || day > range[1])) return false;
      if (category && e.category !== category) return false;
      if (q) {
        const v = e.venue;
        if (!normalize(`${e.title} ${v?.name || ""} ${v?.address || ""}`).includes(q)) return false;
      }
      return true;
    });
  }, [events, search, when, customDate, category]);

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

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Tu navegador no permite la geolocalización", className: "info-toast" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const city = await cityFromCoords(coords.latitude, coords.longitude);
          if (!city) throw new Error("no city");
          setSearch(city);
          toast({ title: `Mostrando planes en ${city}`, className: "success-toast" });
        } catch {
          toast({ title: "No se pudo saber tu ciudad", description: "Escríbela en el buscador.", className: "info-toast" });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast({
          title: "No se pudo acceder a tu ubicación",
          description: "Revisa los permisos del navegador o escribe tu ciudad.",
          className: "error-toast",
        });
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  };

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
                <div className="flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 text-ink shadow-lift">
                  <MapPin className="ml-2 h-5 w-5 shrink-0 text-accent" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ciudad, local o evento"
                    aria-label="Buscar por ciudad, local o evento"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted sm:text-base"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="rounded-full p-1.5 text-muted hover:bg-canvas" aria-label="Borrar búsqueda">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={handleNearMe} disabled={locating} className="btn-dark shrink-0 !px-4" title="Usar mi ubicación">
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    <span className="hidden sm:inline">Cerca de mí</span>
                  </button>
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

      {/* ---------- LISTADO ---------- */}
      <section className="page mt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Próximos planes</h2>
            <p className="mt-1 text-sm text-muted">
              {loading ? "Buscando planes..." : `${filtered.length} ${filtered.length === 1 ? "evento" : "eventos"}`}
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
            {filtered.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
              >
                <EventCard event={event} limited={!isAuthenticated} eager={index < 3} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title={events.length === 0 ? "Aún no hay planes publicados" : "Nada por aquí"}
            text={events.length === 0 ? "Vuelve pronto: los locales publican nuevos eventos cada semana." : "Prueba con otro día, otra categoría u otra ciudad."}
          >
            {hasFilters && (
              <button onClick={clearFilters} className="btn-outline">Limpiar filtros</button>
            )}
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
