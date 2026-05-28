/**
 * Cliente de auth/datos server-side para gestores.
 *
 * El navegador (incluso en Cuba) solo habla con `sophiacatalog.com/api/*`;
 * el servidor (Vercel → Google) hace el trabajo con Firebase. Mismo motivo
 * y patrón que `gestor-lookup-client.ts`. Las cookies httpOnly de sesión
 * viajan automáticamente en cada fetch same-origin.
 */
import type { User } from '@/store/AuthContext';
import type { IGestor, IOrder, OrderStatus } from '@/entities/all';

// El servidor devuelve createdAt como string ISO; el tipo User lo espera
// como Date. Lo rehidratamos para no romper consumidores que lo traten así.
function hydrateUser(raw: Record<string, unknown> | null | undefined): User | null {
  if (!raw) return null;
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string) : undefined,
  } as User;
}

export async function loginViaServer(
  email: string,
  password: string,
): Promise<{ user: User } | { error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || 'Error al iniciar sesión' };
  const user = hydrateUser(data.user);
  if (!user) return { error: 'Error al iniciar sesión' };
  return { user };
}

export async function fetchSession(): Promise<User | null> {
  const res = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return hydrateUser(data.user);
}

export async function logoutViaServer(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
  } catch {
    // best-effort: el cliente limpia su estado igualmente
  }
}

export async function fetchManagerData(): Promise<{
  gestor: IGestor | null;
  orders: IOrder[];
}> {
  const res = await fetch('/api/manager/orders', { cache: 'no-store' });
  if (!res.ok) throw new Error(`manager orders failed: ${res.status}`);
  const data = await res.json();
  return { gestor: (data.gestor ?? null) as IGestor | null, orders: (data.orders ?? []) as IOrder[] };
}

export async function updateManagerOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const res = await fetch(`/api/manager/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al actualizar el pedido');
  }
}

export async function changeManagerPassword(newPassword: string): Promise<void> {
  const res = await fetch('/api/manager/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al cambiar la contraseña');
  }
}
