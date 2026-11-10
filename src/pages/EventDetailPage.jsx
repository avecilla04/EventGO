import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Clock, Eye, Share2, Navigation, ChevronRight, CalendarX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, GUEST_EVENT_COLUMNS } from "@/lib/supabase";
import { categoryIcon, coverUrl, formatDate, formatTimeRange } from "@/lib/events";
import LoginRequired from "@/components/LoginRequired";
import EmptyState from "@/components/EmptyState";
import useDocumentTitle from "@/lib/useDocumentTitle";

/** Cuenta una visita por evento y sesión del navegador (función register_event_view en schema.sql). */
function registerView(eventId) {
  const key = `eventgo:viewed:${eventId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // Sin sessionStorage (modo privado estricto): contamos igualmente.
  }
  supabase.rpc("register_event_view", { p_event_id: eventId }).then(() => {}, () => {});
  return true;
}

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex gap-3.5">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
      <Icon className="h-5 w-5 text-accent" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-ink">{children}</div>
    </div>
  </div>
);

const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(event?.title || "Evento");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("events")
      .select(isAuthenticated ? "*, venue:venues(id, name, address)" : GUEST_EVENT_COLUMNS)
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data && isAuthenticated && registerView(data.id)) data.views = (data.views || 0) + 1;
        setEvent(data || null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: `${event.title} en EventGo`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Enlace copiado", description: "Pásaselo a tu grupo.", className: "success-toast" });
    } catch (err) {
      if (err?.name !== "AbortError") toast({ title: "No se pudo compartir", description: url, className: "info-toast" });
    }
  };

  if (loading) {
    return (
      <div className="page animate-pulse pt-6">
        <div className="h-72 rounded-[28px] bg-line sm:h-[420px]" />
        <div className="mt-8 h-8 w-1/2 rounded bg-line" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page py-16">
        <EmptyState icon={CalendarX} title="Evento no encontrado" text="El evento que buscas no existe o ya no está disponible.">
          <Link to="/" className="btn-dark">Ver otros planes</Link>
        </EmptyState>
      </div>
    );
  }

  const venue = event.venue;
  const longDate = formatDate(event.date, { weekday: "long", day: "numeric", month: "long" });
  const dateLabel = longDate && longDate.charAt(0).toUpperCase() + longDate.slice(1);
  const timeLabel = formatTimeRange(event.start_time, event.end_time);
  const CatIcon = categoryIcon(event.category);
  const mapsUrl = venue && `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address || ""}`)}`;

  return (
    <div className="page pt-4 sm:pt-6">
      {/* Portada */}
      <div className="relative h-72 overflow-hidden rounded-[28px] bg-ink sm:h-[440px]">
        <img className="h-full w-full object-cover" alt="" src={coverUrl(event)} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <Link
          to="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-medium text-ink shadow-soft backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Planes
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          {event.category && isAuthenticated && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
              {CatIcon && <CatIcon className="h-3.5 w-3.5" />}
              {event.category}
            </span>
          )}
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl">{event.title}</h1>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="-mt-8">
          <LoginRequired
            title="Inicia sesión para ver el plan completo"
            text="Fecha, hora, local y descripción están disponibles para usuarios registrados. Es gratis."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <article>
            <h2 className="section-title !text-xl">Sobre el plan</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/80">
              {event.description || "El local no ha añadido descripción."}
            </p>

            {venue && (
              <Link to={`/local/${venue.id}`} className="panel mt-8 flex items-center gap-4 transition hover:shadow-lift">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink font-display text-lg font-bold text-white">
                  {venue.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">Organiza</p>
                  <p className="truncate font-display text-lg font-semibold">{venue.name}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            )}
          </article>

          <aside className="panel h-max space-y-5 lg:sticky lg:top-24">
            {dateLabel && <InfoRow icon={CalendarDays} label="Fecha">{dateLabel}</InfoRow>}
            {timeLabel && <InfoRow icon={Clock} label="Horario">{timeLabel}</InfoRow>}
            {venue && (
              <InfoRow icon={MapPin} label="Dónde">
                <span className="block">{venue.name}</span>
                <span className="block font-normal text-muted">{venue.address}</span>
              </InfoRow>
            )}
            <p className="flex items-center gap-2 text-sm text-muted">
              <Eye className="h-4 w-4" />
              {event.views || 0} {event.views === 1 ? "persona lo ha visto" : "personas lo han visto"}
            </p>

            <div className="grid gap-2 pt-1">
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  <Navigation className="h-4 w-4" />
                  Cómo llegar
                </a>
              )}
              <button onClick={handleShare} className="btn-outline w-full">
                <Share2 className="h-4 w-4" />
                Compartir con mi grupo
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
