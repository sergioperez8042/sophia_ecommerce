import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <motion.nav
            className="flex items-center space-x-2 text-sm sm:text-base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Home icon */}
            <Link href="/" className="flex items-center text-gray-800 hover:text-[#505A4A] transition-colors duration-200">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {items.map((item, index) => (
                <motion.div
                    key={index}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />

                    {item.href ? (
                        <Link
                            href={item.href}
                            className="text-gray-800 hover:text-[#505A4A] transition-colors duration-200 font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-[#505A4A] font-bold">
                            {item.label}
                        </span>
                    )}
                </motion.div>
            ))}
        </motion.nav>
    );
}