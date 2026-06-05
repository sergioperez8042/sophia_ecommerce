'use client';

/**
 * Toggle switch puro tailwind (sin deps).
 *
 * Estados visuales:
 *  - checked → track verde Sophia (#2E4A3A) con thumb a la derecha
 *  - unchecked → track gris con thumb a la izquierda
 *
 * Usado en la lista de gestores para Activar/Desactivar — sustituye al
 * antiguo botón "Desactivar"/"Activar" para que el estado sea visible de
 * un vistazo (todo lo que pasa por click es flip; no hay submit).
 */

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Tamaño en pixeles del thumb. Track será ~2x ancho */
  size?: 'sm' | 'md';
  /** Etiqueta accesible cuando no hay texto visible al lado */
  ariaLabel?: string;
  disabled?: boolean;
  /** title para tooltip hover */
  title?: string;
}

export default function Switch({
  checked,
  onChange,
  size = 'sm',
  ariaLabel,
  disabled = false,
  title,
}: SwitchProps) {
  const dims = size === 'sm'
    ? { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: checked ? 'translate-x-4' : 'translate-x-0.5' }
    : { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: checked ? 'translate-x-5' : 'translate-x-0.5' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center ${dims.track} rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E4A3A]/50 dark:focus:ring-offset-gray-900 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked
          ? 'bg-[#2E4A3A] dark:bg-[#C4AC91]'
          : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        aria-hidden
        className={`inline-block ${dims.thumb} bg-white dark:bg-gray-100 rounded-full shadow transform transition-transform duration-200 ${dims.translate}`}
      />
    </button>
  );
}
