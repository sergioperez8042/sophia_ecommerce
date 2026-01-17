"use client";

import "./globals.css";
import Header from "@/components/Header";
import { StoreProvider } from "@/store";
import { ToastProvider } from "@/components/ui/toast";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isCatalogo = pathname?.startsWith('/catalogo');

  // Si es la página de catálogo, renderizar sin header ni providers
  if (isCatalogo) {
    return (
      <html lang="es" suppressHydrationWarning={true}>
        <head>
          <title>Catálogo - Sophia Cosmética Natural</title>
          <meta name="description" content="Catálogo de productos de cosmética natural artesanal" />
        </head>
        <body className="antialiased" suppressHydrationWarning={true}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <title>Sophia - Cosmética Natural</title>
        <meta name="description" content="Cosmética natural artesanal con ingredientes orgánicos de la más alta calidad" />
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        <StoreProvider>
          <ToastProvider>
            <Header />
            <div className="min-h-screen bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]">
              {children}
            </div>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}