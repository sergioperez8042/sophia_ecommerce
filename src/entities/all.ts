// Tipos TypeScript
export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image: string;
  rating: number;
  reviews_count: number;
  tags: string[];
  ingredients: string[];
  active: boolean;
  created_date: string;
  featured: boolean;
  usage?: string;
  weight?: number;
  weight_unit?: string;
  out_of_stock?: boolean;
  zona_uso?: string[];
  tipo_piel?: string[];
  tipo_cabello?: string[];
  beneficios?: string[];
}

export interface ICategory {
  id: string;
  name: string;
  description: string;
  image: string;
  sort_order: number;
  active: boolean;
  product_count: number;
  parent_id?: string;
}

// Permisos disponibles para gestores
export const GESTOR_PERMISSIONS = {
  'orders.view': 'Ver pedidos',
  'orders.manage': 'Gestionar pedidos',
  'catalog.prices': 'Ver precios de gestor',
  'orders.create': 'Crear pedidos',
  'stats.view': 'Ver estadísticas',
  'clients.view': 'Ver clientes de su zona',
} as const;

export type GestorPermission = keyof typeof GESTOR_PERMISSIONS;

// Permisos por defecto al crear un gestor
export const DEFAULT_GESTOR_PERMISSIONS: GestorPermission[] = [
  'orders.view',
  'catalog.prices',
  'orders.create',
];

// Gestor de zona (delivery/ventas por WhatsApp en municipios específicos)
export interface IGestor {
  id: string;
  name: string;
  whatsapp: string; // número sin +, ej: "5352010900"
  /**
   * Provincias que cubre el gestor. Se introdujo como array (antes era
   * `province: string`) para soportar gestores que cubren varias
   * provincias (e.g. Marian cubre Santiago de Cuba + Granma). El admin
   * lo gestiona como multi-select; el lookup en findByLocation no usa
   * este campo directamente — sólo se filtra por `municipalities[]` y
   * `consejos[]`, así que es informativo / agrupador.
   */
  provinces: string[];
  municipalities: string[]; // municipios que cubre
  /**
   * Consejos populares específicos que cubre el gestor (dentro de los
   * municipios listados). Solo se usa para provincias con flag
   * usesConsejos=true (La Habana). Para provincias sin consejos (Matanzas
   * y futuras), este campo queda vacío y la cobertura es a nivel municipio.
   *
   * El admin gestiona estos arrays vía la UI: checkboxes por municipio
   * que muestran los consejos disponibles de localities.ts.
   */
  consejos?: Array<{ municipality: string; consejo: string }>;
  active: boolean;
  photoUrl?: string; // foto del gestor (Cloudinary)
  createdAt?: string;
  email?: string;        // login email
  userId?: string;       // Firebase Auth UID link
  permissions?: GestorPermission[]; // permisos del gestor
}

// ==================== PEDIDOS ====================

export const ORDER_STATUSES = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_transit: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrder {
  id: string;
  orderNumber: string; // e.g. "SPH-20260314-001"
  items: IOrderItem[];
  subtotal: number;
  status: OrderStatus;
  // Customer location
  province: string;
  municipality: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  // Gestor assignment
  gestorId?: string;
  gestorName?: string;
  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// ==================== RESEÑAS ====================

export interface IReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;        // 1-5
  comment: string;
  createdAt: string;
  verified?: boolean;    // true si el usuario compró el producto
}

// Exportar tipos para compatibilidad
export type { IProduct as ProductType, ICategory as CategoryType };
