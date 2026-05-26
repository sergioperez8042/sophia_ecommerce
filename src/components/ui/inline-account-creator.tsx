'use client';

import { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Check, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { GestorAccountService } from '@/lib/firestore-services';
import { generateGestorPassword } from '@/lib/random-password';
import type { IGestor } from '@/entities/all';

/**
 * CTA inline para crear/reparar la cuenta de un gestor desde la card de
 * la lista. Sustituye al badge estático "Sin cuenta" — al click se
 * expande en un mini-form con email + password + Generar, que llama al
 * server-side `/api/managers/create-account` (Firebase Admin SDK).
 *
 * Por qué: el flow viejo obligaba al admin a entrar al form completo de
 * edición del gestor, marcar manualmente el checkbox "Crear cuenta" y
 * meter password. Demasiados pasos para algo que es básicamente
 * "vincular email+password a este gestor". Aquí lo hace en sitio.
 *
 * Solo se renderiza cuando `gestor.userId` está vacío. Si el gestor ya
 * tiene cuenta, el padre dibuja un badge estático "Con cuenta" — este
 * componente devuelve `null`.
 */

interface InlineAccountCreatorProps {
  gestor: IGestor;
  /** Llamado tras un crear-cuenta exitoso (e.g. para refresh manual; el
   * listener de Firestore ya actualiza la lista automáticamente, pero
   * dejamos el callback por si el padre necesita hacer algo más). */
  onSuccess?: () => void;
}

export default function InlineAccountCreator({ gestor, onSuccess }: InlineAccountCreatorProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(gestor.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (gestor.userId) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        title="Crear cuenta de acceso para este gestor"
      >
        <UserPlus className="w-3 h-3" />
        Sin cuenta — Crear acceso
      </button>
    );
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = !submitting && isValidEmail && password.length >= 6;

  const handleSubmit = async () => {
    if (!isValidEmail) {
      toast.error('Email inválido. Verifica el formato (nombre@email.com).');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      await GestorAccountService.createAccount({
        email: email.trim(),
        password,
        name: gestor.name,
        gestorId: gestor.id,
      });
      toast.success(`Cuenta creada para ${gestor.name}`, {
        description: `Email: ${email.trim()} — Pásale las credenciales al gestor.`,
        duration: 8000,
      });
      setOpen(false);
      setPassword('');
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al crear cuenta: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 rounded-lg p-3 space-y-2 max-w-md">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <UserPlus className="w-3.5 h-3.5" />
          Crear cuenta de acceso
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="p-0.5 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-40"
          aria-label="Cancelar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative">
        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="gestor@email.com"
          disabled={submitting}
          className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-amber-200 dark:border-amber-800/40 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#505A4A]/30 focus:border-[#505A4A] disabled:opacity-60"
        />
      </div>

      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            disabled={submitting}
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-amber-200 dark:border-amber-800/40 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#505A4A]/30 focus:border-[#505A4A] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            disabled={submitting}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-40"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPassword(generateGestorPassword())}
          disabled={submitting}
          className="text-[11px] px-2.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 font-medium transition-colors"
        >
          Generar
        </button>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#505A4A] text-white text-xs font-medium hover:bg-[#414A3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Creando...
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" />
            Crear cuenta
          </>
        )}
      </button>
    </div>
  );
}
