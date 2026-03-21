import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo | Sophia",
  description:
    "Consulta nuestro catálogo completo de productos naturales.",
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
