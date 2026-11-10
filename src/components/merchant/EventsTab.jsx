import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Eye, Clock, MapPin, Pencil, Trash2, ChevronDown, CalendarPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CreateEventForm from '@/components/merchant/CreateEventForm';
import EmptyState from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { removeCovers } from '@/lib/images';
import { categoryIcon, coverUrl, dateParts, errorMessage, formatTimeRange, todayISO } from '@/lib/events';

const EventsTab = ({ events, setEvents, venues, setActiveTab }) => {
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
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
      removeCovers([event.cover_path]);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      if (editing?.id === event.id) setEditing(null);
      toast({ title: 'Evento borrado', className: 'info-toast' });
    } catch (err) {
      toast({ title: 'No se pudo borrar el evento', description: errorMessage(err), className: 'error-toast' });
    }
  };

  const renderCard = (event) => {
    const parts = dateParts(event.date);
    const timeLabel = formatTimeRange(event.start_time, event.end_time);
    const CatIcon = categoryIcon(event.category);
    return (
      <div key={event.id} className="group overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition hover:shadow-lift">
        <div className="relative aspect-[16/9] bg-line">
          <img src={coverUrl(event)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          {parts && (
            <div className="absolute left-3 top-3 min-w-[48px] rounded-xl bg-white/95 px-2 py-1 text-center shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{parts.month}</p>
              <p className="font-display text-lg font-bold leading-none">{parts.day}</p>
            </div>
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Eye className="h-3 w-3" />
            {event.views || 0}
          </span>
        </div>
        <div className="p-4">
          <Link to={`/evento/${event.id}`} className="line-clamp-1 font-display text-lg font-semibold hover:text-accent">
            {event.title}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {timeLabel && (
              <span className="tag"><Clock className="h-3 w-3" />{timeLabel}</span>
            )}
            {event.category && (
              <span className="tag-accent">{CatIcon && <CatIcon className="h-3 w-3" />}{event.category}</span>
            )}
            {event.venue && (
              <span className="tag"><MapPin className="h-3 w-3" />{event.venue.name}</span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-outline btn-sm" onClick={() => setEditing(event)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => handleDelete(event)}>
              <Trash2 className="h-3.5 w-3.5" />
              Borrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-title">Mis Eventos</h2>
        {!editing && venues.length > 0 && (
          <button onClick={() => setEditing('new')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Crear Evento
          </button>
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

      {venues.length === 0 ? (
        <EmptyState icon={MapPin} title="Primero, tu local" text="Registra un local para poder publicar eventos en él.">
          <button className="btn-dark" onClick={() => setActiveTab?.('venues')}>Registrar local</button>
        </EmptyState>
      ) : upcoming.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map(renderCard)}</div>
      ) : (
        !editing && (
          <EmptyState icon={CalendarPlus} title="No tienes eventos próximos" text="Publica tu próximo plan: tarda menos de un minuto.">
            <button className="btn-primary" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              Crear evento
            </button>
          </EmptyState>
        )
      )}

      {past.length > 0 && (
        <div className="border-t border-line pt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showPast ? '' : '-rotate-90'}`} />
            Eventos pasados ({past.length})
          </button>
          {showPast && (
            <div className="mt-5 grid grid-cols-1 gap-5 opacity-75 sm:grid-cols-2 lg:grid-cols-3">{past.map(renderCard)}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EventsTab;
