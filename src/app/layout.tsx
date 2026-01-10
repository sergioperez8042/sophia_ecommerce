"use client";

import { useEffect } from "react";
import "./globals.css";
import Header from "@/components/Header";
import { StoreProvider } from "@/store";
import { ToastProvider } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Set document title and meta description
    document.title = "Sophia - Cosmética Natural";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Cosmética natural artesanal con ingredientes orgánicos de la más alta calidad');
    }
  }, []);

  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
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