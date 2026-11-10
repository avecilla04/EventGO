import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";

/** Aviso para invitados en las páginas que requieren sesión. */
export default function LoginRequired({ title, text }) {
  const location = useLocation();
  return (
    <div className="page py-16 sm:py-24">
      <div className="glow-bg mx-auto max-w-xl overflow-hidden rounded-3xl px-6 py-12 text-center text-white shadow-lift sm:px-10">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <Lock className="h-5 w-5 text-accent" />
        </span>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-white/70">{text}</p>
        <Link to="/auth" state={{ from: location.pathname }} className="btn-primary btn-lg mt-8">
          Acceder o crear cuenta
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
