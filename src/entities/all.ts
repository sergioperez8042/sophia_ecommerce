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

// Gestor de zona (delivery/ventas por WhatsApp en municipios específicos)
export interface IGestor {
  id: string;
  name: string;
  whatsapp: string; // numero sin +, ej: "5352010900"
  province: string;
  municipalities: string[]; // municipios que cubre
  active: boolean;
  photoUrl?: string; // foto del gestor (Cloudinary)
  createdAt?: string;
}

// Exportar tipos para compatibilidad
export type { IProduct as ProductType, ICategory as CategoryType };
