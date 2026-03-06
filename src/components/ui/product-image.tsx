"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

const PLACEHOLDER = "/images/no-image.svg";

/**
 * Check whether a src string points to a valid remote image.
 * Local paths like "/images/champu-organico.jpg" are invalid because those
 * files don't exist in the public folder -- they were entered by mistake in
 * the admin panel.  Only external URLs (Cloudinary, Unsplash, etc.) are
 * considered valid product image sources.
 */
function isValidImageSrc(src: string | undefined | null): src is string {
    if (!src || src.trim() === "") return false;
    // Allow the placeholder itself
    if (src === PLACEHOLDER) return true;
    // External URLs are valid (Cloudinary, Unsplash, etc.)
    if (src.startsWith("http://") || src.startsWith("https://")) return true;
    // Any other local path (e.g. /images/champu-organico.jpg) is NOT valid
    // because the file almost certainly doesn't exist in public/
    return false;
}

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

    const imageSrc = error || !isValidImageSrc(src) ? PLACEHOLDER : src;
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
