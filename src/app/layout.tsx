"use client";

import "./globals.css";
import Header from "@/components/Header";
import { StoreProvider } from "@/store";
import { ThemeProvider } from "@/store/ThemeContext";
import { ToastProvider } from "@/components/ui/toast";
import { usePathname } from "next/navigation";

const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('sophia-theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Rutas que usan el layout limpio (sin header)
  const isPublicCatalog = pathname === '/' || pathname?.startsWith('/catalogo');
  const isAuthPage = pathname === '/auth';

  // Si es la página principal o catálogo, renderizar sin header (vista cliente)
  if (isPublicCatalog) {
    return (
      <html lang="es" suppressHydrationWarning={true}>
        <head>
          <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
          <title>Sophia Cosmética Botánica | Productos Naturales Artesanales</title>
          <meta name="description" content="Sophia Cosmética Botánica: productos de belleza natural elaborados artesanalmente con ingredientes orgánicos. Cremas, aceites y tratamientos para piel y cabello. Envíos a toda España." />
          <meta name="keywords" content="cosmética natural, cosmética botánica, productos artesanales, belleza natural, cremas naturales, aceites esenciales, skincare orgánico, Sophia cosmética, cuidado piel natural, cosmética vegana España" />
          <meta name="author" content="Sophia Cosmética Botánica" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
          <link rel="canonical" href="https://sophia-cosmetic.vercel.app" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="es_ES" />
          <meta property="og:site_name" content="Sophia Cosmética Botánica" />
          <meta property="og:title" content="Sophia Cosmética Botánica | Belleza Natural Artesanal" />
          <meta property="og:description" content="Descubre nuestra colección de productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos de la más alta calidad." />
          <meta property="og:url" content="https://sophia-cosmetic.vercel.app" />
          <meta property="og:image" content="https://sophia-cosmetic.vercel.app/images/sophia_logo_nuevo.jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Sophia Cosmética Botánica | Belleza Natural Artesanal" />
          <meta name="twitter:description" content="Productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos." />
          <meta name="twitter:image" content="https://sophia-cosmetic.vercel.app/images/sophia_logo_nuevo.jpeg" />

          {/* Structured Data - LocalBusiness */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Store",
                "name": "Sophia Cosmética Botánica",
                "description": "Tienda de cosmética natural y botánica artesanal con ingredientes orgánicos",
                "url": "https://sophia-cosmetic.vercel.app",
                "logo": "https://sophia-cosmetic.vercel.app/images/sophia_logo_nuevo.jpeg",
                "image": "https://sophia-cosmetic.vercel.app/images/sophia_logo_nuevo.jpeg",
                "telephone": "+34642633982",
                "email": "chavesophia1994@gmail.com",
                "foundingDate": "2022",
                "priceRange": "€€",
                "sameAs": [],
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "ES"
                },
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+34642633982",
                  "contactType": "customer service",
                  "availableLanguage": ["Spanish"]
                }
              })
            }}
          />

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased" style={{ fontFamily: 'Poppins, sans-serif' }} suppressHydrationWarning={true}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <title>Sophia Cosmética Botánica | Panel de Administración</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Panel de administración de Sophia Cosmética Botánica" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Poppins, sans-serif' }} suppressHydrationWarning={true}>
        <StoreProvider>
          <ToastProvider>
            {!isAuthPage && <Header />}
            <div className={`min-h-screen ${isAuthPage ? '' : 'bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8]'}`}>
              {children}
            </div>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}