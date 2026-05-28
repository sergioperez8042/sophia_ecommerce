import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// --- Mocks ---

const mockOnAuthStateChanged = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateProfile = jest.fn();
const mockSendPasswordResetEmail = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
}));

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();

jest.mock('firebase/firestore', () => {
  // Define mock Timestamp class inside the factory so it is available at mock-hoist time
  class MockTimestamp {
    static now() {
      return new MockTimestamp();
    }
    toDate() {
      return new Date('2024-01-01');
    }
  }

  return {
    doc: jest.fn((...args: unknown[]) => ({ path: args.join('/') })),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    collection: jest.fn((...args: unknown[]) => ({ path: args.join('/') })),
    query: jest.fn((...args: unknown[]) => args),
    where: jest.fn(),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    Timestamp: MockTimestamp,
  };
});

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

// El login/logout/hidratación ahora pasan por el cliente server-side
// (cookie httpOnly). Mockeamos ese módulo. Por defecto fetchSession
// devuelve null → AuthContext cae al fallback del SDK (onAuthStateChanged),
// que es lo que prueban los tests de detección de usuario.
const mockLoginViaServer = jest.fn();
const mockFetchSession = jest.fn();
const mockLogoutViaServer = jest.fn();

jest.mock('@/lib/auth-client', () => ({
  loginViaServer: (...args: unknown[]) => mockLoginViaServer(...args),
  fetchSession: (...args: unknown[]) => mockFetchSession(...args),
  logoutViaServer: (...args: unknown[]) => mockLogoutViaServer(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no user authenticated
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
      callback(null);
      return jest.fn(); // unsubscribe
    });
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
    mockSetDoc.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
    mockUpdateProfile.mockResolvedValue(undefined);
    // Sin sesión por cookie por defecto → fallback al SDK
    mockFetchSession.mockResolvedValue(null);
    mockLogoutViaServer.mockResolvedValue(undefined);
  });

  describe('Estado inicial', () => {
    it('debe iniciar sin usuario autenticado', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
      expect(result.current.isClient).toBe(false);
    });

    it('debe establecer isLoaded en true despues de verificar el estado de auth', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });
    });
  });

  describe('Deteccion de usuario autenticado via onAuthStateChanged', () => {
    it('debe establecer el usuario cuando Firebase reporta un usuario logueado', async () => {
      const mockUserProfile = {
        name: 'Ana Garcia',
        email: 'ana@test.com',
        role: 'client' as const,
      };

      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'user-123' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => mockUserProfile,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.user?.name).toBe('Ana Garcia');
      expect(result.current.user?.email).toBe('ana@test.com');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isClient).toBe(true);
    });

    it('debe detectar correctamente el rol de admin', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'admin-1' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'admin-1',
        data: () => ({ name: 'Admin', email: 'admin@test.com', role: 'admin' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      expect(result.current.isManager).toBe(false);
      expect(result.current.isClient).toBe(false);
    });

    it('debe detectar correctamente el rol de manager', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'mgr-1' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'mgr-1',
        data: () => ({ name: 'Manager', email: 'mgr@test.com', role: 'manager', managerCode: 'MGR-001' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isManager).toBe(true);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isClient).toBe(false);
    });

    it('debe manejar el caso de usuario en Auth pero sin perfil en Firestore', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'orphan-user' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('debe retornar exito al hacer login correctamente', async () => {
      mockLoginViaServer.mockResolvedValue({
        user: { id: 'user-123', name: 'Test', email: 'test@test.com', role: 'client' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'password123');
      });

      expect(loginResult!.success).toBe(true);
      expect(mockLoginViaServer).toHaveBeenCalledWith('test@test.com', 'password123');
      // login de cliente NO debe encender el SDK
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('debe encender el SDK cliente cuando el rol es admin', async () => {
      mockLoginViaServer.mockResolvedValue({
        user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
      });
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'admin-1', email: 'admin@test.com' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('admin@test.com', 'secret123');
      });

      expect(loginResult!.success).toBe(true);
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
    });

    it('debe retornar error al fallar el login con credenciales invalidas', async () => {
      mockLoginViaServer.mockResolvedValue({ error: 'Credenciales inválidas' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('wrong@test.com', 'bad-password');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Credenciales inválidas');
    });

    it('debe retornar error cuando el usuario no existe', async () => {
      mockLoginViaServer.mockResolvedValue({ error: 'Usuario no encontrado' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('noexist@test.com', 'pass');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Usuario no encontrado');
    });

    it('debe retornar error generico si el cliente server lanza', async () => {
      mockLoginViaServer.mockRejectedValue(new Error('Network down'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('x@test.com', 'pass');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Error al iniciar sesión');
    });
  });

  describe('register', () => {
    it('debe registrar un cliente exitosamente', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'new-user-1', email: 'new@test.com', displayName: null },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let regResult: { success: boolean; error?: string };
      await act(async () => {
        regResult = await result.current.register({
          name: 'Nuevo Usuario',
          email: 'new@test.com',
          password: 'password123',
          role: 'client',
        });
      });

      expect(regResult!.success).toBe(true);
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('debe retornar error cuando el email ya esta registrado', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      mockCreateUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let regResult: { success: boolean; error?: string };
      await act(async () => {
        regResult = await result.current.register({
          name: 'Dup User',
          email: 'dup@test.com',
          password: 'password123',
          role: 'client',
        });
      });

      expect(regResult!.success).toBe(false);
      expect(regResult!.error).toBe('Este email ya está registrado');
    });

    it('debe retornar error por contrasena debil', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      mockCreateUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/weak-password',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let regResult: { success: boolean; error?: string };
      await act(async () => {
        regResult = await result.current.register({
          name: 'User',
          email: 'user@test.com',
          password: '123',
          role: 'client',
        });
      });

      expect(regResult!.success).toBe(false);
      expect(regResult!.error).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('debe retornar error por formato de email invalido', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let regResult: { success: boolean; error?: string };
      await act(async () => {
        regResult = await result.current.register({
          name: 'User',
          email: 'not-an-email',
          password: 'password123',
          role: 'client',
        });
      });

      expect(regResult!.success).toBe(false);
      expect(regResult!.error).toBe('Formato de email inválido');
    });
  });

  describe('resetPassword', () => {
    it('debe enviar email de recuperacion exitosamente', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let resetResult: { success: boolean; error?: string };
      await act(async () => {
        resetResult = await result.current.resetPassword('user@test.com');
      });

      expect(resetResult!.success).toBe(true);
      expect(mockSendPasswordResetEmail).toHaveBeenCalled();
    });

    it('debe retornar error por formato de email invalido en reset', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: null) => void) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      let resetResult: { success: boolean; error?: string };
      await act(async () => {
        resetResult = await result.current.resetPassword('bad-email');
      });

      expect(resetResult!.success).toBe(false);
      expect(resetResult!.error).toBe('Formato de email inválido');
    });
  });

  describe('logout', () => {
    it('debe cerrar sesion y limpiar el estado del usuario', async () => {
      // Start with a user
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'user-123' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => ({ name: 'User', email: 'user@test.com', role: 'client' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Roles del usuario', () => {
    it('isAdmin debe ser true solo para rol admin', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'a1' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'a1',
        data: () => ({ name: 'Admin', email: 'admin@test.com', role: 'admin' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      expect(result.current.isManager).toBe(false);
      expect(result.current.isClient).toBe(false);
    });

    it('isManager debe ser true solo para rol manager', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'm1' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'm1',
        data: () => ({ name: 'Mgr', email: 'mgr@test.com', role: 'manager' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isManager).toBe(true);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isClient).toBe(false);
    });

    it('isClient debe ser true solo para rol client', async () => {
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: { uid: string }) => void) => {
        callback({ uid: 'c1' });
        return jest.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'c1',
        data: () => ({ name: 'Client', email: 'client@test.com', role: 'client' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isClient).toBe(true);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isManager).toBe(false);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useAuth fuera del AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});
