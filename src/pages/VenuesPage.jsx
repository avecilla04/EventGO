import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Store, ArrowUpRight, X } from "lucide-react";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import LoginRequired from "@/components/LoginRequired";
import EmptyState from "@/components/EmptyState";
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

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return q ? venues.filter((v) => normalize(`${v.name} ${v.address}`).includes(q)) : venues;
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
    <div className="page pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Directorio</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Locales</h1>
          <p className="mt-2 text-muted">Bares y locales que publican sus planes en EventGo.</p>
        </div>

        <div className="flex w-full items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 shadow-soft sm:w-80 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="text"
            placeholder="Nombre o ciudad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            aria-label="Buscar locales"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Borrar búsqueda" className="text-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />)}
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((venue) => (
              <Link
                key={venue.id}
                to={`/local/${venue.id}`}
                className="group panel flex items-start gap-4 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink font-display text-lg font-bold text-white transition group-hover:bg-accent">
                  {venue.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold">{venue.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{venue.address || "Sin dirección"}</span>
                  </p>
                  {venue.description && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{venue.description}</p>}
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Store}
            title={venues.length === 0 ? "Todavía no hay locales" : "No hay locales con ese nombre"}
            text={venues.length === 0 ? "Pronto los bares de tu zona empezarán a publicar." : "Prueba con otro nombre o ciudad."}
          />
        )}
      </div>
    </div>
  );
}
