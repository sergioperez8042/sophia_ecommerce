import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

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
}

interface Category {
  id: string;
  name: string;
  icon: string;
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
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
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
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
