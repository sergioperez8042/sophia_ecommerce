"use client";

import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, MessageCircle, Trash2, AlertTriangle, MapPin, FileText, Loader2 } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useCart } from '@/store/CartContext';
import { useLocation } from '@/store/LocationContext';
import { useTheme } from '@/store/ThemeContext';
import { GestorService, OrderService } from '@/lib/firestore-services';
import { IGestor, IOrderItem } from '@/entities/all';
import ProductImage from '@/components/ui/product-image';
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
  const [gestor, setGestor] = useState<IGestor | null>(null);
  const [gestorLoading, setGestorLoading] = useState(false);
  const [noGestorMessage, setNoGestorMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Find gestor when location changes
  useEffect(() => {
    if (!location?.municipality) {
      setGestor(null);
      return;
    }

    const findGestor = async () => {
      setGestorLoading(true);
      try {
        const found = await GestorService.findByMunicipality(location.municipality);
        setGestor(found);
      } catch {
        setGestor(null);
      } finally {
        setGestorLoading(false);
      }
    };

    findGestor();
  }, [location?.municipality]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  // Generate minimalist branded PDF
  const generateOrderPDF = async (): Promise<Blob> => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const margin = 25;
    const contentWidth = pw - margin * 2;

    // -- Background --
    doc.setFillColor(254, 252, 247); // #FEFCF7
    doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');

    // -- Top accent line --
    doc.setFillColor(80, 90, 74); // #505A4A
    doc.rect(0, 0, pw, 3, 'F');

    // -- Brand name --
    let y = 30;
    doc.setTextColor(80, 90, 74);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'normal');
    doc.text('Sophia', margin, y);

    doc.setFontSize(9);
    doc.setTextColor(160, 152, 137); // muted
    doc.text('Cosmetica Botanica', margin, y + 8);

    // -- Date on the right --
    doc.setFontSize(9);
    doc.setTextColor(160, 152, 137);
    const dateStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc.text(dateStr, pw - margin, y, { align: 'right' });

    // -- Thin separator --
    y += 18;
    doc.setDrawColor(196, 181, 144); // #C4B590
    doc.setLineWidth(0.3);
    doc.line(margin, y, pw - margin, y);

    // -- Customer & Location --
    y += 12;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    if (customerName.trim()) {
      doc.text(`Cliente: ${customerName.trim()}`, margin, y);
      y += 6;
    }
    if (customerPhone.trim()) {
      doc.text(`Telefono: ${customerPhone.trim()}`, margin, y);
      y += 6;
    }
    if (location) {
      doc.text(`Entrega: ${location.municipality}, ${location.province}`, margin, y);
      y += 6;
    }
    if (orderNotes.trim()) {
      doc.text(`Notas: ${orderNotes.trim()}`, margin, y);
      y += 6;
    }
    y += 4;

    // -- Items header --
    y += 2;
    doc.setFontSize(8);
    doc.setTextColor(160, 152, 137);
    doc.text('PRODUCTO', margin, y);
    doc.text('CANT.', margin + contentWidth * 0.6, y);
    doc.text('PRECIO', margin + contentWidth * 0.75, y);
    doc.text('SUBTOTAL', pw - margin, y, { align: 'right' });

    y += 4;
    doc.setDrawColor(230, 226, 219);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pw - margin, y);
    y += 8;

    // -- Items --
    doc.setTextColor(60, 60, 60);
    items.forEach((item) => {
      if (y > 265) {
        doc.addPage();
        doc.setFillColor(254, 252, 247);
        doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');
        y = 25;
      }
      const itemSub = item.product.price * item.quantity;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(item.product.name.substring(0, 35), margin, y);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(String(item.quantity), margin + contentWidth * 0.63, y);
      doc.text(formatPrice(item.product.price), margin + contentWidth * 0.75, y);
      doc.setTextColor(80, 90, 74);
      doc.text(formatPrice(itemSub), pw - margin, y, { align: 'right' });

      y += 5;
      doc.setDrawColor(240, 237, 230);
      doc.setLineWidth(0.1);
      doc.line(margin, y, pw - margin, y);
      y += 8;
      doc.setTextColor(60, 60, 60);
    });

    // -- Total section --
    y += 4;
    doc.setDrawColor(196, 181, 144);
    doc.setLineWidth(0.4);
    doc.line(margin + contentWidth * 0.5, y, pw - margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Total', margin + contentWidth * 0.55, y);

    doc.setFontSize(16);
    doc.setTextColor(80, 90, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(subtotal), pw - margin, y, { align: 'right' });

    // -- Gestor info section --
    if (gestor) {
      y += 20;
      doc.setDrawColor(196, 181, 144);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pw - margin, y);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(160, 152, 137);
      doc.text('TU GESTOR DE ZONA', margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor(80, 90, 74);
      doc.setFont('helvetica', 'bold');
      doc.text(gestor.name, margin, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`WhatsApp: +${gestor.whatsapp}`, margin, y);
      y += 6;
      doc.text(`Zona: ${gestor.municipalities.join(', ')}`, margin, y);
      y += 6;
      doc.text(`Provincia: ${gestor.province}`, margin, y);
    }

    // -- Footer --
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(230, 226, 219);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 8, pw - margin, footerY - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 175, 165);
    doc.text('Sophia Cosmetica Botanica  |  www.sophia-cosmetic.vercel.app', pw / 2, footerY, { align: 'center' });

    return doc.output('blob');
  };

  // Download PDF and open the correct WhatsApp chat
  const sendOrderPDF = async (pdfBlob: Blob, whatsappNumber: string) => {
    const fileName = `Pedido_Sophia_${new Date().toISOString().slice(0, 10)}.pdf`;

    // 1. Download the PDF to the device
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // 2. Show toast with instruction
    toast.success('PDF descargado. Adjuntalo en el chat de WhatsApp.', { duration: 5000 });

    // 3. Open WhatsApp directly to the gestor's chat (no text, just the right contact)
    setTimeout(() => {
      window.location.href = `https://wa.me/${whatsappNumber}`;
    }, 600);
  };

  // Save order to Firestore
  const saveOrder = async (): Promise<void> => {
    const orderItems: IOrderItem[] = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    }));

    try {
      const order = await OrderService.create({
        items: orderItems,
        subtotal,
        province: location?.province || 'Sin provincia',
        municipality: location?.municipality || 'Sin municipio',
        gestorId: gestor?.id,
        gestorName: gestor?.name,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: orderNotes.trim(),
      });
      console.log('Order saved:', order.orderNumber);
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('No se pudo guardar el pedido en el sistema');
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
      // Save order to database
      await saveOrder();

      const pdfBlob = await generateOrderPDF();
      const whatsappNumber = gestor ? gestor.whatsapp : WHATSAPP_GENERAL;

      if (gestor) {
        await sendOrderPDF(pdfBlob, whatsappNumber);
        clearCart();
        setShowCheckout(false);
        setCustomerName('');
        setCustomerPhone('');
        setOrderNotes('');
        onClose();
      } else if (location?.municipality) {
        setNoGestorMessage(true);
      } else {
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
      await saveOrder();
      const pdfBlob = await generateOrderPDF();
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
              isDark ? 'bg-[#1a1d19]' : 'bg-[#FEFCF7]'
            }`}
            style={{ height: '100dvh' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDark ? 'border-[#C4B590]/15' : 'border-[#505A4A]/10'
            }`}>
              <div className="flex items-center gap-2">
                <ShoppingBag className={`w-5 h-5 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`} />
                <h2 className={`text-lg font-semibold ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                  Carrito ({totalItems})
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-[#C4B590]/10 text-[#C4B590]' : 'hover:bg-[#505A4A]/5 text-[#505A4A]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className={`w-12 h-12 mb-4 ${isDark ? 'text-[#C4B590]/20' : 'text-[#505A4A]/15'}`} />
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
                        isDark ? 'bg-[#22261f]' : 'bg-[#F5F1E8]/50'
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
                          isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'
                        }`}>
                          {formatPrice(item.product.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className={`flex items-center gap-0 rounded-lg border ${
                            isDark ? 'border-[#C4B590]/15' : 'border-[#505A4A]/15'
                          }`}>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className={`p-1.5 transition-colors ${
                                isDark ? 'hover:bg-[#C4B590]/10 text-[#C4B590]' : 'hover:bg-[#505A4A]/5 text-[#505A4A]'
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
                                isDark ? 'hover:bg-[#C4B590]/10 text-[#C4B590]' : 'hover:bg-[#505A4A]/5 text-[#505A4A]'
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
                      ? 'bg-[#C4B590]/5 border-[#C4B590]/20'
                      : 'bg-[#F5F1E8] border-[#C4B590]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'
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
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#505A4A] hover:text-[#414A3C] transition-colors disabled:opacity-50"
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
                    className={`absolute top-2 right-2 p-1 ${isDark ? 'text-[#C4B590]/50' : 'text-[#505A4A]/40'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </m.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {items.length > 0 && (
              <div className={`px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t ${
                isDark ? 'border-[#C4B590]/15' : 'border-[#505A4A]/10'
              }`}>
                {/* Location info */}
                {location && (
                  <div className={`flex items-center gap-2 mb-3 text-xs ${
                    isDark ? 'text-[#8a8278]' : 'text-[#666]'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span>{location.municipality}, {location.province}</span>
                    {gestor && !gestorLoading && (
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isDark ? 'bg-[#C4B590]/10 text-[#C4B590]' : 'bg-[#505A4A]/10 text-[#505A4A]'
                      }`}>
                        Entrega disponible
                      </span>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDark ? 'text-[#e8e4dc]' : 'text-gray-900'}`}>
                    Total
                  </span>
                  <span className={`text-xl font-bold ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {/* Checkout form - appears when user clicks the button */}
                {showCheckout && (
                  <div className={`mb-3 space-y-2 p-3 rounded-xl border ${
                    isDark ? 'bg-[#22261f] border-[#C4B590]/15' : 'bg-[#F5F1E8]/50 border-[#505A4A]/10'
                  }`}>
                    <p className={`text-xs font-medium mb-2 ${isDark ? 'text-[#C4B590]' : 'text-[#505A4A]'}`}>
                      Datos para tu pedido
                    </p>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tu nombre *"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#1a1d19] border-[#C4B590]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Tu telefono (opcional)"
                      className={`w-full px-3 py-2 rounded-lg text-sm border ${
                        isDark
                          ? 'bg-[#1a1d19] border-[#C4B590]/15 text-[#e8e4dc] placeholder-[#7a7568]'
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
                          ? 'bg-[#1a1d19] border-[#C4B590]/15 text-[#e8e4dc] placeholder-[#7a7568]'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                )}

                {/* WhatsApp order button with PDF */}
                <button
                  onClick={handleWhatsAppOrder}
                  disabled={gestorLoading || isSending}
                  className="w-full bg-[#505A4A] text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#414A3C] transition-colors disabled:opacity-50"
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
        </>
      )}
    </AnimatePresence>
  );
}
