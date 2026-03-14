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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, deleteUser, Auth, getAuth } from 'firebase/auth';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { db, auth } from './firebase';
import { IProduct, ICategory, IGestor, IOrder, IOrderItem, OrderStatus } from '@/entities/all';
import { User, UserRole } from '@/store/AuthContext';

// Collection names
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const USERS_COLLECTION = 'users';
const SUBSCRIBERS_COLLECTION = 'subscribers';
const NEWSLETTERS_COLLECTION = 'newsletters';
const GESTORES_COLLECTION = 'gestores';
const ORDERS_COLLECTION = 'orders';

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
  async findByMunicipality(municipality: string): Promise<IGestor | null> {
    const gestores = await this.getActive();
    const normalizedMuni = municipality.toLowerCase().trim();
    return gestores.find((g) =>
      g.municipalities.some((m) => m.toLowerCase().trim() === normalizedMuni)
    ) || null;
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
   * Creates a Firebase Auth account for a gestor using a secondary Firebase app instance.
   * This prevents the admin from being logged out when creating a new user.
   * Also creates the `users` doc with role: 'manager' and links gestorId.
   */
  async createAccount(data: {
    email: string;
    password: string;
    name: string;
    gestorId: string;
  }): Promise<{ userId: string }> {
    const firestore = getDb();

    // Create a secondary Firebase app to avoid logging out the admin
    const secondaryAppName = `gestor-creator-${Date.now()}`;
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };

    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      let uid: string;

      try {
        // Try to create a new user
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          data.email,
          data.password
        );
        uid = userCredential.user.uid;
        await updateProfile(userCredential.user, { displayName: data.name });
        await secondaryAuth.signOut();
      } catch (createErr) {
        const err = createErr as { code?: string };
        if (err.code === 'auth/email-already-in-use') {
          // Email already exists — sign in to get the UID and relink
          const existingCred = await signInWithEmailAndPassword(
            secondaryAuth,
            data.email,
            data.password
          );
          uid = existingCred.user.uid;
          await secondaryAuth.signOut();
        } else {
          throw createErr;
        }
      }

      // Create/update the users doc in Firestore with role: 'manager'
      await setDoc(doc(firestore, USERS_COLLECTION, uid), {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: 'manager' as UserRole,
        gestorId: data.gestorId,
        createdAt: Timestamp.now(),
      });

      // Update the gestor doc with the userId and email
      await updateDoc(doc(firestore, GESTORES_COLLECTION, data.gestorId), {
        userId: uid,
        email: data.email.trim().toLowerCase(),
      });

      return { userId: uid };
    } finally {
      // Clean up the secondary app
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
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
    await fetch('/api/gestores/delete-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId }),
    });
  },
};
