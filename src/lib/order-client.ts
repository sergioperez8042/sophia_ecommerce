import type { IOrderItem } from '@/entities/all';

/**
 * Cliente para crear pedidos vía el endpoint server-side `/api/orders`.
 *
 * El navegador (también en Cuba) solo habla con sophiacatalog.com; el
 * servidor escribe en Firestore. Reemplaza la llamada directa
 * `OrderService.create` (SDK cliente), que en Cuba se cuelga reintentando
 * contra `*.googleapis.com` y bloqueaba el envío del pedido por WhatsApp.
 */
export interface CreateOrderInput {
  items: IOrderItem[];
  subtotal: number;
  province?: string;
  municipality?: string;
  gestorId?: string;
  gestorName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  id?: string;
  error?: string;
}

export async function createOrderViaServer(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data.error || 'No se pudo guardar el pedido' };
  return { success: true, orderNumber: data.orderNumber, id: data.id };
}
