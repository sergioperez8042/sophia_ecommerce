import { IProduct } from './all';

describe('IProduct - Campos de uso y peso', () => {
  const baseProduct: IProduct = {
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
  };

  it('acepta usage, weight y weight_unit como campos opcionales', () => {
    const product: IProduct = {
      ...baseProduct,
      usage: 'Aplicar sobre la piel limpia dos veces al día',
      weight: 250,
      weight_unit: 'ml',
    };

    expect(product.usage).toBe('Aplicar sobre la piel limpia dos veces al día');
    expect(product.weight).toBe(250);
    expect(product.weight_unit).toBe('ml');
  });

  it('funciona sin usage, weight ni weight_unit (compatibilidad hacia atrás)', () => {
    const product: IProduct = { ...baseProduct };

    expect(product.usage).toBeUndefined();
    expect(product.weight).toBeUndefined();
    expect(product.weight_unit).toBeUndefined();
  });

  it('permite asignar solo usage sin weight ni weight_unit', () => {
    const product: IProduct = {
      ...baseProduct,
      usage: 'Modo de uso del producto',
    };

    expect(product.usage).toBe('Modo de uso del producto');
    expect(product.weight).toBeUndefined();
    expect(product.weight_unit).toBeUndefined();
  });

  it('permite asignar weight sin weight_unit', () => {
    const product: IProduct = {
      ...baseProduct,
      weight: 100,
    };

    expect(product.weight).toBe(100);
    expect(product.weight_unit).toBeUndefined();
  });

  it('permite asignar weight con weight_unit', () => {
    const product: IProduct = {
      ...baseProduct,
      weight: 500,
      weight_unit: 'g',
    };

    expect(product.weight).toBe(500);
    expect(product.weight_unit).toBe('g');
  });

  it('acepta todas las unidades de peso válidas', () => {
    const units = ['g', 'kg', 'ml', 'l', 'oz', 'lb'];

    units.forEach((unit) => {
      const product: IProduct = {
        ...baseProduct,
        weight: 100,
        weight_unit: unit,
      };
      expect(product.weight_unit).toBe(unit);
    });
  });
});
