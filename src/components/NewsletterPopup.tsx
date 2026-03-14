"use client";

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { m, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, Loader2 } from 'lucide-react';

const STORAGE_KEYS = {
  subscribed: 'sophia_subscribed',
  dismissed: 'sophia_popup_dismissed',
};

const DISMISS_DAYS = 7;

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Don't show if already subscribed
    if (localStorage.getItem(STORAGE_KEYS.subscribed)) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEYS.dismissed);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    let scrollTriggered = false;
    let timeTriggered = false;

    const checkAndShow = () => {
      if (scrollTriggered && timeTriggered) {
        setIsOpen(true);
      }
    };

    // Time trigger: 8 seconds
    const timer = setTimeout(() => {
      timeTriggered = true;
      checkAndShow();
    }, 8000);

    // Scroll trigger: 40% of page
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.4) {
        scrollTriggered = true;
        checkAndShow();
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEYS.dismissed, Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup' }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        localStorage.setItem(STORAGE_KEYS.subscribed, 'true');
      } else {
        setError(data.error || 'Error al suscribirte');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <m.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <m.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-[#1a1d19] border border-[#C4B590]/20 rounded-2xl p-6 sm:p-8 relative shadow-2xl">
                  {/* Close button */}
                  <Dialog.Close asChild>
                    <button
                      onClick={handleDismiss}
                      className="absolute top-4 right-4 text-[#C4B590]/50 hover:text-[#C4B590] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>

                  {!isSuccess ? (
                    <>
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#C4B590]/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-[#C4B590]" />
                      </div>

                      {/* Title */}
                      <Dialog.Title className="text-xl font-semibold text-[#C4B590] mb-2">
                        10% de descuento en tu primer pedido
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-[#d4cdc0]/80 mb-6 leading-relaxed">
                        Suscríbete a nuestro boletín y recibe un código de descuento exclusivo,
                        además de tips de belleza natural.
                      </Dialog.Description>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B590]/40" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Tu email"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-[#C4B590]/20 rounded-xl text-[#e8e0d0] placeholder-[#C4B590]/30 text-sm focus:outline-none focus:border-[#C4B590]/50"
                          />
                        </div>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-[#C4B590] hover:bg-[#b5a680] text-[#1a1d19] py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Suscribirme'
                          )}
                        </button>
                      </form>

                      <p className="text-xs text-[#C4B590]/60 text-center mt-4">
                        Sin spam. Solo lo mejor para tu piel.
                      </p>
                    </>
                  ) : (
                    /* Success state */
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-[#C4B590]/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-7 h-7 text-[#C4B590]" />
                      </div>
                      <Dialog.Title className="text-xl font-semibold text-[#C4B590] mb-2">
                        ¡Listo! Revisa tu email 🌿
                      </Dialog.Title>
                      <p className="text-sm text-[#d4cdc0]/80 mb-4">
                        Tu código de descuento:
                      </p>
                      <div className="bg-[#2a2d25] border border-[#C4B590]/30 rounded-xl py-3 px-6 inline-block">
                        <span className="text-2xl font-bold text-[#C4B590] tracking-widest">BIENVENIDA10</span>
                      </div>
                      <p className="text-xs text-[#C4B590]/60 mt-4">10% de descuento en tu primer pedido</p>
                    </div>
                  )}
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
