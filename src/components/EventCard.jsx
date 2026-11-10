import React from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Lock } from "lucide-react";
import { categoryIcon, coverUrl, dateParts, formatTimeRange } from "@/lib/events";

/**
 * Tarjeta de evento. Con `limited` (invitado) solo enseña foto y título.
 */
export default function EventCard({ event, limited = false, eager = false, showVenue = true }) {
  const parts = dateParts(event.date);
  const venue = event.expand?.venue;
  const time = formatTimeRange(event.start_time, event.end_time);
  const CatIcon = categoryIcon(event.category);

  return (
    <Link to={`/evento/${event.id}`} className="group block focus-visible:rounded-2xl">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-line">
        <img
          src={coverUrl(event)}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {!limited && parts && (
          <div className="absolute left-3 top-3 min-w-[52px] rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-soft backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{parts.month}</p>
            <p className="font-display text-xl font-bold leading-none text-ink">{parts.day}</p>
          </div>
        )}

        {!limited && event.category && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-soft backdrop-blur">
            {CatIcon && <CatIcon className="h-3.5 w-3.5 text-accent" />}
            {event.category}
          </span>
        )}
      </div>

      <div className="px-0.5 pt-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent line-clamp-2">
          {event.title}
        </h3>

        {limited ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
            <Lock className="h-3.5 w-3.5" />
            Inicia sesión para ver dónde y cuándo
          </p>
        ) : (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {showVenue && venue && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{venue.name}</span>
              </span>
            )}
            {time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {parts?.weekday && <span className="capitalize">{parts.weekday}</span>} {time}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-2xl bg-line" />
      <div className="mt-3 h-5 w-3/4 rounded bg-line" />
      <div className="mt-2 h-4 w-1/2 rounded bg-line" />
    </div>
  );
}
