import { isValidPhoneNumber } from 'react-phone-number-input';

/**
 * Helpers de puente entre el formato E.164 que usa el componente
 * `PhoneInput` (`+5352010900`) y el formato que Firestore guarda (solo
 * dígitos, sin `+`: `5352010900`).
 *
 * Viven aquí (no en `phone-input.tsx`) para que ese archivo solo exporte
 * el componente React — requisito de Fast Refresh de Next.js
 * (react-doctor/only-export-components). Mezclar exports de componente +
 * funciones en el mismo módulo rompe el hot-reload en dev.
 */

/**
 * Convierte el formato Firestore ('5352010900' sin +) al formato que
 * react-phone-number-input espera ('+5352010900').
 */
export function digitsToE164(digits: string | undefined | null): string | undefined {
  if (!digits) return undefined;
  const trimmed = digits.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed.replace(/[^0-9]/g, '')}`;
}

/**
 * Helper inverso: del E.164 del componente al formato Firestore (solo
 * dígitos, sin +).
 */
export function e164ToDigits(e164: string | undefined | null): string {
  if (!e164) return '';
  return e164.replace(/[^0-9]/g, '');
}

/** Re-export de la validación E.164 de libphonenumber-js. */
export { isValidPhoneNumber };
