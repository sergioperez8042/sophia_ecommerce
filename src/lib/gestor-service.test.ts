import type { IGestor } from '@/entities/all';

// --- Firestore mocks ---
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  setDoc: jest.fn(),
  Timestamp: { now: () => ({ toDate: () => new Date() }) },
}));

jest.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
jest.mock('firebase/auth', () => ({}));

import { GestorService } from './firestore-services';

const makeGestor = (overrides: Partial<IGestor> = {}): IGestor => ({
  id: 'g-1',
  name: 'Tester',
  whatsapp: '5350000000',
  email: 'tester@sophia.test',
  province: 'La Habana',
  municipalities: ['Centro Habana'],
  consejos: [],
  active: true,
  createdAt: new Date().toISOString(),
  ...overrides,
} as IGestor);

const mockGestoresList = (list: IGestor[]) => {
  mockGetDocs.mockResolvedValue({
    docs: list.map((g) => ({
      id: g.id,
      data: () => ({ ...g }),
    })),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.mockReturnValue('coll');
  mockQuery.mockReturnValue('query');
  mockWhere.mockReturnValue('where');
  mockOrderBy.mockReturnValue('orderBy');
});

describe('GestorService.findByLocation', () => {
  describe('contrato La Habana (requiresConsejoPopular=true)', () => {
    it('returns null when consejo is required but not provided', async () => {
      mockGestoresList([
        makeGestor({
          id: 'maday',
          name: 'Maday',
          municipalities: ['Centro Habana'],
          consejos: [{ municipality: 'Centro Habana', consejo: 'Cayo Hueso' }],
        }),
      ]);
      const result = await GestorService.findByLocation(
        'La Habana',
        'Centro Habana',
      );
      expect(result).toBeNull();
    });

    it('returns the gestor when (municipality, consejo) tuple matches', async () => {
      const maday = makeGestor({
        id: 'maday',
        name: 'Maday',
        municipalities: ['Centro Habana'],
        consejos: [
          { municipality: 'Centro Habana', consejo: 'Cayo Hueso' },
          { municipality: 'Centro Habana', consejo: 'Dragones' },
        ],
      });
      mockGestoresList([maday]);
      const result = await GestorService.findByLocation(
        'La Habana',
        'Centro Habana',
        'Cayo Hueso',
      );
      expect(result?.name).toBe('Maday');
    });

    it('returns null when consejo provided but no gestor covers it (no municipio fallback)', async () => {
      // El bug original: cliente en Campo Florido (no cubierto) recibía un
      // gestor cualquiera de La Habana del Este. Esto verifica que YA NO pasa.
      const arturo = makeGestor({
        id: 'arturo',
        name: 'Arturo',
        municipalities: ['La Habana del Este'],
        consejos: [
          { municipality: 'La Habana del Este', consejo: 'Camilo Cienfuegos' },
        ],
      });
      mockGestoresList([arturo]);
      const result = await GestorService.findByLocation(
        'La Habana',
        'La Habana del Este',
        'Campo Florido',
      );
      expect(result).toBeNull();
    });

    it('tolerates accent / case variants when matching consejo', async () => {
      const gisselle = makeGestor({
        id: 'gisselle',
        name: 'Gisselle',
        municipalities: ['Guanabacoa'],
        consejos: [{ municipality: 'Guanabacoa', consejo: 'Chibás - Jata' }],
      });
      mockGestoresList([gisselle]);
      // sin acento
      const result = await GestorService.findByLocation(
        'La Habana',
        'Guanabacoa',
        'Chibas - Jata',
      );
      expect(result?.name).toBe('Gisselle');
    });
  });

  describe('contrato Matanzas (requiresConsejoPopular=false)', () => {
    it('matches by municipality when no consejo provided', async () => {
      const deborah = makeGestor({
        id: 'deborah',
        name: 'Deborah',
        province: 'Matanzas',
        municipalities: ['Cárdenas', 'Limonar', 'Unión de Reyes'],
        consejos: [],
      });
      mockGestoresList([deborah]);
      const result = await GestorService.findByLocation('Matanzas', 'Cárdenas');
      expect(result?.name).toBe('Deborah');
    });

    it('matches with unaccented municipality input (admin legacy)', async () => {
      const deborah = makeGestor({
        province: 'Matanzas',
        municipalities: ['Cárdenas'],
      });
      mockGestoresList([deborah]);
      const result = await GestorService.findByLocation('Matanzas', 'Cardenas');
      expect(result).not.toBeNull();
    });

    it('returns null when no gestor covers the municipality', async () => {
      const deborah = makeGestor({
        province: 'Matanzas',
        municipalities: ['Cárdenas'],
      });
      mockGestoresList([deborah]);
      const result = await GestorService.findByLocation(
        'Matanzas',
        'Jovellanos',
      );
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('returns null when gestores list is empty', async () => {
      mockGestoresList([]);
      expect(
        await GestorService.findByLocation('Matanzas', 'Cárdenas'),
      ).toBeNull();
    });

    it('ignores inactive gestores (getActive filters them)', async () => {
      // findByLocation usa getActive — los inactivos no aparecen en la lista
      mockGestoresList([]); // simulamos que getActive devuelve []
      const result = await GestorService.findByLocation(
        'Matanzas',
        'Cárdenas',
      );
      expect(result).toBeNull();
    });

    it('safely handles gestores without consejos field (legacy docs)', async () => {
      // Antes del rollout, gestores se guardaban sin consejos[]
      const legacy = makeGestor({ consejos: undefined as never });
      mockGestoresList([legacy]);
      const result = await GestorService.findByLocation(
        'La Habana',
        'Centro Habana',
        'Cayo Hueso',
      );
      expect(result).toBeNull(); // sin consejos[] no matchea, sin fallback
    });
  });
});

describe('GestorService.getCoveredConsejosInMunicipality', () => {
  it('returns consejos in geographic order (localities.ts order)', async () => {
    // En localities.ts, 'La Habana del Este' tiene: Camilo, Cojímar, Gaiteras,
    // Alamar, Guanabo, Campo Florido (en ese orden de declaración pero los
    // consejos se ordenan alfabético en getConsejos)
    const arturo = makeGestor({
      id: 'arturo',
      name: 'Arturo',
      municipalities: ['La Habana del Este'],
      consejos: [
        { municipality: 'La Habana del Este', consejo: 'Cojímar' },
        { municipality: 'La Habana del Este', consejo: 'Camilo Cienfuegos' },
        { municipality: 'La Habana del Este', consejo: 'Gaiteras' },
      ],
    });
    const danay = makeGestor({
      id: 'danay',
      name: 'Danay',
      municipalities: ['La Habana del Este'],
      consejos: [{ municipality: 'La Habana del Este', consejo: 'Alamar' }],
    });
    // Le damos Arturo primero — no debe ganar el top-3 por ese sesgo
    mockGestoresList([arturo, danay]);

    const result = await GestorService.getCoveredConsejosInMunicipality(
      'La Habana',
      'La Habana del Este',
    );

    // Orden alfabético en getConsejos: Alamar, Camilo Cienfuegos, Cojímar,
    // Gaiteras... → top 3 = Alamar (Danay), Camilo (Arturo), Cojímar (Arturo)
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0]?.consejo).toBe('Alamar');
    expect(result[0]?.gestorName).toBe('Danay');
  });

  it('caps results at 3', async () => {
    const arturo = makeGestor({
      municipalities: ['Diez de Octubre'],
      consejos: [
        { municipality: 'Diez de Octubre', consejo: 'Luyanó' },
        { municipality: 'Diez de Octubre', consejo: 'Lawton' },
        { municipality: 'Diez de Octubre', consejo: 'Vista Alegre' },
        { municipality: 'Diez de Octubre', consejo: 'Tamarindo' },
        { municipality: 'Diez de Octubre', consejo: 'Santos Suárez' },
      ],
    });
    mockGestoresList([arturo]);
    const result = await GestorService.getCoveredConsejosInMunicipality(
      'La Habana',
      'Diez de Octubre',
    );
    expect(result.length).toBe(3);
  });

  it('returns empty when no consejos are covered', async () => {
    const arturo = makeGestor({
      municipalities: ['La Habana del Este'],
      consejos: [], // sin cobertura
    });
    mockGestoresList([arturo]);
    const result = await GestorService.getCoveredConsejosInMunicipality(
      'La Habana',
      'La Habana del Este',
    );
    expect(result).toEqual([]);
  });

  it('returns empty for a municipality not in localities.ts', async () => {
    mockGestoresList([]);
    const result = await GestorService.getCoveredConsejosInMunicipality(
      'La Habana',
      'Atlantis',
    );
    expect(result).toEqual([]);
  });
});
