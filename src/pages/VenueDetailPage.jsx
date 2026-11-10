import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Globe, Instagram, Heart } from "lucide-react";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import LoginRequired from "@/components/LoginRequired";
import { coverUrl, errorMessage, formatDate, todayISO } from "@/lib/events";
import { instagramUrl, safeWebsite } from "@/lib/links";
import useDocumentTitle from "@/lib/useDocumentTitle";

export default function VenueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [venue, setVenue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followId, setFollowId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  useDocumentTitle(venue?.name || "Local");

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      pb.collection("venues").getOne(id),
      pb.collection("events").getFullList({
        filter: pb.filter("venue = {:id} && date >= {:today}", { id, today: `${todayISO()} 00:00:00` }),
        sort: "date,start_time",
      }),
      pb.collection("venue_follows").getList(1, 1, {
        filter: pb.filter("user = {:user} && venue = {:id}", { user: user.id, id }),
      }),
    ])
      .then(([venueRecord, eventRecords, follows]) => {
        if (cancelled) return;
        setVenue(venueRecord);
        setEvents(eventRecords);
        setFollowId(follows.items[0]?.id || null);
      })
      .catch((err) => {
        console.error("Error loading venue detail:", err);
        if (!cancelled) setVenue(null);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    try {
      setFollowLoading(true);
      if (!followId) {
        const created = await pb.collection("venue_follows").create({ user: user.id, venue: venue.id });
        setFollowId(created.id);
        toast({ title: "❤️ Ahora sigues este local", className: "success-toast" });
      } else {
        await pb.collection("venue_follows").delete(followId);
        setFollowId(null);
        toast({ title: "Has dejado de seguir este local", className: "info-toast" });
      }
    } catch (err) {
      toast({ title: "❌ No se pudo actualizar", description: errorMessage(err), className: "error-toast" });
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
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Cargando local...</div>;
  }

  if (!venue) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 text-slate-800 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Local no encontrado</h2>
          <p className="text-slate-500 mb-6">El local que buscas no existe o no está disponible.</p>
          <Link to="/locales" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a locales
          </Link>
        </div>
      </div>
    );
  }

  const website = safeWebsite(venue.website);
  const instagram = instagramUrl(venue.instagram);
  const isOwner = venue.user_id === user.id;

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/locales" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a locales
        </Link>

        <div className="merchant-panel mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{venue.name}</h1>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address || venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 inline-flex items-center text-sm mb-4"
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                {venue.address || "Sin dirección"}
              </a>
            </div>

            {!isOwner && (
              <Button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={followId ? "" : "btn-primary"}
                variant={followId ? "outline" : "default"}
              >
                <Heart className={`h-4 w-4 mr-2 ${followId ? "fill-red-500 text-red-500" : ""}`} />
                {followLoading ? "Guardando..." : followId ? "Siguiendo" : "Seguir"}
              </Button>
            )}
          </div>

          {venue.description && <p className="text-slate-700 mb-4 whitespace-pre-line">{venue.description}</p>}

          <div className="flex flex-wrap gap-4 text-sm">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                Sitio web
              </a>
            )}
            {instagram && (
              <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                <Instagram className="h-4 w-4 mr-1" />
                @{instagram.handle}
              </a>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Próximos eventos</h2>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} to={`/evento/${event.id}`} className="event-card block">
                <div className="overflow-hidden rounded-xl mb-4">
                  <img className="event-image !mb-0" src={coverUrl(event)} alt={`Portada de ${event.title}`} loading="lazy" decoding="async" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{event.title}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="date-badge inline-flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(event.date) || "Sin fecha"}
                    {event.start_time && ` · ${event.start_time}`}
                  </span>
                  {event.category && <span className="stats-badge">{event.category}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Este local no tiene eventos próximos.</p>
        )}
      </div>
    </div>
  );
}
