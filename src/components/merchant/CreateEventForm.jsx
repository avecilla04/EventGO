import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { EVENT_CATEGORIES, MAX_COVER_BYTES, coverUrl, errorMessage, toDateInput, todayISO } from "@/lib/events";

const emptyEventForm = {
  title: "",
  category: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
  venue: "",
};

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif";

const CreateEventForm = ({ venues, mode = "create", initialData = null, onSaved, onCancel }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const coverInputRef = useRef(null);
  const isEdit = mode === "edit" && initialData;

  useEffect(() => {
    if (isEdit) {
      setEventForm({
        title: initialData.title || "",
        category: initialData.category || "",
        description: initialData.description || "",
        date: toDateInput(initialData.date),
        start_time: initialData.start_time || "",
        end_time: initialData.end_time || "",
        venue: initialData.venue || "",
      });
    } else {
      // Con un solo local, se preselecciona.
      setEventForm({ ...emptyEventForm, venue: venues.length === 1 ? venues[0].id : "" });
    }
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }, [isEdit, initialData, venues]);

  const set = (field) => (e) => setEventForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCover = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_COVER_BYTES) {
      toast({ title: "⚠️ La imagen supera los 5 MB", className: "error-toast" });
      e.target.value = "";
      setCoverFile(null);
      return;
    }
    setCoverFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!eventForm.title.trim() || !eventForm.date || !eventForm.venue) {
      toast({
        title: "⚠️ Faltan datos",
        description: "Completa título, fecha y local.",
        className: "info-toast",
      });
      return;
    }

    const payload = {
      title: eventForm.title.trim(),
      category: eventForm.category,
      description: eventForm.description.trim(),
      date: `${eventForm.date} 00:00:00`,
      start_time: eventForm.start_time,
      end_time: eventForm.end_time,
      venue: eventForm.venue,
      user_id: user.id,
      ...(coverFile ? { cover: coverFile } : {}),
    };

    try {
      setSaving(true);
      const saved = isEdit
        ? await pb.collection("events").update(initialData.id, payload)
        : await pb.collection("events").create(payload);

      // Añadimos el local localmente para no tener que volver a pedirlo.
      saved.expand = { venue: venues.find((v) => v.id === saved.venue) };

      toast({
        title: isEdit ? "✅ Evento actualizado" : "✅ Evento publicado",
        className: "success-toast",
      });
      onSaved?.(saved);
    } catch (err) {
      console.error("Save event error:", err);
      toast({
        title: isEdit ? "❌ No se pudo guardar el evento" : "❌ No se pudo crear el evento",
        description: errorMessage(err),
        className: "error-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  if (venues.length === 0) {
    return (
      <div className="merchant-panel text-slate-600">
        Primero registra un local en la pestaña <strong>Mis Locales</strong> para poder publicar eventos.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="merchant-panel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label" htmlFor="ev-title">Título *</label>
          <input id="ev-title" name="title" className="form-input" maxLength={120} required
            placeholder="Ej.: Tardeo con flamenquito" value={eventForm.title} onChange={set("title")} />
        </div>

        <div>
          <label className="form-label" htmlFor="ev-description">Descripción</label>
          <textarea id="ev-description" name="description" className="form-textarea" maxLength={5000}
            placeholder="¿Qué plan ofreces?" value={eventForm.description} onChange={set("description")} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="ev-venue">Local *</label>
            <select id="ev-venue" className="form-input" value={eventForm.venue} onChange={set("venue")} required>
              <option value="">Selecciona un local</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="ev-category">Tipo de plan</label>
            <select id="ev-category" className="form-input" value={eventForm.category} onChange={set("category")}>
              <option value="">Sin categoría</option>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label" htmlFor="ev-date">Fecha *</label>
            <input id="ev-date" type="date" className="form-input" required
              min={isEdit ? undefined : todayISO()} value={eventForm.date} onChange={set("date")} />
          </div>
          <div>
            <label className="form-label" htmlFor="ev-start">Hora de inicio</label>
            <input id="ev-start" type="time" className="form-input" value={eventForm.start_time} onChange={set("start_time")} />
          </div>
          <div>
            <label className="form-label" htmlFor="ev-end">Hora de fin</label>
            <input id="ev-end" type="time" className="form-input" value={eventForm.end_time} onChange={set("end_time")} />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="ev-cover">Imagen de portada (JPG, PNG, WEBP o GIF, máx. 5 MB)</label>
          {isEdit && initialData.cover && !coverFile && (
            <img src={coverUrl(initialData)} alt="Portada actual" className="h-24 rounded-lg mb-2 object-cover" />
          )}
          <input id="ev-cover" ref={coverInputRef} type="file" accept={ACCEPTED_IMAGES} className="form-input" onChange={handleCover} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar evento"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateEventForm;
