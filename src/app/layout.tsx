"use client";

import "./globals.css";
import Header from "@/components/Header";
import { StoreProvider } from "@/store";
import { ThemeProvider } from "@/store/ThemeContext";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { Poppins, Cinzel } from "next/font/google";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const FOUC_SCRIPT = `(function(){try{var t=localStorage.getItem('sophia-theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Rutas que usan el layout limpio (sin header global) — el catálogo tiene su propio
  // header embebido en CatalogView, así que no le agregamos el header de la app.
  const isPublicCatalog = pathname === '/' || pathname?.startsWith('/catalog');
  const isAuthPage = pathname === '/auth';
  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  const isGestorPage = pathname === '/manager' || pathname?.startsWith('/manager/');

  // Metadata para crawlers (WhatsApp, Facebook, Twitter): siempre la pública,
  // EXCEPTO cuando estamos explícitamente bajo /admin/*. Si pathname es null
  // durante prerender estático, fallback a metadata pública (no admin).
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;

  // Si es la página principal o catálogo, renderizar sin header (vista cliente)
  if (isPublicCatalog) {
    return (
      <html lang="es" suppressHydrationWarning={true}>
        <head>
          <Script id="fouc-prevention" strategy="beforeInteractive">{FOUC_SCRIPT}</Script>
          <link rel="icon" href="/images/sophia_logo_v3.jpeg" type="image/jpeg" />
          <link rel="apple-touch-icon" href="/images/sophia_logo_v3.jpeg" />
          <title>Sophia | Productos Naturales Artesanales</title>
          <meta name="description" content="Sophia: productos de belleza natural elaborados artesanalmente con ingredientes orgánicos. Cremas, aceites y tratamientos para piel y cabello. Envíos a toda España." />
          <meta name="keywords" content="cosmética natural, cosmética botánica, productos artesanales, belleza natural, cremas naturales, aceites esenciales, skincare orgánico, Sophia cosmética, cuidado piel natural, cosmética vegana España" />
          <meta name="author" content="Sophia" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
          <link rel="canonical" href="https://sophiacatalog.com" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="es_ES" />
          <meta property="og:site_name" content="Sophia" />
          <meta property="og:title" content="Sophia | Belleza Natural Artesanal" />
          <meta property="og:description" content="Descubre nuestra colección de productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos de la más alta calidad." />
          <meta property="og:url" content="https://sophiacatalog.com" />
          <meta property="og:image" content="https://sophiacatalog.com/images/sophia_logo_v3.jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Sophia | Belleza Natural Artesanal" />
          <meta name="twitter:description" content="Productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos." />
          <meta name="twitter:image" content="https://sophiacatalog.com/images/sophia_logo_v3.jpeg" />

          {/* Structured Data - Store */}
          <Script id="structured-data-store" type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Sophia",
            "description": "Tienda de cosmética natural y botánica artesanal con ingredientes orgánicos",
            "url": "https://sophiacatalog.com",
            "logo": "https://sophiacatalog.com/images/sophia_logo_v3.jpeg",
            "image": "https://sophiacatalog.com/images/sophia_logo_v3.jpeg",
            "telephone": "+34642633982",
            "email": "chavesophia1994@gmail.com",
            "foundingDate": "2022",
            "priceRange": "$$",
            "sameAs": [],
            "address": { "@type": "PostalAddress", "addressCountry": "ES" },
            "contactPoint": { "@type": "ContactPoint", "telephone": "+34642633982", "contactType": "customer service", "availableLanguage": ["Spanish"] }
          })}</Script>
        </head>
        <body className={`${poppins.variable} ${cinzel.variable} antialiased`} style={{ fontFamily: 'var(--font-poppins), sans-serif' }} suppressHydrationWarning={true}>
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="user">
              <StoreProvider>
                  <Toaster
                    position="top-right"
                    theme="system"
                    richColors
                    closeButton
                    duration={4000}
                    expand
                    toastOptions={{
                      classNames: {
                        toast: 'group !rounded-2xl !border !shadow-2xl !backdrop-blur-xl !bg-white/95 dark:!bg-[#1A2A20]/95 !border-gray-200/60 dark:!border-[#36473B] !px-4 !py-3.5 !gap-3',
                        title: '!text-sm !font-semibold !text-gray-900 dark:!text-[#e8e0d0] !tracking-tight',
                        description: '!text-xs !text-gray-500 dark:!text-[#C9A96E]/70 !mt-0.5 !leading-relaxed',
                        success: '!bg-emerald-50/95 dark:!bg-emerald-950/40 !border-emerald-200/60 dark:!border-emerald-800/40 !text-emerald-800 dark:!text-emerald-300',
                        error: '!bg-red-50/95 dark:!bg-red-950/40 !border-red-200/60 dark:!border-red-800/40 !text-red-800 dark:!text-red-300',
                        info: '!bg-sky-50/95 dark:!bg-sky-950/40 !border-sky-200/60 dark:!border-sky-800/40',
                        warning: '!bg-amber-50/95 dark:!bg-amber-950/40 !border-amber-200/60 dark:!border-amber-800/40',
                        closeButton: '!bg-white dark:!bg-[#213529] !border !border-gray-200 dark:!border-[#36473B] !rounded-full !w-5 !h-5 hover:!scale-110 !transition-transform',
                        actionButton: '!rounded-lg !text-xs !font-medium',
                        cancelButton: '!rounded-lg !text-xs',
                        icon: '!flex !items-center !justify-center',
                      },
                    }}
                  />
                  {children}
              </StoreProvider>
            </MotionConfig>
          </LazyMotion>
        </body>
      </html>
    );
  }

  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <Script id="fouc-prevention-admin" strategy="beforeInteractive">{FOUC_SCRIPT}</Script>
        <link rel="icon" href="/images/sophia_logo_v3.jpeg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/images/sophia_logo_v3.jpeg" />
        {isAdminRoute ? (
          <>
            <title>Sophia | Panel de Administración</title>
            <meta name="robots" content="noindex, nofollow" />
            <meta name="description" content="Panel de administración de Sophia" />
          </>
        ) : (
          <>
            <title>Sophia | Productos Naturales Artesanales</title>
            <meta name="description" content="Sophia: productos de belleza natural elaborados artesanalmente con ingredientes orgánicos. Cremas, aceites y tratamientos para piel y cabello." />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <link rel="canonical" href="https://sophiacatalog.com" />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content="es_ES" />
            <meta property="og:site_name" content="Sophia" />
            <meta property="og:title" content="Sophia | Belleza Natural Artesanal" />
            <meta property="og:description" content="Descubre nuestra colección de productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos de la más alta calidad." />
            <meta property="og:url" content="https://sophiacatalog.com" />
            <meta property="og:image" content="https://sophiacatalog.com/images/sophia_logo_v3.jpeg" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Sophia | Belleza Natural Artesanal" />
            <meta name="twitter:description" content="Productos de cosmética natural elaborados artesanalmente con ingredientes orgánicos." />
            <meta name="twitter:image" content="https://sophiacatalog.com/images/sophia_logo_v3.jpeg" />
          </>
        )}
      </head>
      <body className={`${poppins.variable} ${cinzel.variable} antialiased`} style={{ fontFamily: 'var(--font-poppins), sans-serif' }} suppressHydrationWarning={true}>
        <LazyMotion features={domAnimation} strict>
          <MotionConfig reducedMotion="user">
            <StoreProvider>
                <Toaster
                    position="top-right"
                    theme="system"
                    richColors
                    closeButton
                    duration={4000}
                    expand
                    toastOptions={{
                      classNames: {
                        toast: 'group !rounded-2xl !border !shadow-2xl !backdrop-blur-xl !bg-white/95 dark:!bg-[#1A2A20]/95 !border-gray-200/60 dark:!border-[#36473B] !px-4 !py-3.5 !gap-3',
                        title: '!text-sm !font-semibold !text-gray-900 dark:!text-[#e8e0d0] !tracking-tight',
                        description: '!text-xs !text-gray-500 dark:!text-[#C9A96E]/70 !mt-0.5 !leading-relaxed',
                        success: '!bg-emerald-50/95 dark:!bg-emerald-950/40 !border-emerald-200/60 dark:!border-emerald-800/40 !text-emerald-800 dark:!text-emerald-300',
                        error: '!bg-red-50/95 dark:!bg-red-950/40 !border-red-200/60 dark:!border-red-800/40 !text-red-800 dark:!text-red-300',
                        info: '!bg-sky-50/95 dark:!bg-sky-950/40 !border-sky-200/60 dark:!border-sky-800/40',
                        warning: '!bg-amber-50/95 dark:!bg-amber-950/40 !border-amber-200/60 dark:!border-amber-800/40',
                        closeButton: '!bg-white dark:!bg-[#213529] !border !border-gray-200 dark:!border-[#36473B] !rounded-full !w-5 !h-5 hover:!scale-110 !transition-transform',
                        actionButton: '!rounded-lg !text-xs !font-medium',
                        cancelButton: '!rounded-lg !text-xs',
                        icon: '!flex !items-center !justify-center',
                      },
                    }}
                  />
                {!isAuthPage && !isLegalPage && !isGestorPage && <Header />}
                <div className={`min-h-screen ${isAuthPage || isLegalPage || isGestorPage ? '' : 'bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8] dark:from-[#15241B] dark:to-[#15241B]'}`}>
                  {children}
                </div>
            </StoreProvider>
          </MotionConfig>
        </LazyMotion>
      </body>
    </html>
  );
}