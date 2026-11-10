import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";

/** Aviso para invitados en las páginas que requieren sesión. */
export default function LoginRequired({ title, text }) {
  const location = useLocation();
  return (
    <div className="max-w-xl mx-auto text-center py-16 px-4">
      <Lock className="h-10 w-10 mx-auto text-blue-600 mb-3" />
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 mb-6">{text}</p>
      <Link to="/auth" state={{ from: location.pathname }} className="btn-primary inline-block">
        Acceder o crear cuenta
      </Link>
    </div>
  );
}
