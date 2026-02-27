import { getActiveProducts, getCategories } from '@/lib/server-data';
import CatalogView from '@/components/CatalogView';

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories(),
  ]);

  return <CatalogView initialProducts={products} initialCategories={categories} />;
}
