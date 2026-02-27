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

// Exportar tipos para compatibilidad
export type { IProduct as ProductType, ICategory as CategoryType };
