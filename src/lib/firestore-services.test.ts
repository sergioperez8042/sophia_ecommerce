import { IProduct } from '@/entities/all';

// --- Mocks de Firebase ---

const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  setDoc: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

import { ProductService } from './firestore-services';

// --- Helpers ---

const createMockProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
  id: 'prod-1',
  name: 'Crema Hidratante',
  description: 'Crema para piel seca',
  price: 29.99,
  category_id: 'cat-1',
  image: '/img/crema.jpg',
  rating: 4.5,
  reviews_count: 10,
  tags: ['hidratante'],
  ingredients: ['aloe vera'],
  active: true,
  created_date: '2024-01-01T00:00:00Z',
  featured: false,
  ...overrides,
});

describe('ProductService - Campos usage, weight y weight_unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReturnValue('mock-query');
    mockCollection.mockReturnValue('mock-collection');
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  describe('create()', () => {
    it('pasa usage, weight y weight_unit a Firestore al crear un producto', async () => {
      const newProductData = {
        name: 'Sérum Facial',
        description: 'Sérum antioxidante',
        price: 45.0,
        category_id: 'cat-2',
        image: '/img/serum.jpg',
        rating: 0,
        reviews_count: 0,
        tags: ['sérum'],
        ingredients: ['vitamina C'],
        active: true,
        featured: false,
        usage: 'Aplicar 3 gotas sobre el rostro limpio por la noche',
        weight: 30,
        weight_unit: 'ml',
        created_date: new Date().toISOString(),
      };

      mockAddDoc.mockResolvedValue({ id: 'new-prod-1' });

      const result = await ProductService.create(newProductData);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const calledWith = mockAddDoc.mock.calls[0][1];
      expect(calledWith.usage).toBe('Aplicar 3 gotas sobre el rostro limpio por la noche');
      expect(calledWith.weight).toBe(30);
      expect(calledWith.weight_unit).toBe('ml');
      expect(result.id).toBe('new-prod-1');
      expect(result.usage).toBe('Aplicar 3 gotas sobre el rostro limpio por la noche');
      expect(result.weight).toBe(30);
      expect(result.weight_unit).toBe('ml');
    });

    it('crea un producto sin usage, weight ni weight_unit', async () => {
      const newProductData = {
        name: 'Jabón Natural',
        description: 'Jabón artesanal',
        price: 12.0,
        category_id: 'cat-1',
        image: '/img/jabon.jpg',
        rating: 0,
        reviews_count: 0,
        tags: [],
        ingredients: [],
        active: true,
        featured: false,
        created_date: new Date().toISOString(),
      };

      mockAddDoc.mockResolvedValue({ id: 'new-prod-2' });

      const result = await ProductService.create(newProductData);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const calledWith = mockAddDoc.mock.calls[0][1];
      expect(calledWith.usage).toBeUndefined();
      expect(calledWith.weight).toBeUndefined();
      expect(calledWith.weight_unit).toBeUndefined();
      expect(result.id).toBe('new-prod-2');
    });
  });

  describe('update()', () => {
    it('puede actualizar solo el campo usage', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await ProductService.update('prod-1', {
        usage: 'Aplicar por la mañana y la noche',
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        usage: 'Aplicar por la mañana y la noche',
      });
    });

    it('puede actualizar solo el campo weight', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await ProductService.update('prod-1', { weight: 500 });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        weight: 500,
      });
    });

    it('puede actualizar solo el campo weight_unit', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await ProductService.update('prod-1', { weight_unit: 'kg' });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        weight_unit: 'kg',
      });
    });

    it('puede actualizar usage, weight y weight_unit juntos', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await ProductService.update('prod-1', {
        usage: 'Usar diariamente',
        weight: 200,
        weight_unit: 'ml',
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        usage: 'Usar diariamente',
        weight: 200,
        weight_unit: 'ml',
      });
    });
  });

  describe('getAll()', () => {
    it('retorna productos con los campos usage, weight y weight_unit', async () => {
      const mockDocs = [
        {
          id: 'prod-1',
          data: () => ({
            name: 'Crema Hidratante',
            description: 'Crema para piel seca',
            price: 29.99,
            category_id: 'cat-1',
            image: '/img/crema.jpg',
            rating: 4.5,
            reviews_count: 10,
            tags: ['hidratante'],
            ingredients: ['aloe vera'],
            active: true,
            created_date: '2024-01-01T00:00:00Z',
            featured: false,
            usage: 'Aplicar dos veces al día',
            weight: 250,
            weight_unit: 'ml',
          }),
        },
        {
          id: 'prod-2',
          data: () => ({
            name: 'Jabón Natural',
            description: 'Jabón artesanal',
            price: 12.0,
            category_id: 'cat-1',
            image: '/img/jabon.jpg',
            rating: 3.0,
            reviews_count: 5,
            tags: [],
            ingredients: [],
            active: true,
            created_date: '2024-02-01T00:00:00Z',
            featured: false,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockDocs });

      const products = await ProductService.getAll();

      expect(products).toHaveLength(2);
      expect(products[0].usage).toBe('Aplicar dos veces al día');
      expect(products[0].weight).toBe(250);
      expect(products[0].weight_unit).toBe('ml');
      // Producto sin campos nuevos
      expect(products[1].usage).toBeUndefined();
      expect(products[1].weight).toBeUndefined();
      expect(products[1].weight_unit).toBeUndefined();
    });
  });

  describe('getById()', () => {
    it('retorna un producto con los campos usage, weight y weight_unit', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'prod-1',
        data: () => ({
          name: 'Sérum Facial',
          description: 'Sérum antioxidante',
          price: 45.0,
          category_id: 'cat-2',
          image: '/img/serum.jpg',
          rating: 4.8,
          reviews_count: 20,
          tags: ['sérum'],
          ingredients: ['vitamina C'],
          active: true,
          created_date: '2024-01-15T00:00:00Z',
          featured: true,
          usage: 'Aplicar 3 gotas por la noche',
          weight: 30,
          weight_unit: 'ml',
        }),
      });

      const product = await ProductService.getById('prod-1');

      expect(product).not.toBeNull();
      expect(product!.usage).toBe('Aplicar 3 gotas por la noche');
      expect(product!.weight).toBe(30);
      expect(product!.weight_unit).toBe('ml');
    });
  });
});
