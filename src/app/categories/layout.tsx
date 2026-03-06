import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categorías | Sophia Cosmética Botánica",
  description:
    "Descubre nuestras categorías de productos naturales organizados para tu bienestar.",
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
