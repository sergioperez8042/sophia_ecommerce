import { redirect } from 'next/navigation';

/**
 * /products → / (home)
 *
 * Antes esta ruta renderizaba una segunda implementación del catálogo
 * (~700 LOC) con filtros y grid/list propios, paralela al `CatalogView`
 * que vive en la home. La duplicación causaba que cada arreglo visual
 * (dark mode, contraste, paleta) tuviera que aplicarse dos veces y casi
 * siempre divergía. La decisión consistente con `/catalog` (que ya
 * redirigía aquí desde hace meses) es matar el duplicado y centralizar
 * el catálogo en `/`.
 *
 * Mantenemos el segmento `/products/[id]` (detalle del producto) — ese
 * NO es duplicado y se accede desde links de la home y del wishlist.
 *
 * Todos los `Link href="/products"` repartidos por la app (wishlist,
 * about, checkout) siguen funcionando: caen aquí y redirigen a `/`.
 */
export default function ProductsPage() {
  redirect('/');
}
