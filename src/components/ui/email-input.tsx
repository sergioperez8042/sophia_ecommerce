"use client";

import { useEffect, useState } from 'react';

interface EmailInputProps {
    placeholder?: string;
    className?: string;
    onEmailChange?: (email: string) => void;
}

export default function EmailInput({
    placeholder = "Tu email",
    className = "",
    onEmailChange
}: EmailInputProps) {
    const [email, setEmail] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (onEmailChange) {
            onEmailChange(value);
        }
    };

    // Prevenir problemas de hidratación con extensiones del navegador
    const baseClassName = `
    ${className}
  `.trim();

    return (
        <input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={handleChange}
            className={baseClassName}
            suppressHydrationWarning={true}
            autoComplete="email"
            // Atributos para evitar que las extensiones interfieran
            data-form-type="email"
            data-lpignore="true"
            data-1p-ignore="true"
        />
    );
}