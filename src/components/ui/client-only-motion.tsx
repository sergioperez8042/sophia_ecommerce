"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ClientOnlyMotionProps {
    children: React.ReactNode;
    className?: string;
    initial?: any;
    animate?: any;
    whileInView?: any;
    transition?: any;
    viewport?: any;
    [key: string]: any;
}

export default function ClientOnlyMotion({
    children,
    className,
    initial,
    animate,
    whileInView,
    transition,
    viewport,
    ...props
}: ClientOnlyMotionProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className={className} suppressHydrationWarning>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            className={className}
            initial={initial}
            animate={animate}
            whileInView={whileInView}
            transition={transition}
            viewport={viewport}
            {...props}
        >
            {children}
        </motion.div>
    );
}