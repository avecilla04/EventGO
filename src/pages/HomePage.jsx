import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Eye, Users, X, Clock, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import pb from "@/lib/pocketbase";
import { EVENT_CATEGORIES, coverUrl, formatDate, formatTimeRange, todayISO } from "@/lib/events";
import useDocumentTitle from "@/lib/useDocumentTitle";

const FILTERS = [{ id: "Todos", icon: "🎯" }, ...EVENT_CATEGORIES];

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Coordenadas -> nombre de la ciudad (OpenStreetMap, gratuito y sin clave). */
async function cityFromCoords(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=es&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("reverse geocoding failed");
  const data = await res.json();
  const a = data?.address || {};
  return a.city || a.town || a.village || a.municipality || a.county || "";
}

export default function HomePage() {
  const [searchLocation, setSearchLocation] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated, isMerchant } = useAuth();

  useDocumentTitle("Descubre planes cerca de ti");

  // Solo eventos de hoy en adelante, ordenados por fecha.
  // El local (expand) solo llega con sesión iniciada: así lo marcan las reglas de PocketBase.
  useEffect(() => {
    let cancelled = false;

    pb.collection("events")
      .getFullList({
        filter: pb.filter("date >= {:today}", { today: `${todayISO()} 00:00:00` }),
        sort: "date,start_time",
        expand: isAuthenticated ? "venue" : undefined,
      })
      .then((data) => !cancelled && setEvents(data))
      .catch((err) => {
        console.error("Error fetching events:", err);
        if (!cancelled) {
          toast({
            title: "❌ No se pudieron cargar los eventos",
            description: "Comprueba que el backend (PocketBase) está arrancado.",
            className: "error-toast",
          });
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, toast]);

  const filteredEvents = useMemo(() => {
    const q = normalize(searchLocation.trim());

    return events.filter((e) => {
      if (searchDate && String(e.date).slice(0, 10) !== searchDate) return false;
      if (selectedFilter !== "Todos" && e.category !== selectedFilter) return false;
      if (q) {
        const venue = e.expand?.venue;
        const haystack = normalize(`${e.title} ${venue?.name || ""} ${venue?.address || ""}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [events, searchDate, searchLocation, selectedFilter]);

  const hasFilters = searchLocation || searchDate || selectedFilter !== "Todos";

  const clearFilters = () => {
    setSearchLocation("");
    setSearchDate("");
    setSelectedFilter("Todos");
  };

  const handleLocationSearch = () => {
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
          setSearchLocation(city);
          toast({ title: `📍 Mostrando planes en ${city}`, className: "success-toast" });
        } catch {
          toast({
            title: "No se pudo saber tu ciudad",
            description: "Escríbela en el buscador.",
            className: "info-toast",
          });
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
    <div className="min-h-screen bg-transparent">
      {/* HERO */}
      <section className="hero-gradient py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Descubre <span className="gradient-text">el mejor plan</span> cerca de ti
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {isAuthenticated
                ? "Tardeo, directos, DJ y fiestas en los bares y locales de tu ciudad."
                : "Explora los planes como invitado. Inicia sesión para ver dónde y cuándo."}
            </p>
          </motion.div>

          {/* FILTROS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="floating-card max-w-4xl mx-auto !p-5 md:!p-8"
          >
            <div className={`grid grid-cols-1 gap-4 items-center ${isAuthenticated ? "md:grid-cols-2" : ""}`}>
              {isAuthenticated && (
                <div className="search-input-container">
                  <MapPin className="h-5 w-5 text-slate-500 ml-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Ciudad, local o evento..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="search-input"
                    aria-label="Buscar por ciudad, local o evento"
                  />
                  <Button
                    onClick={handleLocationSearch}
                    size="sm"
                    variant="ghost"
                    className="mr-1 flex-shrink-0"
                    disabled={locating}
                    title="Usar mi ubicación"
                  >
                    <LocateFixed className="h-4 w-4 md:mr-1.5" />
                    <span className="hidden md:inline">{locating ? "Buscando..." : "Cerca de mí"}</span>
                  </Button>
                </div>
              )}

              <div className="calendar-input-container">
                <Calendar className="calendar-icon" />
                <input
                  type="date"
                  value={searchDate}
                  min={todayISO()}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="calendar-input"
                  aria-label="Filtrar por día"
                />
              </div>
            </div>

            <div className="search-filters">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`filter-chip ${selectedFilter === filter.id ? "active" : ""}`}
                  aria-pressed={selectedFilter === filter.id}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.id}
                </button>
              ))}
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="filter-chip !bg-transparent !text-slate-500 hover:!text-slate-800">
                  <X className="h-4 w-4 inline mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </motion.div>

          {!isAuthenticated && (
            <div className="max-w-4xl mx-auto mt-6 text-center">
              <Link to="/auth" className="btn-primary inline-block">
                Acceder para ver detalles
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* LISTADO */}
      <section className="py-14 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Próximos planes</h2>
            <p className="text-slate-500">
              {loading
                ? "Cargando eventos..."
                : `${filteredEvents.length} ${filteredEvents.length === 1 ? "evento encontrado" : "eventos encontrados"}`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="event-card animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-xl mb-4" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => {
                const venueName = event.expand?.venue?.name;
                const timeLabel = formatTimeRange(event.start_time, event.end_time);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 8) * 0.05 }}
                  >
                    <Link to={`/evento/${event.id}`} className="event-card group block h-full">
                      <div className="overflow-hidden rounded-xl mb-4">
                        <img
                          className="event-image !mb-0 group-hover:scale-105 transition-transform duration-300"
                          alt={`Imagen del evento: ${event.title}`}
                          src={coverUrl(event)}
                          loading={index < 3 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>

                        {/* Invitado: solo título + foto */}
                        {isAuthenticated && (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {venueName && <span className="location-badge">{venueName}</span>}
                              <span className="date-badge">{formatDate(event.date) || "Sin fecha"}</span>
                              {timeLabel && (
                                <span className="date-badge inline-flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {timeLabel}
                                </span>
                              )}
                              {event.category && <span className="stats-badge">{event.category}</span>}
                            </div>

                            {event.description && (
                              <p className="text-slate-600 line-clamp-2 text-sm">{event.description}</p>
                            )}

                            <span className="stats-badge inline-flex items-center w-max">
                              <Eye className="h-3 w-3 mr-1.5" />
                              {event.views || 0} vistazos
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">
                {events.length === 0
                  ? "Todavía no hay eventos próximos publicados."
                  : "No hay eventos que coincidan con tu búsqueda."}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Comerciante */}
      <section className="py-20 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">¿Tienes un bar o local?</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Publica tus eventos y haz que tu local sea el plan del día.
            </p>

            {isMerchant ? (
              <Link to="/comerciante" className="btn-primary inline-flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Ir a mi panel
              </Link>
            ) : !isAuthenticated ? (
              <Link to="/auth" className="btn-primary inline-flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Acceder como comerciante
              </Link>
            ) : (
              <p className="text-slate-500 text-sm">
                Tu cuenta es de cliente. Para publicar eventos, crea una cuenta de comerciante.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
