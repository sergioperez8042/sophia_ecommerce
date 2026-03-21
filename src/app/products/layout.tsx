import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos | Sophia",
  description:
    "Explora nuestra colección de productos naturales para el cuidado de la piel y el cabello.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
