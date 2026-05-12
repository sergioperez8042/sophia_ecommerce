/**
 * Create the 8 aromatic candles in the Sophia catalog.
 *
 * Steps:
 *   1. Uploads each image to Cloudinary (folder: products/velas)
 *   2. Creates a product document in Firestore under category 'velas-aromaticas'
 *
 * Usage:
 *   node scripts/create-velas.mjs            → dry-run (uploads images, prints product payloads, no Firestore write)
 *   node scripts/create-velas.mjs --apply    → upload + write to Firestore
 *
 * Env vars (loaded from ../.env.local):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { readFileSync, existsSync } from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

// ── Load .env.local from the parent project root ─────────────────────────
const envPath = path.resolve(__dirname, '../../../../.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('✖ Faltan credenciales de Cloudinary en .env.local');
  process.exit(1);
}
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });

// ── Firestore REST helpers ───────────────────────────────────────────────

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  return { stringValue: String(value) };
}

async function firestoreCreate(collection, docId, fields) {
  const firestoreFields = {};
  for (const [k, v] of Object.entries(fields)) firestoreFields[k] = toFirestoreValue(v);
  // documentId param creates a new doc with that ID; fails if it already exists
  const url = `${FIRESTORE_BASE}/${collection}?documentId=${encodeURIComponent(docId)}&key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) throw new Error(`CREATE ${collection}/${docId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function checkExists(collection, docId) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  return res.ok;
}

// ── Velas dataset ────────────────────────────────────────────────────────

const IMAGES_DIR = '/Users/sergio/Downloads/New Folder With Items 2';

// Sophia-style: 2 frases (~250-320c), beneficio sensorial + ingredientes + ambiente recomendado.
// Por convención de bienestar/aromaterapia: cera de soja vegetal, mecha de algodón sin plomo, aceite esencial puro.
// zona_uso / tipo_piel / tipo_cabello quedan vacíos (no aplican: producto ambiental).
// beneficios: usamos "Calmante" para relajantes y "Purificante" para limpiadoras de ambiente.

const VELAS = [
  {
    id: 'vela-aromatica-canela',
    name: 'Vela Aromática de Canela',
    file: 'WhatsApp Image 2026-05-12 at 21.47.37.jpeg',
    description: 'Vela artesanal de canela en frasco ámbar que envuelve el ambiente con un aroma cálido, dulce y especiado, ideal para los días fríos. Sus notas reconfortantes estimulan la sensación de hogar y bienestar, perfectas para acompañar tardes de lectura, reuniones íntimas o rituales de gratitud.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de canela', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'canela', 'cálida', 'reconfortante', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Canela',
  },
  {
    id: 'vela-aromatica-rosas',
    name: 'Vela Aromática de Rosas',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (6).jpeg',
    description: 'Vela artesanal de rosas en frasco ámbar que perfuma el ambiente con un aroma floral elegante, dulce y delicado. Pensada para crear momentos románticos, sesiones de meditación o un baño relajante, sus notas evocan jardines en flor y serenidad emocional.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de rosas', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'rosas', 'floral', 'romántica', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Rosas',
  },
  {
    id: 'vela-aromatica-cedro',
    name: 'Vela Aromática de Cedro',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (5).jpeg',
    description: 'Vela artesanal de cedro en frasco ámbar que llena el ambiente con un aroma amaderado, profundo y reconfortante. Sus notas terrosas favorecen la concentración, la calma mental y la sensación de arraigo, ideales para espacios de trabajo, meditación o yoga.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de cedro', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'cedro', 'amaderado', 'concentración', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Cedro',
  },
  {
    id: 'vela-aromatica-vainilla',
    name: 'Vela Aromática de Vainilla',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (4).jpeg',
    description: 'Vela artesanal de vainilla en frasco ámbar que perfuma el ambiente con un aroma dulce, cremoso y envolvente. Sus notas reconfortantes evocan calidez, descanso y placer, perfectas para acompañar el final del día, una pausa con café o una noche acogedora en casa.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de vainilla', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'vainilla', 'dulce', 'reconfortante', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Vainilla',
  },
  {
    id: 'vela-aromatica-floral',
    name: 'Vela Aromática Floral',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (3).jpeg',
    description: 'Vela artesanal con bouquet floral en frasco ámbar que combina notas de jazmín, rosa y flores blancas para un aroma elegante y luminoso. Ideal para refrescar ambientes, acompañar encuentros con amigos o transformar tu rutina diaria en un ritual sensorial.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Mezcla de aceites esenciales florales (jazmín, rosa, flores blancas)', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'floral', 'jazmín', 'rosa', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Floral',
  },
  {
    id: 'vela-aromatica-eucalipto',
    name: 'Vela Aromática de Eucalipto',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (1).jpeg',
    description: 'Vela artesanal de eucalipto en frasco ámbar que purifica el ambiente con un aroma fresco, mentolado y revitalizante. Sus notas favorecen la respiración, despejan la mente y aportan una sensación de limpieza profunda, ideales para mañanas activas y espacios de descanso.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de eucalipto', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'eucalipto', 'fresca', 'purificante', 'aromaterapia'],
    beneficios: ['Purificante', 'Calmante'],
    aroma: 'Eucalipto',
  },
  {
    id: 'vela-aromatica-lavanda',
    name: 'Vela Aromática de Lavanda',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36 (2).jpeg',
    description: 'Vela artesanal de lavanda en frasco ámbar que envuelve el ambiente con un aroma herbal, suave y profundamente relajante. Sus notas son reconocidas por aliviar el estrés, mejorar la calidad del sueño y crear espacios de calma para meditar, leer o tomar un baño.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Aceite esencial de lavanda', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'lavanda', 'relajante', 'antiestrés', 'aromaterapia'],
    beneficios: ['Calmante'],
    aroma: 'Lavanda',
  },
  {
    id: 'vela-aromatica-citricos',
    name: 'Vela Aromática de Cítricos',
    file: 'WhatsApp Image 2026-05-12 at 21.47.36.jpeg',
    description: 'Vela artesanal de cítricos en frasco ámbar con notas vibrantes de naranja, limón y lima que energizan el ambiente y elevan el ánimo. Su aroma refrescante combate la modorra, mejora el enfoque y purifica los olores, ideal para mañanas productivas y cocinas luminosas.',
    usage: 'Encender la mecha durante 2-3 horas en la primera quema para asegurar una fusión pareja de la cera. Mantener alejada de corrientes de aire, niños y mascotas. Apagar antes de dormir o salir del ambiente.',
    ingredients: ['Cera de soja vegetal', 'Mecha de algodón sin plomo', 'Mezcla de aceites esenciales cítricos (naranja, limón, lima)', 'Frasco de vidrio ámbar'],
    tags: ['vela aromática', 'cítricos', 'naranja', 'limón', 'energizante', 'aromaterapia'],
    beneficios: ['Purificante'],
    aroma: 'Cítricos',
  },
];

// ── Defaults for new candle products ─────────────────────────────────────
const DEFAULT_PRICE = 500;       // CUP — confirmado por el cliente
const DEFAULT_WEIGHT = 25;       // gramos — confirmado por el cliente
const DEFAULT_WEIGHT_UNIT = 'g';
const CATEGORY_ID = 'velas-aromaticas';

// ── Main ─────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  Sophia — crear 8 velas aromáticas  ${APPLY ? '— APPLY MODE 🚀' : '(dry-run)'}`);
  console.log(`${'═'.repeat(72)}\n`);

  const now = new Date().toISOString();
  const results = [];

  for (const vela of VELAS) {
    console.log(`▸ ${vela.name}`);
    const filePath = path.join(IMAGES_DIR, vela.file);
    if (!existsSync(filePath)) {
      console.log(`  ✖ Imagen no encontrada: ${filePath}`);
      continue;
    }

    // 1. Upload to Cloudinary
    let imageUrl;
    try {
      const upload = await cloudinary.uploader.upload(filePath, {
        folder: 'products/velas',
        public_id: vela.id,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        transformation: [{ quality: 'auto:good', fetch_format: 'webp' }],
      });
      imageUrl = upload.secure_url;
      console.log(`  ✓ Cloudinary: ${imageUrl}`);
    } catch (e) {
      console.log(`  ✖ Cloudinary upload error: ${e.message}`);
      continue;
    }

    // 2. Build product payload
    const product = {
      name: vela.name,
      description: vela.description,
      usage: vela.usage,
      ingredients: vela.ingredients,
      tags: vela.tags,
      price: DEFAULT_PRICE,
      weight: DEFAULT_WEIGHT,
      weight_unit: DEFAULT_WEIGHT_UNIT,
      image: imageUrl,
      category_id: CATEGORY_ID,
      beneficios: vela.beneficios,
      zona_uso: [],
      tipo_piel: [],
      tipo_cabello: [],
      active: true,
      featured: false,
      out_of_stock: false,
      rating: 0,
      reviews_count: 0,
      created_date: now,
    };

    console.log(`  • ${product.description.length}c desc · $${product.price} · ${product.weight}${product.weight_unit} · benef:[${product.beneficios.join(',')}]`);

    // 3. Create in Firestore
    if (APPLY) {
      const exists = await checkExists('products', vela.id);
      if (exists) {
        console.log(`  ⚠ Ya existía en Firestore — SKIP`);
        continue;
      }
      try {
        await firestoreCreate('products', vela.id, product);
        console.log(`  ✓ Firestore: products/${vela.id} creado`);
      } catch (e) {
        console.log(`  ✖ Firestore error: ${e.message}`);
        continue;
      }
    }

    results.push({ id: vela.id, name: vela.name, image: imageUrl });
  }

  console.log(`\n${'─'.repeat(72)}`);
  console.log(`  Procesados: ${results.length}/${VELAS.length}`);
  if (!APPLY) {
    console.log(`  Dry-run: imágenes subidas, productos NO creados.`);
    console.log(`  Aplicar:  node scripts/create-velas.mjs --apply\n`);
  } else {
    console.log(`  ✅ Velas creadas en Firestore.\n`);
  }
})();
