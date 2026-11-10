import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-muted">El mejor plan de tardeo y noche, cerca de ti.</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted">
          <Link to="/" className="hover:text-ink">Eventos</Link>
          <Link to="/locales" className="hover:text-ink">Locales</Link>
          <Link to="/comerciante" className="hover:text-ink">Para locales</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="page py-4 text-xs text-muted">© {new Date().getFullYear()} EventGo</p>
      </div>
    </footer>
  );
}
