import { getProductById, getCategories } from '@/lib/server-data';
import { notFound } from 'next/navigation';
import CatalogProductDetail from '@/components/CatalogProductDetail';

export const revalidate = 30;

export default async function CatalogProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  const category = categories.find(c => c.id === product.category_id);

  return (
    <CatalogProductDetail
      product={product}
      categoryName={category?.name || ''}
    />
  );
}
