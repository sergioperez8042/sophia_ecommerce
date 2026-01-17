"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Leaf, User, Mail, Phone, Lock, MapPin, Briefcase, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, RegisterData } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AuthMode = 'login' | 'register';
type UserType = 'client' | 'manager';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    zone: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', zone: '' });
    setUserType(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A6741]/10 via-white to-[#4A6741]/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <motion.div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#4A6741] to-[#3F5D4C] flex items-center justify-center shadow-lg relative overflow-hidden"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 25px rgba(74, 103, 65, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Anillo giratorio */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ borderStyle: "dashed" }}
              />
              {/* Brillo que pasa */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.img
                src="/images/logo_hand2.png"
                alt="Sophia"
                className="w-11 h-11 object-contain relative z-10"
                animate={{ 
                  y: [0, -2, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </motion.div>
            <motion.div 
              className="text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.h1 
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: 'Cinzel, serif' }}
                whileHover={{ color: "#4A6741" }}
              >
                Sophia
              </motion.h1>
              <motion.p 
                className="text-sm text-[#4A6741] font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Cosmética Natural
              </motion.p>
            </motion.div>
          </Link>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            {/* Tabs */}
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all ${mode === 'login'
                  ? 'bg-white text-[#4A6741] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); resetForm(); }}
                className={`flex-1 py-2.5 rounded-md font-medium transition-all ${mode === 'register'
                  ? 'bg-white text-[#4A6741] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Registrarse
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* LOGIN */}
              {mode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm text-center bg-red-50 p-2 rounded"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white py-6"
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </motion.form>
              )}

              {/* REGISTER */}
              {mode === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Step 1: Choose user type */}
                  {!userType && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
                        ¿Cómo deseas registrarte?
                      </h3>

                      <motion.button
                        type="button"
                        onClick={() => setUserType('client')}
                        className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-[#4A6741] hover:bg-[#4A6741]/5 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-[#4A6741]/20">
                            <ShoppingBag className="w-7 h-7 text-blue-600 group-hover:text-[#4A6741]" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900">Cliente</h4>
                            <p className="text-sm text-gray-500">Quiero comprar productos para uso personal</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => setUserType('manager')}
                        className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-[#4A6741] hover:bg-[#4A6741]/5 transition-all group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-[#4A6741]/20">
                            <Briefcase className="w-7 h-7 text-amber-600 group-hover:text-[#4A6741]" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900">Gestor / Distribuidor</h4>
                            <p className="text-sm text-gray-500">Quiero vender productos con precios especiales</p>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  )}

                  {/* Step 2: Registration form */}
                  {userType && (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setUserType(null)}
                        className="text-sm text-gray-500 hover:text-[#4A6741] mb-2"
                      >
                        ← Cambiar tipo de cuenta
                      </button>

                      {/* Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${userType === 'manager'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {userType === 'manager' ? (
                          <><Briefcase className="w-4 h-4" /> Registro de Gestor</>
                        ) : (
                          <><ShoppingBag className="w-4 h-4" /> Registro de Cliente</>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Tu nombre"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="tu@email.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+34 600 000 000"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Zone field for managers */}
                      {userType === 'manager' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zona de trabajo
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                              type="text"
                              name="zone"
                              value={formData.zone}
                              onChange={handleInputChange}
                              placeholder="Ej: Madrid Centro"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Mínimo 6 caracteres"
                            className="pl-10 pr-10"
                            minLength={6}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {userType === 'manager' && (
                        <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
                          <p className="font-medium">Beneficios de gestor:</p>
                          <ul className="list-disc list-inside mt-1 text-amber-700">
                            <li>Precios especiales con hasta 33% de descuento</li>
                            <li>Panel de control con tus estadísticas</li>
                            <li>Historial de pedidos y comisiones</li>
                          </ul>
                        </div>
                      )}

                      {error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm text-center bg-red-50 p-2 rounded"
                        >
                          {error}
                        </motion.p>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#4A6741] hover:bg-[#3F5D4C] text-white py-6"
                      >
                        {isLoading ? 'Registrando...' : 'Crear cuenta'}
                      </Button>
                    </motion.form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Al continuar, aceptas nuestros{' '}
          <Link href="#" className="text-[#4A6741] hover:underline">Términos de servicio</Link>
          {' '}y{' '}
          <Link href="#" className="text-[#4A6741] hover:underline">Política de privacidad</Link>
        </p>
      </motion.div>
    </div>
  );
}
