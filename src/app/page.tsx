import { unstable_noStore as noStore } from 'next/cache';
import { getActiveProducts, getCategories, getCatalogConfig } from '@/lib/server-data';
import CatalogView from '@/components/CatalogView';

// Revalidar cada 30 segundos para que los cambios del admin se reflejen.
// Si la consulta a Firestore devuelve vacío llamamos noStore() más abajo
// para evitar que un fallo transitorio quede cacheado 5 min en el edge.
export const revalidate = 30;

export default async function HomePage() {
  const [products, categories, catalogConfig] = await Promise.all([
    getActiveProducts(),
    getCategories(),
    getCatalogConfig(),
  ]);

  // Cuando Firestore falla (silent catch en server-data → arrays vacíos),
  // no queremos que esa página vacía quede cacheada en el edge. noStore()
  // marca este render como no cacheable; el siguiente request lo recalcula
  // y, si Firebase ya está sano, devuelve datos reales.
  if (products.length === 0 || categories.length === 0) {
    noStore();
    console.error(
      `[HomePage] Empty catalog detected at render time — products=${products.length}, categories=${categories.length}. Skipping ISR cache for this render.`
    );
  }

  return (
    <CatalogView
      initialProducts={products}
      initialCategories={categories}
      groupByCategory={catalogConfig.group_by_category}
    />
  );
}
