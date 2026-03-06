import { getActiveProducts, getCategories } from '@/lib/server-data';
import CatalogView from '@/components/CatalogView';

// Revalidar cada 30 segundos para que los cambios del admin se reflejen
export const revalidate = 30;

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);

  return <CatalogView initialProducts={products} initialCategories={categories} />;
}
