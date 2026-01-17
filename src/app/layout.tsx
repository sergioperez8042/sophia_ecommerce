import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { StoreProvider } from "@/store";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Sophia - Cosmética Natural",
  description: "Cosmética natural artesanal con ingredientes orgánicos de la más alta calidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
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