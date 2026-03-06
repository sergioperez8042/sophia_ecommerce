import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Deseos | Sophia",
  description: "Productos guardados en tu lista de deseos.",
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
