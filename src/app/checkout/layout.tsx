import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar Compra | Sophia",
  description: "Completa tu pedido de forma segura.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
