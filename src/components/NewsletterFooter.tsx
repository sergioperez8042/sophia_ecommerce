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
        <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-[#C9A96E]" />
        </div>
        <p className="text-sm text-[#C9A96E]">¡Gracias por suscribirte! Revisa tu email 🌿</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-[#C9A96E]/60" />
        <p className="text-sm text-[#d4cdc0]/80">
          Recibe novedades y un <span className="text-[#C9A96E] font-medium">10% de descuento</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* bg/border subidos (10% → 15%/25%) para que el input sea claramente
            visible sobre el fondo verde oscuro del footer. Placeholder al 55%
            para cumplir el contraste 4.5:1 mínimo. */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu email"
          required
          aria-label="Email para suscribirte al newsletter"
          className="flex-1 min-w-0 min-h-[44px] px-4 py-2.5 bg-white/15 border border-white/25 rounded-xl text-white placeholder-white/55 text-base sm:text-sm focus:outline-none focus:border-[#C9A96E]/60 focus:bg-white/20 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          aria-label="Suscribirme al newsletter"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-[#C9A96E] hover:bg-[#b5a680] text-[#15241B] px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
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
