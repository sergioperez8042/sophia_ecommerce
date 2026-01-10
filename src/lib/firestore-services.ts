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
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from './firebase';
import { IProduct, ICategory } from '@/entities/all';
import { User, UserRole } from '@/store/AuthContext';

// Collection names
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const USERS_COLLECTION = 'users';

// ==================== PRODUCTS ====================

export const ProductService = {
  // Get all products
  async getAll(orderByField?: string): Promise<IProduct[]> {
    const constraints: QueryConstraint[] = [];
    
    if (orderByField) {
      const direction = orderByField.startsWith('-') ? 'desc' : 'asc';
      const field = orderByField.replace('-', '');
      constraints.push(orderBy(field, direction));
    }

    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as IProduct[];
  },

  // Get product by ID
  async getById(id: string): Promise<IProduct | null> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as IProduct;
    }
    return null;
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<IProduct[]> {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
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
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
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
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
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
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...product,
      created_date: new Date().toISOString(),
    });
    
    return { id: docRef.id, ...product, created_date: new Date().toISOString() };
  },

  // Update product
  async update(id: string, data: Partial<IProduct>): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
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
    for (const product of products) {
      const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
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
    const constraints: QueryConstraint[] = [];
    
    if (orderByField) {
      constraints.push(orderBy(orderByField));
    }

    const q = query(collection(db, CATEGORIES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ICategory[];
  },

  // Get active categories
  async getActive(): Promise<ICategory[]> {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
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
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ICategory;
    }
    return null;
  },

  // Create category
  async create(category: Omit<ICategory, 'id'>): Promise<ICategory> {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), category);
    return { id: docRef.id, ...category };
  },

  // Update category
  async update(id: string, data: Partial<ICategory>): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Seed categories from JSON (for initial setup)
  async seedFromJSON(categories: ICategory[]): Promise<void> {
    for (const category of categories) {
      const docRef = doc(db, CATEGORIES_COLLECTION, category.id);
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
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  // Get users by role
  async getByRole(role: UserRole): Promise<User[]> {
    const q = query(
      collection(db, USERS_COLLECTION),
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
    const docRef = doc(db, USERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  // Update user
  async update(id: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(docRef, data as DocumentData);
  },

  // Delete user (Firestore only, does not delete from Auth)
  async delete(id: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Seed initial users (creates in both Auth and Firestore)
  async seedUsers(users: SeedUserData[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    for (const userData of users) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
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
        await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userProfile);
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
    const q = query(
      collection(db, USERS_COLLECTION),
      where('role', '==', role)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};
