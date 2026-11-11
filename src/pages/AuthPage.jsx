import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEGAL } from '@/lib/legal';
import { User, Mail, Lock, Eye, EyeOff, Store, Compass, Sparkles, CalendarHeart, MapPinned, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/events';
import useDocumentTitle from '@/lib/useDocumentTitle';

const MIN_PASSWORD = 8;
const SIDE_IMAGE = '/img/auth.webp';

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

/** Pide el email y envía el enlace para elegir una contraseña nueva (página /restablecer). */
const ForgotPassword = ({ initialEmail, onBack }) => {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setSending(false);
    // Por seguridad no se revela si el email existe: se muestra lo mismo en ambos casos.
    if (error && /rate limit|too many/i.test(error.message)) {
      toast({ title: 'Demasiados intentos', description: 'Espera unos minutos y vuelve a probar.', className: 'error-toast' });
      return;
    }
    setSent(true);
  };

  return (
    <>
      <button type="button" onClick={onBack} className="btn-ghost btn-sm -ml-3 text-muted">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      {sent ? (
        <div className="mt-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft">
            <MailCheck className="h-6 w-6 text-accent" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold">Revisa tu email</h1>
          <p className="mt-2 text-muted">
            Si existe una cuenta con <strong className="text-ink">{email}</strong>, te hemos enviado un enlace para
            elegir una contraseña nueva. Mira también en la carpeta de spam.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-3xl font-extrabold">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-muted">Escribe tu email y te enviaremos un enlace para crear una nueva.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email" icon={Mail}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name="reset-email"
                className="form-input pl-10" placeholder="tu@email.com" autoComplete="email" required />
            </Field>
            <button type="submit" disabled={sending} className="btn-primary btn-lg w-full">
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar enlace
            </button>
          </form>
        </>
      )}
    </>
  );
};

const AuthPage = () => {
  const location = useLocation();
  // Desde el QR de un local se abre directamente en "Crear cuenta".
  const [isLogin, setIsLogin] = useState(location.state?.mode !== 'signup');
  const [forgot, setForgot] = useState(false);
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
        const { needsConfirmation } = await signUp({
          email: formData.email.trim(),
          password: formData.password,
          type: userType,
          name: formData.name.trim(),
          businessName: formData.businessName.trim(),
        });
        if (needsConfirmation) {
          toast({
            title: 'Revisa tu email',
            description: 'Te hemos enviado un enlace para confirmar la cuenta.',
            className: 'info-toast',
            duration: 10000,
          });
          setIsLogin(true);
          return;
        }
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
        description: errorMessage(error),
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
            {forgot ? (
              <ForgotPassword initialEmail={formData.email} onBack={() => setForgot(false)} />
            ) : (
            <>
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
              {isLogin && (
                <div className="-mt-2 text-right">
                  <button type="button" onClick={() => setForgot(true)} className="text-sm font-medium text-muted hover:text-accent">
                    ¿Has olvidado tu contraseña?
                  </button>
                </div>
              )}

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
              {!isLogin && (
                <p className="text-center text-xs leading-relaxed text-muted">
                  Al crear una cuenta confirmas que tienes {LEGAL.minimumAge} años o más y aceptas la{' '}
                  <Link to="/privacidad" target="_blank" className="font-semibold text-ink underline-offset-2 hover:underline">
                    política de privacidad
                  </Link>
                  .
                </p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button type="button" onClick={switchMode} className="ml-1.5 font-semibold text-accent hover:underline">
                {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
