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
// Shape: cada gestor tiene `provinces: string[]` (multi-provincia). El admin
// las gestiona como multi-select. El lookup en findByLocation no usa este
// campo directamente — el matching real es por `municipalities[]` y
// `consejos[]`. Provinces es informativo / agrupador para la UI del admin.
const GESTORES = [
  {
    // Arturo absorbe los municipios de La Habana sin gestor:
    //   San Miguel del Padrón, Cotorro, Playa, Cerro, Arroyo Naranjo,
    //   Boyeros, Marianao, La Lisa
    // (decisión del cliente, mayo 2026). Campo Florido queda fuera
    // explícitamente — no hay quien asuma ese consejo.
    id: 'arturo',
    name: 'Arturo',
    whatsapp: '5352010900',
    provinces: ['La Habana'],
    municipalities: [
      'La Habana del Este',
      'Centro Habana',
      'Diez de Octubre',
      'San Miguel del Padrón',
      'Cotorro',
      'Playa',
      'Cerro',
      'Arroyo Naranjo',
      'Boyeros',
      'Marianao',
      'La Lisa',
    ],
    consejos: [
      // La Habana del Este (sin Campo Florido — excluido)
      { municipality: 'La Habana del Este', consejo: 'Camilo Cienfuegos' },
      { municipality: 'La Habana del Este', consejo: 'Cojímar' },
      { municipality: 'La Habana del Este', consejo: 'Guiteras' },
      { municipality: 'La Habana del Este', consejo: 'El Bahía' },
      // Centro Habana (compartido con Maday)
      { municipality: 'Centro Habana', consejo: 'San Leopoldo' },
      { municipality: 'Centro Habana', consejo: 'Los Sitios' },
      // Diez de Octubre (cobertura completa)
      { municipality: 'Diez de Octubre', consejo: 'Luyanó' },
      { municipality: 'Diez de Octubre', consejo: 'Jesús del Monte' },
      { municipality: 'Diez de Octubre', consejo: 'Lawton' },
      { municipality: 'Diez de Octubre', consejo: 'Vista Alegre' },
      { municipality: 'Diez de Octubre', consejo: 'Tamarindo' },
      { municipality: 'Diez de Octubre', consejo: 'Santos Suárez' },
      { municipality: 'Diez de Octubre', consejo: 'Víbora' },
      { municipality: 'Diez de Octubre', consejo: 'Acosta' },
      { municipality: 'Diez de Octubre', consejo: 'Sevillano' },
      // San Miguel del Padrón (6)
      { municipality: 'San Miguel del Padrón', consejo: 'Rocafort' },
      { municipality: 'San Miguel del Padrón', consejo: 'Luyanó Moderno' },
      { municipality: 'San Miguel del Padrón', consejo: 'Diezmero' },
      { municipality: 'San Miguel del Padrón', consejo: 'San Francisco de Paula' },
      { municipality: 'San Miguel del Padrón', consejo: 'Dolores - Veracruz' },
      { municipality: 'San Miguel del Padrón', consejo: 'Jacomino' },
      // Cotorro (6)
      { municipality: 'Cotorro', consejo: 'San Pedro - Centro Cotorro' },
      { municipality: 'Cotorro', consejo: 'Santa María del Rosario' },
      { municipality: 'Cotorro', consejo: 'Lotería' },
      { municipality: 'Cotorro', consejo: 'Cuatro Caminos' },
      { municipality: 'Cotorro', consejo: 'Magdalena - Torriente' },
      { municipality: 'Cotorro', consejo: 'Alberro' },
      // Playa (8)
      { municipality: 'Playa', consejo: 'Miramar' },
      { municipality: 'Playa', consejo: 'Buena Vista' },
      { municipality: 'Playa', consejo: 'Ampliación de Almendares' },
      { municipality: 'Playa', consejo: 'Ceiba - Kohly' },
      { municipality: 'Playa', consejo: 'Cubanacán' },
      { municipality: 'Playa', consejo: 'Siboney - Atabey' },
      { municipality: 'Playa', consejo: 'Jaimanitas' },
      { municipality: 'Playa', consejo: 'Santa Fe' },
      // Cerro (8)
      { municipality: 'Cerro', consejo: 'Latinoamericano' },
      { municipality: 'Cerro', consejo: 'Pilar - Atarés' },
      { municipality: 'Cerro', consejo: 'Cerros' },
      { municipality: 'Cerro', consejo: 'Las Cañas' },
      { municipality: 'Cerro', consejo: 'Canal' },
      { municipality: 'Cerro', consejo: 'Palatino' },
      { municipality: 'Cerro', consejo: 'Armada' },
      { municipality: 'Cerro', consejo: 'Casino Deportivo' },
      // Arroyo Naranjo (10)
      { municipality: 'Arroyo Naranjo', consejo: 'Los Pinos' },
      { municipality: 'Arroyo Naranjo', consejo: 'Joey' },
      { municipality: 'Arroyo Naranjo', consejo: 'Víbora Park' },
      // Mantilla → Kathy (no Arturo)
      { municipality: 'Arroyo Naranjo', consejo: 'Párraga' },
      { municipality: 'Arroyo Naranjo', consejo: 'Calzada de Managua' },
      { municipality: 'Arroyo Naranjo', consejo: 'Guadalupe' },
      { municipality: 'Arroyo Naranjo', consejo: 'El Eléctrico' },
      { municipality: 'Arroyo Naranjo', consejo: 'Managua' },
      { municipality: 'Arroyo Naranjo', consejo: 'Callejas' },
      // Boyeros (7)
      { municipality: 'Boyeros', consejo: 'Altahabana' },
      { municipality: 'Boyeros', consejo: 'Capdevila' },
      { municipality: 'Boyeros', consejo: 'Armada' },
      { municipality: 'Boyeros', consejo: 'Calabazar' },
      { municipality: 'Boyeros', consejo: 'Wajay' },
      { municipality: 'Boyeros', consejo: 'Santiago de las Vegas' },
      { municipality: 'Boyeros', consejo: 'Nuevo Santiago' },
      // Marianao (6)
      { municipality: 'Marianao', consejo: 'Pogolotti - Belén - Finlay' },
      { municipality: 'Marianao', consejo: 'Zamora - Coco Solo' },
      { municipality: 'Marianao', consejo: 'Libertad' },
      { municipality: 'Marianao', consejo: 'ICAIC' },
      { municipality: 'Marianao', consejo: 'Los Ángeles' },
      { municipality: 'Marianao', consejo: 'Civic Center (Plaza Cívica)' },
      // La Lisa (10)
      { municipality: 'La Lisa', consejo: 'Alturas de La Lisa' },
      { municipality: 'La Lisa', consejo: 'Balcón de Arimao' },
      { municipality: 'La Lisa', consejo: 'El Cano' },
      { municipality: 'La Lisa', consejo: 'Valle Grande' },
      { municipality: 'La Lisa', consejo: 'Bello 26' },
      { municipality: 'La Lisa', consejo: 'San Agustín' },
      { municipality: 'La Lisa', consejo: 'Arroyo Arenas' },
      { municipality: 'La Lisa', consejo: 'Punta Brava' },
      { municipality: 'La Lisa', consejo: 'Versalles' },
      { municipality: 'La Lisa', consejo: 'Coronela' },
    ],
    active: true,
  },
  {
    id: 'danay',
    name: 'Danay',
    whatsapp: '5353969396',
    provinces: ['La Habana'],
    municipalities: ['La Habana del Este'],
    consejos: [{ municipality: 'La Habana del Este', consejo: 'Alamar' }],
    active: true,
  },
  {
    id: 'mariam',
    name: 'Mariam',
    whatsapp: '5353639460',
    provinces: ['La Habana'],
    municipalities: ['La Habana del Este'],
    consejos: [{ municipality: 'La Habana del Este', consejo: 'Guanabo' }],
    active: true,
  },
  {
    id: 'gisselle',
    name: 'Gisselle',
    whatsapp: '5358747563',
    provinces: ['La Habana'],
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
    provinces: ['La Habana'],
    municipalities: ['Plaza de la Revolución', 'Arroyo Naranjo'],
    consejos: [
      { municipality: 'Plaza de la Revolución', consejo: 'Vedado' },
      { municipality: 'Plaza de la Revolución', consejo: 'Vedado - Malecón' },
      { municipality: 'Plaza de la Revolución', consejo: 'El Carmelo' },
      { municipality: 'Plaza de la Revolución', consejo: 'Rampa' },
      { municipality: 'Plaza de la Revolución', consejo: 'Príncipe' },
      { municipality: 'Plaza de la Revolución', consejo: 'Plaza' },
      { municipality: 'Plaza de la Revolución', consejo: 'Nuevo Vedado' },
      { municipality: 'Plaza de la Revolución', consejo: 'Colón' },
      // Mantilla movido desde Arturo (mayo 2026 — solicitud del cliente)
      { municipality: 'Arroyo Naranjo', consejo: 'Mantilla' },
    ],
    active: true,
  },
  {
    id: 'maday',
    name: 'Maday',
    whatsapp: '5354223000',
    provinces: ['La Habana'],
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
    provinces: ['Matanzas'],
    municipalities: ['Matanzas', 'Cárdenas', 'Limonar', 'Unión de Reyes'],
    consejos: [],
    active: true,
  },
  {
    // Heydi cubre SOLO Santa Cruz del Norte por el momento. El resto de
    // municipios de Mayabeque (Batabanó, Bejucal, Güines, Jaruco, Madruga,
    // Melena del Sur, Nueva Paz, Quivicán, San José de las Lajas,
    // San Nicolás de Bari) siguen apareciendo en el dropdown del cliente
    // pero al seleccionarlos verán "no hay gestor en esta zona" hasta que
    // se incorpore otro gestor o Heydi extienda su cobertura.
    id: 'heydi',
    name: 'Heydi',
    whatsapp: '5354520796',
    provinces: ['Mayabeque'],
    municipalities: ['Santa Cruz del Norte'],
    consejos: [],
    active: true,
  },
  {
    // Multi-provincia: cubre Santiago de Cuba + Granma, PERO no todos los
    // municipios de cada una — solo los listados aquí. El resto aparecen
    // en el dropdown del cliente (vienen de localities.ts) pero al
    // seleccionarlos verá "no hay gestor en esta zona". Es decisión del
    // cliente (Sophia) qué cobertura activa por gestor.
    id: 'marian',
    name: 'Marian',
    whatsapp: '5359188843',
    provinces: ['Santiago de Cuba', 'Granma'],
    municipalities: [
      // Santiago de Cuba (2 de 9)
      'Contramaestre',
      'Santiago de Cuba',
      // Granma (1 de 13)
      'Jiguaní',
    ],
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
    provinces: g.provinces,
    municipalities: g.municipalities,
    consejos: g.consejos,
    active: g.active,
    createdAt: new Date().toISOString(),
  };
  const consejosCount = g.consejos?.length ?? 0;
  console.log(`• ${g.name.padEnd(10)} +${g.whatsapp}  [${g.provinces.join(' + ')}]  →  ${g.municipalities.length} municipios${consejosCount > 0 ? ` (${consejosCount} consejos)` : ''}`);

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
