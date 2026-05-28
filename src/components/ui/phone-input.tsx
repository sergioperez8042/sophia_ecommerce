"use client";

import PhoneInputBase, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import CountrySelect from './country-select';

/**
 * Input de teléfono internacional con bandera del país.
 *
 * Wrapper sobre `react-phone-number-input` (libphonenumber-js de Google bajo
 * el capó) estilizado con la paleta Sophia. Da:
 *  - Bandera del país a la izquierda del input
 *  - Selector de país con buscador
 *  - Validación E.164 estricta (formato internacional con + y código de país)
 *  - Formato automático mientras se tipea ("+53 5 201 0900")
 *  - Auto-detección del país a partir del número
 *
 * **Almacenamiento**: el componente devuelve siempre el número en formato
 * E.164 (`+5352010900`). Como Firestore guarda los números SIN el `+`
 * (`5352010900`), el caller debe quitar el prefijo antes de persistir y
 * añadirlo antes de pasar el valor al input — los helpers `e164ToDigits`
 * y `digitsToE164` (en `@/lib/phone-utils`) ayudan con eso.
 *
 * Nota: los helpers viven en `@/lib/phone-utils` (no aquí) para que este
 * archivo SOLO exporte el componente React — requisito de Fast Refresh
 * de Next.js (react-doctor/only-export-components).
 */

export interface PhoneInputProps {
  /** Valor E.164 ('+5352010900') o undefined si está vacío */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** País por defecto si el valor está vacío */
  defaultCountry?: 'CU' | 'ES' | 'US' | 'MX' | 'AR' | string;
  placeholder?: string;
  disabled?: boolean;
  /** ID del input para vincular con un <label htmlFor> */
  id?: string;
  /** Mensaje a mostrar bajo el input cuando el valor no es válido */
  showValidationHint?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'CU',
  placeholder = 'Número de teléfono',
  disabled = false,
  id,
  showValidationHint = true,
}: PhoneInputProps) {
  const valid = !value || isValidPhoneNumber(value);

  return (
    <div className="phone-input-wrapper">
      <PhoneInputBase
        id={id}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry as never}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        countrySelectComponent={CountrySelect as never}
      />
      {showValidationHint && value && !valid && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
          Número de teléfono inválido. Verifica el código de país y el largo.
        </p>
      )}

      {/* Estilos: alineamos el control con el resto de inputs del admin
          (border-gray-200 / dark:border-gray-600, bg-white / dark:bg-gray-700,
          rounded-lg, py-2.5, text-sm). Sobreescribimos los estilos por
          defecto del paquete con CSS scoped al wrapper. */}
      <style jsx>{`
        .phone-input-wrapper :global(.PhoneInput) {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid rgb(229 231 235); /* gray-200 */
          border-radius: 0.5rem; /* rounded-lg */
          background: rgb(255 255 255); /* white */
          font-size: 0.875rem; /* text-sm */
          color: rgb(17 24 39); /* gray-900 */
          gap: 0.5rem;
        }
        .phone-input-wrapper :global(.PhoneInput:focus-within) {
          outline: 2px solid rgb(80 90 74 / 0.3); /* #505A4A/30 */
          border-color: rgb(80 90 74); /* #505A4A */
          outline-offset: -1px;
        }
        :global(.dark) .phone-input-wrapper :global(.PhoneInput) {
          border-color: rgb(75 85 99); /* gray-600 */
          background: rgb(55 65 81); /* gray-700 */
          color: rgb(255 255 255); /* white */
        }
        :global(.dark) .phone-input-wrapper :global(.PhoneInput:focus-within) {
          outline-color: rgb(196 181 144 / 0.3); /* #C4B590/30 */
          border-color: rgb(196 181 144); /* #C4B590 */
        }
        .phone-input-wrapper :global(.PhoneInputCountry) {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-shrink: 0;
        }
        .phone-input-wrapper :global(.PhoneInputCountrySelect) {
          /* Botón nativo de select tras la bandera */
          cursor: pointer;
          font-size: 0.875rem;
          color: inherit;
          background: transparent;
          border: none;
          padding: 0;
          min-width: 0;
        }
        .phone-input-wrapper :global(.PhoneInputCountryIcon) {
          width: 1.5rem;
          height: 1.125rem;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .phone-input-wrapper :global(.PhoneInputInput) {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: inherit;
          font-family: inherit;
        }
        .phone-input-wrapper :global(.PhoneInputCountrySelectArrow) {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
