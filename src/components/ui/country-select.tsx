'use client';

import { useEffect, useMemo, useRef, useState, ComponentType } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * Country selector custom para `react-phone-number-input`.
 *
 * Reemplaza el `<select>` nativo (que el paquete renderiza por defecto)
 * por un dropdown con la bandera del país actual como trigger, y un panel
 * con buscador interno + lista filtrable estilizada en la paleta Sophia.
 *
 * Se conecta a react-phone-number-input via la prop `countrySelectComponent`.
 * El paquete pasa estas props:
 *  - `value`: código ISO del país actual (ej. 'CU') o undefined para "International"
 *  - `onChange`: (countryCode) => void
 *  - `options`: array de { value, label, divider? } generado por el paquete
 *  - `iconComponent`: componente React que renderiza la bandera de un país
 *  - `disabled`, `readOnly`, etc.
 *
 * La bandera se obtiene via `iconComponent` que recibe `country` como prop.
 * Cuando `value` es undefined, mostramos un globo (mundo) por defecto.
 */

type Option = {
  value?: string;
  label: string;
  divider?: boolean;
};

interface CountrySelectProps {
  name?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  options: Option[];
  iconComponent?: ComponentType<{ country?: string; label?: string; aspectRatio?: number }>;
  disabled?: boolean;
  readOnly?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  onFocus,
  onBlur,
  options,
  iconComponent: IconComponent,
  disabled = false,
  readOnly = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtramos out las "divider" rows del paquete — no las renderizamos
  // como separador visual porque el orden por defecto (most-used arriba)
  // se pierde con el buscador. La lista plana ordenada alfabéticamente
  // es más usable.
  const flatOptions = useMemo(
    () => options.filter((o) => !o.divider && o.value !== undefined) as Required<Option>[],
    [options],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return flatOptions;
    return flatOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [flatOptions, search]);

  const current = useMemo(() => flatOptions.find((o) => o.value === value), [flatOptions, value]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onBlur]);

  const select = (v: string) => {
    onChange(v);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          if (disabled || readOnly) return;
          setIsOpen(!isOpen);
          if (!isOpen) onFocus?.();
        }}
        disabled={disabled || readOnly}
        className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-[#2E4A3A]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={current?.label || 'Cambiar país'}
      >
        {IconComponent && (
          <span className="w-6 h-[18px] overflow-hidden rounded-sm shadow-sm flex-shrink-0">
            <IconComponent country={value} label={current?.label} aspectRatio={1.5} />
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar país..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E4A3A]/30 focus:border-[#2E4A3A]"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                Sin resultados
              </div>
            ) : (
              filtered.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                      isActive
                        ? 'bg-[#2E4A3A]/8 text-[#2E4A3A] dark:text-[#C9A96E] font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {IconComponent && (
                      <span className="w-6 h-[18px] overflow-hidden rounded-sm shadow-sm flex-shrink-0">
                        <IconComponent country={opt.value} label={opt.label} aspectRatio={1.5} />
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
