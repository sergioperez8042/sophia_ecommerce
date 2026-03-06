import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Sophia",
  description:
    "Accede a tu cuenta o regístrate en Sophia Cosmética Botánica.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
