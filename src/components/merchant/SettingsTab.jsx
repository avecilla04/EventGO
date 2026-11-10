import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbase';
import { errorMessage } from '@/lib/events';

const SettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: user.name || '', business_name: user.business_name || '' });
  const [saving, setSaving] = useState(false);

  const dirty = form.name !== (user.name || '') || form.business_name !== (user.business_name || '');

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      // El SDK actualiza la sesión con los datos nuevos automáticamente.
      await pb.collection('users').update(user.id, {
        name: form.name.trim(),
        business_name: form.business_name.trim(),
      });
      toast({ title: 'Perfil actualizado', className: 'success-toast' });
    } catch (err) {
      toast({ title: 'No se pudo guardar', description: errorMessage(err), className: 'error-toast' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <h2 className="section-title">Perfil</h2>

      <form onSubmit={handleSave} className="panel max-w-2xl">
        <h3 className="mb-6 font-display text-xl font-semibold">Datos de tu cuenta</h3>
        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="s-name">Nombre del responsable</label>
            <input id="s-name" type="text" className="form-input" maxLength={100}
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="s-business">Nombre del negocio</label>
            <input id="s-business" type="text" className="form-input" maxLength={100}
              value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="s-email">Email</label>
            <input id="s-email" type="email" className="form-input opacity-70" value={user.email || ''} disabled />
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary" disabled={saving || !dirty}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default SettingsTab;
