/**
 * Estructura administrativa Provincia → Municipio → Consejo Popular para
 * la cobertura Sophia. Los datos son ESTÁTICOS (la división política no
 * cambia), pero la asignación de `gestorName` puede evolucionar — por eso
 * los gestores se buscan en Firestore por nombre, no se hardcodea su info.
 *
 * Diseño del lookup:
 *   1. El usuario selecciona provincia → municipio → consejo en el popup
 *   2. Llamamos a `findGestorNameForLocality()` → devuelve el nombre del
 *      gestor o null
 *   3. Si hay nombre, GestorService.findByName(name) trae el IGestor de
 *      Firestore (con su WhatsApp, foto, permisos)
 *   4. Si no hay nombre, `getNearbyConsejosWithGestor()` sugiere consejos
 *      cercanos del mismo municipio que sí tengan gestor asignado
 *
 * Para añadir nuevas provincias (Pinar del Río, Matanzas, etc), basta con
 * pushear otra entrada al array `PROVINCES_DATA`.
 */

export type LocalityEntry = {
  /** Nombre del consejo popular (ej. "Cayo Hueso") */
  consejo: string;
  /** Nombre del gestor asignado, o null si la zona aún no tiene cobertura */
  gestorName: string | null;
};

export type MunicipalityData = {
  municipality: string;
  /** Consejos populares del municipio. Solo se usa cuando la provincia
   * tiene `usesConsejos: true`. Para provincias sin consejos detallados,
   * este array queda vacío y se usa `defaultGestorName` a nivel municipio. */
  consejos: LocalityEntry[];
  /** Gestor que cubre todo el municipio cuando la provincia no usa el 3er
   * dropdown de consejo popular. Null si el municipio no tiene cobertura. */
  defaultGestorName?: string | null;
};

export type ProvinceData = {
  province: string;
  /** Si true, el cliente debe seleccionar Provincia → Municipio → Consejo
   * Popular (3 dropdowns). Si false, basta con Provincia + Municipio. */
  usesConsejos: boolean;
  municipalities: MunicipalityData[];
};

