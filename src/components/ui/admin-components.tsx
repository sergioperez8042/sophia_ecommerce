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

/**
 * Reusable loading spinner component
 */
export function LoadingSpinner({
    size = "md",
    className = ""
}: {
    size?: "sm" | "md" | "lg";
    className?: string;
}) {
    const sizes = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-16 w-16",
    };

    return (
        <div className={`min-h-screen flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-b-2 border-[#4A6741] ${sizes[size]}`}
            />
        </div>
    );
}

/**
 * Empty state component for lists
 */
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            {icon && (
                <div className="flex justify-center mb-4 text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            {description && (
                <p className="text-gray-600 mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}

/**
 * Stats card component for admin dashboards
 */
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBgColor?: string;
    valueColor?: string;
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    iconBgColor = "bg-gray-100",
    valueColor = "text-gray-900",
}: StatCardProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                {icon}
            </div>
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
                        className="flex items-center gap-2 text-gray-600 hover:text-[#4A6741] transition-colors mb-2"
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
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                {description && (
                    <p className="text-gray-600 mt-1">{description}</p>
                )}
            </div>
            {actions}
        </div>
    );
}

/**
 * Confirmation dialog for delete actions
 */
interface ConfirmDeleteProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    itemName?: string;
}

export function ConfirmDelete({
    isOpen,
    onConfirm,
    onCancel,
    itemName = "este elemento",
}: ConfirmDeleteProps) {
    if (!isOpen) return null;

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onConfirm}
                className="px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            >
                Sí
            </button>
            <button
                onClick={onCancel}
                className="px-2 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
                No
            </button>
        </div>
    );
}
