"use client";

import { useState } from 'react';
import { Mail, ArrowRight, Check, Loader2 } from 'lucide-react';

export default function NewsletterFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        try {
          localStorage.setItem('sophia_subscribed', 'true');
        } catch {
          // localStorage not available
        }
      } else {
        setError(data.error || 'Error al suscribirte');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-8 h-8 rounded-full bg-[#C4B590]/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-[#C4B590]" />
        </div>
        <p className="text-sm text-[#C4B590]">¡Gracias por suscribirte! Revisa tu email 🌿</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-[#C4B590]/60" />
        <p className="text-sm text-[#d4cdc0]/80">
          Recibe novedades y un <span className="text-[#C4B590] font-medium">10% de descuento</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email"
          required
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C4B590]/40"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C4B590] hover:bg-[#b5a680] text-[#1a1d19] px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
