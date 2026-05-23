/**
 * Seed/actualiza los 6 gestores de Sophia en Firestore.
 *
 * Los nombres y WhatsApp vienen del cliente (mayo 2026). Los municipios
 * cubiertos se DEDUCEN de src/data/localities.ts — si en el futuro se
 * reasigna un consejo a otro gestor, basta con re-correr este script.
 *
 * Idempotencia: cada gestor tiene un documentId estable derivado de su
 * nombre (kebab-case). Re-correr el script ACTUALIZA los datos, no crea
 * duplicados.
 *
 * Uso:
 *   node scripts/seed-gestores.mjs            → dry-run (imprime payloads)
 *   node scripts/seed-gestores.mjs --apply    → escribe a Firestore
 *
 * Auth para --apply: las reglas de Firestore exigen request.auth != null
 * en la colección /gestores. El script hace email/password sign-in vía
 * Firebase Identity Toolkit REST. Necesita estas env vars en .env.local
 * o en el shell:
 *   FIREBASE_ADMIN_EMAIL=sophia.cosmetica.natural@elyerromenu.com
 *   FIREBASE_ADMIN_PASSWORD=<password del admin>
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

// ── Load .env.local from the project root (mismo patrón que create-velas) ──
const envPath = path.resolve(__dirname, '../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ── Firestore REST ─────────────────────────────────────────────────────────
const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return { fields };
}

// Sign in via Firebase Identity Toolkit REST. Devuelve el idToken que después
// pasamos como Bearer en cada PATCH a Firestore.
async function signInWithPassword(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sign-in failed (${resp.status}): ${text}`);
  }
  const data = await resp.json();
  return data.idToken;
}

async function writeDoc(collection, docId, obj, idToken) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  const resp = await fetch(url, {
    method: 'PATCH', // PATCH funciona como upsert: crea si no existe, actualiza si existe
    headers,
    body: JSON.stringify(toFirestoreDoc(obj)),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Firestore PATCH ${docId} failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

// ── Datos de los gestores ──────────────────────────────────────────────────
//
// Los teléfonos: WhatsApp espera el número en formato internacional SIN el
// "+" inicial. Los números cubanos móviles son +53 + 8 dígitos = 10 dígitos
// total. Verifica antes de aplicar.
//
// Los municipios cubiertos se deducen de la asignación consejo→gestor en
// localities.ts. Si en el futuro se reasigna un consejo, regenerar esta lista.
// El campo `consejos` lista los consejos populares específicos que cubre
// cada gestor dentro de sus municipios (solo para provincias con
// usesConsejos=true en localities.ts). Para gestores en Matanzas, este
// array queda vacío — la cobertura es a nivel municipio.
const GESTORES = [
  {
    id: 'arturo',
    name: 'Arturo',
    whatsapp: '5352010900',
    province: 'La Habana',
    municipalities: ['La Habana del Este', 'Centro Habana', 'Diez de Octubre'],
    consejos: [
      { municipality: 'La Habana del Este', consejo: 'Camilo Cienfuegos' },
      { municipality: 'La Habana del Este', consejo: 'Cojímar' },
      { municipality: 'La Habana del Este', consejo: 'Gaiteras' },
      { municipality: 'Centro Habana', consejo: 'San Leopoldo' },
      { municipality: 'Centro Habana', consejo: 'Los Sitios' },
      { municipality: 'Diez de Octubre', consejo: 'Luyanó' },
      { municipality: 'Diez de Octubre', consejo: 'Jesús del Monte' },
      { municipality: 'Diez de Octubre', consejo: 'Lawton' },
      { municipality: 'Diez de Octubre', consejo: 'Vista Alegre' },
      { municipality: 'Diez de Octubre', consejo: 'Tamarindo' },
      { municipality: 'Diez de Octubre', consejo: 'Santos Suárez' },
      { municipality: 'Diez de Octubre', consejo: 'Víbora' },
      { municipality: 'Diez de Octubre', consejo: 'Acosta' },
      { municipality: 'Diez de Octubre', consejo: 'Sevillano' },
    ],
    active: true,
  },
  {
    id: 'danay',
    name: 'Danay',
    whatsapp: '5353969396',
    province: 'La Habana',
    municipalities: ['La Habana del Este'],
    consejos: [{ municipality: 'La Habana del Este', consejo: 'Alamar' }],
    active: true,
  },
  {
    id: 'mariam',
    name: 'Mariam',
    whatsapp: '5353639460',
    province: 'La Habana',
    municipalities: ['La Habana del Este'],
    consejos: [{ municipality: 'La Habana del Este', consejo: 'Guanabo' }],
    active: true,
  },
  {
    id: 'gisselle',
    name: 'Gisselle',
    whatsapp: '5358747563',
    province: 'La Habana',
    municipalities: ['Guanabacoa', 'Regla'],
    consejos: [
      { municipality: 'Guanabacoa', consejo: 'Villa I (Centro Histórico)' },
      { municipality: 'Guanabacoa', consejo: 'Villa II' },
      { municipality: 'Guanabacoa', consejo: 'Chibás - Jata' },
      { municipality: 'Guanabacoa', consejo: "D'Beche - Nalón" },
      { municipality: 'Guanabacoa', consejo: 'Minas - Barrera y Pedro Pi' },
      { municipality: 'Guanabacoa', consejo: 'Peñalver - Bacuranao' },
      { municipality: 'Regla', consejo: 'Guaicanamar' },
      { municipality: 'Regla', consejo: 'Casablanca' },
      { municipality: 'Regla', consejo: 'Loma - Modelo' },
    ],
    active: true,
  },
  {
    id: 'kathy',
    name: 'Kathy',
    whatsapp: '5359710567',
    province: 'La Habana',
    municipalities: ['Plaza de la Revolución'],
    consejos: [
      { municipality: 'Plaza de la Revolución', consejo: 'Vedado' },
      { municipality: 'Plaza de la Revolución', consejo: 'Vedado - Malecón' },
      { municipality: 'Plaza de la Revolución', consejo: 'El Carmelo' },
      { municipality: 'Plaza de la Revolución', consejo: 'Rampa' },
      { municipality: 'Plaza de la Revolución', consejo: 'Príncipe' },
      { municipality: 'Plaza de la Revolución', consejo: 'Plaza' },
      { municipality: 'Plaza de la Revolución', consejo: 'Nuevo Vedado' },
      { municipality: 'Plaza de la Revolución', consejo: 'Colón' },
    ],
    active: true,
  },
  {
    id: 'maday',
    name: 'Maday',
    whatsapp: '5354223000',
    province: 'La Habana',
    municipalities: ['Centro Habana', 'La Habana Vieja'],
    consejos: [
      { municipality: 'Centro Habana', consejo: 'Cayo Hueso' },
      { municipality: 'Centro Habana', consejo: 'Dragones' },
      { municipality: 'Centro Habana', consejo: 'Pueblo Nuevo' },
      { municipality: 'La Habana Vieja', consejo: 'Prado' },
    ],
    active: true,
  },
  {
    id: 'deborah',
    name: 'Deborah',
    whatsapp: '5355739238',
    province: 'Matanzas',
    municipalities: ['Cárdenas', 'Limonar', 'Unión de Reyes'],
    consejos: [],
    active: true,
  },
];

// ── Run ────────────────────────────────────────────────────────────────────
console.log(`\n${APPLY ? '🚀 APPLY MODE' : '🧪 DRY RUN'} — ${GESTORES.length} gestores\n`);

// Sign-in (solo en --apply, dry-run no necesita auth)
let idToken = null;
if (APPLY) {
  const email = process.env.FIREBASE_ADMIN_EMAIL;
  const password = process.env.FIREBASE_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('✖ Faltan FIREBASE_ADMIN_EMAIL y/o FIREBASE_ADMIN_PASSWORD');
    console.error('  Añádelas al .env.local o pásalas inline:');
    console.error('  FIREBASE_ADMIN_EMAIL=... FIREBASE_ADMIN_PASSWORD=... node scripts/seed-gestores.mjs --apply');
    process.exit(1);
  }
  try {
    idToken = await signInWithPassword(email, password);
    console.log(`✓ Autenticado como ${email}\n`);
  } catch (err) {
    console.error(`✖ ${err.message}`);
    process.exit(1);
  }
}

for (const g of GESTORES) {
  const payload = {
    name: g.name,
    whatsapp: g.whatsapp,
    province: g.province,
    municipalities: g.municipalities,
    consejos: g.consejos,
    active: g.active,
    createdAt: new Date().toISOString(),
  };
  const consejosCount = g.consejos?.length ?? 0;
  console.log(`• ${g.name.padEnd(10)} +${g.whatsapp}  →  ${g.municipalities.join(', ')}${consejosCount > 0 ? ` (${consejosCount} consejos)` : ''}`);

  if (APPLY) {
    try {
      await writeDoc('gestores', g.id, payload, idToken);
      console.log(`  ✓ escrito en gestores/${g.id}`);
    } catch (err) {
      console.error(`  ✖ ${err.message}`);
    }
  }
}

console.log(`\n${APPLY ? 'Listo. Verifica en Firebase console.' : 'Re-corre con --apply para escribir.'}\n`);
