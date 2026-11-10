import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import CreateVenueForm from "@/components/merchant/CreateVenueForm";
import pb from "@/lib/pocketbase";
import { errorMessage } from "@/lib/events";
import { instagramUrl, safeWebsite } from "@/lib/links";

const VenuesTab = ({ venues, setVenues, events, setEvents }) => {
  // null = formulario cerrado, 'new' = crear, objeto = editar ese local
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const handleSaved = (saved) => {
    setVenues((prev) =>
      prev.some((v) => v.id === saved.id) ? prev.map((v) => (v.id === saved.id ? saved : v)) : [...prev, saved]
    );
    // Mantiene actualizado el nombre del local en la lista de eventos.
    setEvents((prev) =>
      prev.map((e) => (e.venue === saved.id ? { ...e, expand: { ...e.expand, venue: saved } } : e))
    );
    setEditing(null);
  };

  const handleDelete = async (venue) => {
    const count = events.filter((e) => e.venue === venue.id).length;
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
      await pb.collection("venues").delete(venue.id);
      setVenues((prev) => prev.filter((v) => v.id !== venue.id));
      if (editing?.id === venue.id) setEditing(null);
      toast({ title: "🗑️ Local borrado", className: "info-toast" });
    } catch (err) {
      toast({ title: "❌ No se pudo borrar el local", description: errorMessage(err), className: "error-toast" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Mis Locales</h2>
        {!editing && (
          <Button onClick={() => setEditing("new")} className="btn-primary w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Local
          </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venues.map((venue) => {
            const website = safeWebsite(venue.website);
            const instagram = instagramUrl(venue.instagram);
            return (
              <div key={venue.id} className="merchant-panel">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Link to={`/local/${venue.id}`} className="font-bold text-lg text-slate-800 hover:text-blue-600">
                      {venue.name}
                    </Link>
                    <p className="text-slate-500 flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {venue.address}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditing(venue)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(venue)}>
                      Borrar
                    </Button>
                  </div>
                </div>

                {venue.description && <p className="text-slate-600 mb-4 text-sm line-clamp-3">{venue.description}</p>}

                <div className="flex space-x-4 text-sm">
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Sitio web
                    </a>
                  )}
                  {instagram && (
                    <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      @{instagram.handle}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !editing && (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No tienes locales registrados</h3>
            <p className="text-slate-500 mb-6">Registra tu local para poder asociarlo a tus eventos.</p>
            <Button onClick={() => setEditing("new")} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Mi Primer Local
            </Button>
          </div>
        )
      )}
    </motion.div>
  );
};

export default VenuesTab;
