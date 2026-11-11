import React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Heart, Eye, Store, Plus, ArrowRight, CalendarX, QrCode } from 'lucide-react';
import { dateParts, todayISO } from '@/lib/events';
import EmptyState from '@/components/EmptyState';

const StatCard = ({ icon: Icon, label, value, extra }) => (
  <div className="panel">
    <div className="flex items-start justify-between gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
        <Icon className="h-5 w-5 text-accent" />
      </span>
      {extra && <span className="tag-accent">{extra}</span>}
    </div>
    <p className="mt-4 font-display text-3xl font-bold">{value}</p>
    <p className="text-sm text-muted">{label}</p>
  </div>
);

const DashboardTab = ({ events, venues, setActiveTab, stats }) => {
  const today = todayISO();
  const upcoming = events
    .filter((e) => String(e.date).slice(0, 10) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const totalViews = events.reduce((sum, e) => sum + (e.views || 0), 0);
  const followers = stats ? Object.values(stats).reduce((s, v) => s + v.followers, 0) : null;
  const newFollowers = stats ? Object.values(stats).reduce((s, v) => s + v.newFollowers, 0) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {venues.length === 0 && (
        <div className="glow-bg flex flex-col gap-5 rounded-3xl p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="eyebrow">Primer paso</p>
            <h2 className="mt-1 text-2xl font-bold">Registra tu local</h2>
            <p className="mt-1 text-white/70">Necesitas al menos un local para poder publicar eventos.</p>
          </div>
          <button className="btn-primary shrink-0" onClick={() => setActiveTab('venues')}>
            <Store className="h-4 w-4" />
            Registrar local
          </button>
        </div>
      )}

      {venues.length > 0 && followers === 0 && (
        <div className="panel flex flex-col gap-4 border-accent/30 bg-accent-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink">
              <QrCode className="h-5 w-5 text-accent" />
            </span>
            <div>
              <p className="font-semibold">Consigue tus primeros seguidores</p>
              <p className="text-sm text-muted">Imprime el cartel QR de tu local: quien lo escanee te seguirá y verá tus planes.</p>
            </div>
          </div>
          <button className="btn-dark shrink-0" onClick={() => setActiveTab('venues')}>
            <QrCode className="h-4 w-4" />
            Ver mi cartel QR
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label="Eventos próximos" value={upcoming.length} />
        <StatCard
          icon={Heart}
          label="Seguidores"
          value={followers ?? '—'}
          extra={newFollowers > 0 ? `+${newFollowers} esta semana` : null}
        />
        <StatCard icon={Eye} label="Vistas totales" value={totalViews} />
        <StatCard icon={Store} label="Locales" value={venues.length} />
      </div>

      <div className="panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">Próximos eventos</h2>
          {venues.length > 0 && (
            <button className="btn-primary btn-sm" onClick={() => setActiveTab('events')}>
              <Plus className="h-4 w-4" />
              Crear evento
            </button>
          )}
        </div>

        {upcoming.length > 0 ? (
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 5).map((e) => {
              const parts = dateParts(e.date);
              return (
                <li key={e.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 shrink-0 rounded-xl bg-canvas py-1.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{parts?.month}</p>
                    <p className="font-display text-lg font-bold leading-none">{parts?.day}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{e.title}</p>
                    <p className="truncate text-sm text-muted">
                      {e.start_time || 'Sin hora'}
                      {e.venue?.name && ` · ${e.venue.name}`}
                    </p>
                  </div>
                  <span className="tag shrink-0">
                    <Eye className="h-3 w-3" />
                    {e.views || 0}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={CalendarX} title="No tienes eventos próximos" text="Publica tu próximo plan para que la gente lo descubra.">
            {venues.length > 0 && (
              <button className="btn-dark" onClick={() => setActiveTab('events')}>
                Crear evento <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </EmptyState>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardTab;
