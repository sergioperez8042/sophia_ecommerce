import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Sophia Cosmética Botánica",
  description:
    "Ponte en contacto con nosotros. Estamos aquí para ayudarte.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
