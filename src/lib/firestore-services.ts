import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  DocumentData,
  QueryConstraint,
  setDoc,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, deleteUser, Auth } from 'firebase/auth';
import { db, auth } from './firebase';
import { IProduct, ICategory, IGestor, IOrder, IOrderItem, OrderStatus, IReview } from '@/entities/all';
import { User, UserRole } from '@/store/AuthContext';
import { normalizeForMatch, requiresConsejoPopular, getConsejos } from '@/data/localities';

// Collection names
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const USERS_COLLECTION = 'users';
const SUBSCRIBERS_COLLECTION = 'subscribers';
const NEWSLETTERS_COLLECTION = 'newsletters';
const GESTORES_COLLECTION = 'gestores';
const ORDERS_COLLECTION = 'orders';
const REVIEWS_COLLECTION = 'reviews';

// Helper to check if Firebase is available (client-side only)
const isFirebaseAvailable = (): boolean => {
  return typeof window !== 'undefined' && db !== null;
};

// Helper to ensure Firebase is initialized
const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Please check your environment configuration.');
  }
  return db;
};

const getAuthInstance = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your environment configuration.');
  }
  return auth;
};

// ==================== PRODUCTS ====================

export const ProductService = {
  // Get all products
  async getAll(orderByField?: string): Promise<IProduct[]> {
    const firestore = getDb();
    const constraints: QueryConstraint[] = [];
    
    if (orderByField) {
      const direction = orderByField.startsWith('-') ? 'desc' : 'asc';
      const field = orderByField.replace('-', '');
      constraints.push(orderBy(field, direction));
    }

    const q = query(collection(firestore, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IProduct[];
  },

  // Get product by ID
  async getById(id: string): Promise<IProduct | null> {
    const firestore = getDb();
    const docRef = doc(firestore, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IProduct;
    }
    return null;
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<IProduct[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, PRODUCTS_COLLECTION),
      where('category_id', '==', categoryId),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IProduct[];
  },

  // Get featured products
  async getFeatured(): Promise<IProduct[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, PRODUCTS_COLLECTION),
      where('featured', '==', true),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IProduct[];
  },

  // Get active products
  async getActive(): Promise<IProduct[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, PRODUCTS_COLLECTION),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IProduct[];
  },

  // Create product
  async create(product: Omit<IProduct, 'id'>): Promise<IProduct> {
    const firestore = getDb();
    const docRef = await addDoc(collection(firestore, PRODUCTS_COLLECTION), {
      ...product,
      created_date: new Date().toISOString(),
    });
    
    return { id: docRef.id, ...product, created_date: new Date().toISOString() };
  },

  // Update product
  async update(id: string, data: Partial<IProduct>): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Toggle active status
  async toggleActive(id: string): Promise<boolean> {
    const product = await this.getById(id);
    if (!product) return false;
    
    await this.update(id, { active: !product.active });
    return true;
  },

  // Toggle featured status
  async toggleFeatured(id: string): Promise<boolean> {
    const product = await this.getById(id);
    if (!product) return false;
    
    await this.update(id, { featured: !product.featured });
    return true;
  },

  // Seed products from JSON (for initial setup)
  async seedFromJSON(products: IProduct[]): Promise<void> {
    const firestore = getDb();
    for (const product of products) {
      const docRef = doc(firestore, PRODUCTS_COLLECTION, product.id);
      await setDoc(docRef, {
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        image: product.image,
        rating: product.rating,
        reviews_count: product.reviews_count,
        tags: product.tags,
        ingredients: product.ingredients,
        active: product.active,
        created_date: product.created_date,
        featured: product.featured,
        out_of_stock: product.out_of_stock || false,
      });
    }
  },
};

// ==================== CATEGORIES ====================

