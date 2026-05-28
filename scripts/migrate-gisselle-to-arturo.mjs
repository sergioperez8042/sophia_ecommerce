/**
 * Migración puntual: ELIMINAR a Gisselle y transferir TODA su cobertura
 * (provinces, municipalities, consejos) a Arturo.
 *
 * Decisión del cliente (mayo 2026): Gisselle deja de ser gestora; Arturo
 * asume sus zonas (Guanabacoa + Regla).
 *
 * Seguridad / cuidado:
 *  - DRY-RUN por defecto. Imprime exactamente qué quedaría en Arturo y qué
 *    se borraría. NO escribe nada sin `--apply`.
 *  - Merge ROBUSTO: une por clave NORMALIZADA (sin acentos / espacios /
 *    mayúsculas) para no duplicar ni descartar silenciosamente consejos
 *    cuando el mismo lugar viene escrito distinto entre fuentes.
 *  - Lee la cobertura EN VIVO de Firestore (no del seed), porque el admin
 *    pudo haber divergido del seed.
 *  - Idempotente: re-correr no agrega duplicados ni falla si Gisselle ya
 *    no existe.
 *
 * Uso:
 *   node scripts/migrate-gisselle-to-arturo.mjs            → dry-run
 *   FIREBASE_ADMIN_EMAIL=... FIREBASE_ADMIN_PASSWORD=... \
 *     node scripts/migrate-gisselle-to-arturo.mjs --apply  → ejecuta
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const envPath = path.resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const TARGET_ID = 'arturo';
const SOURCE_ID = 'gisselle';

// ── Normalización robusta (idéntica a normalizeForMatch de la app) ──────────
const DIACRITIC_RE = /[̀-ͯ]/g;
const norm = (s) => (s ?? '').normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase().trim();

function dedupeStrings(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    const k = norm(v);
    if (k && !seen.has(k)) { seen.add(k); out.push(v); }
  }
  return out;
}
function dedupeConsejos(consejos) {
  const seen = new Set();
  const out = [];
  for (const c of consejos) {
    const k = `${norm(c.municipality)}|${norm(c.consejo)}`;
    if (!seen.has(k)) { seen.add(k); out.push(c); }
  }
  return out;
}

// ── Firestore REST helpers ──────────────────────────────────────────────────
function fromValue(v) {
  if (!v) return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fromValue);
  if ('mapValue' in v) {
    const o = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) o[k] = fromValue(val);
    return o;
  }
  return undefined;
}
function parseDoc(doc) {
  const o = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) o[k] = fromValue(v);
  return o;
}
function toValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

async function readDoc(id, idToken) {
  const url = `${FIRESTORE_BASE}/gestores/${id}?key=${FIREBASE_API_KEY}`;
  const headers = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  const resp = await fetch(url, { headers });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GET ${id} failed: ${resp.status} ${await resp.text()}`);
  return parseDoc(await resp.json());
}
async function patchFields(id, fields, idToken) {
  // updateMask para tocar SOLO municipalities + consejos (no pisar otros campos)
  const mask = Object.keys(fields).map((f) => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${FIRESTORE_BASE}/gestores/${id}?key=${FIREBASE_API_KEY}&${mask}`;
  const docFields = {};
  for (const [k, v] of Object.entries(fields)) docFields[k] = toValue(v);
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields: docFields }),
  });
  if (!resp.ok) throw new Error(`PATCH ${id} failed: ${resp.status} ${await resp.text()}`);
}
async function deleteDoc(id, idToken) {
  const url = `${FIRESTORE_BASE}/gestores/${id}?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } });
  if (!resp.ok) throw new Error(`DELETE ${id} failed: ${resp.status} ${await resp.text()}`);
}
async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  if (!resp.ok) throw new Error(`Sign-in failed (${resp.status}): ${await resp.text()}`);
  return (await resp.json()).idToken;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔁 Migración Gisselle → Arturo  [${APPLY ? 'APPLY' : 'DRY-RUN'}]\n`);

  const [target, source] = await Promise.all([readDoc(TARGET_ID), readDoc(SOURCE_ID)]);

  if (!target) throw new Error(`Gestor destino '${TARGET_ID}' (Arturo) no existe. Abortando.`);
  if (!source) {
    console.log(`✓ '${SOURCE_ID}' (Gisselle) ya no existe — nada que migrar. Idempotente.`);
    return;
  }

  console.log(`Arturo ANTES: ${target.municipalities.length} municipios, ${(target.consejos ?? []).length} consejos`);
  console.log(`Gisselle:     ${source.municipalities.length} municipios, ${(source.consejos ?? []).length} consejos`);
  console.log(`  → municipios de Gisselle: ${source.municipalities.join(', ')}`);

  const mergedMunicipalities = dedupeStrings([...target.municipalities, ...source.municipalities]);
  const mergedConsejos = dedupeConsejos([...(target.consejos ?? []), ...(source.consejos ?? [])]);
  const mergedProvinces = dedupeStrings([...(target.provinces ?? []), ...(source.provinces ?? [])]);

  console.log(`\nArturo DESPUÉS: ${mergedMunicipalities.length} municipios, ${mergedConsejos.length} consejos`);
  const added = mergedMunicipalities.filter((m) => !target.municipalities.some((t) => norm(t) === norm(m)));
  console.log(`  municipios añadidos: ${added.join(', ') || '(ninguno)'}`);
  const addedConsejos = mergedConsejos.length - (target.consejos ?? []).length;
  console.log(`  consejos añadidos: ${addedConsejos}`);

  if (!APPLY) {
    console.log(`\n(DRY-RUN) No se escribió nada. Para ejecutar:`);
    console.log(`  FIREBASE_ADMIN_EMAIL=... FIREBASE_ADMIN_PASSWORD=... node scripts/migrate-gisselle-to-arturo.mjs --apply\n`);
    return;
  }

  const email = process.env.FIREBASE_ADMIN_EMAIL;
  const password = process.env.FIREBASE_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Faltan FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD para --apply.');
  const idToken = await signIn(email, password);

  console.log('\n→ Actualizando Arturo (municipalities + consejos + provinces)...');
  await patchFields(TARGET_ID, { municipalities: mergedMunicipalities, consejos: mergedConsejos, provinces: mergedProvinces }, idToken);

  console.log('→ Eliminando gestor Gisselle...');
  await deleteDoc(SOURCE_ID, idToken);

  // Verificación post-escritura
  const verify = await readDoc(TARGET_ID, idToken);
  const gone = await readDoc(SOURCE_ID, idToken);
  console.log(`\n✅ Hecho. Arturo: ${verify.municipalities.length} municipios, ${verify.consejos.length} consejos. Gisselle existe: ${gone ? 'SÍ (ERROR)' : 'NO ✓'}`);
}

main().catch((e) => { console.error('✖', e.message); process.exit(1); });
