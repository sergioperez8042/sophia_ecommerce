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

  // Rutas que usan el layout limpio (solo catálogo, sin header)
  const isPublicCatalog = pathname === '/' || pathname?.startsWith('/catalogo');

  // Si es la página principal o catálogo, renderizar sin header (vista cliente)
  if (isPublicCatalog) {
    return (
      <html lang="es" suppressHydrationWarning={true}>
        <head>
          <title>Sophia - Cosmética Natural</title>
          <meta name="description" content="Catálogo de productos de cosmética natural artesanal" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased" style={{ fontFamily: 'Poppins, sans-serif' }} suppressHydrationWarning={true}>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Poppins, sans-serif' }} suppressHydrationWarning={true}>
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