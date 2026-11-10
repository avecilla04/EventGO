import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Eye, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateEventForm from '@/components/merchant/CreateEventForm';
import pb from '@/lib/pocketbase';
import { coverUrl, errorMessage, formatDate, formatTimeRange, todayISO } from '@/lib/events';

const EventsTab = ({ events, setEvents, venues }) => {
  // null = formulario cerrado, 'new' = crear, objeto = editar ese evento
  const [editing, setEditing] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const { toast } = useToast();

  const today = todayISO();
  const upcoming = events
    .filter((e) => String(e.date).slice(0, 10) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const past = events.filter((e) => String(e.date).slice(0, 10) < today);

  const handleSaved = (saved) => {
    setEvents((prev) =>
      prev.some((e) => e.id === saved.id) ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
    );
    setEditing(null);
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`¿Seguro que quieres borrar "${event.title}"?`)) return;
    try {
      await pb.collection('events').delete(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (editing?.id === event.id) setEditing(null);
      toast({ title: '🗑️ Evento borrado', className: 'info-toast' });
    } catch (err) {
      toast({ title: '❌ No se pudo borrar el evento', description: errorMessage(err), className: 'error-toast' });
    }
  };

  const renderCard = (event) => {
    const timeLabel = formatTimeRange(event.start_time, event.end_time);
    return (
      <div key={event.id} className="event-card flex flex-col">
        <img src={coverUrl(event)} alt="" className="event-image" loading="lazy" decoding="async" />
        <Link to={`/evento/${event.id}`} className="font-bold text-slate-800 hover:text-blue-600">
          {event.title}
        </Link>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="date-badge">{formatDate(event.date) || 'Sin fecha'}</span>
          {timeLabel && (
            <span className="date-badge inline-flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {timeLabel}
            </span>
          )}
          {event.category && <span className="stats-badge">{event.category}</span>}
          <span className="stats-badge inline-flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {event.views || 0}
          </span>
        </div>
        {event.expand?.venue && (
          <p className="text-sm text-slate-500 mt-2 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {event.expand.venue.name}
          </p>
        )}
        <div className="pt-3 mt-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(event)}>
            Editar
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(event)}>
            Borrar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Mis Eventos</h2>
        {!editing && (
          <Button onClick={() => setEditing('new')} className="btn-primary" disabled={venues.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Button>
        )}
      </div>

      {editing && (
        <CreateEventForm
          venues={venues}
          mode={editing === 'new' ? 'create' : 'edit'}
          initialData={editing === 'new' ? null : editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      {venues.length === 0 && !editing && (
        <p className="text-slate-500">Registra primero un local en la pestaña Mis Locales para poder publicar eventos.</p>
      )}

      {upcoming.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map(renderCard)}</div>
      ) : (
        venues.length > 0 && <p className="text-slate-500 text-center py-6">No tienes eventos próximos.</p>
      )}

      {past.length > 0 && (
        <div className="pt-4">
          <button type="button" className="text-slate-600 hover:text-slate-900 font-medium" onClick={() => setShowPast((s) => !s)}>
            {showPast ? '▾' : '▸'} Eventos pasados ({past.length})
          </button>
          {showPast && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 opacity-80">{past.map(renderCard)}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EventsTab;
