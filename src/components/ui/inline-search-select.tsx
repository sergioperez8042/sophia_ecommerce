"use client";

import { useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * Selector inline con búsqueda. El usuario tipea en el input y va viendo
 * resultados en un dropdown justo debajo. Pensado para flujos en los que
 * la búsqueda forma parte del UX permanente (no detrás de un botón).
 *
 * Reemplaza el patrón que el `LocationPopup` repetía 3 veces (provincia,
 * municipio, consejo popular). La paleta y la lógica de cascada se
 * quedan en el padre — este componente es controlado y presentacional.
 *
 * Si necesitas el patrón "botón + panel con search" para listas largas
 * en formularios admin, mira el `SearchableDropdown` (default export en
 * `searchable-dropdown.tsx`). Son patrones distintos a propósito.
 */

export interface InlineSearchSelectProps {
  /** Etiqueta encima del input (uppercase, tracking-wider) */
  label: string;
  /** Texto del input de búsqueda — controlado por el padre */
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  /** Valor canónico seleccionado actualmente. Vacío = nada seleccionado */
  selected: string;
  /** Opciones a mostrar — ya filtradas por el padre */
  options: readonly string[];
  /** Click en una opción del dropdown */
  onSelect: (option: string) => void;
  /** Estado del dropdown — controlado por el padre */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Placeholder del input */
  placeholder: string;
  /** Texto cuando `options.length === 0` */
  emptyMessage: string;
  /** Si true, input deshabilitado y dropdown oculto */
  disabled?: boolean;
  /** Modo dark — calcula la paleta de Sophia */
  isDark: boolean;
  /** Para tests (data-testid en el contenedor) */
  testId?: string;
}

export function InlineSearchSelect({
  label,
  searchTerm,
  onSearchTermChange,
  selected,
  options,
  onSelect,
  isOpen,
  onOpenChange,
  placeholder,
  emptyMessage,
  disabled = false,
  isDark,
  testId,
}: InlineSearchSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside cierra el dropdown. Solo registramos el listener cuando
  // el dropdown está abierto — sin coste en el caso común (cerrado).
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, onOpenChange]);

  // Paleta Sophia: tonos cálidos #C9A96E (dark) / #2E4A3A (light) con
  // opacidades. Derivada de `isDark` (boolean estable) — sin useMemo.
  // Estas clases son IDÉNTICAS a las que vivían inline en `LocationPopup`
  // antes de la extracción, mantenidas explícitamente para garantizar
  // zero cambio visual.
  const labelColor = isDark ? "text-[#C9A96E]/60" : "text-[#2E4A3A]/60";
  const iconColor = isDark ? "text-[#C9A96E]/40" : "text-[#2E4A3A]/40";
  const inputBg = isDark ? "bg-white/5" : "bg-gray-50";
  const inputBorder = isDark ? "border-[#C9A96E]/20" : "border-gray-200";
  const inputText = isDark ? "text-[#e8e0d0]" : "text-gray-900";
  const inputPlaceholder = isDark
    ? "placeholder-[#C9A96E]/30"
    : "placeholder-gray-400";
  const inputFocus = isDark
    ? "focus:border-[#C9A96E]/50"
    : "focus:border-[#2E4A3A]/40";
  const dropdownBg = isDark ? "bg-[#22261f]" : "bg-white";
  const dropdownBorder = isDark ? "border-[#C9A96E]/20" : "border-gray-200";
  const emptyText = isDark ? "text-[#C9A96E]/50" : "text-gray-400";
  const optionHover = isDark
    ? "hover:bg-[#C9A96E]/10"
    : "hover:bg-[#2E4A3A]/5";
  const optionText = isDark ? "text-[#d4cdc0]" : "text-gray-700";
  const optionActive = isDark
    ? "text-[#C9A96E] bg-[#C9A96E]/5"
    : "text-[#2E4A3A] bg-[#2E4A3A]/5";

  const dropdownVisible = isOpen && !disabled;
  const listboxId = testId ? `${testId}-listbox` : undefined;

  return (
    <div ref={containerRef} className="relative" data-testid={testId}>
      <label
        className={`text-xs ${labelColor} uppercase tracking-wider mb-1.5 block`}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
            onOpenChange(true);
          }}
          onFocus={() => {
            if (!disabled) onOpenChange(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          aria-expanded={dropdownVisible}
          aria-controls={listboxId}
          role="combobox"
          className={`w-full pl-10 pr-10 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${inputPlaceholder} text-sm focus:outline-none ${inputFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
        />
        <ChevronDown
          aria-hidden
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
        />
      </div>
      {dropdownVisible && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-10 w-full mt-1 ${dropdownBg} border ${dropdownBorder} rounded-xl max-h-48 overflow-y-auto shadow-xl`}
        >
          {options.length === 0 ? (
            <div className={`px-4 py-3 text-sm ${emptyText}`}>
              {emptyMessage}
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected === opt}
                onClick={() => onSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm ${optionHover} transition-colors ${
                  selected === opt ? optionActive : optionText
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
