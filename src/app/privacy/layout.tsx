import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Sophia",
  description: "Nuestra política de privacidad y protección de datos.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
