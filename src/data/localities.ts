/**
 * Estructura administrativa Provincia → Municipio → Consejo Popular para
 * el catálogo Sophia. Los datos aquí son ESTÁTICOS (la división política
 * de Cuba no cambia con frecuencia).
 *
 * La asignación de QUÉ gestor cubre QUÉ consejo vive en Firestore
 * (campo `consejos[]` de cada IGestor) y se gestiona desde el admin —
 * NO aquí. Esto permite reasignar zonas sin tocar código.
 *
 * Helpers expuestos:
 *   - getProvinces()                       → ['La Habana', 'Matanzas']
 *   - getMunicipalities(province)          → municipios de esa provincia
 *   - getConsejos(province, municipality)  → consejos populares del municipio
 *   - requiresConsejoPopular(province)     → true si la provincia usa 3 niveles
 *
 * Para añadir nuevas provincias (Pinar del Río, Cienfuegos, etc), basta con
 * pushear otra entrada al array `PROVINCES_DATA`.
 */

export type MunicipalityData = {
  municipality: string;
  /** Consejos populares del municipio. Solo se usa cuando la provincia
   * tiene `usesConsejos: true`. Para provincias sin consejos detallados
   * (Matanzas, etc), este array queda vacío. */
  consejos: string[];
};

export type ProvinceData = {
  province: string;
  /** Si true, el flujo cliente requiere los 3 dropdowns (Provincia →
   * Municipio → Consejo Popular). Si false, solo Provincia + Municipio. */
  usesConsejos: boolean;
  municipalities: MunicipalityData[];
};

// =============================================================================
// LA HABANA — 15 municipios × ~7 consejos populares (datos del cliente)
// =============================================================================
const LA_HABANA: ProvinceData = {
  province: "La Habana",
  usesConsejos: true,
  municipalities: [
    {
      municipality: "La Habana del Este",
      consejos: [
        "Camilo Cienfuegos",
        "Cojímar",
        "Gaiteras",
        "Alamar",
        "Guanabo",
        "Campo Florido",
      ],
    },
    {
      municipality: "Guanabacoa",
      consejos: [
        "Villa I (Centro Histórico)",
        "Villa II",
        "Chibás - Jata",
        "D'Beche - Nalón",
        "Minas - Barrera y Pedro Pi",
        "Peñalver - Bacuranao",
      ],
    },
    {
      municipality: "Regla",
      consejos: ["Guaicanamar", "Casablanca", "Loma - Modelo"],
    },
    {
      municipality: "San Miguel del Padrón",
      consejos: [
        "Rocafort",
        "Luyanó Moderno",
        "Diezmero",
        "San Francisco de Paula",
        "Dolores - Veracruz",
        "Jacomino",
      ],
    },
    {
      municipality: "Cotorro",
      consejos: [
        "San Pedro - Centro Cotorro",
        "Santa María del Rosario",
        "Lotería",
        "Cuatro Caminos",
        "Magdalena - Torriente",
        "Alberro",
      ],
    },
    {
      municipality: "Plaza de la Revolución",
      consejos: [
        "Vedado",
        "Vedado - Malecón",
        "El Carmelo",
        "Rampa",
        "Príncipe",
        "Plaza",
        "Nuevo Vedado",
        "Colón",
      ],
    },
    {
      municipality: "Playa",
      consejos: [
        "Miramar",
        "Buena Vista",
        "Ampliación de Almendares",
        "Ceiba - Kohly",
        "Cubanacán",
        "Siboney - Atabey",
        "Jaimanitas",
        "Santa Fe",
      ],
    },
    {
      municipality: "Centro Habana",
      consejos: [
        "Cayo Hueso",
        "San Leopoldo",
        "Dragones",
        "Los Sitios",
        "Pueblo Nuevo",
      ],
    },
    {
      municipality: "La Habana Vieja",
      consejos: [
        "Prado",
        "Catedral",
        "Plaza Vieja",
        "Belén",
        "Jesús María",
        "San Isidro",
        "Tallapiedra",
      ],
    },
    {
      municipality: "Cerro",
      consejos: [
        "Latinoamericano",
        "Pilar - Atarés",
        "Cerros",
        "Las Cañas",
        "Canal",
        "Palatino",
        "Armada",
        "Casino Deportivo",
      ],
    },
    {
      municipality: "Diez de Octubre",
      consejos: [
        "Luyanó",
        "Jesús del Monte",
        "Lawton",
        "Vista Alegre",
        "Tamarindo",
        "Santos Suárez",
        "Víbora",
        "Acosta",
        "Sevillano",
      ],
    },
    {
      municipality: "Arroyo Naranjo",
      consejos: [
        "Los Pinos",
        "Joey",
        "Víbora Park",
        "Mantilla",
        "Párraga",
        "Calzada de Managua",
        "Guadalupe",
        "El Eléctrico",
        "Managua",
        "Callejas",
      ],
    },
    {
      municipality: "Boyeros",
      consejos: [
        "Altahabana",
        "Capdevila",
        "Armada",
        "Calabazar",
        "Wajay",
        "Santiago de las Vegas",
        "Nuevo Santiago",
      ],
    },
    {
      municipality: "Marianao",
      consejos: [
        "Pogolotti - Belén - Finlay",
        "Zamora - Coco Solo",
        "Libertad",
        "ICAIC",
        "Los Ángeles",
        "Civic Center (Plaza Cívica)",
      ],
    },
    {
      municipality: "La Lisa",
      consejos: [
        "Alturas de La Lisa",
        "Balcón de Arimao",
        "El Cano",
        "Valle Grande",
        "Bello 26",
        "San Agustín",
        "Arroyo Arenas",
        "Punta Brava",
        "Versalles",
        "Coronela",
      ],
    },
  ],
};

