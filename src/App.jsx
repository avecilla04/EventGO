import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import HomePage from "@/pages/HomePage";

// El resto de páginas se descargan solo cuando se visitan.
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const VenuesPage = lazy(() => import("@/pages/VenuesPage"));
const VenueDetailPage = lazy(() => import("@/pages/VenueDetailPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const MerchantDashboard = lazy(() => import("@/pages/MerchantDashboard"));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Cargando...</div>
);

const MerchantRoute = ({ children }) => {
  const { user, isMerchant } = useAuth();
  if (!user) return <Navigate to="/auth" replace state={{ from: "/comerciante" }} />;
  if (!isMerchant) return <Navigate to="/" replace />;
  return children;
};

// Tras iniciar sesión vuelve a la página desde la que se vino (si la hay);
// si no, el comerciante va a su panel y el cliente a la portada.
const GuestOnlyRoute = ({ children }) => {
  const { user, isMerchant } = useAuth();
  const location = useLocation();
  if (!user) return children;
  const from = location.state?.from;
  return <Navigate to={from || (isMerchant ? "/comerciante" : "/")} replace />;
};

const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-3xl font-bold text-slate-800 mb-2">Página no encontrada</h1>
    <p className="text-slate-500 mb-6">La dirección que buscas no existe.</p>
    <Link to="/" className="btn-primary">Volver al inicio</Link>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/locales" element={<VenuesPage />} />
            <Route path="/local/:id" element={<VenueDetailPage />} />
            <Route path="/auth" element={<GuestOnlyRoute><AuthPage /></GuestOnlyRoute>} />
            <Route path="/comerciante" element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
