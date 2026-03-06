import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CategoryProvider, useCategories } from './CategoryContext';
import { ICategory } from '@/entities/all';

// --- Mocks ---

jest.mock('@/lib/firestore-services', () => ({
  CategoryService: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/firebase', () => ({
  db: {}, // non-null so isFirebaseReady returns true
}));

// Get reference to the mocked service after jest.mock hoisting
import { CategoryService } from '@/lib/firestore-services';
const mockCategoryService = CategoryService as jest.Mocked<typeof CategoryService>;

function wrapper({ children }: { children: React.ReactNode }) {
  return <CategoryProvider>{children}</CategoryProvider>;
}

const createMockCategory = (overrides: Partial<ICategory> = {}): ICategory => ({
  id: 'cat-1',
  name: 'Cuidado Facial',
  description: 'Productos para el rostro',
  image: '/img/facial.jpg',
  sort_order: 1,
  active: true,
  product_count: 5,
  ...overrides,
});

describe('CategoryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategoryService.getAll.mockResolvedValue([]);
  });

  describe('Estado inicial', () => {
    it('debe iniciar cargando y con una lista vacia', () => {
      mockCategoryService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.categories).toEqual([]);
    });

    it('debe cargar categorias desde el servicio al montar', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Facial' }),
        createMockCategory({ id: 'cat-2', name: 'Corporal' }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toHaveLength(2);
    });

    it('debe establecer error cuando falla la carga', async () => {
      mockCategoryService.getAll.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error al cargar las categorías');
      expect(result.current.categories).toEqual([]);
    });
  });

  describe('activeCategories', () => {
    it('debe retornar solo categorias activas', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', active: true }),
        createMockCategory({ id: 'cat-2', active: false }),
        createMockCategory({ id: 'cat-3', active: true }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeCategories).toHaveLength(2);
      expect(result.current.activeCategories.every(c => c.active)).toBe(true);
    });
  });

  describe('rootCategories', () => {
    it('debe retornar categorias sin parent_id', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', parent_id: undefined }),
        createMockCategory({ id: 'cat-2', parent_id: 'cat-1' }),
        createMockCategory({ id: 'cat-3', parent_id: undefined }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rootCategories).toHaveLength(2);
    });
  });

  describe('activeRootCategories', () => {
    it('debe retornar categorias raiz activas', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', active: true, parent_id: undefined }),
        createMockCategory({ id: 'cat-2', active: false, parent_id: undefined }),
        createMockCategory({ id: 'cat-3', active: true, parent_id: 'cat-1' }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeRootCategories).toHaveLength(1);
      expect(result.current.activeRootCategories[0].id).toBe('cat-1');
    });
  });

  describe('getCategory', () => {
    it('debe retornar una categoria por su ID', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Facial' }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getCategory('cat-1')?.name).toBe('Facial');
    });

    it('debe retornar undefined para un ID inexistente', async () => {
      mockCategoryService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getCategory('nonexistent')).toBeUndefined();
    });
  });

  describe('getChildren', () => {
    it('debe retornar los hijos de una categoria ordenados por sort_order', async () => {
      const categories = [
        createMockCategory({ id: 'parent', parent_id: undefined }),
        createMockCategory({ id: 'child-2', parent_id: 'parent', sort_order: 2, name: 'Segundo' }),
        createMockCategory({ id: 'child-1', parent_id: 'parent', sort_order: 1, name: 'Primero' }),
        createMockCategory({ id: 'other', parent_id: 'other-parent', sort_order: 1 }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const children = result.current.getChildren('parent');
      expect(children).toHaveLength(2);
      expect(children[0].name).toBe('Primero');
      expect(children[1].name).toBe('Segundo');
    });

    it('debe retornar lista vacia si no tiene hijos', async () => {
      mockCategoryService.getAll.mockResolvedValue([
        createMockCategory({ id: 'cat-1' }),
      ]);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getChildren('cat-1')).toEqual([]);
    });
  });

  describe('getActiveChildren', () => {
    it('debe retornar solo hijos activos de una categoria', async () => {
      const categories = [
        createMockCategory({ id: 'parent' }),
        createMockCategory({ id: 'child-1', parent_id: 'parent', active: true }),
        createMockCategory({ id: 'child-2', parent_id: 'parent', active: false }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const activeChildren = result.current.getActiveChildren('parent');
      expect(activeChildren).toHaveLength(1);
      expect(activeChildren[0].id).toBe('child-1');
    });
  });

  describe('getCategoryPath', () => {
    it('debe retornar la ruta completa desde la raiz hasta la categoria', async () => {
      const categories = [
        createMockCategory({ id: 'root', name: 'Raiz', parent_id: undefined }),
        createMockCategory({ id: 'mid', name: 'Medio', parent_id: 'root' }),
        createMockCategory({ id: 'leaf', name: 'Hoja', parent_id: 'mid' }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const path = result.current.getCategoryPath('leaf');
      expect(path).toHaveLength(3);
      expect(path[0].name).toBe('Raiz');
      expect(path[1].name).toBe('Medio');
      expect(path[2].name).toBe('Hoja');
    });

    it('debe retornar solo la categoria si es una raiz', async () => {
      const categories = [
        createMockCategory({ id: 'root', name: 'Raiz', parent_id: undefined }),
      ];
      mockCategoryService.getAll.mockResolvedValue(categories);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const path = result.current.getCategoryPath('root');
      expect(path).toHaveLength(1);
      expect(path[0].name).toBe('Raiz');
    });

    it('debe retornar array vacio para un ID inexistente', async () => {
      mockCategoryService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getCategoryPath('nonexistent')).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('debe crear una categoria nueva y refrescar la lista', async () => {
      mockCategoryService.getAll.mockResolvedValue([]);
      const newCategory = createMockCategory({ id: 'new-1', name: 'Nueva' });
      mockCategoryService.create.mockResolvedValue(newCategory);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After create, refreshCategories is called, so mock getAll again
      mockCategoryService.getAll.mockResolvedValue([newCategory]);

      let created: ICategory;
      await act(async () => {
        created = await result.current.createCategory({
          name: 'Nueva',
          description: 'Desc',
          image: '/img/new.jpg',
          sort_order: 1,
          active: true,
          product_count: 0,
        });
      });

      expect(created!.name).toBe('Nueva');
      expect(mockCategoryService.create).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('debe actualizar una categoria y refrescar la lista', async () => {
      const categories = [createMockCategory({ id: 'cat-1', name: 'Original' })];
      mockCategoryService.getAll.mockResolvedValue(categories);
      mockCategoryService.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After update, refreshCategories is called
      mockCategoryService.getAll.mockResolvedValue([
        createMockCategory({ id: 'cat-1', name: 'Actualizada' }),
      ]);

      await act(async () => {
        await result.current.updateCategory('cat-1', { name: 'Actualizada' });
      });

      expect(mockCategoryService.update).toHaveBeenCalledWith('cat-1', { name: 'Actualizada' });
    });
  });

  describe('deleteCategory', () => {
    it('debe eliminar una categoria y refrescar la lista', async () => {
      const categories = [createMockCategory({ id: 'cat-1' })];
      mockCategoryService.getAll.mockResolvedValue(categories);
      mockCategoryService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After delete, refreshCategories is called
      mockCategoryService.getAll.mockResolvedValue([]);

      await act(async () => {
        await result.current.deleteCategory('cat-1');
      });

      expect(mockCategoryService.delete).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('refreshCategories', () => {
    it('debe recargar categorias desde el servicio', async () => {
      mockCategoryService.getAll.mockResolvedValueOnce([createMockCategory({ id: 'cat-1' })]);

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toHaveLength(1);

      mockCategoryService.getAll.mockResolvedValueOnce([
        createMockCategory({ id: 'cat-1' }),
        createMockCategory({ id: 'cat-2' }),
      ]);

      await act(async () => {
        await result.current.refreshCategories();
      });

      expect(result.current.categories).toHaveLength(2);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useCategories fuera del CategoryProvider', () => {
      expect(() => {
        renderHook(() => useCategories());
      }).toThrow('useCategories must be used within a CategoryProvider');
    });
  });
});
