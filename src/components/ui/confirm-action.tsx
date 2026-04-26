'use client';

import { Check, X } from 'lucide-react';

interface ConfirmActionProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'default';
}

export default function ConfirmAction({
    message,
    onConfirm,
    onCancel,
    variant = 'danger',
}: ConfirmActionProps) {
    const colors = variant === 'danger'
        ? {
            bg: 'bg-red-50 dark:bg-red-900/30',
            text: 'text-red-600 dark:text-red-400',
            confirm: 'text-red-600 hover:bg-red-100',
        }
        : {
            bg: 'bg-gray-50 dark:bg-gray-800',
            text: 'text-gray-700 dark:text-gray-300',
            confirm: 'text-emerald-600 hover:bg-emerald-100',
        };

    return (
        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${colors.bg}`}>
            <span className={`text-xs mr-1 ${colors.text}`}>{message}</span>
            <button
                type="button"
                onClick={onConfirm}
                className={`rounded p-1 transition-colors ${colors.confirm}`}
                aria-label="Confirmar"
            >
                <Check className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                aria-label="Cancelar"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
