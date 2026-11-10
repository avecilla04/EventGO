
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Calendar, Eye, EyeOff, Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/events';
import useDocumentTitle from '@/lib/useDocumentTitle';

const MIN_PASSWORD = 8;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    confirmPassword: ''
  });
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();

  useDocumentTitle(isLogin ? 'Iniciar sesión' : 'Crear cuenta');

  // Al tener sesión, la ruta /auth redirige sola (ver GuestOnlyRoute en App.jsx).
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "❌ Las contraseñas no coinciden",
        className: "error-toast",
      });
      return;
    }

    try {
      setSubmitting(true);
      if (isLogin) {
        await signIn(formData.email.trim(), formData.password);
        toast({ title: "🎉 ¡Bienvenido de vuelta!", className: "success-toast" });
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
          title: "🎉 ¡Cuenta creada!",
          description: userType === 'comerciante'
            ? "Registra tu local para empezar a publicar eventos."
            : "Ya puedes descubrir planes cerca de ti.",
          className: "success-toast",
        });
      }
    } catch (error) {
      toast({
        title: isLogin ? "❌ No se pudo iniciar sesión" : "❌ No se pudo crear la cuenta",
        description: isLogin && error?.status === 400
          ? "Email o contraseña incorrectos."
          : errorMessage(error),
        className: "error-toast",
      });
    } finally {
      setSubmitting(false);
    }
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 auth-container">
        <div className="max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="auth-card"
          >
            <div className="text-center mb-8">
              <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {isLogin ? 'Bienvenido de vuelta' : 'Únete a EventGo'}
              </h1>
              <p className="text-slate-500">
                {isLogin 
                  ? 'Inicia sesión para descubrir eventos únicos' 
                  : 'Crea tu cuenta y comienza a explorar'
                }
              </p>
            </div>

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <label className="block text-sm font-medium text-slate-700 mb-3">Tipo de cuenta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('cliente')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      userType === 'cliente' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="h-5 w-5 mx-auto mb-2" />
                    <div className="text-sm font-semibold">Cliente</div>
                    <div className="text-xs opacity-80">Descubrir eventos</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('comerciante')}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      userType === 'comerciante' 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="h-5 w-5 mx-auto mb-2" />
                    <div className="text-sm font-semibold">Comerciante</div>
                    <div className="text-xs opacity-80">Organizar eventos</div>
                  </button>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {userType === 'comerciante' ? 'Nombre del responsable' : 'Nombre completo'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {!isLogin && userType === 'comerciante' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del negocio</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="Nombre de tu local o empresa"
                      required
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={isLogin ? undefined : MIN_PASSWORD}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Mínimo {MIN_PASSWORD} caracteres.</p>
                </motion.div>
              )}

              <Button type="submit" disabled={submitting} className="btn-primary w-full !py-3 !text-base">
                {submitting ? 'Un momento...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ email: '', password: '', name: '', businessName: '', confirmPassword: '' });
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
