import {
  normalizeForMatch,
  getProvinces,
  getMunicipalities,
  getConsejos,
  requiresConsejoPopular,
} from './localities';

describe('normalizeForMatch', () => {
  it('strips diacritics so accented and unaccented variants match', () => {
    expect(normalizeForMatch('Cárdenas')).toBe('cardenas');
    expect(normalizeForMatch('Plaza de la Revolución')).toBe(
      'plaza de la revolucion',
    );
    expect(normalizeForMatch('San Miguel del Padrón')).toBe(
      'san miguel del padron',
    );
  });

  it('lowercases', () => {
    expect(normalizeForMatch('CENTRO HABANA')).toBe('centro habana');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeForMatch('  La Habana  ')).toBe('la habana');
  });

  it('is idempotent (applying twice yields the same result)', () => {
    const once = normalizeForMatch('Ciénaga de Zapata');
    const twice = normalizeForMatch(once);
    expect(once).toBe(twice);
  });

  it('matches accented vs unaccented variants symmetrically', () => {
    // Caso real del bug fix: cuba-locations.ts tenía nombres sin acentos
    // mientras localities.ts y Firestore usaban los canónicos
    expect(normalizeForMatch('Cardenas')).toBe(normalizeForMatch('Cárdenas'));
    expect(normalizeForMatch('Plaza de la Revolucion')).toBe(
      normalizeForMatch('Plaza de la Revolución'),
    );
  });

  it('handles empty string', () => {
    expect(normalizeForMatch('')).toBe('');
  });
});

describe('getProvinces', () => {
  it('returns the canonical list of covered provinces', () => {
    const provinces = getProvinces();
    expect(provinces).toContain('La Habana');
    expect(provinces).toContain('Matanzas');
  });

  it('returns a stable reference across calls (memoized at module level)', () => {
    expect(getProvinces()).toBe(getProvinces());
  });
});

describe('requiresConsejoPopular', () => {
  it('returns true for La Habana', () => {
    expect(requiresConsejoPopular('La Habana')).toBe(true);
  });

  it('returns false for Matanzas', () => {
    expect(requiresConsejoPopular('Matanzas')).toBe(false);
  });

  it('returns false for unknown provinces', () => {
    expect(requiresConsejoPopular('Atlantis')).toBe(false);
    expect(requiresConsejoPopular('')).toBe(false);
  });

  it('tolerates accent / case variants', () => {
    expect(requiresConsejoPopular('la habana')).toBe(true);
    expect(requiresConsejoPopular('LA HABANA')).toBe(true);
  });
});

describe('getMunicipalities', () => {
  it('returns alphabetized municipalities for La Habana', () => {
    const munis = getMunicipalities('La Habana');
    expect(munis.length).toBeGreaterThan(0);
    expect(munis).toContain('Centro Habana');
    expect(munis).toContain('La Habana del Este');
    expect(munis).toContain('Plaza de la Revolución');

    // alphabetical (Spanish-locale aware)
    const sorted = [...munis].sort((a, b) => a.localeCompare(b, 'es'));
    expect(munis).toEqual(sorted);
  });

  it('returns alphabetized municipalities for Matanzas', () => {
    const munis = getMunicipalities('Matanzas');
    expect(munis).toContain('Cárdenas');
    expect(munis).toContain('Limonar');
  });

  it('returns empty for unknown provinces', () => {
    expect(getMunicipalities('Atlantis')).toEqual([]);
  });

  it('tolerates accent variants on input', () => {
    // Aunque la fuente esté en una forma, normalize-comparison la encuentra
    const munisAccented = getMunicipalities('La Habana');
    const munisLower = getMunicipalities('la habana');
    expect(munisLower).toEqual(munisAccented);
  });

  it('returns the same reference across calls (cached)', () => {
    expect(getMunicipalities('La Habana')).toBe(getMunicipalities('La Habana'));
  });
});

describe('getConsejos', () => {
  it('returns alphabetized consejos for La Habana / Centro Habana', () => {
    const consejos = getConsejos('La Habana', 'Centro Habana');
    expect(consejos).toContain('Cayo Hueso');
    expect(consejos).toContain('Pueblo Nuevo');

    const sorted = [...consejos].sort((a, b) => a.localeCompare(b, 'es'));
    expect(consejos).toEqual(sorted);
  });

  it('returns consejos for La Habana del Este (with prefix "La ")', () => {
    const consejos = getConsejos('La Habana', 'La Habana del Este');
    expect(consejos).toContain('Alamar');
    expect(consejos).toContain('Cojímar');
  });

  it('also works passing unaccented municipality (legacy admin entries)', () => {
    // Esto era el bug #3 antes del fix: el admin guardaba 'San Miguel del Padron'
    // y la búsqueda quedaba []. Con normalizeForMatch matchea simétricamente.
    expect(getConsejos('La Habana', 'San Miguel del Padron')).not.toEqual([]);
    expect(getConsejos('La Habana', 'San Miguel del Padrón')).toEqual(
      getConsejos('La Habana', 'San Miguel del Padron'),
    );
  });

  it('returns empty for Matanzas municipalities (usesConsejos=false)', () => {
    expect(getConsejos('Matanzas', 'Cárdenas')).toEqual([]);
  });

  it('returns empty for unknown combinations', () => {
    expect(getConsejos('La Habana', 'Atlantis')).toEqual([]);
    expect(getConsejos('Atlantis', 'whatever')).toEqual([]);
  });
});
