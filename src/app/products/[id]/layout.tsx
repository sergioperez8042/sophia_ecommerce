import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Producto | Sophia",
  description: "Detalle del producto - Sophia",
};

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
