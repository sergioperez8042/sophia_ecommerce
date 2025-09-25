import ProductsData from './Product.json';
import CategoriesData from './Category.json';

// Tipos TypeScript
export interface Product {
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

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  sort_order: number;
  active: boolean;
  product_count: number;
}

// Clases con métodos estáticos para simular una API
export class Product {
  static async list(orderBy?: string): Promise<Product[]> {
    let products = [...ProductsData] as Product[];
    
    if (orderBy) {
      if (orderBy === 'name') {
        products.sort((a, b) => a.name.localeCompare(b.name));
      } else if (orderBy === '-created_date') {
        products.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
      }
    }
    
    return products;
  }

  static async filter(conditions: any, orderBy?: string): Promise<Product[]> {
    let products = await this.list(orderBy);
    
    if (conditions.active !== undefined) {
      products = products.filter(p => p.active === conditions.active);
    }
    
    if (conditions.featured !== undefined) {
      products = products.filter(p => p.featured === conditions.featured);
    }
    
    return products;
  }

  static async findById(id: string): Promise<Product | null> {
    const products = await this.list();
    return products.find(p => p.id === id) || null;
  }
}

export class Category {
  static async list(orderBy?: string): Promise<Category[]> {
    let categories = [...CategoriesData] as Category[];
    
    if (orderBy === 'sort_order') {
      categories.sort((a, b) => a.sort_order - b.sort_order);
    }
    
    return categories.filter(c => c.active);
  }

  static async findById(id: string): Promise<Category | null> {
    const categories = await this.list();
    return categories.find(c => c.id === id) || null;
  }
}