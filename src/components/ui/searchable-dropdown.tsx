'use client';

import { useEffect, useRef, useState, useMemo, ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface DropdownOption {
    id: string;
    label: string;
    /** Indentation level for hierarchical lists (0 = root) */
    depth?: number;
    /** When true, item renders bolder and is non-selectable */
    disabled?: boolean;
}

interface SearchableDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    /** Label shown when nothing is selected (also serves as the "all" option label) */
    placeholder?: string;
    /** When provided, an "all" option appears at the top with this value */
    allOption?: { value: string; label: string };
    /** Icon shown inside the trigger before the selected label */
    icon?: ReactNode;
    /** Width classes for the trigger; default makes it full-width */
    triggerClassName?: string;
    /** Width classes for the dropdown panel; default w-full */
    panelClassName?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
}

export default function SearchableDropdown({
    value,
    onChange,
    options,
    placeholder = 'Seleccionar',
    allOption,
    icon,
    triggerClassName = 'w-full',
    panelClassName = 'w-full',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'Sin resultados',
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = useMemo(() => {
        if (allOption && value === allOption.value) return allOption.label;
        const opt = options.find(o => o.id === value);
        return opt?.label.replace(/^\s*↳\s*/, '') || placeholder;
    }, [value, options, allOption, placeholder]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return options;
        return options.filter(o => o.label.toLowerCase().includes(q));
    }, [options, search]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (v: string) => {
        onChange(v);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div ref={dropdownRef} className={`relative ${triggerClassName}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2E4A3A]/30 focus:border-[#2E4A3A] transition-all"
            >
                <span className="flex items-center gap-2 min-w-0">
                    {icon && <span className="flex-shrink-0 text-gray-400">{icon}</span>}
                    <span className="truncate">{selectedLabel}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute z-50 mt-1.5 ${panelClassName} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden`}>
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2E4A3A]/30 focus:border-[#2E4A3A] transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                        {allOption && (
                            <DropdownItem
                                label={allOption.label}
                                isActive={value === allOption.value}
                                onClick={() => select(allOption.value)}
                                depth={0}
                            />
                        )}
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                                {emptyMessage}
                            </div>
                        ) : (
                            filtered.map(opt => (
                                <DropdownItem
                                    key={opt.id}
                                    label={opt.label.replace(/^\s*↳\s*/, '')}
                                    isActive={value === opt.id}
                                    onClick={() => !opt.disabled && select(opt.id)}
                                    depth={opt.depth || 0}
                                    disabled={opt.disabled}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DropdownItem({
    label,
    isActive,
    onClick,
    depth,
    disabled,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    depth: number;
    disabled?: boolean;
}) {
    const base = 'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2';
    const state = isActive
        ? 'bg-[#2E4A3A]/8 text-[#2E4A3A] dark:text-[#C9A96E] font-medium'
        : disabled
            ? 'text-gray-900 dark:text-white font-semibold cursor-default'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${state}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
            {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className={!isActive ? 'ml-5.5' : ''}>{label}</span>
        </button>
    );
}
