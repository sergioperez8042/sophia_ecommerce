import ProductsData from './Product.json';
import CategoriesData from './Category.json';

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

// Clases con métodos estáticos para simular una API
export class Product {
  static async list(orderBy?: string): Promise<IProduct[]> {
    const products = [...ProductsData] as IProduct[];
    
    if (orderBy) {
      if (orderBy === 'name') {
        products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (orderBy === '-created_date') {
        products.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      }
    }
    
    return products;
  }

  static async filter(conditions: Record<string, unknown>, orderBy?: string): Promise<IProduct[]> {
    const products = await this.list(orderBy);
    let filteredProducts = [...products];
    
    if (conditions.active !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.active === conditions.active);
    }
    
    if (conditions.featured !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.featured === conditions.featured);
    }
    
    return filteredProducts;
  }

  static async findById(id: string): Promise<IProduct | null> {
    const products = await this.list();
    return products.find(p => p.id === id) || null;
  }
}

export class Category {
  static async list(orderBy?: string): Promise<ICategory[]> {
    const categories = [...CategoriesData] as ICategory[];
    
    if (orderBy === 'sort_order') {
      categories.sort((a, b) => a.sort_order - b.sort_order);
    }
    
    return categories.filter(c => c.active);
  }

  static async findById(id: string): Promise<ICategory | null> {
    const categories = await this.list();
    return categories.find(c => c.id === id) || null;
  }
}

// Exportar también los tipos para compatibilidad con código existente
export type { IProduct as ProductType, ICategory as CategoryType };