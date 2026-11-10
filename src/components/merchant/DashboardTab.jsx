import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarClock, Eye, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, todayISO } from '@/lib/events';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="dashboard-card">
    <Icon className="h-6 w-6 text-blue-600 mb-3" />
    <p className="text-3xl font-bold text-slate-800">{value}</p>
    <p className="text-slate-500 text-sm">{label}</p>
  </div>
);

const DashboardTab = ({ events, venues, setActiveTab }) => {
  const today = todayISO();
  const upcoming = events
    .filter((e) => String(e.date).slice(0, 10) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {venues.length === 0 && (
        <div className="merchant-panel border-blue-200 bg-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg text-slate-800">Primer paso: registra tu local</h2>
            <p className="text-slate-600 text-sm">Necesitas al menos un local para poder publicar eventos.</p>
          </div>
          <Button className="btn-primary" onClick={() => setActiveTab('venues')}>
            <MapPin className="h-4 w-4 mr-2" />
            Registrar local
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarClock} label="Eventos próximos" value={upcoming.length} />
        <StatCard icon={Calendar} label="Eventos publicados" value={events.length} />
        <StatCard icon={Eye} label="Vistas totales" value={totalViews} />
        <StatCard icon={MapPin} label="Locales" value={venues.length} />
      </div>

      <div className="merchant-panel">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold text-slate-800">Próximos eventos</h2>
          {venues.length > 0 && (
            <Button className="btn-primary" onClick={() => setActiveTab('events')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear evento
            </Button>
          )}
        </div>

        {upcoming.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {upcoming.slice(0, 5).map((e) => (
              <li key={e.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{e.title}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(e.date)}
                    {e.start_time && ` · ${e.start_time}`}
                    {e.expand?.venue?.name && ` · ${e.expand.venue.name}`}
                  </p>
                </div>
                <span className="stats-badge inline-flex items-center flex-shrink-0">
                  <Eye className="h-3 w-3 mr-1" />
                  {e.views || 0}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No tienes eventos próximos.</p>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardTab;