export const CategoryService = {
  // Get all categories
  async getAll(orderByField?: string): Promise<ICategory[]> {
    const firestore = getDb();
    
    try {
      const constraints: QueryConstraint[] = [];
      
      if (orderByField) {
        constraints.push(orderBy(orderByField));
      }

      const q = query(collection(firestore, CATEGORIES_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ICategory[];
    } catch {
      const snapshot = await getDocs(collection(firestore, CATEGORIES_COLLECTION));
      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ICategory[];
      return categories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  },

  // Get active categories
  async getActive(): Promise<ICategory[]> {
    const firestore = getDb();
    
    try {
      const q = query(
        collection(firestore, CATEGORIES_COLLECTION),
        where('active', '==', true),
        orderBy('sort_order')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ICategory[];
    } catch {
      const snapshot = await getDocs(collection(firestore, CATEGORIES_COLLECTION));
      const categories = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() })) as ICategory[];
      return categories
        .filter(c => c.active)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  },

  // Get category by ID
  async getById(id: string): Promise<ICategory | null> {
    const firestore = getDb();
    const docRef = doc(firestore, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ICategory;
    }
    return null;
  },

  // Create category
  async create(category: Omit<ICategory, 'id'>): Promise<ICategory> {
    const firestore = getDb();
    const docRef = await addDoc(collection(firestore, CATEGORIES_COLLECTION), category);
    return { id: docRef.id, ...category };
  },

  // Update category
  async update(id: string, data: Partial<ICategory>): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Get children of a category
  async getChildren(parentId: string): Promise<ICategory[]> {
    const firestore = getDb();
    try {
      const q = query(
        collection(firestore, CATEGORIES_COLLECTION),
        where('parent_id', '==', parentId),
        orderBy('sort_order')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ICategory[];
    } catch {
      const snapshot = await getDocs(collection(firestore, CATEGORIES_COLLECTION));
      const allCats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() })) as ICategory[];
      return allCats
        .filter((c) => c.parent_id === parentId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  },

  // Seed categories from JSON (for initial setup)
  async seedFromJSON(categories: ICategory[]): Promise<void> {
    const firestore = getDb();
    for (const category of categories) {
      const docRef = doc(firestore, CATEGORIES_COLLECTION, category.id);
      await setDoc(docRef, {
        name: category.name,
        description: category.description,
        image: category.image,
        sort_order: category.sort_order,
        active: category.active,
        product_count: category.product_count,
        parent_id: category.parent_id || '',
      });
    }
  },
};

// ==================== USERS ====================

interface SeedUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  managerCode?: string;
  zone?: string;
  address?: string;
  city?: string;
}

export const UserService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const firestore = getDb();
    const snapshot = await getDocs(collection(firestore, USERS_COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  // Get users by role
  async getByRole(role: UserRole): Promise<User[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, USERS_COLLECTION),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  // Get managers
  async getManagers(): Promise<User[]> {
    return this.getByRole('manager');
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const firestore = getDb();
    const docRef = doc(firestore, USERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  // Update user
  async update(id: string, data: Partial<User>): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, USERS_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete user (Firestore only, does not delete from Auth)
  async delete(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, USERS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Seed initial users (creates in both Auth and Firestore)
  async seedUsers(users: SeedUserData[]): Promise<{ success: number; errors: string[] }> {
    const firestore = getDb();
    const authInstance = getAuthInstance();
    const errors: string[] = [];
    let success = 0;

    for (const userData of users) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          authInstance,
          userData.email,
          userData.password
        );
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: userData.name });

        // Create user profile in Firestore
        const userProfile = {
          name: userData.name.trim(),
          email: userData.email.trim().toLowerCase(),
          phone: userData.phone?.trim() || '',
          role: userData.role,
          createdAt: Timestamp.now(),
        };

        // Add role-specific fields
        if (userData.role === 'manager') {
          Object.assign(userProfile, {
            managerCode: userData.managerCode,
            zone: userData.zone || 'Sin asignar',
          });
        }

        if (userData.role === 'client') {
          Object.assign(userProfile, {
            address: userData.address,
            city: userData.city,
          });
        }

        // Save to Firestore
        await setDoc(doc(firestore, USERS_COLLECTION, firebaseUser.uid), userProfile);
        success++;
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        errors.push(`${userData.email}: ${err.message || 'Error desconocido'}`);
      }
    }

    return { success, errors };
  },

  // Get count by role
  async getCountByRole(role: UserRole): Promise<number> {
    const firestore = getDb();
    const q = query(
      collection(firestore, USERS_COLLECTION),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};

// ==================== CONFIG ====================

const CONFIG_COLLECTION = 'config';

export interface CatalogConfig {
  group_by_category: boolean;
}

const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  group_by_category: false,
};

export const ConfigService = {
  async getCatalogConfig(): Promise<CatalogConfig> {
    const firestore = getDb();
    const docRef = doc(firestore, CONFIG_COLLECTION, 'catalog');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...DEFAULT_CATALOG_CONFIG, ...docSnap.data() } as CatalogConfig;
    }
    return DEFAULT_CATALOG_CONFIG;
  },

  async setCatalogConfig(data: Partial<CatalogConfig>): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, CONFIG_COLLECTION, 'catalog');
    await setDoc(docRef, data, { merge: true });
  },
};

