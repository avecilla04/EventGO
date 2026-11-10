import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import LoginRequired from "@/components/LoginRequired";
import useDocumentTitle from "@/lib/useDocumentTitle";

const normalize = (text) =>
  String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function VenuesPage() {
  const { isAuthenticated } = useAuth();
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useDocumentTitle("Locales");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");

    pb.collection("venues")
      .getFullList({ sort: "name" })
      .then((data) => !cancelled && setVenues(data))
      .catch((err) => {
        console.error("Error loading venues:", err);
        if (!cancelled) setError("No se pudieron cargar los locales.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const filteredVenues = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return venues;
    return venues.filter((v) => normalize(`${v.name} ${v.address}`).includes(q));
  }, [venues, search]);

  if (!isAuthenticated) {
    return (
      <LoginRequired
        title="Descubre los locales de tu ciudad"
        text="Inicia sesión para ver los bares y locales, sus próximos eventos y seguir tus favoritos."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Descubrir Locales</h1>
          <p className="text-slate-500">Explora locales y entra a su perfil público.</p>
        </div>

        <div className="search-input-container mb-8">
          <Search className="h-5 w-5 text-slate-500 ml-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Buscar locales"
          />
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando locales...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVenues.map((venue) => (
              <Link
                key={venue.id}
                to={`/local/${venue.id}`}
                className="merchant-panel block hover:shadow-md hover:border-blue-200 transition-all"
              >
                <h2 className="font-bold text-xl text-slate-800 mb-2">{venue.name}</h2>
                <p className="text-slate-500 flex items-center text-sm mb-3">
                  <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  {venue.address || "Sin dirección"}
                </p>
                {venue.description && (
                  <p className="text-slate-600 text-sm line-clamp-2">{venue.description}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">
            {venues.length === 0 ? "Todavía no hay locales registrados." : "No se encontraron locales."}
          </p>
        )}
      </div>
    </div>
  );
}
