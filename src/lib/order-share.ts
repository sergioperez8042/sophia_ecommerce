/**
 * Comparte un pedido vía WhatsApp con el gestor.
 *
 * Antes esta lógica vivía DUPLICADA en `CartDrawer.tsx` y `app/cart/page.tsx`
 * con pequeñas divergencias (uno mostraba un toast, otro no; uno usaba
 * `window.location.href`, otro `window.open(..., '_blank')`; los filenames
 * eran distintos). El helper unifica el comportamiento.
 *
 * Estrategia:
 * 1. Si el navegador soporta Web Share API Nivel 2 con `files`, lanza el
 *    share-sheet nativo (en Android/iOS el cliente elige WhatsApp y el PDF
 *    llega adjunto de verdad).
 * 2. Si no, fallback: descarga local del PDF + redirect a wa.me con un
 *    texto que recuerda al cliente adjuntarlo manualmente.
 *
 * El helper se mantiene a propósito como función pura (no hook): no usa
 * state ni effects, solo orquesta APIs del navegador. Esto permite que
 * cualquier componente — drawer, page, o futuras superficies — lo use sin
 * arrastrar el ciclo de render.
 */

export interface ShareOrderArgs {
  /** PDF del pedido ya generado */
  pdfBlob: Blob;
  /** Nombre sugerido para el archivo (.pdf) */
  fileName: string;
  /** Número del gestor en formato internacional sin '+' (e.g. '5353969396') */
  whatsappNumber: string;
  /** Texto del mensaje (típicamente de buildOrderMessage) */
  message: string;
  /**
   * Sufijo opcional para el caso fallback. Útil para recordar al cliente
   * que debe adjuntar el PDF manualmente al chat.
   * Por defecto: "Te adjunto el PDF con los detalles (revisá tu descarga)."
   */
  fallbackMessageSuffix?: string;
  /**
   * Callback opcional invocado cuando se cae al modo fallback (descarga
   * local). El componente lo usa para mostrar un toast como
   * "PDF descargado. Adjúntalo en el chat."
   */
  onFallbackDownload?: () => void;
}

const DEFAULT_FALLBACK_SUFFIX =
  'Te adjunto el PDF con los detalles (revisá tu descarga).';

/**
 * Genera un filename canónico para el PDF del pedido. Formato:
 *   "Pedido_Sophia_YYYY-MM-DD.pdf"
 * Determinístico por fecha — si el cliente envía 2 pedidos el mismo día,
 * el segundo sobreescribe el primero en la carpeta de descargas (intencional:
 * el cliente normalmente solo envía uno por sesión).
 */
export function generateOrderFileName(): string {
  return `Pedido_Sophia_${new Date().toISOString().slice(0, 10)}.pdf`;
}

export async function sendOrderViaWhatsApp(args: ShareOrderArgs): Promise<void> {
  const {
    pdfBlob,
    fileName,
    whatsappNumber,
    message,
    fallbackMessageSuffix = DEFAULT_FALLBACK_SUFFIX,
    onFallbackDownload,
  } = args;

  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  // 1) Web Share API Nivel 2 (mobile + Safari)
  const canShareFile =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] });

  if (canShareFile) {
    try {
      await navigator.share({
        files: [pdfFile],
        text: message,
        title: 'Pedido Sophia',
      });
      return;
    } catch (shareErr) {
      // El usuario canceló o el navegador rechazó el share. Caemos al
      // fallback en silencio — pero logueamos por si hay un bug futuro.
      console.warn(
        'Web Share cancelado, usando fallback descarga+wa.me:',
        shareErr,
      );
    }
  }

  // 2) Fallback: descarga local + redirect a wa.me click-to-chat
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke después de un tick para que el navegador termine la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  onFallbackDownload?.();

  const fallbackText = `${message}\n\n${fallbackMessageSuffix}`;
  // Usamos location.href en vez de window.open para evitar popup blockers
  // y para que en mobile la app de WhatsApp se abra directamente.
  setTimeout(() => {
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(fallbackText)}`;
  }, 600);
}
