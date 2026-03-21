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
  province: string;
  municipalities: string[]; // municipios que cubre
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
