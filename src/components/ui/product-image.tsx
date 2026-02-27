"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

const PLACEHOLDER = "/images/no-image.svg";

interface ProductImageProps {
    src: string | undefined | null;
    alt: string;
    fill?: boolean;
    width?: number;
    height?: number;
    className?: string;
    sizes?: string;
}

export default function ProductImage({
    src,
    alt,
    fill = true,
    width,
    height,
    className = "object-cover",
    sizes,
}: ProductImageProps) {
    const [error, setError] = useState(false);
    const handleError = useCallback(() => setError(true), []);

    const imageSrc = error || !src ? PLACEHOLDER : src;
    const isPlaceholder = imageSrc === PLACEHOLDER;

    return (
        <Image
            src={imageSrc}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className={`${className} ${isPlaceholder ? "object-contain p-4" : ""}`}
            onError={handleError}
            unoptimized={isPlaceholder}
            sizes={sizes}
        />
    );
}
