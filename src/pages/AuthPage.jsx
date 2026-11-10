import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Store, Compass, Sparkles, CalendarHeart, MapPinned, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/events';
import useDocumentTitle from '@/lib/useDocumentTitle';

const MIN_PASSWORD = 8;
const SIDE_IMAGE = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=70';

const ACCOUNT_TYPES = [
  { id: 'cliente', label: 'Busco planes', hint: 'Cliente', Icon: Compass },
  { id: 'comerciante', label: 'Tengo un local', hint: 'Comerciante', Icon: Store },
];

const Field = ({ label, icon: Icon, children, hint }) => (
  <div>
    <label className="form-label">{label}</label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      {children}
    </div>
    {hint && <p className="form-hint">{hint}</p>}
  </div>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', businessName: '', confirmPassword: '' });
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  useDocumentTitle(isLogin ? 'Iniciar sesión' : 'Crear cuenta');

  const handleInputChange = (e) => setFormData((f) => ({ ...f, [e.target.name]: e.target.value }));

  const switchMode = () => {
    setIsLogin((v) => !v);
    setFormData({ email: '', password: '', name: '', businessName: '', confirmPassword: '' });
  };

  // Al tener sesión, la ruta /auth redirige sola (ver GuestOnlyRoute en App.jsx).
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', className: 'error-toast' });
      return;
    }

    try {
      setSubmitting(true);
      if (isLogin) {
        await signIn(formData.email.trim(), formData.password);
        toast({ title: '¡Bienvenido de vuelta!', className: 'success-toast' });
      } else {
        await signUp({
          email: formData.email.trim(),
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          type: userType,
          name: formData.name.trim(),
          businessName: formData.businessName.trim(),
        });
        toast({
          title: '¡Cuenta creada!',
          description: userType === 'comerciante'
            ? 'Registra tu local para empezar a publicar eventos.'
            : 'Ya puedes descubrir planes cerca de ti.',
          className: 'success-toast',
        });
      }
    } catch (error) {
      toast({
        title: isLogin ? 'No se pudo iniciar sesión' : 'No se pudo crear la cuenta',
        description: isLogin && error?.status === 400 ? 'Email o contraseña incorrectos.' : errorMessage(error),
        className: 'error-toast',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page py-6 sm:py-10">
      <div className="grid overflow-hidden rounded-[28px] border border-line bg-white shadow-lift lg:grid-cols-2">
        {/* Lado visual (solo escritorio) */}
        <div className="relative hidden min-h-[640px] bg-ink lg:block">
          <img src={SIDE_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Gratis para siempre
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight">
              Sal de casa con el <span className="text-accent">plan hecho.</span>
            </h2>
            <ul className="mt-6 space-y-3 text-white/80">
              <li className="flex items-center gap-3"><CalendarHeart className="h-5 w-5 text-accent" /> Directos, DJ, tardeo y mucho más</li>
              <li className="flex items-center gap-3"><MapPinned className="h-5 w-5 text-accent" /> Los locales de tu ciudad en un solo sitio</li>
              <li className="flex items-center gap-3"><Store className="h-5 w-5 text-accent" /> ¿Tienes un bar? Publica tus eventos</li>
            </ul>
          </div>
        </div>

        {/* Formulario */}
        <div className="flex items-center px-6 py-10 sm:px-12">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl font-extrabold">{isLogin ? 'Hola de nuevo' : 'Crea tu cuenta'}</h1>
            <p className="mt-2 text-muted">
              {isLogin ? 'Inicia sesión para ver todos los planes.' : 'Tardas menos de un minuto.'}
            </p>

            {!isLogin && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1.5" role="radiogroup" aria-label="Tipo de cuenta">
                {ACCOUNT_TYPES.map(({ id, label, hint, Icon }) => {
                  const active = userType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setUserType(id)}
                      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition ${
                        active ? 'bg-white text-ink shadow-soft ring-1 ring-line' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-accent' : ''}`} />
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-[11px] opacity-70">{hint}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {!isLogin && (
                <Field label={userType === 'comerciante' ? 'Nombre del responsable' : 'Tu nombre'} icon={User}>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="form-input pl-10" placeholder="Nombre" maxLength={100} autoComplete="name" required />
                </Field>
              )}

              {!isLogin && userType === 'comerciante' && (
                <Field label="Nombre del local" icon={Store}>
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange}
                    className="form-input pl-10" placeholder="Bar La Esquina" maxLength={100} autoComplete="organization" required />
                </Field>
              )}

              <Field label="Email" icon={Mail}>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                  className="form-input pl-10" placeholder="tu@email.com" autoComplete="email" required />
              </Field>

              <Field label="Contraseña" icon={Lock} hint={!isLogin ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pl-10 pr-11"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={isLogin ? undefined : MIN_PASSWORD}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-canvas hover:text-ink"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {!isLogin && (
                <Field label="Repite la contraseña" icon={Lock}>
                  <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleInputChange} className="form-input pl-10" placeholder="••••••••"
                    autoComplete="new-password" minLength={MIN_PASSWORD} required />
                </Field>
              )}

              <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Un momento...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button type="button" onClick={switchMode} className="ml-1.5 font-semibold text-accent hover:underline">
                {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