// =============================================================================
// LA HABANA — datos verificados con el cliente (mayo 2026)
// =============================================================================
const LA_HABANA: ProvinceData = {
  province: "La Habana",
  usesConsejos: true,
  municipalities: [
    {
      municipality: "La Habana del Este",
      consejos: [
        { consejo: "Camilo Cienfuegos", gestorName: "Arturo" },
        { consejo: "Cojímar", gestorName: "Arturo" },
        { consejo: "Gaiteras", gestorName: "Arturo" },
        { consejo: "Alamar", gestorName: "Danay" },
        { consejo: "Guanabo", gestorName: "Mariam" },
        { consejo: "Campo Florido", gestorName: null },
      ],
    },
    {
      municipality: "Guanabacoa",
      consejos: [
        { consejo: "Villa I (Centro Histórico)", gestorName: "Gisselle" },
        { consejo: "Villa II", gestorName: "Gisselle" },
        { consejo: "Chibás - Jata", gestorName: "Gisselle" },
        { consejo: "D'Beche - Nalón", gestorName: "Gisselle" },
        { consejo: "Minas - Barrera y Pedro Pi", gestorName: "Gisselle" },
        { consejo: "Peñalver - Bacuranao", gestorName: "Gisselle" },
      ],
    },
    {
      municipality: "Regla",
      consejos: [
        { consejo: "Guaicanamar", gestorName: "Gisselle" },
        { consejo: "Casablanca", gestorName: "Gisselle" },
        { consejo: "Loma - Modelo", gestorName: "Gisselle" },
      ],
    },
    {
      municipality: "San Miguel del Padrón",
      consejos: [
        { consejo: "Rocafort", gestorName: null },
        { consejo: "Luyanó Moderno", gestorName: null },
        { consejo: "Diezmero", gestorName: null },
        { consejo: "San Francisco de Paula", gestorName: null },
        { consejo: "Dolores - Veracruz", gestorName: null },
        { consejo: "Jacomino", gestorName: null },
      ],
    },
    {
      municipality: "Cotorro",
      consejos: [
        { consejo: "San Pedro - Centro Cotorro", gestorName: null },
        { consejo: "Santa María del Rosario", gestorName: null },
        { consejo: "Lotería", gestorName: null },
        { consejo: "Cuatro Caminos", gestorName: null },
        { consejo: "Magdalena - Torriente", gestorName: null },
        { consejo: "Alberro", gestorName: null },
      ],
    },
    {
      municipality: "Plaza de la Revolución",
      consejos: [
        { consejo: "Vedado", gestorName: "Kathy" },
        { consejo: "Vedado - Malecón", gestorName: "Kathy" },
        { consejo: "El Carmelo", gestorName: "Kathy" },
        { consejo: "Rampa", gestorName: "Kathy" },
        { consejo: "Príncipe", gestorName: "Kathy" },
        { consejo: "Plaza", gestorName: "Kathy" },
        { consejo: "Nuevo Vedado", gestorName: "Kathy" },
        { consejo: "Colón", gestorName: "Kathy" },
      ],
    },
    {
      municipality: "Playa",
      consejos: [
        { consejo: "Miramar", gestorName: null },
        { consejo: "Buena Vista", gestorName: null },
        { consejo: "Ampliación de Almendares", gestorName: null },
        { consejo: "Ceiba - Kohly", gestorName: null },
        { consejo: "Cubanacán", gestorName: null },
        { consejo: "Siboney - Atabey", gestorName: null },
        { consejo: "Jaimanitas", gestorName: null },
        { consejo: "Santa Fe", gestorName: null },
      ],
    },
    {
      municipality: "Centro Habana",
      consejos: [
        { consejo: "Cayo Hueso", gestorName: "Maday" },
        { consejo: "San Leopoldo", gestorName: "Arturo" },
        { consejo: "Dragones", gestorName: "Maday" },
        { consejo: "Los Sitios", gestorName: "Arturo" },
        { consejo: "Pueblo Nuevo", gestorName: "Maday" },
      ],
    },
    {
      municipality: "La Habana Vieja",
      consejos: [
        { consejo: "Prado", gestorName: "Maday" },
        { consejo: "Catedral", gestorName: null },
        { consejo: "Plaza Vieja", gestorName: null },
        { consejo: "Belén", gestorName: null },
        { consejo: "Jesús María", gestorName: null },
        { consejo: "San Isidro", gestorName: null },
        { consejo: "Tallapiedra", gestorName: null },
      ],
    },
    {
      municipality: "Cerro",
      consejos: [
        { consejo: "Latinoamericano", gestorName: null },
        { consejo: "Pilar - Atarés", gestorName: null },
        { consejo: "Cerros", gestorName: null },
        { consejo: "Las Cañas", gestorName: null },
        { consejo: "Canal", gestorName: null },
        { consejo: "Palatino", gestorName: null },
        { consejo: "Armada", gestorName: null },
        { consejo: "Casino Deportivo", gestorName: null },
      ],
    },
    {
      municipality: "Diez de Octubre",
      consejos: [
        { consejo: "Luyanó", gestorName: "Arturo" },
        { consejo: "Jesús del Monte", gestorName: "Arturo" },
        { consejo: "Lawton", gestorName: "Arturo" },
        { consejo: "Vista Alegre", gestorName: "Arturo" },
        { consejo: "Tamarindo", gestorName: "Arturo" },
        { consejo: "Santos Suárez", gestorName: "Arturo" },
        { consejo: "Víbora", gestorName: "Arturo" },
        { consejo: "Acosta", gestorName: "Arturo" },
        { consejo: "Sevillano", gestorName: "Arturo" },
      ],
    },
    {
      municipality: "Arroyo Naranjo",
      consejos: [
        { consejo: "Los Pinos", gestorName: null },
        { consejo: "Joey", gestorName: null },
        { consejo: "Víbora Park", gestorName: null },
        { consejo: "Mantilla", gestorName: null },
        { consejo: "Párraga", gestorName: null },
        { consejo: "Calzada de Managua", gestorName: null },
        { consejo: "Guadalupe", gestorName: null },
        { consejo: "El Eléctrico", gestorName: null },
        { consejo: "Managua", gestorName: null },
        { consejo: "Callejas", gestorName: null },
      ],
    },
    {
      municipality: "Boyeros",
      consejos: [
        { consejo: "Altahabana", gestorName: null },
        { consejo: "Capdevila", gestorName: null },
        { consejo: "Armada", gestorName: null },
        { consejo: "Calabazar", gestorName: null },
        { consejo: "Wajay", gestorName: null },
        { consejo: "Santiago de las Vegas", gestorName: null },
        { consejo: "Nuevo Santiago", gestorName: null },
      ],
    },
    {
      municipality: "Marianao",
      consejos: [
        { consejo: "Pogolotti - Belén - Finlay", gestorName: null },
        { consejo: "Zamora - Coco Solo", gestorName: null },
        { consejo: "Libertad", gestorName: null },
        { consejo: "ICAIC", gestorName: null },
        { consejo: "Los Ángeles", gestorName: null },
        { consejo: "Civic Center (Plaza Cívica)", gestorName: null },
      ],
    },
    {
      municipality: "La Lisa",
      consejos: [
        { consejo: "Alturas de La Lisa", gestorName: null },
        { consejo: "Balcón de Arimao", gestorName: null },
        { consejo: "El Cano", gestorName: null },
        { consejo: "Valle Grande", gestorName: null },
        { consejo: "Bello 26", gestorName: null },
        { consejo: "San Agustín", gestorName: null },
        { consejo: "Arroyo Arenas", gestorName: null },
        { consejo: "Punta Brava", gestorName: null },
        { consejo: "Versalles", gestorName: null },
        { consejo: "Coronela", gestorName: null },
      ],
    },
  ],
};

