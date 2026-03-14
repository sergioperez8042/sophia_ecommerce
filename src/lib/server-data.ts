import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface CatalogConfig {
  group_by_category: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string;
  rating: number;
  reviews_count: number;
  featured: boolean;
  active: boolean;
  tags: string[];
  ingredients: string[];
  usage?: string;
  weight?: number;
  weight_unit?: string;
  out_of_stock?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export async function getActiveProducts(): Promise<Product[]> {
  if (!db) return [];

  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('active', '==', true)
    );
    const snapshot = await getDocs(productsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch {
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) return null;

  try {
    const docRef = doc(db, 'products', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Product;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch {
    return [];
  }
}

export async function getCatalogConfig(): Promise<CatalogConfig> {
  if (!db) return { group_by_category: false };

  try {
    const docRef = doc(db, 'config', 'catalog');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { group_by_category: false, ...snapshot.data() } as CatalogConfig;
    }
    return { group_by_category: false };
  } catch {
    return { group_by_category: false };
  }
}
