import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Eye, Share2, Tag, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import pb from "@/lib/pocketbase";
import { coverUrl, formatDate, formatTimeRange } from "@/lib/events";
import useDocumentTitle from "@/lib/useDocumentTitle";

/** Cuenta una visita por evento y sesión del navegador (ver backend/pb_hooks/views.pb.js). */
function registerView(eventId) {
  const key = `eventgo:viewed:${eventId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // Sin sessionStorage (modo privado estricto): contamos igualmente.
  }
  pb.send(`/api/eventgo/events/${eventId}/view`, { method: "POST" }).catch(() => {});
  return true;
}

const EventDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(event?.title || "Evento");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    pb.collection("events")
      .getOne(id, { expand: isAuthenticated ? "venue" : undefined })
      .then((record) => {
        if (cancelled) return;
        if (isAuthenticated && registerView(record.id)) {
          record.views = (record.views || 0) + 1;
        }
        setEvent(record);
      })
      .catch(() => !cancelled && setEvent(null))
      .finally(() => !cancelled && setLoading(false));

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
      toast({ title: "🔗 Enlace copiado", className: "success-toast" });
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast({ title: "No se pudo compartir", description: url, className: "info-toast" });
      }
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Cargando evento...</div>;
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 text-slate-800 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
          <p className="text-slate-500 mb-6">El evento que buscas no existe o ya no está disponible.</p>
          <Link to="/" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  const venue = event.expand?.venue;
  const longDate = formatDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dateLabel = longDate && longDate.charAt(0).toUpperCase() + longDate.slice(1);
  const timeLabel = formatTimeRange(event.start_time, event.end_time);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="relative h-64 md:h-96">
        <img className="w-full h-full object-cover" alt={`Imagen del evento ${event.title}`} src={coverUrl(event, "1600x0")} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 text-white max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors w-max">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a eventos
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <Lock className="h-10 w-10 mx-auto text-blue-600 mb-3" />
            <h2 className="text-xl font-bold mb-2">Inicia sesión para ver el plan completo</h2>
            <p className="text-slate-500 mb-6">Fecha, hora, local y descripción están disponibles para usuarios registrados.</p>
            <Link to="/auth" state={{ from: location.pathname }} className="btn-primary inline-block">
              Acceder o crear cuenta
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold mb-3">Descripción</h2>
              <p className="text-slate-700 whitespace-pre-line">
                {event.description || "El local no ha añadido descripción."}
              </p>
            </div>

            <aside className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4 h-max">
              {dateLabel && (
                <p className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                  {dateLabel}
                </p>
              )}
              {timeLabel && (
                <p className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                  {timeLabel}
                </p>
              )}
              {venue && (
                <Link to={`/local/${venue.id}`} className="flex items-start hover:text-blue-600 transition-colors">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                  <span>
                    <span className="font-semibold block">{venue.name}</span>
                    <span className="text-sm text-slate-500">{venue.address}</span>
                  </span>
                </Link>
              )}
              {event.category && (
                <p className="flex items-start">
                  <Tag className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                  {event.category}
                </p>
              )}
              <p className="flex items-start text-slate-500">
                <Eye className="h-5 w-5 mr-3 flex-shrink-0" />
                {event.views || 0} vistas
              </p>

              <Button onClick={handleShare} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
