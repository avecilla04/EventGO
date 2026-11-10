import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Calendar, MapPin, Settings } from 'lucide-react';

import DashboardTab from '@/components/merchant/DashboardTab';
import EventsTab from '@/components/merchant/EventsTab';
import VenuesTab from '@/components/merchant/VenuesTab';
import SettingsTab from '@/components/merchant/SettingsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import pb from '@/lib/pocketbase';
import useDocumentTitle from '@/lib/useDocumentTitle';

const TABS = [
  { id: 'dashboard', label: 'Panel Principal', icon: BarChart3 },
  { id: 'events', label: 'Mis Eventos', icon: Calendar },
  { id: 'venues', label: 'Mis Locales', icon: MapPin },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

const MerchantDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    const mine = pb.filter('user_id = {:id}', { id: user.id });

    Promise.all([
      pb.collection('venues').getFullList({ filter: mine, sort: 'name' }),
      pb.collection('events').getFullList({ filter: mine, sort: '-date', expand: 'venue' }),
    ])
      .then(([v, e]) => {
        if (cancelled) return;
        setVenues(v);
        setEvents(e);
      })
      .catch((err) => {
        console.error('Error loading merchant data:', err);
        if (!cancelled) {
          toast({ title: '❌ No se pudieron cargar tus datos', className: 'error-toast' });
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user.id, toast]);

  const shared = { venues, setVenues, events, setEvents, setActiveTab };

  const renderContent = () => {
    if (loading && activeTab !== 'settings') {
      return <p className="text-slate-500">Cargando...</p>;
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
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Panel de Comerciante</h1>
          <p className="text-slate-500">
            {user.business_name ? `${user.business_name} · ` : ''}Gestiona tus eventos y llega a más personas
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-2 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-2" role="tablist">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 md:px-4 text-sm md:text-base rounded-lg transition-all font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default MerchantDashboard;
