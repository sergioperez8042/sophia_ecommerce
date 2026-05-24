import { renderHook, waitFor, act } from '@testing-library/react';
import type { IGestor } from '@/entities/all';

// Mock de GestorService — el hook llama findByLocation
const mockFindByLocation = jest.fn();

jest.mock('@/lib/firestore-services', () => ({
  GestorService: {
    findByLocation: (...args: unknown[]) => mockFindByLocation(...args),
  },
}));

import { useGestorByLocation } from './useGestorByLocation';

const fakeGestor: IGestor = {
  id: 'g-1',
  name: 'Maday',
  whatsapp: '5350000000',
  email: 'maday@sophia.test',
  provinces: ['La Habana'],
  municipalities: ['Centro Habana'],
  consejos: [{ municipality: 'Centro Habana', consejo: 'Cayo Hueso' }],
  active: true,
  createdAt: new Date().toISOString(),
} as IGestor;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGestorByLocation', () => {
  it('returns gestor=null and loading=false when location is null', () => {
    const { result } = renderHook(() => useGestorByLocation(null));
    expect(result.current.gestor).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFindByLocation).not.toHaveBeenCalled();
  });

  it('returns gestor=null when province is missing', () => {
    const { result } = renderHook(() =>
      useGestorByLocation({ municipality: 'Centro Habana' }),
    );
    expect(result.current.gestor).toBeNull();
    expect(mockFindByLocation).not.toHaveBeenCalled();
  });

  it('resolves the gestor from the service', async () => {
    mockFindByLocation.mockResolvedValue(fakeGestor);
    const { result } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'Centro Habana',
        consejoPopular: 'Cayo Hueso',
      }),
    );

    // Loading state arranca true mientras espera
    await waitFor(() => expect(result.current.gestor).not.toBeNull());

    expect(result.current.gestor?.name).toBe('Maday');
    expect(result.current.loading).toBe(false);
    expect(mockFindByLocation).toHaveBeenCalledWith(
      'La Habana',
      'Centro Habana',
      'Cayo Hueso',
    );
  });

  it('returns null when service returns null (consejo uncovered)', async () => {
    mockFindByLocation.mockResolvedValue(null);
    const { result } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'La Habana del Este',
        consejoPopular: 'Campo Florido',
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gestor).toBeNull();
  });

  it('returns null when service throws (network/firestore error)', async () => {
    mockFindByLocation.mockRejectedValue(new Error('Network down'));
    const { result } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'Centro Habana',
        consejoPopular: 'Cayo Hueso',
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gestor).toBeNull();
  });

  it('refetches when consejoPopular changes', async () => {
    mockFindByLocation.mockResolvedValue(fakeGestor);
    const { result, rerender } = renderHook(
      ({ consejo }) =>
        useGestorByLocation({
          province: 'La Habana',
          municipality: 'Centro Habana',
          consejoPopular: consejo,
        }),
      { initialProps: { consejo: 'Cayo Hueso' } },
    );

    await waitFor(() => expect(result.current.gestor).not.toBeNull());
    expect(mockFindByLocation).toHaveBeenCalledTimes(1);

    // Cambio de consejo dispara otra búsqueda
    mockFindByLocation.mockResolvedValueOnce({ ...fakeGestor, name: 'Otro' });
    rerender({ consejo: 'Dragones' });
    await waitFor(() =>
      expect(mockFindByLocation).toHaveBeenCalledTimes(2),
    );
    expect(mockFindByLocation).toHaveBeenLastCalledWith(
      'La Habana',
      'Centro Habana',
      'Dragones',
    );
  });

  it('does NOT update state when a stale fetch resolves after a fresh one', async () => {
    // Simula carrera: primer fetch lento, segundo rápido. Esperamos que el
    // resultado final sea el del segundo, sin que el primero "pise" el state.
    let resolveFirst!: (g: IGestor | null) => void;
    const firstPromise = new Promise<IGestor | null>((res) => {
      resolveFirst = res;
    });
    mockFindByLocation
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({ ...fakeGestor, name: 'Segundo' });

    const { result, rerender } = renderHook(
      ({ muni }) =>
        useGestorByLocation({
          province: 'Matanzas',
          municipality: muni,
        }),
      { initialProps: { muni: 'Cárdenas' } },
    );

    // Dispara el segundo render antes de que el primero resuelva
    rerender({ muni: 'Limonar' });
    await waitFor(() => expect(result.current.gestor?.name).toBe('Segundo'));

    // Resolvemos el primero TARDE — no debe pisar
    await act(async () => {
      resolveFirst({ ...fakeGestor, name: 'Primero' });
      // dar tiempo a que el microtask termine
      await Promise.resolve();
    });
    expect(result.current.gestor?.name).toBe('Segundo');
  });

  it('reads only province / municipality / consejoPopular (ignores object identity)', async () => {
    mockFindByLocation.mockResolvedValue(fakeGestor);
    const { result, rerender } = renderHook(
      ({ loc }: { loc: { province: string; municipality: string } }) =>
        useGestorByLocation(loc),
      {
        initialProps: {
          loc: { province: 'Matanzas', municipality: 'Cárdenas' },
        },
      },
    );
    await waitFor(() => expect(result.current.gestor).not.toBeNull());
    expect(mockFindByLocation).toHaveBeenCalledTimes(1);

    // Nuevo objeto con MISMOS valores → no debe refetch
    rerender({ loc: { province: 'Matanzas', municipality: 'Cárdenas' } });
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFindByLocation).toHaveBeenCalledTimes(1);
  });
});