// =============================================================================
// MATANZAS — 13 municipios, sin consejos populares detallados aún.
// usesConsejos=false → el flujo cliente es solo Provincia + Municipio.
// =============================================================================
const MATANZAS: ProvinceData = {
  province: "Matanzas",
  usesConsejos: false,
  municipalities: [
    { municipality: "Matanzas", consejos: [] },
    { municipality: "Cárdenas", consejos: [] },
    { municipality: "Limonar", consejos: [] },
    { municipality: "Unión de Reyes", consejos: [] },
    { municipality: "Colón", consejos: [] },
    { municipality: "Jovellanos", consejos: [] },
    { municipality: "Jagüey Grande", consejos: [] },
    { municipality: "Ciénaga de Zapata", consejos: [] },
    { municipality: "Calimete", consejos: [] },
    { municipality: "Pedro Betancourt", consejos: [] },
    { municipality: "Perico", consejos: [] },
    { municipality: "Martí", consejos: [] },
    { municipality: "Los Arabos", consejos: [] },
  ],
};

export const PROVINCES_DATA: ProvinceData[] = [LA_HABANA, MATANZAS];

// =============================================================================
// HELPERS DE LOOKUP — pure functions, sin IO
// =============================================================================

/**
 * Normaliza un string para hacer comparaciones tolerantes a acentos y
 * mayúsculas. Es la pieza que evita que "San Miguel del Padron" (escrito sin
 * tilde en `cuba-locations.ts`) deje de matchear contra "San Miguel del
 * Padrón" (con tilde, escrito en `PROVINCES_DATA` aquí o en Firestore).
 *
 * IMPORTANTE: solo se usa en COMPARACIONES. Los strings guardados (en
 * Firestore, en este archivo, en localStorage) NO se modifican — el usuario
 * sigue viendo "Padrón" en la UI. Esto es symmetric matching, no rewriting.
 *
 * Idempotente: aplicar dos veces da el mismo resultado.
 */
export const normalizeForMatch = (s: string): string =>
  s
    .normalize("NFD")
    // \p{Diacritic} = cualquier combinación diacrítica unicode
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const getProvinces = (): string[] =>
  PROVINCES_DATA.map((p) => p.province);

export const requiresConsejoPopular = (province: string): boolean => {
  // Province es un literal corto, normalizamos por simetría con resto del API
  const target = normalizeForMatch(province);
  const p = PROVINCES_DATA.find((x) => normalizeForMatch(x.province) === target);
  return p?.usesConsejos ?? false;
};

export const getMunicipalities = (province: string): string[] => {
  const target = normalizeForMatch(province);
  const p = PROVINCES_DATA.find((x) => normalizeForMatch(x.province) === target);
  if (!p) return [];
  return p.municipalities
    .map((m) => m.municipality)
    .slice()
    .sort((a, b) => a.localeCompare(b, "es"));
};

export const getConsejos = (
  province: string,
  municipality: string,
): string[] => {
  const m = findMunicipality(province, municipality);
  if (!m) return [];
  return m.consejos.slice().sort((a, b) => a.localeCompare(b, "es"));
};

const findMunicipality = (
  province: string,
  municipality: string,
): MunicipalityData | undefined => {
  const provN = normalizeForMatch(province);
  const muniN = normalizeForMatch(municipality);
  const p = PROVINCES_DATA.find((x) => normalizeForMatch(x.province) === provN);
  return p?.municipalities.find(
    (m) => normalizeForMatch(m.municipality) === muniN,
  );
};
