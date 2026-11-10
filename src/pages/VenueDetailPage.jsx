import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, Instagram, Heart, CalendarX, Store, Navigation } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import LoginRequired from "@/components/LoginRequired";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/EventCard";
import { errorMessage, todayISO } from "@/lib/events";
import { instagramUrl, safeWebsite } from "@/lib/links";
import useDocumentTitle from "@/lib/useDocumentTitle";

export default function VenueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [venue, setVenue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useDocumentTitle(venue?.name || "Local");

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      supabase.from("venues").select("*").eq("id", id).maybeSingle(),
      supabase.from("events").select("*").eq("venue_id", id).gte("date", todayISO()).order("date").order("start_time"),
      supabase.from("venue_follows").select("venue_id").eq("venue_id", id).eq("user_id", user.id).maybeSingle(),
    ]).then(([venueRes, eventsRes, followRes]) => {
      if (cancelled) return;
      if (venueRes.error) console.error("Error loading venue detail:", venueRes.error);
      setVenue(venueRes.data || null);
      setEvents(eventsRes.data || []);
      setFollowing(!!followRes.data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    try {
      setFollowLoading(true);
      if (!following) {
        const { error } = await supabase.from("venue_follows").insert({ venue_id: venue.id });
        if (error && error.code !== "23505") throw error;
        setFollowing(true);
        toast({ title: "Ahora sigues este local", className: "success-toast" });
      } else {
        const { error } = await supabase.from("venue_follows").delete().eq("venue_id", venue.id).eq("user_id", user.id);
        if (error) throw error;
        setFollowing(false);
        toast({ title: "Has dejado de seguir este local", className: "info-toast" });
      }
    } catch (err) {
      toast({ title: "No se pudo actualizar", description: errorMessage(err), className: "error-toast" });
    } finally {
      setFollowLoading(false);
    }
  };

  if (!user) {
    return (
      <LoginRequired
        title="Inicia sesión para ver este local"
        text="Consulta sus próximos eventos y síguelo para no perderte nada."
      />
    );
  }

  if (loading) {
    return (
      <div className="page animate-pulse pt-6">
        <div className="h-56 rounded-[28px] bg-line" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="page py-16">
        <EmptyState icon={Store} title="Local no encontrado" text="El local que buscas no existe o no está disponible.">
          <Link to="/locales" className="btn-dark">Ver locales</Link>
        </EmptyState>
      </div>
    );
  }

  const website = safeWebsite(venue.website);
  const instagram = instagramUrl(venue.instagram);
  const isOwner = venue.user_id === user.id;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address || ""}`)}`;

  return (
    <div className="page pt-4 sm:pt-6">
      <div className="glow-bg relative overflow-hidden rounded-[28px] px-6 pb-8 pt-16 text-white sm:px-10 sm:pb-10 sm:pt-20">
        <Link
          to="/locales"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Locales
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white font-display text-4xl font-extrabold text-ink shadow-lift">
              {venue.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold sm:text-4xl">{venue.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-white/70">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{venue.address || "Sin dirección"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isOwner && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={following ? "btn bg-white text-ink hover:bg-white/90" : "btn-primary"}
              >
                <Heart className={`h-4 w-4 ${following ? "fill-accent text-accent" : ""}`} />
                {followLoading ? "Guardando..." : following ? "Siguiendo" : "Seguir"}
              </button>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15">
              <Navigation className="h-4 w-4" />
              Cómo llegar
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="section-title !text-2xl">Próximos eventos</h2>
          {events.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} showVenue={false} />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState icon={CalendarX} title="Sin eventos próximos" text="Síguelo para enterarte cuando publique nuevos planes." />
            </div>
          )}
        </section>

        <aside className="panel h-max space-y-4">
          <h2 className="font-display text-lg font-semibold">Sobre el local</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink/75">
            {venue.description || "Este local todavía no ha añadido una descripción."}
          </p>
          {(website || instagram) && (
            <div className="space-y-2 border-t border-line pt-4 text-sm">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-ink hover:text-accent">
                  <Globe className="h-4 w-4 text-muted" />
                  {new URL(website).hostname.replace(/^www\./, "")}
                </a>
              )}
              {instagram && (
                <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-medium text-ink hover:text-accent">
                  <Instagram className="h-4 w-4 text-muted" />
                  @{instagram.handle}
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
