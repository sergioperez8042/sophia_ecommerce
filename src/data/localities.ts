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
        "Guiteras",
        "El Bahía",
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

// =============================================================================
// MAYABEQUE — 11 municipios, sin consejos populares detallados.
// =============================================================================
const MAYABEQUE: ProvinceData = {
  province: "Mayabeque",
  usesConsejos: false,
  municipalities: [
    { municipality: "Batabanó", consejos: [] },
    { municipality: "Bejucal", consejos: [] },
    { municipality: "Güines", consejos: [] },
    { municipality: "Jaruco", consejos: [] },
    { municipality: "Madruga", consejos: [] },
    { municipality: "Melena del Sur", consejos: [] },
    { municipality: "Nueva Paz", consejos: [] },
    { municipality: "Quivicán", consejos: [] },
    { municipality: "San José de las Lajas", consejos: [] },
    { municipality: "San Nicolás de Bari", consejos: [] },
    { municipality: "Santa Cruz del Norte", consejos: [] },
  ],
};

// =============================================================================
// GRANMA — 13 municipios, sin consejos populares detallados.
// =============================================================================
const GRANMA: ProvinceData = {
  province: "Granma",
  usesConsejos: false,
  municipalities: [
    { municipality: "Bartolomé Masó", consejos: [] },
    { municipality: "Bayamo", consejos: [] },
    { municipality: "Buey Arriba", consejos: [] },
    { municipality: "Campechuela", consejos: [] },
    { municipality: "Cauto Cristo", consejos: [] },
    { municipality: "Guisa", consejos: [] },
    { municipality: "Jiguaní", consejos: [] },
    { municipality: "Manzanillo", consejos: [] },
    { municipality: "Media Luna", consejos: [] },
    { municipality: "Niquero", consejos: [] },
    { municipality: "Pilón", consejos: [] },
    { municipality: "Río Cauto", consejos: [] },
    { municipality: "Yara", consejos: [] },
  ],
};

// =============================================================================
// SANTIAGO DE CUBA — 9 municipios, sin consejos populares detallados.
// =============================================================================
const SANTIAGO_DE_CUBA: ProvinceData = {
  province: "Santiago de Cuba",
  usesConsejos: false,
  municipalities: [
    { municipality: "Contramaestre", consejos: [] },
    { municipality: "Guamá", consejos: [] },
    { municipality: "Julio Antonio Mella", consejos: [] },
    { municipality: "Palma Soriano", consejos: [] },
    { municipality: "San Luis", consejos: [] },
    { municipality: "Santiago de Cuba", consejos: [] },
    { municipality: "Segundo Frente", consejos: [] },
    { municipality: "Songo - La Maya", consejos: [] },
    { municipality: "Tercer Frente", consejos: [] },
  ],
};

export const PROVINCES_DATA: ProvinceData[] = [
  LA_HABANA,
  MATANZAS,
  MAYABEQUE,
  GRANMA,
  SANTIAGO_DE_CUBA,
];

// =============================================================================
// HELPERS DE LOOKUP — pure functions, sin IO
// =============================================================================

// Regex hoisted a módulo: evita crear una nueva instancia en cada llamada a
// normalizeForMatch (que se invoca decenas de veces por render del admin).
const DIACRITIC_RE = /\p{Diacritic}/gu;

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
  s.normalize("NFD").replace(DIACRITIC_RE, "").toLowerCase().trim();

// Cachés a nivel de módulo. Los datos son ESTÁTICOS (la división política
// no cambia en runtime), así que precomputamos lo que cada lookup devuelve.
// Pasamos de O(N) en cada llamada a O(1) tras el primer hit.
//
// NOTA: los caches no se invalidan nunca a propósito — `PROVINCES_DATA` es
// const y se inicializa una sola vez. Si en el futuro estos datos pasaran
// a venir de Firestore, habría que añadir invalidación.

// Mapa con clave normalizada → ProvinceData. Permite que el lookup tolere
// variantes de acentos/case sin recalcular normalización en cada find.
const PROVINCE_INDEX: ReadonlyMap<string, ProvinceData> = (() => {
  const m = new Map<string, ProvinceData>();
  for (const p of PROVINCES_DATA) m.set(normalizeForMatch(p.province), p);
  return m;
})();

// Lista plana de nombres canónicos de provincia (orden de declaración).
const PROVINCE_NAMES: readonly string[] = PROVINCES_DATA.map((p) => p.province);

// Municipios ordenados por provincia. La key es la province normalizada.
const MUNICIPALITIES_BY_PROVINCE: ReadonlyMap<string, readonly string[]> =
  (() => {
    const m = new Map<string, readonly string[]>();
    for (const p of PROVINCES_DATA) {
      const sorted = p.municipalities
        .map((mu) => mu.municipality)
        .slice()
        .sort((a, b) => a.localeCompare(b, "es"));
      m.set(normalizeForMatch(p.province), sorted);
    }
    return m;
  })();

// Consejos por (province + municipality). Key = "provN|muniN".
const CONSEJOS_INDEX: ReadonlyMap<string, readonly string[]> = (() => {
  const m = new Map<string, readonly string[]>();
  for (const p of PROVINCES_DATA) {
    const provN = normalizeForMatch(p.province);
    for (const mu of p.municipalities) {
      const sorted = mu.consejos
        .slice()
        .sort((a, b) => a.localeCompare(b, "es"));
      m.set(`${provN}|${normalizeForMatch(mu.municipality)}`, sorted);
    }
  }
  return m;
})();

// Map plano de municipality data por (provN|muniN). Útil para internos.
const MUNICIPALITY_INDEX: ReadonlyMap<string, MunicipalityData> = (() => {
  const m = new Map<string, MunicipalityData>();
  for (const p of PROVINCES_DATA) {
    const provN = normalizeForMatch(p.province);
    for (const mu of p.municipalities) {
      m.set(`${provN}|${normalizeForMatch(mu.municipality)}`, mu);
    }
  }
  return m;
})();

export const getProvinces = (): readonly string[] => PROVINCE_NAMES;

export const requiresConsejoPopular = (province: string): boolean => {
  const p = PROVINCE_INDEX.get(normalizeForMatch(province));
  return p?.usesConsejos ?? false;
};

export const getMunicipalities = (province: string): readonly string[] => {
  return MUNICIPALITIES_BY_PROVINCE.get(normalizeForMatch(province)) ?? [];
};

export const getConsejos = (
  province: string,
  municipality: string,
): readonly string[] => {
  const key = `${normalizeForMatch(province)}|${normalizeForMatch(municipality)}`;
  return CONSEJOS_INDEX.get(key) ?? [];
};

// Reservado por si algún consumer interno necesita el objeto completo.
// Hoy no se usa fuera del módulo — lo dejo private por YAGNI.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const findMunicipality = (
  province: string,
  municipality: string,
): MunicipalityData | undefined => {
  const key = `${normalizeForMatch(province)}|${normalizeForMatch(municipality)}`;
  return MUNICIPALITY_INDEX.get(key);
};
