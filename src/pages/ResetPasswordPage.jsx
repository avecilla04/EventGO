import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Eye, EyeOff, LinkIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/EmptyState";
import { errorMessage } from "@/lib/events";
import useDocumentTitle from "@/lib/useDocumentTitle";

const MIN_PASSWORD = 8;

/**
 * Destino del enlace de "¿Has olvidado tu contraseña?". Supabase abre la sesión
 * con el enlace (el AuthContext la recoge) y aquí se elige la contraseña nueva.
 */
export default function ResetPasswordPage() {
  const { user, isMerchant } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useDocumentTitle("Nueva contraseña");

  if (!user) {
    return (
      <div className="page py-16">
        <EmptyState
          icon={LinkIcon}
          title="Enlace no válido o caducado"
          text="Los enlaces para cambiar la contraseña caducan al cabo de un rato. Pide uno nuevo."
        >
          <Link to="/auth" className="btn-dark">Volver a iniciar sesión</Link>
        </EmptyState>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", className: "error-toast" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({
        title: "No se pudo cambiar la contraseña",
        description: /should be different/i.test(error.message)
          ? "La nueva contraseña debe ser distinta de la anterior."
          : errorMessage(error),
        className: "error-toast",
      });
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Ya puedes usarla para iniciar sesión.", className: "success-toast" });
    navigate(isMerchant ? "/comerciante" : "/", { replace: true });
  };

  return (
    <div className="page py-10 sm:py-16">
      <div className="panel mx-auto max-w-md !p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
          <KeyRound className="h-6 w-6 text-accent" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold">Nueva contraseña</h1>
        <p className="mt-2 text-muted">Elige una contraseña nueva para {user.email}.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="form-label" htmlFor="new-password">Contraseña nueva</label>
            <div className="relative">
              <input id="new-password" type={show ? "text" : "password"} className="form-input pr-11" value={password}
                onChange={(e) => setPassword(e.target.value)} minLength={MIN_PASSWORD} autoComplete="new-password" required />
              <button type="button" onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-canvas hover:text-ink"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="form-hint">Mínimo {MIN_PASSWORD} caracteres.</p>
          </div>
          <div>
            <label className="form-label" htmlFor="confirm-password">Repite la contraseña</label>
            <input id="confirm-password" type={show ? "text" : "password"} className="form-input" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} minLength={MIN_PASSWORD} autoComplete="new-password" required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary btn-lg w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
