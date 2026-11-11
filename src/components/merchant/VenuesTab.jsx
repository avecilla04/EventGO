import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, MapPin, Store, Pencil, Trash2, Globe, Instagram, QrCode, Heart } from "lucide-react";
import QrPosterDialog from "@/components/merchant/QrPosterDialog";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import CreateVenueForm from "@/components/merchant/CreateVenueForm";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/events";
import { instagramUrl, safeWebsite } from "@/lib/links";

const VenuesTab = ({ venues, setVenues, events, setEvents, stats }) => {
  // null = formulario cerrado, 'new' = crear, objeto = editar ese local
  const [editing, setEditing] = useState(null);
  const [posterVenue, setPosterVenue] = useState(null);
  const { toast } = useToast();

  const closePoster = useCallback(() => setPosterVenue(null), []);

  const handleSaved = (saved) => {
    setVenues((prev) =>
      prev.some((v) => v.id === saved.id) ? prev.map((v) => (v.id === saved.id ? saved : v)) : [...prev, saved]
    );
    // Mantiene actualizado el nombre del local en la lista de eventos.
    setEvents((prev) =>
      prev.map((e) => (e.venue_id === saved.id ? { ...e, venue: { id: saved.id, name: saved.name, address: saved.address } } : e))
    );
    setEditing(null);
  };

  const handleDelete = async (venue) => {
    const count = events.filter((e) => e.venue_id === venue.id).length;
    if (count > 0) {
      toast({
        title: "⚠️ No se puede borrar el local",
        description: `Tiene ${count} ${count === 1 ? "evento asociado" : "eventos asociados"}. Bórralos primero.`,
        className: "info-toast",
      });
      return;
    }
    if (!window.confirm(`¿Seguro que quieres borrar "${venue.name}"?`)) return;

    try {
      const { error } = await supabase.from("venues").delete().eq("id", venue.id);
      if (error) throw error;
      setVenues((prev) => prev.filter((v) => v.id !== venue.id));
      if (editing?.id === venue.id) setEditing(null);
      toast({ title: "Local borrado", className: "info-toast" });
    } catch (err) {
      toast({ title: "❌ No se pudo borrar el local", description: errorMessage(err), className: "error-toast" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="section-title">Mis Locales</h2>
        {!editing && venues.length > 0 && (
          <button onClick={() => setEditing("new")} className="btn-primary">
            <Plus className="h-4 w-4" />
            Registrar Local
          </button>
        )}
      </div>

      {editing && (
        <CreateVenueForm
          mode={editing === "new" ? "create" : "edit"}
          initialData={editing === "new" ? null : editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      )}

      {venues.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {venues.map((venue) => {
            const website = safeWebsite(venue.website);
            const instagram = instagramUrl(venue.instagram);
            const count = events.filter((e) => e.venue_id === venue.id).length;
            return (
              <div key={venue.id} className="panel flex flex-col">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink font-display text-lg font-bold text-white">
                    {venue.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/local/${venue.id}`} className="block truncate font-display text-lg font-semibold hover:text-accent">
                      {venue.name}
                    </Link>
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="tag">{count} {count === 1 ? "evento" : "eventos"}</span>
                    {stats?.[venue.id] && (
                      <span className="tag-accent">
                        <Heart className="h-3 w-3" />
                        {stats[venue.id].followers} {stats[venue.id].followers === 1 ? "seguidor" : "seguidores"}
                      </span>
                    )}
                  </div>
                </div>

                {venue.description && <p className="mt-4 line-clamp-3 text-sm text-ink/70">{venue.description}</p>}

                {(website || instagram) && (
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {website && (
                      <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-accent">
                        <Globe className="h-4 w-4" />
                        Web
                      </a>
                    )}
                    {instagram && (
                      <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-accent">
                        <Instagram className="h-4 w-4" />
                        @{instagram.handle}
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <button className="btn-dark btn-sm" onClick={() => setPosterVenue(venue)}>
                    <QrCode className="h-3.5 w-3.5" />
                    Cartel QR
                  </button>
                  <button className="btn-outline btn-sm" onClick={() => setEditing(venue)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => handleDelete(venue)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !editing && (
          <EmptyState icon={Store} title="No tienes locales registrados" text="Registra tu local para poder asociarlo a tus eventos.">
            <button onClick={() => setEditing("new")} className="btn-primary">
              <Plus className="h-4 w-4" />
              Registrar Mi Primer Local
            </button>
          </EmptyState>
        )
      )}
      {posterVenue && <QrPosterDialog venue={posterVenue} onClose={closePoster} />}
    </motion.div>
  );
};

export default VenuesTab;