// ==================== SUBSCRIBERS (CRM) ====================

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  active: boolean;
  source: 'popup' | 'footer' | 'admin';
  subscribedAt: string;
  unsubscribedAt?: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  bySource: { popup: number; footer: number; admin: number };
}

export const SubscriberService = {
  async getAll(): Promise<Subscriber[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, SUBSCRIBERS_COLLECTION),
      orderBy('subscribedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        name: data.name || '',
        active: data.active ?? true,
        source: data.source || 'admin',
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString?.() || data.subscribedAt || '',
        unsubscribedAt: data.unsubscribedAt?.toDate?.()?.toISOString?.() || data.unsubscribedAt || undefined,
      } as Subscriber;
    });
  },

  async getActive(): Promise<Subscriber[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, SUBSCRIBERS_COLLECTION),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email,
        name: data.name || '',
        active: true,
        source: data.source || 'admin',
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString?.() || data.subscribedAt || '',
      } as Subscriber;
    });
  },

  async add(email: string, source: 'popup' | 'footer' | 'admin', name?: string): Promise<Subscriber> {
    const firestore = getDb();
    const docRef = await addDoc(collection(firestore, SUBSCRIBERS_COLLECTION), {
      email: email.trim().toLowerCase(),
      name: name?.trim() || '',
      active: true,
      source,
      subscribedAt: Timestamp.now(),
    });
    return {
      id: docRef.id,
      email: email.trim().toLowerCase(),
      name: name?.trim() || '',
      active: true,
      source,
      subscribedAt: new Date().toISOString(),
    };
  },

  async exists(email: string): Promise<boolean> {
    const firestore = getDb();
    const q = query(
      collection(firestore, SUBSCRIBERS_COLLECTION),
      where('email', '==', email.trim().toLowerCase())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  async deactivate(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, SUBSCRIBERS_COLLECTION, id);
    await updateDoc(docRef, {
      active: false,
      unsubscribedAt: Timestamp.now(),
    });
  },

  async activate(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, SUBSCRIBERS_COLLECTION, id);
    await updateDoc(docRef, { active: true });
  },

  async delete(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, SUBSCRIBERS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async getStats(): Promise<SubscriberStats> {
    const all = await this.getAll();
    const active = all.filter((s) => s.active).length;
    const bySource = { popup: 0, footer: 0, admin: 0 };
    all.forEach((s) => {
      if (s.source in bySource) bySource[s.source as keyof typeof bySource]++;
    });
    return {
      total: all.length,
      active,
      inactive: all.length - active,
      bySource,
    };
  },
};

// ==================== NEWSLETTER HISTORY ====================

