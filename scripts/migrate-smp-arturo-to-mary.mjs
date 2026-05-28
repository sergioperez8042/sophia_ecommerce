/**
 * Migración puntual: REASIGNAR San Miguel del Padrón de Arturo → Mary.
 *
 * Decisión del cliente (mayo 2026): Arturo deja de cubrir San Miguel del
 * Padrón; entra una gestora nueva, Mary (+53 5 6868265), que asume ese
 * municipio con los MISMOS consejos que cubría Arturo (transferencia 1:1,
 * sin huecos ni cobertura nueva).
 *
 * Seguridad / cuidado:
 *  - DRY-RUN por defecto. Imprime el plan exacto. NO escribe sin `--apply`.
 *  - Lee la cobertura EN VIVO de Arturo (no del seed) — fuente de verdad.
 *  - Split NORMALIZADO (sin acentos/espacios): extrae el municipio + sus
 *    consejos sin descartar ni duplicar nada del resto de Arturo.
 *  - Idempotente: re-correr no rompe (si Arturo ya no tiene SMP, Mary ya
 *    está creada con los consejos correctos).
 *  - Mary NO tiene cuenta de acceso (solo WhatsApp) — igual que el patrón
 *    de gestores sin login. Si luego quiere portal, se crea desde el admin.
 *
 * Uso:
 *   node scripts/migrate-smp-arturo-to-mary.mjs            → dry-run
 *   FIREBASE_ADMIN_EMAIL=... FIREBASE_ADMIN_PASSWORD=... \
 *     node scripts/migrate-smp-arturo-to-mary.mjs --apply  → ejecuta
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

const ARTURO_ID = 'arturo';
const MARY_ID = 'mary';
const MUNICIPALITY = 'San Miguel del Padrón';

const DIACRITIC_RE = /[̀-ͯ]/g;
const norm = (s) => (s ?? '').normalize('NFD').replace(DIACRITIC_RE, '').toLowerCase().trim();

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
async function writeFullDoc(id, obj, idToken) {
  // PATCH sin updateMask = reemplaza el doc completo (upsert).
  const url = `${FIRESTORE_BASE}/gestores/${id}?key=${FIREBASE_API_KEY}`;
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toValue(v);
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) throw new Error(`WRITE ${id} failed: ${resp.status} ${await resp.text()}`);
}
async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  if (!resp.ok) throw new Error(`Sign-in failed (${resp.status}): ${await resp.text()}`);
  return (await resp.json()).idToken;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔁 Reasignar "${MUNICIPALITY}": Arturo → Mary  [${APPLY ? 'APPLY' : 'DRY-RUN'}]\n`);

  const arturo = await readDoc(ARTURO_ID);
  if (!arturo) throw new Error("Arturo no existe. Abortando.");

  const target = norm(MUNICIPALITY);
  const smpConsejos = (arturo.consejos ?? []).filter((c) => norm(c.municipality) === target);
  const arturoMunisRemaining = arturo.municipalities.filter((m) => norm(m) !== target);
  const arturoConsejosRemaining = (arturo.consejos ?? []).filter((c) => norm(c.municipality) !== target);

  console.log(`Arturo ANTES: ${arturo.municipalities.length} munis, ${(arturo.consejos ?? []).length} consejos`);
  console.log(`  SMP en Arturo: ${smpConsejos.length} consejos → ${smpConsejos.map((c) => c.consejo).join(', ') || '(ninguno)'}`);
  console.log(`Arturo DESPUÉS: ${arturoMunisRemaining.length} munis, ${arturoConsejosRemaining.length} consejos`);

  const mary = {
    name: 'Mary',
    whatsapp: '5356868265',
    provinces: ['La Habana'],
    municipalities: [MUNICIPALITY],
    consejos: smpConsejos.length > 0 ? smpConsejos : [
      // Fallback si Arturo ya no tiene SMP (re-run): consejos canónicos.
      { municipality: MUNICIPALITY, consejo: 'Rocafort' },
      { municipality: MUNICIPALITY, consejo: 'Luyanó Moderno' },
      { municipality: MUNICIPALITY, consejo: 'Diezmero' },
      { municipality: MUNICIPALITY, consejo: 'San Francisco de Paula' },
      { municipality: MUNICIPALITY, consejo: 'Dolores - Veracruz' },
      { municipality: MUNICIPALITY, consejo: 'Jacomino' },
    ],
    active: true,
  };
  console.log(`\nMary (nueva): WhatsApp ${mary.whatsapp}, ${mary.municipalities.length} muni, ${mary.consejos.length} consejos`);

  if (!APPLY) {
    console.log(`\n(DRY-RUN) No se escribió nada. Para ejecutar:`);
    console.log(`  FIREBASE_ADMIN_EMAIL=... FIREBASE_ADMIN_PASSWORD=... node scripts/migrate-smp-arturo-to-mary.mjs --apply\n`);
    return;
  }

  const email = process.env.FIREBASE_ADMIN_EMAIL;
  const password = process.env.FIREBASE_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Faltan FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD para --apply.');
  const idToken = await signIn(email, password);

  console.log('\n→ Creando/actualizando gestora Mary...');
  await writeFullDoc(MARY_ID, mary, idToken);

  console.log('→ Quitando San Miguel del Padrón de Arturo...');
  await patchFields(ARTURO_ID, { municipalities: arturoMunisRemaining, consejos: arturoConsejosRemaining }, idToken);

  // Verificación post-escritura
  const vArturo = await readDoc(ARTURO_ID, idToken);
  const vMary = await readDoc(MARY_ID, idToken);
  const arturoStillSmp = (vArturo.consejos ?? []).some((c) => norm(c.municipality) === target);
  console.log(`\n✅ Hecho.`);
  console.log(`   Arturo: ${vArturo.municipalities.length} munis, ${vArturo.consejos.length} consejos. ¿Sigue con SMP?: ${arturoStillSmp ? 'SÍ (ERROR)' : 'NO ✓'}`);
  console.log(`   Mary: ${vMary.municipalities.length} muni, ${vMary.consejos.length} consejos, whatsapp=${vMary.whatsapp} ✓`);
}

main().catch((e) => { console.error('✖', e.message); process.exit(1); });
