import { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.isValid ? pb.authStore.record : null);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.isValid ? pb.authStore.record : null);
    });

    // Comprueba con el servidor que la sesión guardada sigue siendo válida
    // (usuario borrado, token caducado...) y trae los datos actualizados.
    if (pb.authStore.isValid) {
      pb.collection("users")
        .authRefresh()
        .catch((err) => {
          if (err?.status === 401 || err?.status === 403 || err?.status === 404) {
            pb.authStore.clear();
          }
        });
    } else {
      pb.authStore.clear();
    }

    return () => unsubscribe();
  }, []);

  const signIn = (email, password) =>
    pb.collection("users").authWithPassword(email, password);

  const signUp = async ({ email, password, passwordConfirm, type, name, businessName }) => {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm,
      type,
      name,
      business_name: type === "comerciante" ? businessName : "",
    });
    return signIn(email, password);
  };

  const signOut = () => pb.authStore.clear();

  const value = {
    user,
    isAuthenticated: !!user,
    isMerchant: user?.type === "comerciante",
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
