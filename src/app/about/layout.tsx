import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | Sophia",
  description:
    "Conoce nuestra historia y compromiso con la cosmética natural.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
