import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Compass, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Logo from '@/components/Logo';

const LINKS = [
  { to: '/', label: 'Eventos', Icon: Compass, end: true },
  { to: '/locales', label: 'Locales', Icon: Store },
];

const Avatar = ({ name }) => (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent">
    {(name || '?').trim().charAt(0).toUpperCase()}
  </span>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { user, isMerchant, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Cierra los menús al cambiar de página o al pulsar fuera.
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isProfileOpen) return undefined;
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setIsProfileOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileOpen]);

  const handleLogout = () => {
    signOut();
    toast({ title: 'Has cerrado sesión', description: '¡Hasta pronto!', className: 'info-toast' });
    navigate('/');
  };

  const linkClass = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-canvas/80 backdrop-blur-xl">
      <div className="page flex h-16 items-center justify-between">
        <Logo />

        {/* Escritorio */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium transition hover:border-ink/20"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <Avatar name={user.name || user.email} />
                <span className="max-w-[140px] truncate">{user.name || 'Mi cuenta'}</span>
                <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift animate-in fade-in-0 zoom-in-95"
                >
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-ink">{user.name || 'Mi cuenta'}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  {isMerchant && (
                    <Link to="/comerciante" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink hover:bg-canvas">
                      <LayoutDashboard className="h-4 w-4 text-muted" />
                      Panel de mi local
                    </Link>
                  )}
                  <button onClick={handleLogout} role="menuitem" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn-dark">
              Acceder
            </Link>
          )}
        </div>

        {/* Móvil */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-line bg-canvas md:hidden animate-in slide-in-from-top-2 fade-in-0">
          <nav className="page space-y-1 py-4">
            {LINKS.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium ${isActive ? 'bg-white text-ink shadow-soft' : 'text-muted'}`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}

            {user ? (
              <>
                {isMerchant && (
                  <Link to="/comerciante" className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-muted">
                    <LayoutDashboard className="h-5 w-5" />
                    Panel de mi local
                  </Link>
                )}
                <div className="my-2 h-px bg-line" />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={user.name || user.email} />
                    <span className="truncate text-sm font-medium">{user.name || user.email}</span>
                  </div>
                  <button onClick={handleLogout} className="btn-ghost btn-sm text-red-600">
                    <LogOut className="h-4 w-4" />
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <Link to="/auth" className="btn-dark mt-3 w-full">
                Acceder
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
