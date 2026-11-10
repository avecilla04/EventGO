import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

/** Usuario de la app = sesión de Supabase Auth + su fila en `profiles`. */
async function loadUser(session) {
  if (!session?.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, type, name, business_name")
    .eq("id", session.user.id)
    .maybeSingle();
  return {
    id: session.user.id,
    email: session.user.email,
    type: data?.type || "cliente",
    name: data?.name || "",
    business_name: data?.business_name || "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = async (session) => {
      const next = await loadUser(session);
      if (active) {
        setUser(next);
        setLoading(false);
      }
    };

    // getSession solo lee el navegador; getUser confirma con el servidor que el token es válido
    // (usuario borrado, token falso o caducado). Si no lo es, se descarta la sesión local.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return apply(null);
      const { error } = await supabase.auth.getUser();
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        return apply(null);
      }
      return apply(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      // Supabase recomienda no llamar a la API dentro del callback: lo diferimos.
      setTimeout(() => apply(session), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  /** Devuelve { needsConfirmation: true } si el proyecto exige confirmar el email. */
  const signUp = async ({ email, password, type, name, businessName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { type, name, business_name: type === "comerciante" ? businessName : "" } },
    });
    if (error) throw error;
    // Con la confirmación activada, Supabase no da sesión ni avisa de emails repetidos.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("User already registered");
    }
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = useCallback(
    async (fields) => {
      const { error } = await supabase.from("profiles").update(fields).eq("id", user.id);
      if (error) throw error;
      setUser((u) => ({ ...u, ...fields }));
    },
    [user?.id]
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isMerchant: user?.type === "comerciante",
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Cargando" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
