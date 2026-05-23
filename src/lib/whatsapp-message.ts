/**
 * Builder único del mensaje de pedido vía WhatsApp.
 *
 * Antes el mensaje vivía duplicado en `CartDrawer.tsx` y `app/cart/page.tsx`
 * y los dos derivaban — el drawer recogía nombre/teléfono/email/notas, la
 * página solo provincia/municipio. Resultado: el gestor recibía mensajes
 * con info distinta según qué ruta usara el cliente. Este helper lo
 * centraliza para que cualquier futura adición (cobertura por consejo,
 * link de pago, etc) llegue a las dos rutas al mismo tiempo.
 *
 * Markdown de WhatsApp: usa `*negrita*` con asteriscos simples. Las líneas
 * en blanco crean separación visual en la app.
 */

export type OrderItemForMessage = {
  productName: string;
  quantity: number;
  /** Subtotal de la línea = price × quantity, ya calculado por el caller */
  lineSubtotal: number;
};

export type BuildOrderMessageArgs = {
  /** Nombre del gestor receptor. Si null/undefined → saludo genérico */
  gestorName?: string | null;
  /** Nombre del cliente. Si está vacío, la sección "Cliente" lo omite */
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** Ubicación canónica del cliente */
  municipality?: string;
  province?: string;
  /** Items del carrito, ya con subtotales calculados */
  items: OrderItemForMessage[];
  /** Subtotal total — el caller decide qué incluye (productos, sin envío) */
  subtotal: number;
  /** Notas adicionales del cliente. Si vacío, sección omitida */
  notes?: string;
  /** Formateador de precio. Si se omite, usa `$${n.toFixed(2)}` */
  formatPrice?: (n: number) => string;
};

const defaultFormatPrice = (n: number): string => `$${n.toFixed(2)}`;

export function buildOrderMessage(args: BuildOrderMessageArgs): string {
  const fmt = args.formatPrice ?? defaultFormatPrice;
  const lines: string[] = [];

  lines.push(
    `Hola${args.gestorName ? ` ${args.gestorName}` : ''}, te envío mi pedido de Sophia.`,
  );
  lines.push('');

  // -- Cliente --
  // Se incluye la sección si hay AL MENOS uno de los campos. Cada campo
  // individual se omite si llega vacío, lo cual permite que cart/page
  // siga funcionando con solo location aunque no recoja name/phone/email.
  const hasAnyClient =
    !!args.customerName?.trim() ||
    !!args.customerPhone?.trim() ||
    !!args.customerEmail?.trim() ||
    !!args.municipality ||
    !!args.province;

  if (hasAnyClient) {
    lines.push('*Cliente*');
    if (args.customerName?.trim()) lines.push(args.customerName.trim());
    if (args.municipality || args.province) {
      const loc = [args.municipality, args.province].filter(Boolean).join(', ');
      lines.push(loc);
    }
    if (args.customerPhone?.trim()) lines.push(args.customerPhone.trim());
    if (args.customerEmail?.trim()) lines.push(args.customerEmail.trim());
    lines.push('');
  }

  // -- Pedido --
  lines.push('*Pedido*');
  for (const item of args.items) {
    lines.push(
      `${item.quantity}x ${item.productName} — ${fmt(item.lineSubtotal)}`,
    );
  }
  lines.push('');

  // -- Total --
  lines.push(`*Total: ${fmt(args.subtotal)}*`);

  // -- Nota de envío --
  // En Cuba el costo de mensajería no se puede calcular automáticamente
  // (varía por zona, peso, distancia y disponibilidad del gestor). Esta
  // línea aclara que el total mostrado es SOLO por los productos y que
  // la mensajería es OPCIONAL — solo si el cliente la necesita se
  // coordina con el gestor.
  lines.push('');
  const gestorRef = args.gestorName ? args.gestorName : 'tu gestor de zona';
  lines.push(
    `*El total cubre únicamente los productos, en caso de necesitar mensajería se coordinará directamente con ${gestorRef}.*`,
  );

  // -- Notas opcionales --
  if (args.notes?.trim()) {
    lines.push('');
    lines.push('*Notas*');
    lines.push(args.notes.trim());
  }

  return lines.join('\n');
}
