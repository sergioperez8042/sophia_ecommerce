"use client";

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, MapPin, Briefcase, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAuth, RegisterData } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, resetPasswordSchema, type LoginFormData, type ResetPasswordFormData } from '@/lib/validations';
import type { z } from 'zod';
import { toast } from 'sonner';

type AuthMode = 'login' | 'register' | 'reset';
type UserType = 'client' | 'manager';
type RegisterInput = z.input<typeof registerSchema>;

export default function AuthPage() {
  const router = useRouter();
  const { login, register, resetPassword, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', zone: '' },
  });

  const resetPwForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'manager') {
        router.push('/gestor');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated) {
    return null;
  }

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const result = await login(data.email, data.password);
    if (result.success) {
      // Redirect will happen via the useEffect when user state updates
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
    setIsLoading(false);
  };

  const onRegister = async (data: RegisterInput) => {
    if (!userType) return;
    if (userType === 'manager' && !data.zone?.trim()) {
      registerForm.setError('zone', { message: 'La zona de trabajo es requerida' });
      return;
    }
    setIsLoading(true);
    const registerData: RegisterData = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || '',
      role: userType,
      ...(userType === 'manager' && { zone: data.zone }),
    };
    const result = await register(registerData);
    if (result.success) {
      // Redirect will happen via the useEffect when user state updates
    } else {
      toast.error(result.error || 'Error al registrarse');
    }
    setIsLoading(false);
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setResetSuccess(false);
    const result = await resetPassword(data.email);
    if (result.success) {
      setResetSuccess(true);
    } else {
      toast.error(result.error || 'Error al enviar el email');
    }
    setIsLoading(false);
  };

  const resetAllForms = () => {
    loginForm.reset();
    registerForm.reset();
    resetPwForm.reset();
    setUserType(null);
    setResetSuccess(false);
  };

  const inputClass = (hasError?: boolean) =>
    `w-full h-12 pl-11 pr-4 bg-[#f8f7f4] border ${hasError ? 'border-red-400' : 'border-[#e8e5df]'} rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#505A4A] focus:ring-1 focus:ring-[#505A4A]/20 transition-colors`;
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#505A4A]/40";

  return (
    <div className="min-h-screen bg-[#FEFCF7] flex flex-col items-center justify-center px-4 py-12">
      <m.div
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
                onClick={() => { setMode('login'); resetAllForms(); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-[#505A4A] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); resetAllForms(); }}
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
              <m.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <div>
                  <div className="relative">
                    <Mail className={iconClass} />
                    <input
                      type="email"
                      placeholder="Email"
                      className={inputClass(!!loginForm.formState.errors.email)}
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && <p className="text-xs text-red-500 mt-1 pl-11">{loginForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className={iconClass} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Contraseña"
                      className={`${inputClass(!!loginForm.formState.errors.password)} pr-11`}
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && <p className="text-xs text-red-500 mt-1 pl-11">{loginForm.formState.errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#505A4A] hover:bg-[#434d3e] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('reset'); setResetSuccess(false); }}
                  className="w-full text-xs text-[#505A4A]/70 hover:text-[#505A4A] transition-colors pt-1"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </m.form>
            )}

            {/* RESET PASSWORD */}
            {mode === 'reset' && (
              <m.form
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={resetPwForm.handleSubmit(onResetPassword)}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetAllForms(); }}
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

                <div>
                  <div className="relative">
                    <Mail className={iconClass} />
                    <input
                      type="email"
                      placeholder="Email"
                      className={inputClass(!!resetPwForm.formState.errors.email)}
                      {...resetPwForm.register('email')}
                    />
                  </div>
                  {resetPwForm.formState.errors.email && <p className="text-xs text-red-500 mt-1 pl-11">{resetPwForm.formState.errors.email.message}</p>}
                </div>

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
              </m.form>
            )}

            {/* REGISTER */}
            {mode === 'register' && (
              <m.div
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
                  <m.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={registerForm.handleSubmit(onRegister)}
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

                    <div>
                      <div className="relative">
                        <User className={iconClass} />
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          className={inputClass(!!registerForm.formState.errors.name)}
                          {...registerForm.register('name')}
                        />
                      </div>
                      {registerForm.formState.errors.name && <p className="text-xs text-red-500 mt-1 pl-11">{registerForm.formState.errors.name.message}</p>}
                    </div>

                    <div>
                      <div className="relative">
                        <Mail className={iconClass} />
                        <input
                          type="email"
                          placeholder="Email"
                          className={inputClass(!!registerForm.formState.errors.email)}
                          {...registerForm.register('email')}
                        />
                      </div>
                      {registerForm.formState.errors.email && <p className="text-xs text-red-500 mt-1 pl-11">{registerForm.formState.errors.email.message}</p>}
                    </div>

                    <div>
                      <div className="relative">
                        <Phone className={iconClass} />
                        <input
                          type="tel"
                          placeholder="Teléfono"
                          className={inputClass(!!registerForm.formState.errors.phone)}
                          {...registerForm.register('phone')}
                        />
                      </div>
                      {registerForm.formState.errors.phone && <p className="text-xs text-red-500 mt-1 pl-11">{registerForm.formState.errors.phone.message}</p>}
                    </div>

                    {userType === 'manager' && (
                      <div>
                        <div className="relative">
                          <MapPin className={iconClass} />
                          <input
                            type="text"
                            placeholder="Zona de trabajo"
                            className={inputClass(!!registerForm.formState.errors.zone)}
                            {...registerForm.register('zone')}
                          />
                        </div>
                        {registerForm.formState.errors.zone && <p className="text-xs text-red-500 mt-1 pl-11">{registerForm.formState.errors.zone.message}</p>}
                      </div>
                    )}

                    <div>
                      <div className="relative">
                        <Lock className={iconClass} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña (mín. 6 caracteres)"
                          className={`${inputClass(!!registerForm.formState.errors.password)} pr-11`}
                          {...registerForm.register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && <p className="text-xs text-red-500 mt-1 pl-11">{registerForm.formState.errors.password.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-[#505A4A] hover:bg-[#434d3e] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {isLoading ? 'Registrando...' : 'Crear cuenta'}
                    </button>
                  </m.form>
                )}
              </m.div>
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
      </m.div>
    </div>
  );
}
