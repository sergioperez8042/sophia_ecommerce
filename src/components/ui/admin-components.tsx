"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store";

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * HOC component that protects admin routes
 * Redirects to /auth if user is not authenticated or not an admin
 */
export function AdminGuard({ children }: AdminGuardProps) {
    const router = useRouter();
    const { isAdmin, isLoaded, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isLoaded && (!isAuthenticated || !isAdmin)) {
            router.push("/auth");
        }
    }, [isLoaded, isAuthenticated, isAdmin, router]);

    if (!isLoaded) {
        return <LoadingSpinner />;
    }

    if (!isAdmin) {
        return null;
    }

    return <>{children}</>;
}

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full border-b-2 border-[#505A4A] h-12 w-12" />
        </div>
    );
}

/**
 * Page header with back button
 */
interface PageHeaderProps {
    title: string;
    description?: string;
    backHref?: string;
    backLabel?: string;
    actions?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    backHref,
    backLabel = "Volver",
    actions,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
                {backHref && (
                    <a
                        href={backHref}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#505A4A] transition-colors mb-2"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        {backLabel}
                    </a>
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
                {description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                )}
            </div>
            {actions}
        </div>
    );
}

