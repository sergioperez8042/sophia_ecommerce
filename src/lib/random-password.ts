/**
 * Genera una password aleatoria para cuentas de gestor.
 *
 * Mezcla letras (mayúsculas + minúsculas) y dígitos, excluyendo caracteres
 * ambiguos visualmente (0/O, 1/l/I) para que el admin pueda leerla y
 * compartirla por WhatsApp sin errores de transcripción.
 *
 * Largo por defecto: 10. Encima del mínimo de Firebase Auth (6) y por
 * debajo del threshold donde la gente empieza a copiar+pegar mal.
 */
export function generateGestorPassword(length = 10): string {
  // Sin 0/O ni 1/l/I — confusos al leer y al teclear en móvil
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}
