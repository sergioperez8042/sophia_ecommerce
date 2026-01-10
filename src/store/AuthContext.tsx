"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validate email format
const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

// Types
export type UserRole = 'admin' | 'manager' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  // Solo para gestores
  managerCode?: string;
  zone?: string;
  // Para clientes
  address?: string;
  city?: string;
  createdAt?: Date;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoaded: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: { user: User | null; firebaseUser: FirebaseUser | null } }
  | { type: 'SET_LOADED' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

interface AuthContextType {
  user: User | null;
  isLoaded: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  getManagers: () => Promise<User[]>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'manager' | 'client';
  zone?: string;
}

const USERS_COLLECTION = 'users';

// Generate manager code
const generateManagerCode = async (): Promise<string> => {
  if (!db) return 'MGR-001';

  const managersQuery = query(
    collection(db, USERS_COLLECTION),
    where('role', '==', 'manager')
  );
  const snapshot = await getDocs(managersQuery);
  const count = snapshot.size + 1;
  return `MGR-${String(count).padStart(3, '0')}`;
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        firebaseUser: action.payload.firebaseUser,
        isLoaded: true,
        isAuthenticated: action.payload.user !== null
      };

    case 'SET_LOADED':
      return {
        ...state,
        isLoaded: true
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        firebaseUser: null,
        isAuthenticated: false
      };

    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    firebaseUser: null,
    isLoaded: false,
    isAuthenticated: false
  });

  // Get user profile from Firestore
  const getUserProfile = useCallback(async (uid: string): Promise<User | null> => {
    if (!db) return null;

    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore Timestamp to Date
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : data.createdAt;
        return { id: docSnap.id, ...data, createdAt } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    // Guard: If Firebase is not initialized, mark as loaded with no user
    if (!auth) {
      dispatch({ type: 'SET_LOADED' });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);

        if (userProfile) {
          dispatch({
            type: 'SET_USER',
            payload: { user: userProfile, firebaseUser }
          });
        } else {
          // User exists in Auth but not in Firestore (shouldn't happen normally)
          console.warn('User exists in Auth but not in Firestore');
          dispatch({
            type: 'SET_USER',
            payload: { user: null, firebaseUser: null }
          });
        }
      } else {
        // User is signed out
        dispatch({
          type: 'SET_USER',
          payload: { user: null, firebaseUser: null }
        });
      }
    });

    return () => unsubscribe();
  }, [getUserProfile]);

  // Login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth || !db) {
      return { success: false, error: 'Firebase no está inicializado' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let userProfile = await getUserProfile(userCredential.user.uid);

      // If user exists in Auth but not in Firestore, create the profile
      if (!userProfile) {
        console.log('Creating missing Firestore profile for user:', userCredential.user.uid);
        const newProfile: Omit<User, 'id'> = {
          name: userCredential.user.displayName || email.split('@')[0],
          email: userCredential.user.email || email,
          role: 'client',
          createdAt: new Date(),
        };

        await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), newProfile);
        userProfile = { id: userCredential.user.uid, ...newProfile };

        dispatch({
          type: 'SET_USER',
          payload: { user: userProfile, firebaseUser: userCredential.user }
        });
      }

      return { success: true };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      console.error('Login error:', firebaseError);

      // Map Firebase error codes to Spanish messages
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/invalid-credential': 'Credenciales inválidas',
      };

      const errorMessage = errorMessages[firebaseError.code || ''] || 'Error al iniciar sesión';
      return { success: false, error: errorMessage };
    }
  };

  // Register
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    // Validate email format
    if (!isValidEmail(userData.email)) {
      return { success: false, error: 'Formato de email inválido' };
    }

    if (!auth || !db) {
      return { success: false, error: 'Firebase no está inicializado' };
    }

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

      // Add manager-specific fields
      if (userData.role === 'manager') {
        const managerCode = await generateManagerCode();
        Object.assign(userProfile, {
          managerCode,
          zone: userData.zone || 'Sin asignar',
        });
      }

      // Save to Firestore
      await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userProfile);

      return { success: true };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      console.error('Register error:', firebaseError);

      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/invalid-email': 'Email inválido',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/operation-not-allowed': 'Registro no permitido',
      };

      const errorMessage = errorMessages[firebaseError.code || ''] || 'Error al registrarse';
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateUser = async (data: Partial<User>) => {
    if (!state.user || !state.firebaseUser || !db) return;

    try {
      // Update Firestore
      const docRef = doc(db, USERS_COLLECTION, state.user.id);
      await setDoc(docRef, data, { merge: true });

      // Update local state
      dispatch({ type: 'UPDATE_USER', payload: data });

      // Update Firebase Auth profile if name changed
      if (data.name) {
        await updateProfile(state.firebaseUser, { displayName: data.name });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Get all managers
  const getManagers = async (): Promise<User[]> => {
    if (!db) return [];

    try {
      const managersQuery = query(
        collection(db, USERS_COLLECTION),
        where('role', '==', 'manager')
      );
      const snapshot = await getDocs(managersQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error getting managers:', error);
      return [];
    }
  };

  const value: AuthContextType = {
    user: state.user,
    isLoaded: state.isLoaded,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.user?.role === 'admin',
    isManager: state.user?.role === 'manager',
    isClient: state.user?.role === 'client',
    login,
    register,
    logout,
    updateUser,
    getManagers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
