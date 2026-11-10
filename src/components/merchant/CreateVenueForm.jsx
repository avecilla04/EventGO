import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/lib/events";
import { normalizeWebsite } from "@/lib/links";

const emptyVenueForm = {
  name: "",
  address: "",
  description: "",
  website: "",
  instagram: "",
};

const CreateVenueForm = ({ mode = "create", initialData = null, onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [venueForm, setVenueForm] = useState(emptyVenueForm);
  const isEdit = mode === "edit" && initialData;

  useEffect(() => {
    setVenueForm(
      isEdit
        ? {
            name: initialData.name || "",
            address: initialData.address || "",
            description: initialData.description || "",
            website: initialData.website || "",
            instagram: initialData.instagram || "",
          }
        : emptyVenueForm
    );
  }, [isEdit, initialData]);

  const handleChange = (e) => setVenueForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!venueForm.name.trim() || !venueForm.address.trim()) {
      toast({ title: "❌ Nombre y dirección son obligatorios", className: "error-toast" });
      return;
    }

    const payload = {
      name: venueForm.name.trim(),
      address: venueForm.address.trim(),
      description: venueForm.description.trim(),
      website: normalizeWebsite(venueForm.website),
      instagram: venueForm.instagram.trim().replace(/^@/, ""),
      user_id: user.id,
    };

    try {
      setSaving(true);
      const saved = isEdit
        ? await pb.collection("venues").update(initialData.id, payload)
        : await pb.collection("venues").create(payload);
      toast({ title: isEdit ? "🏢 Local actualizado" : "🏢 Local registrado", className: "success-toast" });
      onSaved?.(saved);
    } catch (err) {
      console.error("Save venue error:", err);
      toast({
        title: isEdit ? "❌ No se pudo guardar el local" : "❌ No se pudo registrar el local",
        description: errorMessage(err),
        className: "error-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="merchant-panel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="v-name">Nombre *</label>
            <input id="v-name" name="name" required maxLength={100} placeholder="Bar La Esquina"
              value={venueForm.name} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label" htmlFor="v-address">Dirección *</label>
            <input id="v-address" name="address" required maxLength={200} placeholder="Calle Mayor 1, Madrid"
              value={venueForm.address} onChange={handleChange} className="form-input" />
            <p className="text-xs text-slate-500 mt-1">Incluye la ciudad para que los clientes te encuentren al buscar.</p>
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="v-description">Descripción</label>
          <textarea id="v-description" name="description" maxLength={2000} placeholder="Cuéntales cómo es tu local"
            value={venueForm.description} onChange={handleChange} className="form-textarea" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="v-website">Web</label>
            <input id="v-website" name="website" placeholder="milocal.com" value={venueForm.website}
              onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label" htmlFor="v-instagram">Instagram</label>
            <input id="v-instagram" name="instagram" maxLength={60} placeholder="@milocal" value={venueForm.instagram}
              onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar Local"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateVenueForm;
