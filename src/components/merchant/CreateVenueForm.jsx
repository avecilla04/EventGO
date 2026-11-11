import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/events";
import { normalizeWebsite } from "@/lib/links";
import { geocodeAddress, normalizeText, prettyCity } from "@/lib/geo";

const emptyVenueForm = {
  name: "",
  address: "",
  city: "",
  description: "",
  website: "",
  instagram: "",
};

const CreateVenueForm = ({ mode = "create", initialData = null, onSaved, onCancel }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [venueForm, setVenueForm] = useState(emptyVenueForm);
  const isEdit = mode === "edit" && initialData;

  useEffect(() => {
    setVenueForm(
      isEdit
        ? {
            name: initialData.name || "",
            address: initialData.address || "",
            city: initialData.city || "",
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

    const address = venueForm.address.trim();
    const city = prettyCity(venueForm.city);
    if (!venueForm.name.trim() || !address || !city) {
      toast({ title: "Nombre, dirección y ciudad son obligatorios", className: "error-toast" });
      return;
    }

    const payload = {
      name: venueForm.name.trim(),
      address,
      city,
      description: venueForm.description.trim(),
      website: normalizeWebsite(venueForm.website),
      instagram: venueForm.instagram.trim().replace(/^@/, ""),
    };

    try {
      setSaving(true);

      // Se busca la ubicación en el mapa solo si es nueva o ha cambiado la dirección.
      const locationChanged =
        !isEdit ||
        initialData.lat == null ||
        normalizeText(initialData.address) !== normalizeText(address) ||
        normalizeText(initialData.city) !== normalizeText(city);
      let geoNotice = null;
      if (locationChanged) {
        const geo = await geocodeAddress(address, city).catch(() => null);
        payload.lat = geo?.lat ?? null;
        payload.lng = geo?.lng ?? null;
        if (!geo) geoNotice = "No hemos encontrado la dirección en el mapa: el local no saldrá en «Cerca de mí». Revisa la dirección.";
        else if (geo.approximate) geoNotice = `No encontramos la calle exacta: usaremos el centro de ${city} para calcular distancias.`;
      }

      const query = isEdit
        ? supabase.from("venues").update(payload).eq("id", initialData.id)
        : supabase.from("venues").insert(payload);
      const { data: saved, error } = await query.select().single();
      if (error) throw error;
      toast({
        title: isEdit ? "Local actualizado" : "Local registrado",
        description: geoNotice || undefined,
        className: geoNotice ? "info-toast" : "success-toast",
        duration: geoNotice ? 9000 : undefined,
      });
      onSaved?.(saved);
    } catch (err) {
      console.error("Save venue error:", err);
      toast({
        title: isEdit ? "No se pudo guardar el local" : "No se pudo registrar el local",
        description: errorMessage(err),
        className: "error-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel">
      <h3 className="mb-6 font-display text-xl font-semibold">{isEdit ? "Editar local" : "Nuevo local"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label" htmlFor="v-name">Nombre *</label>
          <input id="v-name" name="name" required maxLength={100} placeholder="Bar La Esquina"
            value={venueForm.name} onChange={handleChange} className="form-input" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <div>
            <label className="form-label" htmlFor="v-address">Dirección *</label>
            <input id="v-address" name="address" required maxLength={200} placeholder="Calle Feria 12"
              value={venueForm.address} onChange={handleChange} className="form-input" autoComplete="street-address" />
          </div>
          <div>
            <label className="form-label" htmlFor="v-city">Ciudad *</label>
            <input id="v-city" name="city" required maxLength={80} placeholder="Sevilla"
              value={venueForm.city} onChange={handleChange} className="form-input" autoComplete="address-level2" />
          </div>
        </div>
        <p className="form-hint -mt-2 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          Con la dirección te situamos en el mapa para que te encuentren al buscar por ciudad o «cerca de mí».
        </p>
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

        <div className="flex flex-wrap gap-2 border-t border-line pt-5">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar Local"}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateVenueForm;