// =============================================================================
// MATANZAS — 13 municipios. NO usa consejos populares: el cliente solo
// elige Provincia → Municipio, y el gestor (cuando existe) se asigna a
// nivel municipio vía `defaultGestorName`.
// =============================================================================
const matanzasMunicipality = (
  name: string,
  defaultGestorName: string | null = null,
): MunicipalityData => ({
  municipality: name,
  consejos: [],
  defaultGestorName,
});

const MATANZAS: ProvinceData = {
  province: "Matanzas",
  usesConsejos: false,
  municipalities: [
    matanzasMunicipality("Matanzas"),
    matanzasMunicipality("Cárdenas", "Deborah"),
    matanzasMunicipality("Limonar", "Deborah"),
    matanzasMunicipality("Unión de Reyes", "Deborah"),
    matanzasMunicipality("Colón"),
    matanzasMunicipality("Jovellanos"),
    matanzasMunicipality("Jagüey Grande"),
    matanzasMunicipality("Ciénaga de Zapata"),
    matanzasMunicipality("Calimete"),
    matanzasMunicipality("Pedro Betancourt"),
    matanzasMunicipality("Perico"),
    matanzasMunicipality("Martí"),
    matanzasMunicipality("Los Arabos"),
  ],
};

/**
 * Lista de todas las provincias con cobertura. Por ahora La Habana (con
 * datos completos) y Matanzas (estructura sin gestores aún).
 * Cuando se añadan más provincias, pushearlas a este array y el resto del
 * código las recoge automáticamente.
 */
export const PROVINCES_DATA: ProvinceData[] = [LA_HABANA, MATANZAS];

// =============================================================================
// HELPERS DE LOOKUP — pure functions, sin IO
// =============================================================================

