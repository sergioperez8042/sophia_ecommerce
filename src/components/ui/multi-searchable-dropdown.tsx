'use client';

import { useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * Selector multi-select con buscador interno.
 *
 * Misma estética que `SearchableDropdown` (paleta Sophia, rounded-xl,
 * focus:ring-[#2E4A3A]) pero con varios valores seleccionables a la vez —
 * para casos como provincias, municipios o consejos populares en el admin
 * de gestores donde el usuario marca múltiples opciones.
 *
 * El trigger button muestra cuántos elementos están seleccionados; el panel
 * abre debajo con un input de búsqueda en la cabecera y una lista
 * scrollable con checkboxes. Click-outside cierra. Tab y Escape igual.
 *
 * Es controlado (no guarda estado de selección — solo de UI).
 */

export interface MultiOption {
  /** Identificador único de la opción */
  id: string;
  /** Texto a mostrar */
  label: string;
}

interface MultiSearchableDropdownProps {
  /** IDs actualmente seleccionados */
  selected: string[];
  onChange: (next: string[]) => void;
  options: MultiOption[];
  /** Etiqueta del trigger cuando nada está seleccionado */
  placeholder?: string;
  /** Etiqueta singular del item (p.ej. "provincia"). Se usa para "(N provincias)". */
  itemLabel?: string;
  /** Icono dentro del trigger */
  icon?: ReactNode;
  /** Placeholder del search input */
  searchPlaceholder?: string;
  /** Texto cuando no hay matches */
  emptyMessage?: string;
  /** Classes del trigger; default w-full */
  triggerClassName?: string;
  /** Classes del panel; default w-full */
  panelClassName?: string;
  disabled?: boolean;
}

export default function MultiSearchableDropdown({
  selected,
  onChange,
  options,
  placeholder = 'Seleccionar',
  itemLabel = 'seleccionado',
  icon,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  triggerClassName = 'w-full',
  panelClassName = 'w-full',
  disabled = false,
}: MultiSearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set para lookup O(1) cuando renderizamos la lista. Memoizado porque
  // el render del panel itera todas las opciones, y selected puede tener
  // decenas de IDs en formularios con muchas zonas marcadas.
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const triggerLabel = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const opt = options.find((o) => o.id === selected[0]);
      return opt?.label || `1 ${itemLabel}`;
    }
    return `${selected.length} ${itemLabel}s seleccionados`;
  }, [selected, options, placeholder, itemLabel]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else setSearch('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${triggerClassName}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E4A3A]/30 focus:border-[#2E4A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="flex-shrink-0 text-gray-400">{icon}</span>}
          <span className={`truncate ${selected.length === 0 ? 'text-gray-400 dark:text-gray-500' : ''}`}>
            {triggerLabel}
          </span>
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
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2E4A3A]/30 focus:border-[#2E4A3A] transition-all"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt) => {
                const isActive = selectedSet.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-[#2E4A3A]/8 text-[#2E4A3A] dark:text-[#C9A96E] font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#2E4A3A] border-[#2E4A3A] dark:bg-[#C9A96E] dark:border-[#C9A96E]'
                          : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 text-white dark:text-gray-800" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {selected.length} {itemLabel}{selected.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[#2E4A3A] dark:text-[#C9A96E] hover:underline"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