export interface NewsletterRecord {
  id: string;
  subject: string;
  content: string;
  recipientCount: number;
  success: boolean;
  sentAt: string;
}

export const NewsletterHistoryService = {
  async getAll(): Promise<NewsletterRecord[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, NEWSLETTERS_COLLECTION),
      orderBy('sentAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        subject: data.subject,
        content: data.content,
        recipientCount: data.recipientCount,
        success: data.success,
        sentAt: data.sentAt?.toDate?.()?.toISOString?.() || data.sentAt || '',
      } as NewsletterRecord;
    });
  },

  async record(
    subject: string,
    content: string,
    recipientCount: number,
    success: boolean
  ): Promise<void> {
    const firestore = getDb();
    await addDoc(collection(firestore, NEWSLETTERS_COLLECTION), {
      subject,
      content,
      recipientCount,
      success,
      sentAt: Timestamp.now(),
    });
  },
};

// ==================== GESTORES (Zone Managers) ====================

export const GestorService = {
  async getAll(): Promise<IGestor[]> {
    const firestore = getDb();
    const snapshot = await getDocs(collection(firestore, GESTORES_COLLECTION));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as IGestor[];
  },

  async getActive(): Promise<IGestor[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, GESTORES_COLLECTION),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as IGestor[];
  },

  async getById(id: string): Promise<IGestor | null> {
    const firestore = getDb();
    const docRef = doc(firestore, GESTORES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IGestor;
    }
    return null;
  },

  async create(gestor: Omit<IGestor, 'id'>): Promise<IGestor> {
    const firestore = getDb();
    const docRef = await addDoc(collection(firestore, GESTORES_COLLECTION), {
      ...gestor,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...gestor };
  },

  async update(id: string, data: Partial<IGestor>): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, GESTORES_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  async delete(id: string): Promise<void> {
    const firestore = getDb();
    const docRef = doc(firestore, GESTORES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Find gestor by email
  async getByEmail(email: string): Promise<IGestor | null> {
    const firestore = getDb();
    const q = query(
      collection(firestore, GESTORES_COLLECTION),
      where('email', '==', email.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as IGestor;
  },

  // Find gestor by userId
  async getByUserId(userId: string): Promise<IGestor | null> {
    const firestore = getDb();
    const q = query(
      collection(firestore, GESTORES_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as IGestor;
  },

  // Find gestor by municipality - returns the first active gestor covering that municipality
  // Comparación normalizada (NFD + sin diacríticos + lowercase) para tolerar
  // diferencias de acentos entre fuentes de datos (CUBA_PROVINCES vs Firestore).
  async findByMunicipality(municipality: string): Promise<IGestor | null> {
    const gestores = await this.getActive();
    const muniN = normalizeForMatch(municipality);
    return gestores.find((g) =>
      g.municipalities.some((m) => normalizeForMatch(m) === muniN)
    ) || null;
  },

  // Find gestor by exact name (case-insensitive). Mantenido por backward-
  // compat. La nueva ruta principal es findByLocation que combina
  // municipality + consejo (cuando aplica).
  async findByName(name: string): Promise<IGestor | null> {
    const gestores = await this.getActive();
    const normalized = name.toLowerCase().trim();
    return gestores.find((g) => g.name.toLowerCase().trim() === normalized) || null;
  },

  /**
   * Resuelve el gestor que cubre una ubicación específica.
   *
   * CONTRATO (enforced por la firma — recibe `province` precisamente para
   * decidir el modo de búsqueda):
   *
   * 1. Si `requiresConsejoPopular(province)` (La Habana) y NO se pasa
   *    `consejoPopular` → devuelve `null` inmediatamente. La invariante
   *    "La Habana requiere consejo" vive aquí, no en cada caller.
   * 2. Si se pasa `consejoPopular`: match estricto por el par
   *    (municipality, consejo) en `g.consejos[]`. Si no hay match → `null`.
   *    **NO** hacemos fallback al municipio — el cliente debe ver
   *    "no hay gestor en esta zona, selecciona uno cercano".
   * 3. Si la provincia no usa consejos (Matanzas, etc): match por
   *    `municipality` en `g.municipalities[]`.
   *
   * Cualquier caller que necesite el comportamiento viejo (fallback a
   * municipio para La Habana) debe pedirlo explícitamente llamando a
   * `findByMunicipality` aparte — pero ojo: eso rompe la precisión a
   * nivel consejo que es el punto del rollout.
   */
  async findByLocation(
    province: string,
    municipality: string,
    consejoPopular?: string,
  ): Promise<IGestor | null> {
    // (1) Invariante: La Habana requiere consejo
    if (requiresConsejoPopular(province) && !consejoPopular) {
      return null;
    }

    const gestores = await this.getActive();
    const muniN = normalizeForMatch(municipality);

    if (consejoPopular) {
      // (2) Match estricto (municipio, consejo); sin fallback al municipio
      const conN = normalizeForMatch(consejoPopular);
      const match = gestores.find((g) =>
        (g.consejos ?? []).some(
          (c) =>
            normalizeForMatch(c.municipality) === muniN &&
            normalizeForMatch(c.consejo) === conN,
        ),
      );
      return match ?? null;
    }

    // (3) Provincia sin consejos: lookup por municipio
    return (
      gestores.find((g) =>
        g.municipalities.some((m) => normalizeForMatch(m) === muniN),
      ) || null
    );
  },

  /**
   * Para la UX de "no hay gestor en tu consejo, prueba con estos cercanos":
   * devuelve hasta 3 pares (consejo, gestorName) del mismo municipio que SÍ
   * tienen cobertura.
   *
   * Orden = geográfico (orden de aparición en `localities.ts`), NO el orden
   * de documentos en Firestore. Antes podía pasar que un gestor con 5+
   * consejos consecutivos llenara el top-3 y otros gestores con consejos
   * relevantes nunca aparecieran. Ahora recorremos los consejos del
   * municipio en su orden de definición (geográfico) y vamos buscando
   * cuál gestor cubre cada uno.
   */
  async getCoveredConsejosInMunicipality(
    province: string,
    municipality: string,
  ): Promise<Array<{ consejo: string; gestorName: string }>> {
    const allConsejos = getConsejos(province, municipality);
    if (allConsejos.length === 0) return [];

    const gestores = await this.getActive();
    const muniN = normalizeForMatch(municipality);
    const result: Array<{ consejo: string; gestorName: string }> = [];

    for (const consejo of allConsejos) {
      const conN = normalizeForMatch(consejo);
      const g = gestores.find((gest) =>
        (gest.consejos ?? []).some(
          (c) =>
            normalizeForMatch(c.municipality) === muniN &&
            normalizeForMatch(c.consejo) === conN,
        ),
      );
      if (g) {
        result.push({ consejo, gestorName: g.name });
        if (result.length >= 3) break;
      }
    }
    return result;
  },

  // Seed initial gestores
  async seed(gestores: Omit<IGestor, 'id'>[]): Promise<number> {
    const firestore = getDb();
    let count = 0;
    for (const gestor of gestores) {
      await addDoc(collection(firestore, GESTORES_COLLECTION), {
        ...gestor,
        createdAt: Timestamp.now(),
      });
      count++;
    }
    return count;
  },
};

// ==================== ORDERS ====================

export const OrderService = {
  // Generate order number: SPH-YYYYMMDD-NNN
  async generateOrderNumber(): Promise<string> {
    const firestore = getDb();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SPH-${today}-`;

    // Count today's orders to get next number
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const q = query(
      collection(firestore, ORDERS_COLLECTION),
      where('createdAt', '>=', todayStart.toISOString()),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const nextNum = String(snapshot.size + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  },

  async create(data: {
    items: IOrderItem[];
    subtotal: number;
    province: string;
    municipality: string;
    gestorId?: string;
    gestorName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  }): Promise<IOrder> {
    const firestore = getDb();
    const orderNumber = await this.generateOrderNumber();
    const now = new Date().toISOString();

    const orderData = {
      orderNumber,
      items: data.items,
      subtotal: data.subtotal,
      status: 'pending' as OrderStatus,
      province: data.province,
      municipality: data.municipality,
      gestorId: data.gestorId || '',
      gestorName: data.gestorName || '',
      customerName: data.customerName || '',
      customerEmail: data.customerEmail || '',
      customerPhone: data.customerPhone || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(firestore, ORDERS_COLLECTION), orderData);
    return { id: docRef.id, ...orderData };
  },

  async getById(id: string): Promise<IOrder | null> {
    const firestore = getDb();
    const docRef = doc(firestore, ORDERS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as IOrder;
  },

  // Get orders for a specific gestor
  async getByGestorId(gestorId: string): Promise<IOrder[]> {
    const firestore = getDb();
    // Simple where query — sort client-side to avoid needing composite index
    const q = query(
      collection(firestore, ORDERS_COLLECTION),
      where('gestorId', '==', gestorId)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as IOrder);
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Get all orders (for admin)
  async getAll(): Promise<IOrder[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, ORDERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as IOrder);
  },

  // Update order status
  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, ORDERS_COLLECTION, id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  // Update order
  async update(id: string, data: Partial<IOrder>): Promise<void> {
    const firestore = getDb();
    await updateDoc(doc(firestore, ORDERS_COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  // Delete order
  async delete(id: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, ORDERS_COLLECTION, id));
  },

  // Get orders by customer email (for client portal)
  async getByCustomerEmail(email: string): Promise<IOrder[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, ORDERS_COLLECTION),
      where('customerEmail', '==', email)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as IOrder);
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Count orders by status for a gestor
  async countByStatus(gestorId: string): Promise<Record<OrderStatus, number>> {
    const orders = await this.getByGestorId(gestorId);
    const counts: Record<OrderStatus, number> = {
      pending: 0, confirmed: 0, in_transit: 0, delivered: 0, cancelled: 0,
    };
    orders.forEach((o) => { counts[o.status]++; });
    return counts;
  },
};

// ==================== GESTOR ACCOUNT (Create Auth user without logging out admin) ====================

export const GestorAccountService = {
  /**
   * Creates (or relinks) a Firebase Auth account for a gestor.
   *
   * Delegates ALL writes to the server-side API route
   * `/api/managers/create-account` which uses Firebase Admin SDK to
   * bypass Firestore security rules. Esto resuelve el bug intermitente
   * "Missing or insufficient permissions" del flow client-side anterior,
   * que necesitaba que las rules permitieran al admin actualizar
   * `users/{otroUid}` — algo frágil porque depende del role del propio
   * admin estando exactamente como 'admin' en su doc, y porque cualquier
   * setDoc de users/* cuyo doc no existía caía como create y luego al
   * re-intentarse caía como update con reglas distintas.
   *
   * El endpoint server-side:
   *  - Verifica el Firebase ID token del caller (admin).
   *  - Verifica que el caller tenga role=admin en Firestore.
   *  - Crea / re-enlaza el Auth user vía Admin SDK (sin necesidad de
   *    saber la password del user existente).
   *  - Escribe `users/{uid}` (merge) y actualiza `gestores/{id}` en un
   *    batch atómico.
   *  - Loguea cada etapa para diagnóstico.
   */
  async createAccount(data: {
    email: string;
    password: string;
    name: string;
    gestorId: string;
  }): Promise<{ userId: string }> {
    // Obtener el Firebase ID token del admin actual para autenticar al
    // endpoint. Sin esto el endpoint nos rechazará con 401.
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Debes iniciar sesión como admin para crear cuentas de gestor.');
    }
    const idToken = await currentUser.getIdToken();

    const res = await fetch('/api/managers/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        gestorId: data.gestorId,
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      userId?: string;
      error?: string;
      code?: string;
      detail?: string;
    };

    if (!res.ok || !json.success || !json.userId) {
      // Componer un mensaje útil para el admin con todo lo que el endpoint
      // pueda darnos. El form del admin ya lo muestra como `setError(...)`.
      const parts: string[] = [];
      if (json.error) parts.push(json.error);
      if (json.code) parts.push(`(${json.code})`);
      if (json.detail) parts.push(`— ${json.detail}`);
      throw new Error(
        parts.join(' ') || `Error ${res.status} al crear la cuenta del gestor.`,
      );
    }

    return { userId: json.userId };
  },

  /**
   * Deletes a gestor's associated Firestore user doc and calls the server
   * API to delete the Firebase Auth account (requires Admin SDK on server).
   */
  async deleteAccount(gestorId: string, userId: string, adminToken: string): Promise<void> {
    const firestore = getDb();

    // Delete the user doc from Firestore
    try {
      await deleteDoc(doc(firestore, USERS_COLLECTION, userId));
    } catch {
      // User doc may not exist
    }

    // Clear userId/email from the gestor doc
    try {
      await updateDoc(doc(firestore, GESTORES_COLLECTION, gestorId), {
        userId: '',
        email: '',
      });
    } catch {
      // Gestor may already be deleted
    }

    // Call server API to delete Firebase Auth user
    await fetch('/api/managers/delete-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId }),
    });
  },
};

// ==================== REVIEWS ====================

export const ReviewService = {
  async getByProductId(productId: string): Promise<IReview[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, REVIEWS_COLLECTION),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IReview[];
    // Sort client-side to avoid requiring a composite index
    return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getAll(): Promise<IReview[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, REVIEWS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IReview[];
  },

  async create(data: Omit<IReview, 'id'>): Promise<IReview> {
    const firestore = getDb();

    // Save the review
    const docRef = await addDoc(collection(firestore, REVIEWS_COLLECTION), data);
    const newReview = { id: docRef.id, ...data };

    // Recalculate product rating
    await this.recalculateProductRating(data.productId);

    return newReview;
  },

  async delete(id: string, productId: string): Promise<void> {
    const firestore = getDb();
    await deleteDoc(doc(firestore, REVIEWS_COLLECTION, id));

    // Recalculate product rating after deletion
    await this.recalculateProductRating(productId);
  },

  async getUserReviewForProduct(userId: string, productId: string): Promise<IReview | null> {
    const firestore = getDb();
    const q = query(
      collection(firestore, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as IReview;
  },

  async checkVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    const firestore = getDb();
    // Check if user has a delivered order containing this product
    const q = query(
      collection(firestore, ORDERS_COLLECTION),
      where('status', '==', 'delivered')
    );
    const snapshot = await getDocs(q);
    // Filter client-side for orders from this user that contain the product
    return snapshot.docs.some((doc) => {
      const order = doc.data() as IOrder;
      // Match by customerEmail or customerPhone — orders don't store userId directly
      return order.items.some((item) => item.productId === productId);
    });
  },

  async getByUserId(userId: string): Promise<IReview[]> {
    const firestore = getDb();
    const q = query(
      collection(firestore, REVIEWS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IReview[];
    return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async recalculateProductRating(productId: string): Promise<void> {
    const firestore = getDb();
    // Use a simple query without orderBy to avoid requiring a composite index
    const q = query(
      collection(firestore, REVIEWS_COLLECTION),
      where('productId', '==', productId)
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    const avgRating = count > 0
      ? Math.round((snapshot.docs.reduce((sum, d) => sum + (d.data().rating || 0), 0) / count) * 10) / 10
      : 0;
    await updateDoc(doc(firestore, PRODUCTS_COLLECTION, productId), {
      rating: avgRating,
      reviews_count: count,
    });
  },
};
