import {
  productSchema,
  categorySchema,
  loginSchema,
  registerSchema,
  registerManagerSchema,
  resetPasswordSchema,
  contactSchema,
} from './validations';

// ─── Product Schema ─────────────────────────────────────
describe('productSchema', () => {
  const validProduct = {
    name: 'Crema Hidratante',
    description: 'Para piel seca',
    usage: 'Aplicar dos veces al día',
    price: 29.99,
    category_id: 'cat-1',
    image: '/img/crema.jpg',
    weight: 250,
    weight_unit: 'ml',
    tags: ['natural'],
    ingredients: ['aloe vera'],
    active: true,
    featured: false,
    rating: 4.5,
    reviews_count: 10,
  };

  it('acepta datos válidos completos', () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = productSchema.safeParse({ ...validProduct, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre del producto es requerido');
    }
  });

  it('rechaza descripción vacía', () => {
    const result = productSchema.safeParse({ ...validProduct, description: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La descripción es requerida');
    }
  });

  it('rechaza modo de uso vacío', () => {
    const result = productSchema.safeParse({ ...validProduct, usage: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El modo de uso es requerido');
    }
  });

  it('rechaza precio 0 o negativo', () => {
    const resultZero = productSchema.safeParse({ ...validProduct, price: 0 });
    expect(resultZero.success).toBe(false);
    if (!resultZero.success) {
      expect(resultZero.error.issues[0].message).toBe('El precio debe ser mayor a 0');
    }

    const resultNeg = productSchema.safeParse({ ...validProduct, price: -5 });
    expect(resultNeg.success).toBe(false);
  });

  it('rechaza categoría vacía', () => {
    const result = productSchema.safeParse({ ...validProduct, category_id: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Selecciona una categoría');
    }
  });

  it('rechaza imagen vacía', () => {
    const result = productSchema.safeParse({ ...validProduct, image: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La imagen del producto es requerida');
    }
  });

  it('rechaza precio no numérico', () => {
    const result = productSchema.safeParse({ ...validProduct, price: 'abc' });
    expect(result.success).toBe(false);
  });

  it('acepta weight 0 (mínimo válido)', () => {
    const result = productSchema.safeParse({ ...validProduct, weight: 0 });
    expect(result.success).toBe(true);
  });
});

// ─── Category Schema ────────────────────────────────────
describe('categorySchema', () => {
  const validCategory = {
    name: 'Cuidado Facial',
    description: 'Productos para el rostro',
    image: '/img/facial.jpg',
    parent_id: '',
    sort_order: 1,
    active: true,
    product_count: 5,
  };

  it('acepta datos válidos', () => {
    const result = categorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = categorySchema.safeParse({ ...validCategory, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre de la categoría es requerido');
    }
  });

  it('acepta descripción vacía (opcional)', () => {
    const result = categorySchema.safeParse({ ...validCategory, description: '' });
    expect(result.success).toBe(true);
  });

  it('acepta sin parent_id (categoría principal)', () => {
    const result = categorySchema.safeParse({ ...validCategory, parent_id: '' });
    expect(result.success).toBe(true);
  });

  it('acepta con parent_id (subcategoría)', () => {
    const result = categorySchema.safeParse({ ...validCategory, parent_id: 'parent-1' });
    expect(result.success).toBe(true);
  });
});

// ─── Login Schema ───────────────────────────────────────
describe('loginSchema', () => {
  it('acepta email y contraseña válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rechaza email vacío', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El email es requerido');
    }
  });

  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-email', password: '123456' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ingresa un email válido');
    }
  });

  it('rechaza contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La contraseña es requerida');
    }
  });
});

// ─── Register Schema ────────────────────────────────────
describe('registerSchema', () => {
  const validData = {
    name: 'Juan García',
    email: 'juan@test.com',
    password: '123456',
    phone: '612345678',
    zone: '',
  };

  it('acepta datos válidos de cliente', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = registerSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es requerido');
    }
  });

  it('rechaza contraseña menor a 6 caracteres', () => {
    const result = registerSchema.safeParse({ ...validData, password: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
    }
  });

  it('acepta teléfono vacío (opcional)', () => {
    const result = registerSchema.safeParse({ ...validData, phone: '' });
    expect(result.success).toBe(true);
  });

  it('acepta zona vacía para cliente', () => {
    const result = registerSchema.safeParse({ ...validData, zone: '' });
    expect(result.success).toBe(true);
  });
});

// ─── Register Manager Schema ────────────────────────────
describe('registerManagerSchema', () => {
  const validManager = {
    name: 'Ana López',
    email: 'ana@test.com',
    password: '123456',
    phone: '612345678',
    zone: 'Madrid Centro',
  };

  it('acepta datos de gestor con zona', () => {
    const result = registerManagerSchema.safeParse(validManager);
    expect(result.success).toBe(true);
  });

  it('rechaza zona vacía para gestor', () => {
    const result = registerManagerSchema.safeParse({ ...validManager, zone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('La zona de trabajo es requerida');
    }
  });
});

// ─── Reset Password Schema ─────────────────────────────
describe('resetPasswordSchema', () => {
  it('acepta email válido', () => {
    const result = resetPasswordSchema.safeParse({ email: 'user@test.com' });
    expect(result.success).toBe(true);
  });

  it('rechaza email vacío', () => {
    const result = resetPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El email es requerido');
    }
  });

  it('rechaza email inválido', () => {
    const result = resetPasswordSchema.safeParse({ email: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ─── Contact Schema ─────────────────────────────────────
describe('contactSchema', () => {
  const validContact = {
    name: 'María',
    email: 'maria@test.com',
    subject: 'Consulta',
    message: 'Hola, quiero información sobre sus productos.',
  };

  it('acepta datos válidos', () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = contactSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El nombre es requerido');
    }
  });

  it('rechaza email inválido', () => {
    const result = contactSchema.safeParse({ ...validContact, email: 'no-email' });
    expect(result.success).toBe(false);
  });

  it('rechaza asunto vacío', () => {
    const result = contactSchema.safeParse({ ...validContact, subject: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El asunto es requerido');
    }
  });

  it('rechaza mensaje vacío', () => {
    const result = contactSchema.safeParse({ ...validContact, message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('El mensaje es requerido');
    }
  });
});
