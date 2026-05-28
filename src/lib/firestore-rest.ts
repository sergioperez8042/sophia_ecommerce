/**
 * Helpers compartidos para hablar con Firestore vía REST (sin Admin SDK).
 *
 * Motivo: los usuarios están en Cuba, donde el SDK cliente de Firebase
 * (que pega directo a `*.googleapis.com`) es poco fiable/bloqueado. Las
 * rutas server-side (Vercel → Google) sí funcionan, y reusan estos
 * helpers para (de)serializar y leer/escribir documentos con el idToken
 * del propio usuario como Bearer — de modo que **las security rules de
 * Firestore siguen aplicando** (mismo patrón que `create-account`).
 *
 * Funciones puras + thin wrappers sobre `fetch`. Sin imports de Next, así
 * que son fáciles de testear con `fetch` mockeado.
 */

// ── (de)serialización de valores Firestore REST ─────────────────────────────
export type FsValue = Record<string, unknown>;

export function toFsValue(value: unknown): FsValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number')
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFsValue) } };
  if (typeof value === 'object') {
    const fields: Record<string, FsValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

export function fromFsValue(v: FsValue | undefined): unknown {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    const arr = (v.arrayValue as { values?: FsValue[] })?.values ?? [];
    return arr.map(fromFsValue);
  }
  if ('mapValue' in v) {
    const o: Record<string, unknown> = {};
    const fields = (v.mapValue as { fields?: Record<string, FsValue> })?.fields ?? {};
    for (const [k, val] of Object.entries(fields)) o[k] = fromFsValue(val);
    return o;
  }
  return undefined;
}

export function fieldsToObject(
  fields: Record<string, FsValue> | undefined,
): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields ?? {})) o[k] = fromFsValue(v);
  return o;
}

export function objectToFields(obj: Record<string, unknown>): Record<string, FsValue> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFsValue(v)]));
}

// ── config + URLs ───────────────────────────────────────────────────────────
export function getFirebaseRestConfig(): { projectId?: string; apiKey?: string } {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return { projectId, apiKey };
}

export function firestoreBaseUrl(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

// ── operaciones de documento ────────────────────────────────────────────────
export interface FsDocResult {
  ok: boolean;
  status: number;
  fields?: Record<string, FsValue>;
  name?: string;
}

/** GET un documento. `ok:false` con `status:404` si no existe. */
export async function fsGetDoc(
  base: string,
  path: string,
  idToken: string,
  apiKey: string,
): Promise<FsDocResult> {
  const res = await fetch(`${base}/${path}?key=${apiKey}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, status: res.status };
  const json = await res.json();
  return { ok: true, status: res.status, fields: json.fields, name: json.name };
}

/** PATCH (merge vía updateMask) de los campos dados. */
export async function fsPatchDoc(
  base: string,
  path: string,
  fields: Record<string, unknown>,
  idToken: string,
  apiKey: string,
): Promise<{ ok: boolean; status: number; detail?: string }> {
  const mask = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&');
  const res = await fetch(`${base}/${path}?key=${apiKey}&${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields: objectToFields(fields) }),
  });
  if (!res.ok) return { ok: false, status: res.status, detail: await res.text() };
  return { ok: true, status: res.status };
}

/**
 * runQuery sobre una colección. Devuelve filas `{ id, ...campos }`.
 * `structuredQuery` se pasa tal cual (from/where/limit/orderBy).
 */
export async function fsRunQuery(
  base: string,
  structuredQuery: unknown,
  idToken: string,
  apiKey: string,
): Promise<Array<{ id: string; [k: string]: unknown }>> {
  const res = await fetch(`${base}:runQuery?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ structuredQuery }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`runQuery failed: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as Array<{
    document?: { name: string; fields?: Record<string, FsValue> };
  }>;
  const out: Array<{ id: string; [k: string]: unknown }> = [];
  for (const row of rows) {
    if (!row.document) continue; // filas readTime-only (sin match)
    const id = row.document.name.split('/').pop() as string;
    out.push({ id, ...fieldsToObject(row.document.fields) });
  }
  return out;
}

/** Helper para construir un filtro de igualdad por string. */
export function eqStringQuery(
  collectionId: string,
  fieldPath: string,
  value: string,
  limit?: number,
): Record<string, unknown> {
  const q: Record<string, unknown> = {
    from: [{ collectionId }],
    where: {
      fieldFilter: { field: { fieldPath }, op: 'EQUAL', value: { stringValue: value } },
    },
  };
  if (limit) q.limit = limit;
  return q;
}
