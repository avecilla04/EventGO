import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";

// El resto de páginas se descargan solo cuando se visitan.
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const VenuesPage = lazy(() => import("@/pages/VenuesPage"));
const VenueDetailPage = lazy(() => import("@/pages/VenueDetailPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const MerchantDashboard = lazy(() => import("@/pages/MerchantDashboard"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Cargando" />
  </div>
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
  <div className="page flex min-h-[60vh] flex-col items-center justify-center text-center">
    <p className="font-display text-7xl font-extrabold text-accent">404</p>
    <h1 className="mt-2 text-2xl font-bold">Página no encontrada</h1>
    <p className="mt-2 text-muted">La dirección que buscas no existe.</p>
    <Link to="/" className="btn-dark mt-6">Volver al inicio</Link>
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
        <main className="min-h-[calc(100vh-4rem)]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="/locales" element={<VenuesPage />} />
            <Route path="/local/:id" element={<VenueDetailPage />} />
            <Route path="/auth" element={<GuestOnlyRoute><AuthPage /></GuestOnlyRoute>} />
            <Route path="/restablecer" element={<ResetPasswordPage />} />
            <Route path="/comerciante" element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </main>
        <Footer />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
