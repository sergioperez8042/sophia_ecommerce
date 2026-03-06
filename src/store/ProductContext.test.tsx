import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProductProvider, useProducts } from './ProductContext';
import { IProduct } from '@/entities/all';

// --- Mocks ---

jest.mock('@/lib/firestore-services', () => ({
  ProductService: {
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
import { ProductService } from '@/lib/firestore-services';
const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

function wrapper({ children }: { children: React.ReactNode }) {
  return <ProductProvider>{children}</ProductProvider>;
}

const createMockProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
  id: 'prod-1',
  name: 'Crema Hidratante',
  description: 'Crema para piel seca',
  price: 29.99,
  category_id: 'cat-1',
  image: '/img/crema.jpg',
  rating: 4.5,
  reviews_count: 10,
  tags: ['hidratante', 'piel-seca'],
  ingredients: ['aloe vera', 'vitamina E'],
  active: true,
  created_date: '2024-01-01T00:00:00Z',
  featured: false,
  ...overrides,
});

describe('ProductContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProductService.getAll.mockResolvedValue([]);
  });

  describe('Estado inicial', () => {
    it('debe iniciar con una lista de productos vacia y cargando', () => {
      mockProductService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('debe cargar productos desde el servicio al montar', async () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Producto 1' }),
        createMockProduct({ id: 'p2', name: 'Producto 2' }),
      ];
      mockProductService.getAll.mockResolvedValue(products);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toHaveLength(2);
      expect(result.current.products[0].name).toBe('Producto 1');
    });

    it('debe establecer error cuando falla la carga de productos', async () => {
      mockProductService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Error al cargar productos');
      expect(result.current.products).toEqual([]);
    });
  });

  describe('getProducts', () => {
    it('debe retornar todos los productos', async () => {
      const products = [
        createMockProduct({ id: 'p1' }),
        createMockProduct({ id: 'p2' }),
      ];
      mockProductService.getAll.mockResolvedValue(products);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getProducts()).toHaveLength(2);
    });
  });

  describe('getProductById', () => {
    it('debe retornar un producto por su ID', async () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Crema' }),
        createMockProduct({ id: 'p2', name: 'Serum' }),
      ];
      mockProductService.getAll.mockResolvedValue(products);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = result.current.getProductById('p1');
      expect(product?.name).toBe('Crema');
    });

    it('debe retornar undefined para un ID que no existe', async () => {
      mockProductService.getAll.mockResolvedValue([createMockProduct()]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getProductById('nonexistent')).toBeUndefined();
    });
  });

  describe('getProductsByCategory', () => {
    it('debe retornar productos activos de una categoria', async () => {
      const products = [
        createMockProduct({ id: 'p1', category_id: 'cat-1', active: true }),
        createMockProduct({ id: 'p2', category_id: 'cat-1', active: false }),
        createMockProduct({ id: 'p3', category_id: 'cat-2', active: true }),
      ];
      mockProductService.getAll.mockResolvedValue(products);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const catProducts = result.current.getProductsByCategory('cat-1');
      expect(catProducts).toHaveLength(1);
      expect(catProducts[0].id).toBe('p1');
    });

    it('debe retornar lista vacia para categoria sin productos', async () => {
      mockProductService.getAll.mockResolvedValue([createMockProduct({ category_id: 'cat-1' })]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getProductsByCategory('cat-99')).toEqual([]);
    });
  });

  describe('getFeaturedProducts', () => {
    it('debe retornar solo productos destacados y activos', async () => {
      const products = [
        createMockProduct({ id: 'p1', featured: true, active: true }),
        createMockProduct({ id: 'p2', featured: true, active: false }),
        createMockProduct({ id: 'p3', featured: false, active: true }),
      ];
      mockProductService.getAll.mockResolvedValue(products);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const featured = result.current.getFeaturedProducts();
      expect(featured).toHaveLength(1);
      expect(featured[0].id).toBe('p1');
    });
  });

  describe('addProduct', () => {
    it('debe agregar un producto nuevo', async () => {
      mockProductService.getAll.mockResolvedValue([]);
      const newProduct = createMockProduct({ id: 'new-1', name: 'Nuevo Producto' });
      mockProductService.create.mockResolvedValue(newProduct);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let addedProduct: IProduct;
      await act(async () => {
        addedProduct = await result.current.addProduct({
          name: 'Nuevo Producto',
          description: 'Descripcion',
          price: 29.99,
          category_id: 'cat-1',
          image: '/img/new.jpg',
          rating: 0,
          reviews_count: 0,
          tags: [],
          ingredients: [],
          active: true,
          featured: false,
        });
      });

      expect(addedProduct!.name).toBe('Nuevo Producto');
      expect(result.current.products).toHaveLength(1);
    });
  });

  describe('updateProduct', () => {
    it('debe actualizar un producto existente', async () => {
      const products = [createMockProduct({ id: 'p1', name: 'Original' })];
      mockProductService.getAll.mockResolvedValue(products);
      mockProductService.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updated: IProduct | null;
      await act(async () => {
        updated = await result.current.updateProduct('p1', { name: 'Actualizado' });
      });

      expect(updated!).not.toBeNull();
      expect(updated!.name).toBe('Actualizado');
      expect(result.current.products[0].name).toBe('Actualizado');
    });

    it('debe retornar null al actualizar un producto que no existe', async () => {
      mockProductService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updated: IProduct | null;
      await act(async () => {
        updated = await result.current.updateProduct('nonexistent', { name: 'X' });
      });

      expect(updated!).toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('debe eliminar un producto existente', async () => {
      const products = [createMockProduct({ id: 'p1' }), createMockProduct({ id: 'p2' })];
      mockProductService.getAll.mockResolvedValue(products);
      mockProductService.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleted: boolean;
      await act(async () => {
        deleted = await result.current.deleteProduct('p1');
      });

      expect(deleted!).toBe(true);
      expect(result.current.products).toHaveLength(1);
      expect(result.current.products[0].id).toBe('p2');
    });

    it('debe retornar false al eliminar un producto que no existe', async () => {
      mockProductService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleted: boolean;
      await act(async () => {
        deleted = await result.current.deleteProduct('nonexistent');
      });

      expect(deleted!).toBe(false);
    });
  });

  describe('toggleProductActive', () => {
    it('debe cambiar el estado activo de un producto', async () => {
      const products = [createMockProduct({ id: 'p1', active: true })];
      mockProductService.getAll.mockResolvedValue(products);
      mockProductService.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let toggled: boolean;
      await act(async () => {
        toggled = await result.current.toggleProductActive('p1');
      });

      expect(toggled!).toBe(true);
      expect(result.current.products[0].active).toBe(false);
    });

    it('debe retornar false si el producto no existe', async () => {
      mockProductService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let toggled: boolean;
      await act(async () => {
        toggled = await result.current.toggleProductActive('nonexistent');
      });

      expect(toggled!).toBe(false);
    });
  });

  describe('toggleProductFeatured', () => {
    it('debe cambiar el estado destacado de un producto', async () => {
      const products = [createMockProduct({ id: 'p1', featured: false })];
      mockProductService.getAll.mockResolvedValue(products);
      mockProductService.update.mockResolvedValue(undefined);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let toggled: boolean;
      await act(async () => {
        toggled = await result.current.toggleProductFeatured('p1');
      });

      expect(toggled!).toBe(true);
      expect(result.current.products[0].featured).toBe(true);
    });
  });

  describe('refreshProducts', () => {
    it('debe recargar productos desde el servicio', async () => {
      mockProductService.getAll.mockResolvedValueOnce([createMockProduct({ id: 'p1' })]);

      const { result } = renderHook(() => useProducts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toHaveLength(1);

      // Now return more products on refresh
      mockProductService.getAll.mockResolvedValueOnce([
        createMockProduct({ id: 'p1' }),
        createMockProduct({ id: 'p2' }),
      ]);

      await act(async () => {
        await result.current.refreshProducts();
      });

      expect(result.current.products).toHaveLength(2);
    });
  });

  describe('Error cuando no hay Provider', () => {
    it('debe lanzar error al usar useProducts fuera del ProductProvider', () => {
      expect(() => {
        renderHook(() => useProducts());
      }).toThrow('useProducts must be used within a ProductProvider');
    });
  });
});
