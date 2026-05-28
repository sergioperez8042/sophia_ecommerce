import { renderHook, waitFor, act } from '@testing-library/react';
import type { IGestor } from '@/entities/all';

// El hook ahora llama lookupGestorByLocation (endpoint server-side), no
// GestorService directo — para que funcione desde Cuba (Firestore cliente
// está restringido allí). Mockeamos ese helper.
const mockLookup = jest.fn();

jest.mock('@/lib/gestor-lookup-client', () => ({
  lookupGestorByLocation: (...args: unknown[]) => mockLookup(...args),
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

// Helper: envuelve un gestor (o null) en la forma que devuelve el endpoint.
const result = (gestor: IGestor | null) => ({
  available: !!gestor,
  gestor,
  nearby: [],
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGestorByLocation', () => {
  it('returns gestor=null and loading=false when location is null', () => {
    const { result: r } = renderHook(() => useGestorByLocation(null));
    expect(r.current.gestor).toBeNull();
    expect(r.current.loading).toBe(false);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('returns gestor=null when province is missing', () => {
    const { result: r } = renderHook(() =>
      useGestorByLocation({ municipality: 'Centro Habana' }),
    );
    expect(r.current.gestor).toBeNull();
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('resolves the gestor from the lookup endpoint', async () => {
    mockLookup.mockResolvedValue(result(fakeGestor));
    const { result: r } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'Centro Habana',
        consejoPopular: 'Cayo Hueso',
      }),
    );

    await waitFor(() => expect(r.current.gestor).not.toBeNull());

    expect(r.current.gestor?.name).toBe('Maday');
    expect(r.current.loading).toBe(false);
    expect(mockLookup).toHaveBeenCalledWith(
      'La Habana',
      'Centro Habana',
      'Cayo Hueso',
    );
  });

  it('returns null when endpoint reports no coverage (consejo uncovered)', async () => {
    mockLookup.mockResolvedValue(result(null));
    const { result: r } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'La Habana del Este',
        consejoPopular: 'Campo Florido',
      }),
    );
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.gestor).toBeNull();
  });

  it('returns null when the lookup throws (network/firestore error)', async () => {
    mockLookup.mockRejectedValue(new Error('Network down'));
    const { result: r } = renderHook(() =>
      useGestorByLocation({
        province: 'La Habana',
        municipality: 'Centro Habana',
        consejoPopular: 'Cayo Hueso',
      }),
    );
    await waitFor(() => expect(r.current.loading).toBe(false));
    expect(r.current.gestor).toBeNull();
  });

  it('refetches when consejoPopular changes', async () => {
    mockLookup.mockResolvedValue(result(fakeGestor));
    const { result: r, rerender } = renderHook(
      ({ consejo }) =>
        useGestorByLocation({
          province: 'La Habana',
          municipality: 'Centro Habana',
          consejoPopular: consejo,
        }),
      { initialProps: { consejo: 'Cayo Hueso' } },
    );

    await waitFor(() => expect(r.current.gestor).not.toBeNull());
    expect(mockLookup).toHaveBeenCalledTimes(1);

    mockLookup.mockResolvedValueOnce(result({ ...fakeGestor, name: 'Otro' }));
    rerender({ consejo: 'Dragones' });
    await waitFor(() => expect(mockLookup).toHaveBeenCalledTimes(2));
    expect(mockLookup).toHaveBeenLastCalledWith(
      'La Habana',
      'Centro Habana',
      'Dragones',
    );
  });

  it('does NOT update state when a stale fetch resolves after a fresh one', async () => {
    let resolveFirst!: (r: ReturnType<typeof result>) => void;
    const firstPromise = new Promise<ReturnType<typeof result>>((res) => {
      resolveFirst = res;
    });
    mockLookup
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(result({ ...fakeGestor, name: 'Segundo' }));

    const { result: r, rerender } = renderHook(
      ({ muni }) =>
        useGestorByLocation({
          province: 'Matanzas',
          municipality: muni,
        }),
      { initialProps: { muni: 'Cárdenas' } },
    );

    rerender({ muni: 'Limonar' });
    await waitFor(() => expect(r.current.gestor?.name).toBe('Segundo'));

    await act(async () => {
      resolveFirst(result({ ...fakeGestor, name: 'Primero' }));
      await Promise.resolve();
    });
    expect(r.current.gestor?.name).toBe('Segundo');
  });

  it('reads only province / municipality / consejoPopular (ignores object identity)', async () => {
    mockLookup.mockResolvedValue(result(fakeGestor));
    const { result: r, rerender } = renderHook(
      ({ loc }: { loc: { province: string; municipality: string } }) =>
        useGestorByLocation(loc),
      {
        initialProps: {
          loc: { province: 'Matanzas', municipality: 'Cárdenas' },
        },
      },
    );
    await waitFor(() => expect(r.current.gestor).not.toBeNull());
    expect(mockLookup).toHaveBeenCalledTimes(1);

    rerender({ loc: { province: 'Matanzas', municipality: 'Cárdenas' } });
    await new Promise((rs) => setTimeout(rs, 50));
    expect(mockLookup).toHaveBeenCalledTimes(1);
  });
});
