import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
    title: "Catálogo - Sophia Cosmética Natural",
    description: "Catálogo de productos de cosmética natural artesanal",
};

export default function CatalogoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className="antialiased bg-gradient-to-b from-[#FEFCF7] to-[#F5F1E8] min-h-screen">
                {children}
            </body>
        </html>
    );
}
