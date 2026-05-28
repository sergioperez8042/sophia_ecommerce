/**
 * @jest-environment node
 */
import {
  toFsValue,
  fromFsValue,
  fieldsToObject,
  objectToFields,
  eqStringQuery,
  fsRunQuery,
  fsGetDoc,
  fsPatchDoc,
  firestoreBaseUrl,
} from './firestore-rest';

describe('firestore-rest (de)serialización', () => {
  it('round-trip de primitivos', () => {
    expect(fromFsValue(toFsValue('hola'))).toBe('hola');
    expect(fromFsValue(toFsValue(true))).toBe(true);
    expect(fromFsValue(toFsValue(42))).toBe(42);
    expect(fromFsValue(toFsValue(3.14))).toBe(3.14);
    expect(fromFsValue(toFsValue(null))).toBeNull();
  });

  it('enteros como integerValue (string); decimales como doubleValue', () => {
    expect(toFsValue(7)).toEqual({ integerValue: '7' });
    expect(toFsValue(1.5)).toEqual({ doubleValue: 1.5 });
  });

  it('round-trip de Date como timestamp ISO', () => {
    const d = new Date('2026-05-29T10:00:00.000Z');
    expect(toFsValue(d)).toEqual({ timestampValue: d.toISOString() });
    expect(fromFsValue(toFsValue(d))).toBe(d.toISOString());
  });

  it('round-trip de arrays y objetos anidados', () => {
    const obj = { a: 'x', b: [1, 2], c: { d: true } };
    expect(fromFsValue(toFsValue(obj))).toEqual({ a: 'x', b: [1, 2], c: { d: true } });
  });

  it('fieldsToObject / objectToFields', () => {
    const fields = objectToFields({ name: 'Maday', n: 3 });
    expect(fields).toEqual({ name: { stringValue: 'Maday' }, n: { integerValue: '3' } });
    expect(fieldsToObject(fields)).toEqual({ name: 'Maday', n: 3 });
  });
});

describe('eqStringQuery', () => {
  it('construye un filtro EQUAL por string', () => {
    expect(eqStringQuery('orders', 'gestorId', 'arturo')).toEqual({
      from: [{ collectionId: 'orders' }],
      where: {
        fieldFilter: { field: { fieldPath: 'gestorId' }, op: 'EQUAL', value: { stringValue: 'arturo' } },
      },
    });
  });

  it('incluye limit cuando se pasa', () => {
    expect(eqStringQuery('gestores', 'userId', 'uid1', 1).limit).toBe(1);
  });
});

describe('operaciones REST (fetch mockeado)', () => {
  const base = firestoreBaseUrl('proj');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fsRunQuery parsea filas con documento e ignora filas readTime-only', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { readTime: '2026-05-29T00:00:00Z' },
        {
          document: {
            name: 'projects/p/databases/(default)/documents/orders/o1',
            fields: { gestorId: { stringValue: 'arturo' }, subtotal: { doubleValue: 10 } },
          },
        },
      ],
    }) as unknown as typeof fetch;

    const rows = await fsRunQuery(base, eqStringQuery('orders', 'gestorId', 'arturo'), 'idtok', 'key');
    expect(rows).toEqual([{ id: 'o1', gestorId: 'arturo', subtotal: 10 }]);
  });

  it('fsGetDoc devuelve ok:false en 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const r = await fsGetDoc(base, 'gestores/x', 'idtok', 'key');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
  });

  it('fsPatchDoc arma el updateMask y envía los fields', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const r = await fsPatchDoc(base, 'orders/o1', { status: 'delivered' }, 'idtok', 'key');
    expect(r.ok).toBe(true);

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('updateMask.fieldPaths=status');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ fields: { status: { stringValue: 'delivered' } } });
  });
});
