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
      className="flex items-center space-x-2 text-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Home icon */}
      <Link href="/" className="flex items-center text-gray-600 hover:text-[#4A6741] transition-colors duration-200">
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <motion.div
          key={index}
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
          
          {item.href ? (
            <Link 
              href={item.href}
              className="text-gray-600 hover:text-[#4A6741] transition-colors duration-200 font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-semibold">
              {item.label}
            </span>
          )}
        </motion.div>
      ))}
    </motion.nav>
  );
}