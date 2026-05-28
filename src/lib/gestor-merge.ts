import { normalizeForMatch } from '@/data/localities';

/**
 * Merge robusto de cobertura de gestores.
 *
 * Une las zonas de `source` dentro de `target` (provinces, municipalities,
 * consejos) deduplicando por clave NORMALIZADA — es decir, ignorando
 * diferencias de acentos, mayúsculas y espacios al inicio/fin.
 *
 * Por qué normalizado: las distintas fuentes de datos (seed, CUBA_PROVINCES,
 * localities, ediciones manuales del admin) pueden tener el mismo lugar
 * escrito con o sin tilde ("San Miguel del Padrón" vs "San Miguel del
 * Padron"). Un dedup por string exacto generaría duplicados o, peor, al
 * filtrar descartaría silenciosamente cobertura válida. Normalizar la clave
 * evita ese class de bug — el síntoma que llevó a este helper.
 *
 * Política de "ganador" ante un duplicado normalizado: se conserva la
 * PRIMERA aparición (las de `target` van primero), preservando el casing/
 * acentos canónicos que ya tenía el gestor destino.
 */

export interface ConsejoTuple {
  municipality: string;
  consejo: string;
}

export interface GestorCoverage {
  provinces?: string[];
  municipalities: string[];
  consejos: ConsejoTuple[];
}

/** Dedup de strings por valor normalizado, conservando la primera aparición. */
export function dedupeStringsNormalized(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = normalizeForMatch(v);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

/** Clave normalizada estable de un consejo: "municipio|consejo" sin acentos. */
export function consejoKey(c: ConsejoTuple): string {
  return `${normalizeForMatch(c.municipality)}|${normalizeForMatch(c.consejo)}`;
}

/** Dedup de consejos por clave normalizada, conservando la primera aparición. */
export function dedupeConsejosNormalized(
  consejos: readonly ConsejoTuple[],
): ConsejoTuple[] {
  const seen = new Set<string>();
  const out: ConsejoTuple[] = [];
  for (const c of consejos) {
    const key = consejoKey(c);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

/**
 * Une la cobertura de `source` en `target`. No muta los argumentos.
 * Devuelve provinces/municipalities/consejos unidos y deduplicados
 * normalizadamente.
 */
export function mergeGestorCoverage(
  target: GestorCoverage,
  source: GestorCoverage,
): GestorCoverage {
  return {
    provinces: dedupeStringsNormalized([
      ...(target.provinces ?? []),
      ...(source.provinces ?? []),
    ]),
    municipalities: dedupeStringsNormalized([
      ...target.municipalities,
      ...source.municipalities,
    ]),
    consejos: dedupeConsejosNormalized([
      ...target.consejos,
      ...source.consejos,
    ]),
  };
}
