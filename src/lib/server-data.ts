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
  zona_uso?: string[];
  tipo_piel?: string[];
  tipo_cabello?: string[];
  beneficios?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  sort_order?: number;
  parent_id?: string;
}

export async function getActiveProducts(): Promise<Product[]> {
  if (!db) {
    console.error('[getActiveProducts] Firestore not initialized (db is null). Check NEXT_PUBLIC_FIREBASE_* env vars.');
    return [];
  }

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
  } catch (err) {
    console.error('[getActiveProducts] Firestore query failed:', err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) {
    console.error('[getProductById] Firestore not initialized (db is null).');
    return null;
  }

  try {
    const docRef = doc(db, 'products', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Product;
  } catch (err) {
    console.error(`[getProductById] Failed for id="${id}":`, err);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!db) {
    console.error('[getCategories] Firestore not initialized (db is null). Check NEXT_PUBLIC_FIREBASE_* env vars.');
    return [];
  }

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const all = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];

    // Composite sort: respect parent hierarchy so subcategories are grouped
    // under their parent's bucket. Without this, every sub with sort_order=1
    // tied with every parent at sort_order=1 and the order became arbitrary.
    const byId = new Map(all.map(c => [c.id, c]));
    const topOrder = (c: Category) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : null;
      return parent ? (parent.sort_order || 0) : (c.sort_order || 0);
    };

    return all.sort((a, b) => {
      const aTop = topOrder(a);
      const bTop = topOrder(b);
      if (aTop !== bTop) return aTop - bTop;
      // Same top bucket: render the parent first, then its subcategories.
      if (!a.parent_id && b.parent_id) return -1;
      if (a.parent_id && !b.parent_id) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  } catch (err) {
    console.error('[getCategories] Firestore query failed:', err);
    return [];
  }
}

export async function getCatalogConfig(): Promise<CatalogConfig> {
  if (!db) {
    console.error('[getCatalogConfig] Firestore not initialized (db is null).');
    return { group_by_category: false };
  }

  try {
    const docRef = doc(db, 'config', 'catalog');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { group_by_category: false, ...snapshot.data() } as CatalogConfig;
    }
    return { group_by_category: false };
  } catch (err) {
    console.error('[getCatalogConfig] Firestore query failed:', err);
    return { group_by_category: false };
  }
}
