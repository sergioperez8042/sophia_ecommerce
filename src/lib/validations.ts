import { z } from 'zod';

// ─── Producto (Admin) ────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  usage: z.string().min(1, 'El modo de uso es requerido'),
  price: z.number({ error: 'El precio debe ser un número' }).positive('El precio debe ser mayor a 0'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  image: z.string().min(1, 'La imagen del producto es requerida'),
  weight: z.number().min(0),
  weight_unit: z.string(),
  tags: z.array(z.string()),
  ingredients: z.array(z.string()),
  active: z.boolean(),
  featured: z.boolean(),
  rating: z.number(),
  reviews_count: z.number(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ─── Categoría (Admin) ───────────────────────────────────
export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  description: z.string().optional().default(''),
  image: z.string().optional().default(''),
  parent_id: z.string().optional().default(''),
  sort_order: z.number().min(0).default(0),
  active: z.boolean().default(true),
  product_count: z.number().optional().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ─── Login ───────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Registro ────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional().default(''),
  zone: z.string().optional().default(''),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema dinámico para manager (zona requerida)
export const registerManagerSchema = registerSchema.extend({
  zone: z.string().min(1, 'La zona de trabajo es requerida'),
});

// ─── Reset Password ─────────────────────────────────────
export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido'),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Contacto ────────────────────────────────────────────
export const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().min(1, 'El email es requerido').email('Ingresa un email válido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
