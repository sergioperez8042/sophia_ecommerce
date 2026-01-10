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
import { createUserWithEmailAndPassword, updateProfile, Auth } from 'firebase/auth';
import { db, auth } from './firebase';
import { IProduct, ICategory } from '@/entities/all';
import { User, UserRole } from '@/store/AuthContext';

// Collection names
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const USERS_COLLECTION = 'users';

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
      });
    }
  },
};

// ==================== CATEGORIES ====================

export const CategoryService = {
  // Get all categories
  async getAll(orderByField?: string): Promise<ICategory[]> {
    const firestore = getDb();
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
  },

  // Get active categories
  async getActive(): Promise<ICategory[]> {
    const firestore = getDb();
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
