import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Menu, X, ChevronDown, Compass, PlusSquare, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { user, isMerchant, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (path) => location.pathname === path;

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
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isProfileOpen]);

  const handleLogout = () => {
    signOut();
    toast({
      title: "¡Hasta pronto!",
      description: "Has cerrado sesión correctamente.",
      className: "info-toast"
    });
    navigate('/');
  };

  const handlePublishEvent = () => {
    navigate('/comerciante');
    setIsProfileOpen(false);
    setIsOpen(false);
  };

  const handleDiscoverEvents = () => {
    navigate('/');
    setIsProfileOpen(false);
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-600 text-xl font-bold">EventGo</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Eventos
            </Link>
            <Link to="/locales" className={`nav-link ${isActive('/locales') ? 'active' : ''}`}>
              Locales
            </Link>

            {user ? (
              <div className="relative" ref={profileRef}>
                <Button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  variant="outline"
                  className="flex items-center border-slate-300/90 bg-white/80 hover:bg-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="max-w-[140px] truncate">{user.name || "Mi perfil"}</span>
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 py-1.5"
                  >
                    {location.pathname !== "/" && (
                      <button
                        onClick={handleDiscoverEvents}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                      >
                        <Compass className="h-4 w-4 mr-2" />
                        Descubrir eventos
                      </button>
                    )}

                    {isMerchant && (
                      <button onClick={handlePublishEvent} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center">
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Mi panel de comerciante
                      </button>
                    )}

                    <div className="border-t border-slate-200 my-1" />

                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="btn-primary">
                Acceder
              </Link>
            )}
          </div>

          {/* Mobile button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menú" className="text-slate-700 hover:text-blue-600 transition-colors">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-4 border-t border-slate-200/70"
          >
            <Link to="/" className={`block nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              Eventos
            </Link>
            <Link to="/locales" className={`block nav-link ${isActive('/locales') ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              Locales
            </Link>

            {user ? (
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <p className="px-2 text-sm font-semibold text-slate-500">Mi Perfil</p>

                <button onClick={handleDiscoverEvents} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center rounded-md">
                  <Compass className="h-4 w-4 mr-2" />
                  Descubrir eventos
                </button>

                {isMerchant && (
                  <button onClick={handlePublishEvent} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center rounded-md">
                    <PlusSquare className="h-4 w-4 mr-2" />
                    Mi panel de comerciante
                  </button>
                )}

                <div className="border-t border-slate-200 my-1" />

                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center rounded-md">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link to="/auth" className="block btn-primary text-center" onClick={() => setIsOpen(false)}>
                Acceder
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;