import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Sophia",
  description:
    "Términos y condiciones de uso de Sophia.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
