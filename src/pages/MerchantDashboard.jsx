import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Calendar, Store, Settings } from 'lucide-react';

import DashboardTab from '@/components/merchant/DashboardTab';
import EventsTab from '@/components/merchant/EventsTab';
import VenuesTab from '@/components/merchant/VenuesTab';
import SettingsTab from '@/components/merchant/SettingsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase, EVENT_WITH_VENUE } from '@/lib/supabase';
import useDocumentTitle from '@/lib/useDocumentTitle';

const TABS = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'events', label: 'Mis Eventos', icon: Calendar },
  { id: 'venues', label: 'Mis Locales', icon: Store },
  { id: 'settings', label: 'Perfil', icon: Settings },
];

const MerchantDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // { [venueId]: { followers, newFollowers } } · null si la función SQL aún no existe
  const [stats, setStats] = useState(null);

  const tabParam = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : 'dashboard';
  const setActiveTab = useCallback(
    (tab) => setSearchParams(tab === 'dashboard' ? {} : { tab }),
    [setSearchParams]
  );

  useDocumentTitle('Panel de comerciante');

  // Locales y eventos del comerciante: se cargan una vez y se comparten entre pestañas.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('venues').select('*').eq('user_id', user.id).order('name'),
      supabase.from('events').select(EVENT_WITH_VENUE).eq('user_id', user.id).order('date', { ascending: false }),
      supabase.rpc('my_venue_stats'),
    ]).then(([v, e, st]) => {
      if (cancelled) return;
      if (v.error || e.error) {
        console.error('Error loading merchant data:', v.error || e.error);
        toast({ title: 'No se pudieron cargar tus datos', className: 'error-toast' });
      } else {
        setVenues(v.data);
        setEvents(e.data);
      }
      if (!st.error) {
        setStats(Object.fromEntries(st.data.map((r) => [r.venue_id, { followers: r.followers, newFollowers: r.new_followers_7d }])));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user.id, toast]);

  const shared = { venues, setVenues, events, setEvents, setActiveTab, stats };

  const renderContent = () => {
    if (loading && activeTab !== 'settings') {
      return <div className="h-40 animate-pulse rounded-2xl bg-line" />;
    }
    switch (activeTab) {
      case 'events':
        return <EventsTab {...shared} />;
      case 'venues':
        return <VenuesTab {...shared} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab {...shared} />;
    }
  };

  return (
    <div className="page pt-8 sm:pt-10">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">{user.business_name || 'Panel de comerciante'}</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Hola, {(user.name || '').split(' ')[0] || 'de nuevo'}</h1>
        <p className="text-muted">Gestiona tus locales y eventos y mira cómo funcionan.</p>
      </div>

      <div className="-mx-4 mt-8 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-full border border-line bg-white p-1 shadow-soft" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">{renderContent()}</div>
    </div>
  );
};

export default MerchantDashboard;
