"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, MapPin, Briefcase, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuth, RegisterData } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

type AuthMode = 'login' | 'register' | 'reset';
type UserType = 'client' | 'manager';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, resetPassword, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    zone: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setIsLoading(true);
    setError(null);
    const registerData: RegisterData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: userType,
      ...(userType === 'manager' && { zone: formData.zone }),
    };
    const result = await register(registerData);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Error al registrarse');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResetSuccess(false);
    const result = await resetPassword(formData.email);
    if (result.success) {
      setResetSuccess(true);
    } else {
      setError(result.error || 'Error al enviar el email');
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', zone: '' });
    setUserType(null);
    setError(null);
    setResetSuccess(false);
  };

  const inputClass = "w-full h-12 pl-11 pr-4 bg-[#f8f7f4] border border-[#e8e5df] rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#505A4A] focus:ring-1 focus:ring-[#505A4A]/20 transition-colors";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#505A4A]/40";

  return (
    <div className="min-h-screen bg-[#FEFCF7] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <BrandLogo size="lg" showText linkTo="/" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df]/60 p-7">
          {/* Tabs */}
          {mode !== 'reset' && (
            <div className="flex gap-1 mb-7">
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-[#505A4A] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-[#505A4A] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* LOGIN */}
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className={iconClass} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Contraseña"
                    className={`${inputClass} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>

                {error && (
                  <p className="text-red-600 text-xs text-center py-2 px-3 bg-red-50 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#505A4A] hover:bg-[#434d3e] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(null); setResetSuccess(false); }}
                  className="w-full text-xs text-[#505A4A]/70 hover:text-[#505A4A] transition-colors pt-1"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </motion.form>
            )}

            {/* RESET PASSWORD */}
            {mode === 'reset' && (
              <motion.form
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetForm(); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#505A4A] transition-colors mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>

                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Restablecer contraseña</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ingresa tu email y recibirás un enlace para crear una nueva contraseña.
                  </p>
                </div>

                <div className="relative">
                  <Mail className={iconClass} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className={inputClass}
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-xs text-center py-2 px-3 bg-red-50 rounded-lg">{error}</p>
                )}

                {resetSuccess && (
                  <p className="text-[#505A4A] text-xs text-center py-3 px-3 bg-[#505A4A]/5 rounded-lg">
                    Email enviado. Revisa tu bandeja de entrada.
                  </p>
                )}

                {!resetSuccess && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#505A4A] hover:bg-[#434d3e] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                )}
              </motion.form>
            )}

            {/* REGISTER */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {!userType && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center mb-4">Selecciona tu tipo de cuenta</p>

                    <button
                      type="button"
                      onClick={() => setUserType('client')}
                      className="w-full flex items-center gap-4 p-4 border border-[#e8e5df] rounded-xl hover:border-[#505A4A]/40 hover:bg-[#505A4A]/[0.02] transition-all"
                    >
                      <div className="w-11 h-11 bg-[#505A4A]/8 rounded-full flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-[#505A4A]" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-800">Cliente</h4>
                        <p className="text-xs text-gray-500">Compra productos para uso personal</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType('manager')}
                      className="w-full flex items-center gap-4 p-4 border border-[#e8e5df] rounded-xl hover:border-[#505A4A]/40 hover:bg-[#505A4A]/[0.02] transition-all"
                    >
                      <div className="w-11 h-11 bg-[#505A4A]/8 rounded-full flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-[#505A4A]" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-gray-800">Gestor / Distribuidor</h4>
                        <p className="text-xs text-gray-500">Precios especiales para reventa</p>
                      </div>
                    </button>
                  </div>
                )}

                {userType && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleRegister}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        onClick={() => setUserType(null)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#505A4A] transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Atrás
                      </button>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#505A4A]/8 text-[#505A4A]">
                        {userType === 'manager' ? 'Gestor' : 'Cliente'}
                      </span>
                    </div>

                    <div className="relative">
                      <User className={iconClass} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Nombre completo"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Mail className={iconClass} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div className="relative">
                      <Phone className={iconClass} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Teléfono"
                        className={inputClass}
                      />
                    </div>

                    {userType === 'manager' && (
                      <div className="relative">
                        <MapPin className={iconClass} />
                        <input
                          type="text"
                          name="zone"
                          value={formData.zone}
                          onChange={handleInputChange}
                          placeholder="Zona de trabajo"
                          className={inputClass}
                          required
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Lock className={iconClass} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Contraseña (mín. 6 caracteres)"
                        className={`${inputClass} pr-11`}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>

                    {error && (
                      <p className="text-red-600 text-xs text-center py-2 px-3 bg-red-50 rounded-lg">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-[#505A4A] hover:bg-[#434d3e] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isLoading ? 'Registrando...' : 'Crear cuenta'}
                    </button>
                  </motion.form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Al continuar, aceptas nuestros{' '}
          <Link href="/terms" className="text-gray-500 hover:text-[#505A4A]">Términos</Link>
          {' '}y{' '}
          <Link href="/privacy" className="text-gray-500 hover:text-[#505A4A]">Privacidad</Link>
        </p>
      </motion.div>
    </div>
  );
}
