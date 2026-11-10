import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImagePlus, X, Loader2 } from "lucide-react";
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
  const [preview, setPreview] = useState(null);
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

  // Vista previa local de la imagen elegida.
  useEffect(() => {
    if (!coverFile) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(coverFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const set = (field) => (e) => setEventForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCover = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_COVER_BYTES) {
      toast({ title: "La imagen supera los 5 MB", className: "error-toast" });
      e.target.value = "";
      setCoverFile(null);
      return;
    }
    setCoverFile(file);
  };

  const clearCover = () => {
    setCoverFile(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!eventForm.title.trim() || !eventForm.date || !eventForm.venue) {
      toast({ title: "Faltan datos", description: "Completa título, fecha y local.", className: "info-toast" });
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

      toast({ title: isEdit ? "Evento actualizado" : "Evento publicado", className: "success-toast" });
      onSaved?.(saved);
    } catch (err) {
      console.error("Save event error:", err);
      toast({
        title: isEdit ? "No se pudo guardar el evento" : "No se pudo crear el evento",
        description: errorMessage(err),
        className: "error-toast",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentCover = preview || (isEdit && initialData.cover ? coverUrl(initialData) : null);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel">
      <h3 className="font-display text-xl font-semibold">{isEdit ? "Editar evento" : "Nuevo evento"}</h3>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div>
            <label className="form-label" htmlFor="ev-title">Título *</label>
            <input id="ev-title" name="title" className="form-input" maxLength={120} required
              placeholder="Ej.: Tardeo con flamenquito" value={eventForm.title} onChange={set("title")} />
          </div>

          <div>
            <span className="form-label">Tipo de plan</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de plan">
              {EVENT_CATEGORIES.map(({ id, Icon }) => {
                const active = eventForm.category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setEventForm((f) => ({ ...f, category: active ? "" : id }))}
                    className={`chip !py-1.5 ${active ? "!border-accent !bg-accent-soft !text-accent" : ""}`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "" : "text-muted"}`} />
                    {id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="form-label" htmlFor="ev-date">Fecha *</label>
              <input id="ev-date" type="date" className="form-input" required
                min={isEdit ? undefined : todayISO()} value={eventForm.date} onChange={set("date")} />
            </div>
            <div>
              <label className="form-label" htmlFor="ev-start">Empieza</label>
              <input id="ev-start" type="time" className="form-input" value={eventForm.start_time} onChange={set("start_time")} />
            </div>
            <div>
              <label className="form-label" htmlFor="ev-end">Termina</label>
              <input id="ev-end" type="time" className="form-input" value={eventForm.end_time} onChange={set("end_time")} />
            </div>
          </div>

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
            <label className="form-label" htmlFor="ev-description">Descripción</label>
            <textarea id="ev-description" name="description" className="form-textarea" maxLength={5000}
              placeholder="¿Qué plan ofreces? Música, promociones, dress code..." value={eventForm.description} onChange={set("description")} />
          </div>
        </div>

        <div>
          <span className="form-label">Portada</span>
          <label
            htmlFor="ev-cover"
            className="group relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-canvas text-center transition hover:border-accent/50"
          >
            {currentCover ? (
              <>
                <img src={currentCover} alt="Portada actual" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-1.5 text-xs font-medium opacity-0 shadow-soft transition group-hover:opacity-100">
                  Cambiar imagen
                </span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted transition group-hover:text-accent" />
                <span className="mt-2 text-sm font-medium">Sube una imagen</span>
                <span className="mt-0.5 text-xs text-muted">JPG, PNG, WEBP o GIF · máx. 5 MB</span>
              </>
            )}
          </label>
          <input id="ev-cover" ref={coverInputRef} type="file" accept={ACCEPTED_IMAGES} className="sr-only" onChange={handleCover} />
          {coverFile && (
            <button type="button" onClick={clearCover} className="btn-ghost btn-sm mt-2 text-muted">
              <X className="h-3.5 w-3.5" />
              Quitar imagen nueva
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-5 lg:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar evento"}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateEventForm;