/** Devuelve los nombres de todas las provincias con cobertura. */
export const getProvinces = (): string[] =>
  PROVINCES_DATA.map((p) => p.province);

/**
 * Indica si la provincia requiere que el cliente seleccione el 3er nivel
 * (Consejo Popular). Si false, el flujo es solo Provincia + Municipio.
 * Cuando se completen los consejos populares de otras provincias, basta
 * con cambiar el flag `usesConsejos` a true en `localities.ts`.
 */
export const requiresConsejoPopular = (province: string): boolean => {
  const p = PROVINCES_DATA.find((x) => x.province === province);
  return p?.usesConsejos ?? false;
};

/** Devuelve los municipios de una provincia, ordenados alfabéticamente. */
export const getMunicipalities = (province: string): string[] => {
  const p = PROVINCES_DATA.find((x) => x.province === province);
  if (!p) return [];
  return p.municipalities
    .map((m) => m.municipality)
    .slice()
    .sort((a, b) => a.localeCompare(b, "es"));
};

/** Devuelve los consejos populares de un municipio, ordenados alfabéticamente. */
export const getConsejos = (
  province: string,
  municipality: string,
): string[] => {
  const m = findMunicipality(province, municipality);
  if (!m) return [];
  return m.consejos
    .map((c) => c.consejo)
    .slice()
    .sort((a, b) => a.localeCompare(b, "es"));
};

/**
 * Resuelve el nombre del gestor que cubre un consejo específico, o null
 * si esa zona aún no tiene gestor asignado. NO toca Firestore — solo
 * lee la tabla estática. El llamante debe hacer GestorService.findByName()
 * después para obtener el IGestor con whatsapp y demás campos.
 */
export const findGestorNameForLocality = (
  province: string,
  municipality: string,
  consejo: string,
): string | null => {
  const m = findMunicipality(province, municipality);
  if (!m) return null;
  const entry = m.consejos.find((c) => c.consejo === consejo);
  return entry?.gestorName ?? null;
};

/**
 * Si el consejo seleccionado no tiene gestor, devuelve hasta 3 consejos
 * del mismo municipio que SÍ tienen gestor — para sugerirle al cliente
 * que escoja uno cercano.
 */
export const getNearbyConsejosWithGestor = (
  province: string,
  municipality: string,
): Array<{ consejo: string; gestorName: string }> => {
  const m = findMunicipality(province, municipality);
  if (!m) return [];
  return m.consejos
    .filter((c): c is { consejo: string; gestorName: string } =>
      c.gestorName !== null,
    )
    .slice(0, 3);
};

/**
 * Resuelve el gestor a nivel municipio. Usado para provincias que NO
 * usan consejos populares (Matanzas y futuras).
 */
export const findGestorNameForMunicipality = (
  province: string,
  municipality: string,
): string | null => {
  const m = findMunicipality(province, municipality);
  return m?.defaultGestorName ?? null;
};

/**
 * Helper general que decide automáticamente cómo resolver el gestor según
 * el flag `usesConsejos` de la provincia. Si la provincia usa consejos →
 * requiere el 3er argumento. Si no, solo provincia + municipio.
 *
 * El consumer (CartDrawer, cart/page) puede llamar siempre a esta función
 * sin saber el modo de la provincia — devuelve null si falta el dato
 * necesario.
 */
export const findGestorNameForLocation = (
  province: string,
  municipality: string,
  consejoPopular?: string,
): string | null => {
  if (requiresConsejoPopular(province)) {
    if (!consejoPopular) return null;
    return findGestorNameForLocality(province, municipality, consejoPopular);
  }
  return findGestorNameForMunicipality(province, municipality);
};

// =============================================================================
// PRIVATE
// =============================================================================
const findMunicipality = (
  province: string,
  municipality: string,
): MunicipalityData | undefined => {
  const p = PROVINCES_DATA.find((x) => x.province === province);
  return p?.municipalities.find((m) => m.municipality === municipality);
};
