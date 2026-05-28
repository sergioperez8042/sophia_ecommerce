import {
  mergeGestorCoverage,
  dedupeStringsNormalized,
  dedupeConsejosNormalized,
  consejoKey,
} from './gestor-merge';

describe('gestor-merge — robustez de acentos/espacios', () => {
  describe('dedupeStringsNormalized', () => {
    it('dedupea por valor normalizado conservando la primera aparición', () => {
      const out = dedupeStringsNormalized([
        'San Miguel del Padrón',
        'San Miguel del Padron', // sin tilde — mismo lugar
        '  san miguel del padrón  ', // espacios + lowercase
        'Guanabacoa',
      ]);
      expect(out).toEqual(['San Miguel del Padrón', 'Guanabacoa']);
    });

    it('descarta strings vacíos', () => {
      expect(dedupeStringsNormalized(['', '  ', 'Regla'])).toEqual(['Regla']);
    });
  });

  describe('consejoKey', () => {
    it('produce la misma clave para variantes de acento/espacio/caso', () => {
      expect(consejoKey({ municipality: 'San Miguel del Padrón', consejo: 'Jacomino' }))
        .toBe(consejoKey({ municipality: 'san miguel del padron', consejo: '  JACOMINO ' }));
    });
  });

  describe('dedupeConsejosNormalized', () => {
    it('NO descarta consejos válidos distintos del mismo municipio', () => {
      const out = dedupeConsejosNormalized([
        { municipality: 'Regla', consejo: 'Guaicanamar' },
        { municipality: 'Regla', consejo: 'Casablanca' },
        { municipality: 'Regla', consejo: 'Loma - Modelo' },
      ]);
      expect(out).toHaveLength(3);
    });

    it('colapsa duplicados que solo difieren en acento/espacio', () => {
      const out = dedupeConsejosNormalized([
        { municipality: 'San Miguel del Padrón', consejo: 'Jacomino' },
        { municipality: 'San Miguel del Padron', consejo: 'jacomino' }, // dup normalizado
      ]);
      expect(out).toHaveLength(1);
      // conserva la primera (casing canónico del destino)
      expect(out[0]).toEqual({ municipality: 'San Miguel del Padrón', consejo: 'Jacomino' });
    });
  });

  describe('mergeGestorCoverage — caso Gisselle → Arturo', () => {
    const arturo = {
      provinces: ['La Habana'],
      municipalities: ['San Miguel del Padrón', 'Cotorro'],
      consejos: [
        { municipality: 'San Miguel del Padrón', consejo: 'Jacomino' },
        { municipality: 'Cotorro', consejo: 'Lotería' },
      ],
    };
    const gisselle = {
      provinces: ['La Habana'],
      municipalities: ['Guanabacoa', 'Regla'],
      consejos: [
        { municipality: 'Guanabacoa', consejo: 'Villa II' },
        { municipality: 'Regla', consejo: 'Casablanca' },
      ],
    };

    it('une municipios sin perder los de Arturo y agrega los de Gisselle', () => {
      const merged = mergeGestorCoverage(arturo, gisselle);
      expect(merged.municipalities).toEqual([
        'San Miguel del Padrón',
        'Cotorro',
        'Guanabacoa',
        'Regla',
      ]);
    });

    it('une consejos: 2 de Arturo + 2 de Gisselle = 4, sin pérdidas', () => {
      const merged = mergeGestorCoverage(arturo, gisselle);
      expect(merged.consejos).toHaveLength(4);
      expect(merged.consejos).toContainEqual({ municipality: 'Guanabacoa', consejo: 'Villa II' });
      expect(merged.consejos).toContainEqual({ municipality: 'San Miguel del Padrón', consejo: 'Jacomino' });
    });

    it('provincias coincidentes no se duplican', () => {
      const merged = mergeGestorCoverage(arturo, gisselle);
      expect(merged.provinces).toEqual(['La Habana']);
    });

    it('no muta los argumentos', () => {
      const aCopy = JSON.parse(JSON.stringify(arturo));
      const gCopy = JSON.parse(JSON.stringify(gisselle));
      mergeGestorCoverage(arturo, gisselle);
      expect(arturo).toEqual(aCopy);
      expect(gisselle).toEqual(gCopy);
    });

    it('idempotente: mergear dos veces no agrega duplicados', () => {
      const once = mergeGestorCoverage(arturo, gisselle);
      const twice = mergeGestorCoverage(once, gisselle);
      expect(twice.consejos).toHaveLength(once.consejos.length);
      expect(twice.municipalities).toHaveLength(once.municipalities.length);
    });
  });
});
