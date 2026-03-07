import React, { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import ProductDetailPage from './page';
import { IProduct } from '@/entities/all';
import { ICategory } from '@/entities/all';

// --- Mocks ---

let mockProducts: IProduct[] = [];
let mockCategories: ICategory[] = [];
let mockIsLoading = false;

jest.mock('@/store', () => ({
  useCart: () => ({
    addItem: jest.fn(),
  }),
  useWishlist: () => ({
    toggleItem: jest.fn(),
    isInWishlist: () => false,
  }),
  useProducts: () => ({
    products: mockProducts,
    isLoading: mockIsLoading,
  }),
  useCategories: () => ({
    categories: mockCategories,
  }),
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    ...jest.requireActual('framer-motion'),
    LazyMotion: ({ children }: { children: React.ReactNode }) => children,
    domAnimation: {},
    m: new Proxy(
      {},
      {
        get: (_target: object, prop: string) =>
          React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
            const {
              children,
              initial: _initial,
              animate: _animate,
              exit: _exit,
              transition: _transition,
              variants: _variants,
              whileHover: _whileHover,
              whileTap: _whileTap,
              whileInView: _whileInView,
              viewport: _viewport,
              layout: _layout,
              layoutId: _layoutId,
              style,
              ...rest
            } = props;
            return React.createElement(String(prop), { ...rest, style, ref }, children as React.ReactNode);
          }),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('next/link', () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  );
});

jest.mock('next/dynamic', () => {
  return () => {
    return ({ items }: { items: Array<{ label: string }> }) => (
      <nav data-testid="breadcrumb">
        {items.map((item, i) => (
          <span key={i}>{item.label}</span>
        ))}
      </nav>
    );
  };
});

jest.mock('@/components/ui/product-image', () => {
  return ({ alt }: { alt: string }) => <div data-testid="product-image">{alt}</div>;
});

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

const mockCategory: ICategory = {
  id: 'cat-1',
  name: 'Cuidado Facial',
  description: 'Productos para el rostro',
  image: '/img/cat.jpg',
  sort_order: 1,
  active: true,
  product_count: 5,
};

async function renderProductPage(productId: string) {
  const paramsPromise = Promise.resolve({ id: productId });
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <ProductDetailPage params={paramsPromise} />
      </Suspense>
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProducts = [];
  mockCategories = [mockCategory];
  mockIsLoading = false;
});

// --- Tests ---

describe('ProductDetailPage - Seccion Modo de uso', () => {
  it('muestra la seccion "Modo de uso" cuando el producto tiene el campo usage', async () => {
    mockProducts = [
      createMockProduct({
        usage: 'Aplicar sobre la piel limpia dos veces al dia',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Modo de uso')).toBeInTheDocument();
    expect(
      screen.getByText('Aplicar sobre la piel limpia dos veces al dia')
    ).toBeInTheDocument();
  });

  it('no muestra la seccion "Modo de uso" cuando el producto no tiene el campo usage', async () => {
    mockProducts = [createMockProduct()];

    await renderProductPage('prod-1');

    expect(screen.queryByText('Modo de uso')).not.toBeInTheDocument();
  });

  it('no muestra la seccion "Modo de uso" cuando usage es una cadena vacia', async () => {
    mockProducts = [createMockProduct({ usage: '' })];

    await renderProductPage('prod-1');

    expect(screen.queryByText('Modo de uso')).not.toBeInTheDocument();
  });
});

describe('ProductDetailPage - Seccion Peso', () => {
  it('muestra "Peso: 250 ml" cuando weight es 250 y weight_unit es "ml"', async () => {
    mockProducts = [
      createMockProduct({
        weight: 250,
        weight_unit: 'ml',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Peso: 250 ml')).toBeInTheDocument();
  });

  it('muestra "Peso: 100 g" cuando weight es 100 y no se especifica weight_unit (valor por defecto)', async () => {
    mockProducts = [
      createMockProduct({
        weight: 100,
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Peso: 100 g')).toBeInTheDocument();
  });

  it('no muestra la seccion de peso cuando weight es 0', async () => {
    mockProducts = [
      createMockProduct({
        weight: 0,
        weight_unit: 'g',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.queryByText(/Peso:/)).not.toBeInTheDocument();
  });

  it('no muestra la seccion de peso cuando weight no esta definido', async () => {
    mockProducts = [createMockProduct()];

    await renderProductPage('prod-1');

    expect(screen.queryByText(/Peso:/)).not.toBeInTheDocument();
  });

  it('muestra el peso con la unidad "kg" correctamente', async () => {
    mockProducts = [
      createMockProduct({
        weight: 1.5,
        weight_unit: 'kg',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Peso: 1.5 kg')).toBeInTheDocument();
  });

  it('muestra el peso con la unidad "oz" correctamente', async () => {
    mockProducts = [
      createMockProduct({
        weight: 8,
        weight_unit: 'oz',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Peso: 8 oz')).toBeInTheDocument();
  });
});

describe('ProductDetailPage - Campos usage y weight combinados', () => {
  it('muestra tanto "Modo de uso" como "Peso" cuando ambos estan presentes', async () => {
    mockProducts = [
      createMockProduct({
        usage: 'Aplicar generosamente',
        weight: 500,
        weight_unit: 'ml',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Modo de uso')).toBeInTheDocument();
    expect(screen.getByText('Aplicar generosamente')).toBeInTheDocument();
    expect(screen.getByText('Peso: 500 ml')).toBeInTheDocument();
  });

  it('muestra solo "Modo de uso" sin "Peso" cuando weight es 0', async () => {
    mockProducts = [
      createMockProduct({
        usage: 'Aplicar por las noches',
        weight: 0,
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.getByText('Modo de uso')).toBeInTheDocument();
    expect(screen.getByText('Aplicar por las noches')).toBeInTheDocument();
    expect(screen.queryByText(/Peso:/)).not.toBeInTheDocument();
  });

  it('muestra solo "Peso" sin "Modo de uso" cuando usage no esta definido', async () => {
    mockProducts = [
      createMockProduct({
        weight: 200,
        weight_unit: 'g',
      }),
    ];

    await renderProductPage('prod-1');

    expect(screen.queryByText('Modo de uso')).not.toBeInTheDocument();
    expect(screen.getByText('Peso: 200 g')).toBeInTheDocument();
  });
});
