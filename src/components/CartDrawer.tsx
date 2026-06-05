"use client";

import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, MessageCircle, Trash2, AlertTriangle, MapPin, FileText, Loader2 } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useCart } from '@/store/CartContext';
import { useLocation } from '@/store/LocationContext';
import { useTheme } from '@/store/ThemeContext';
import { createOrderViaServer } from '@/lib/order-client';
import { generateOrderPdf } from '@/lib/order-pdf';
import { buildOrderMessage } from '@/lib/whatsapp-message';
import { sendOrderViaWhatsApp, generateOrderFileName } from '@/lib/order-share';
import { useGestorByLocation } from '@/hooks/useGestorByLocation';
import { IOrderItem } from '@/entities/all';
import ProductImage from '@/components/ui/product-image';
import LocationPopup from '@/components/LocationPopup';
import { toast } from 'sonner';

const WHATSAPP_GENERAL = "34642633982";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, totalItems, subtotal } = useCart();
  const { location } = useLocation();
  const { isDark } = useTheme();
  // Resolución asíncrona del gestor que cubre la ubicación.
  // El hook encapsula el cancellation token y el contrato de findByLocation
  // (sin fallback al municipio cuando hay consejo no cubierto).
  const { gestor, loading: gestorLoading } = useGestorByLocation(location);

  const [noGestorMessage, setNoGestorMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  // PDF del pedido — diseño profesional de marca centralizado en
  // src/lib/order-pdf.ts (compartido con /cart, sin duplicación).
  const buildOrderPdf = () =>
    generateOrderPdf({
      items: items.map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      subtotal,
      customerName,
      customerPhone,
      customerEmail,
      province: location?.province,
      municipality: location?.municipality,
      gestor,
      notes: orderNotes,
    });

  // Construye el mensaje rico que recibe el gestor por WhatsApp.
  // Incluye datos del cliente, lista del pedido y total — así el gestor
  // tiene la info esencial aunque el PDF no llegue (fallback de navegador
  // viejo sin Web Share API L2, o si el cliente olvida adjuntarlo).
  // Usa la sintaxis Markdown de WhatsApp: *negrita* con asteriscos.
  // Construcción del mensaje delegada a `buildOrderMessage` (helper compartido
  // entre CartDrawer y app/cart/page). Antes este código vivía duplicado.
  const renderOrderMessage = (): string =>
    buildOrderMessage({
      gestorName: gestor?.name,
      customerName,
      customerPhone,
      customerEmail,
      municipality: location?.municipality,
      province: location?.province,
      items: items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        lineSubtotal: item.product.price * item.quantity,
      })),
      subtotal,
      notes: orderNotes,
      formatPrice,
    });

  // Envía el pedido al gestor delegando la mecánica (Web Share API + fallback
  // de descarga + redirect a wa.me) al helper compartido. Esto garantiza que
  // /cart y el drawer se comportan idénticos.
  const sendOrderPDF = (pdfBlob: Blob, whatsappNumber: string) =>
    sendOrderViaWhatsApp({
      pdfBlob,
      fileName: generateOrderFileName(),
      whatsappNumber,
      message: renderOrderMessage(),
      onFallbackDownload: () =>
        toast.success('PDF descargado. Adjúntalo en el chat de WhatsApp.', {
          duration: 5000,
        }),
    });

  // Guarda el pedido server-side (Firestore vía /api/orders).
  //
  // Best-effort y SIEMPRE en background (ver handlers): la persistencia no
  // debe bloquear el envío por WhatsApp — que es el canal real del pedido y
  // funciona desde Cuba. Antes esto llamaba a OrderService.create (SDK
  // cliente) y se colgaba en Cuba contra *.googleapis.com, dejando el botón
  // en "Enviando…" para siempre. No mostramos toast de error: el cliente ya
  // envió su pedido por WhatsApp.
  const saveOrder = async (): Promise<void> => {
    const orderItems: IOrderItem[] = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    }));

    try {
      const result = await createOrderViaServer({
        items: orderItems,
        subtotal,
        province: location?.province,
        municipality: location?.municipality,
        gestorId: gestor?.id,
        gestorName: gestor?.name,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        notes: orderNotes.trim(),
      });
      if (result.success) console.log('Order saved:', result.orderNumber);
      else console.warn('Order not persisted (best-effort):', result.error);
    } catch (err) {
      console.error('Error saving order:', err);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!showCheckout) {
      setShowCheckout(true);
      return;
    }

    if (!customerName.trim()) {
      toast.error('Escribe tu nombre para continuar');
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = await buildOrderPdf();
      const whatsappNumber = gestor ? gestor.whatsapp : WHATSAPP_GENERAL;

      if (gestor) {
        // Persistencia en background — NUNCA bloquea el envío (clave en Cuba).
        void saveOrder();
        await sendOrderPDF(pdfBlob, whatsappNumber);
        clearCart();
        setShowCheckout(false);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setOrderNotes('');
        onClose();
      } else if (location?.municipality) {
        setNoGestorMessage(true);
      } else {
        void saveOrder();
        await sendOrderPDF(pdfBlob, WHATSAPP_GENERAL);
        clearCart();
        setShowCheckout(false);
        onClose();
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFallbackWhatsApp = async () => {
    setIsSending(true);
    try {
      const pdfBlob = await buildOrderPdf();
      void saveOrder();
      await sendOrderPDF(pdfBlob, WHATSAPP_GENERAL);
      setNoGestorMessage(false);
      clearCart();
      setShowCheckout(false);
      onClose();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <m.div
            className={`fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col shadow-2xl ${
              isDark ? 'bg-[#15241B]' : 'bg-[#FEFCF7]'
            }`}
            style={{ height: '100dvh' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-[#C4AC91]/15' : 'border-[#2E4A3A]/10'
            }`}>
              <div className="flex items-center gap-2">
                <ShoppingBag className={`w-5 h-5 ${isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'}`} />
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                  Carrito ({totalItems})
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-[#C4AC91]/10 text-[#C4AC91]' : 'hover:bg-[#2E4A3A]/5 text-[#2E4A3A]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className={`w-12 h-12 mb-4 ${isDark ? 'text-[#C4AC91]/20' : 'text-[#2E4A3A]/15'}`} />
                  <p className={`text-sm ${isDark ? 'text-[#8a8278]' : 'text-[#999]'}`}>
                    Tu carrito esta vacio
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className={`flex gap-3 p-3 rounded-xl ${
                        isDark ? 'bg-[#15241B]' : 'bg-[#F5F1E8]/50'
                      }`}
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <ProductImage
                          src={item.product.image}
                          alt={item.product.name}
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium line-clamp-1 ${
                          isDark ? 'text-[#e8e4dc]' : 'text-gray-900'
                        }`}>
                          {item.product.name}
                        </h3>
                        <p className={`text-sm font-semibold mt-0.5 ${
                          isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'
                        }`}>
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className={`flex items-center gap-0 rounded-lg border ${
                            isDark ? 'border-[#C4AC91]/15' : 'border-[#2E4A3A]/15'
                          }`}>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className={`p-1.5 transition-colors ${
                                isDark ? 'hover:bg-[#C4AC91]/10 text-[#C4AC91]' : 'hover:bg-[#2E4A3A]/5 text-[#2E4A3A]'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`px-2.5 text-xs font-medium tabular-nums ${
                              isDark ? 'text-[#e8e4dc]' : 'text-gray-900'
                            }`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className={`p-1.5 transition-colors ${
                                isDark ? 'hover:bg-[#C4AC91]/10 text-[#C4AC91]' : 'hover:bg-[#2E4A3A]/5 text-[#2E4A3A]'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-red-500/10 text-[#7a7568] hover:text-red-400' : 'hover:bg-red-50 text-[#999] hover:text-red-500'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* No gestor message */}
            <AnimatePresence>
              {noGestorMessage && (
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`mx-5 mb-3 p-4 rounded-xl border relative ${
                    isDark
                      ? 'bg-[#C4AC91]/5 border-[#C4AC91]/20'
                      : 'bg-[#F5F1E8] border-[#C4AC91]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDark ? 'text-[#e8e4dc]' : 'text-gray-900'
                      }`}>
                        No hay repartidor disponible en {location?.municipality}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isDark ? 'text-[#8a8278]' : 'text-[#666]'
                      }`}>
                        Puedes contactar con nuestro equipo general para coordinar tu pedido.
                      </p>
                      <button
                        onClick={handleFallbackWhatsApp}
                        disabled={isSending}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#2E4A3A] hover:text-[#26402F] transition-colors disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5" />
                        )}
                        Contactar por WhatsApp
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setNoGestorMessage(false)}
                    className={`absolute top-2 right-2 p-1 ${isDark ? 'text-[#C4AC91]/50' : 'text-[#2E4A3A]/40'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </m.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {items.length > 0 && (
              <div className={`px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${
                isDark ? 'border-[#C4AC91]/15' : 'border-[#2E4A3A]/10'
              }`}>
                {/* Location info */}
                {location && (
                  <div className={`flex items-center gap-2 mb-3 text-xs ${
                    isDark ? 'text-[#8a8278]' : 'text-[#666]'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{location.municipality}, {location.province}</span>
                    <button
                      type="button"
                      onClick={() => setShowLocationEditor(true)}
                      className={`ml-1 underline underline-offset-2 text-[10px] uppercase tracking-wide ${
                        isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'
                      }`}
                    >
                      Cambiar
                    </button>
                    {gestor && !gestorLoading && (
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isDark ? 'bg-[#C4AC91]/10 text-[#C4AC91]' : 'bg-[#2E4A3A]/10 text-[#2E4A3A]'
                      }`}>
                        Entrega disponible
                      </span>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                      Total productos
                    </span>
                    <span className={`text-xl font-bold ${isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'}`}>
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1.5 leading-relaxed ${isDark ? 'text-[#8a8278]' : 'text-[#888]'}`}>
                    La mensajería se coordina directamente con {gestor ? gestor.name : 'tu gestor de zona'}.
                  </p>
                </div>

                {/* Checkout form - appears when user clicks the button */}
                {showCheckout && (
                  <div className={`mb-3 space-y-2 p-3 rounded-xl border ${
                    isDark ? 'bg-[#15241B] border-[#C4AC91]/15' : 'bg-[#F5F1E8]/50 border-[#2E4A3A]/10'
                  }`}>
                    <p className={`text-xs font-medium mb-2 ${isDark ? 'text-[#C4AC91]' : 'text-[#2E4A3A]'}`}>
                      Datos para tu pedido
                    </p>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre *"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#15241B] border-[#C4AC91]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Tu email (para seguimiento)"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#15241B] border-[#C4AC91]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Tu teléfono (opcional)"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#15241B] border-[#C4AC91]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Notas (opcional)"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#15241B] border-[#C4AC91]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                )}

                {/* WhatsApp order button with PDF */}
                <button
                  onClick={handleWhatsAppOrder}
                  disabled={gestorLoading || isSending}
                  className="w-full bg-[#2E4A3A] text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#26402F] transition-colors disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                    </>
                  )}
                  {isSending ? 'Enviando pedido...' : showCheckout ? 'Confirmar y enviar por WhatsApp' : 'Realizar pedido'}
                </button>

                {showCheckout && (
                  <button
                    onClick={() => setShowCheckout(false)}
                    className={`w-full text-center text-xs mt-2 py-1 ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`}
                  >
                    Volver al carrito
                  </button>
                )}

                {!showCheckout && (
                  <p className={`text-[10px] text-center mt-2 ${isDark ? 'text-[#7a7568]' : 'text-[#999]'}`}>
                    Se generara un PDF y se enviara al gestor de tu zona
                  </p>
                )}
              </div>
            )}
          </m.div>

          {showLocationEditor && (
            <LocationPopup open={showLocationEditor} onOpenChange={setShowLocationEditor} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
