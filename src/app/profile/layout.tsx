import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil | Sophia",
  description: "Gestiona tu perfil y preferencias.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
