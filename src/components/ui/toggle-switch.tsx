"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    activeColor?: string;
    label?: string;
    className?: string;
}

export function ToggleSwitch({
    checked,
    onCheckedChange,
    disabled = false,
    size = "md",
    activeColor = "bg-green-500",
    label,
    className,
}: ToggleSwitchProps) {
    const sizes = {
        sm: { track: "w-8 h-4", thumb: "w-3 h-3", translate: "translate-x-4" },
        md: { track: "w-12 h-6", thumb: "w-5 h-5", translate: "translate-x-6" },
        lg: { track: "w-14 h-7", thumb: "w-6 h-6", translate: "translate-x-7" },
    };

    const currentSize = sizes[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6741] focus-visible:ring-offset-2",
                currentSize.track,
                checked ? activeColor : "bg-gray-300",
                disabled && "cursor-not-allowed opacity-50",
                className
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-transform",
                    currentSize.thumb,
                    checked ? currentSize.translate : "translate-x-0.5"
                )}
            />
        </button>
    );
}
