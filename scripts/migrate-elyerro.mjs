/**
 * Migration script: El Yerro → Sophia Ecommerce
 * Uploads images to Cloudinary and inserts products into Firestore
 *
 * Usage: node scripts/migrate-elyerro.mjs
 */

import { v2 as cloudinary } from 'cloudinary';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ============================================================
// CONFIG
// ============================================================

const IMAGES_DIR = '/Users/sergio/Downloads/sophia_elyerro_images';
const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Cloudinary config
cloudinary.config({
  cloud_name: 'dm7oy9pmm',
  api_key: '895679433187759',
  api_secret: 'DNQn7sRbgaNaGlefjhC2TtMlJZk',
});

// No auth needed — Firestore rules temporarily open for migration

// ============================================================
// FIRESTORE REST API HELPERS
// ============================================================

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function objectToFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function firestoreGet(collection, docId) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, { headers: JSON_HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${collection}/${docId}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function firestoreSet(collection, docId, data) {
  const url = `${FIRESTORE_BASE}/${collection}?documentId=${docId}&key=${FIREBASE_API_KEY}`;
  const body = { fields: objectToFirestoreFields(data) };
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SET ${collection}/${docId}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function firestoreAdd(collection, data) {
  const url = `${FIRESTORE_BASE}/${collection}?key=${FIREBASE_API_KEY}`;
  const body = { fields: objectToFirestoreFields(data) };
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ADD ${collection}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function firestorePatch(collection, docId, data) {
  const fields = objectToFirestoreFields(data);
  const updateMask = Object.keys(data).map(f => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?${updateMask}&key=${FIREBASE_API_KEY}`;
  const body = { fields };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${collection}/${docId}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function firestoreQuery(collection, field, op, value) {
  const url = `${FIRESTORE_BASE}:runQuery?key=${FIREBASE_API_KEY}`;
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: op,
          value: toFirestoreValue(value),
        },
      },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`QUERY ${collection}: ${res.status} ${await res.text()}`);
  const results = await res.json();
  return results.filter(r => r.document);
}

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  { id: 'jabones-artesanales', name: 'Jabones Artesanales', description: 'Jabones naturales artesanales para limpieza facial y corporal', sort_order: 1 },
  { id: 'aceites-naturales', name: 'Aceites Naturales', description: 'Oleatos botánicos puros para el cuidado de piel y cabello', sort_order: 2 },
  { id: 'mascarillas-faciales', name: 'Mascarillas Faciales', description: 'Mascarillas naturales para tratamiento y renovación facial', sort_order: 3 },
  { id: 'serums-faciales', name: 'Sérums Faciales', description: 'Concentrados regeneradores para tratamientos faciales específicos', sort_order: 4 },
  { id: 'cuidado-capilar', name: 'Cuidado Capilar', description: 'Productos naturales para el bienestar y fortalecimiento del cabello', sort_order: 5 },
  { id: 'cremas-faciales-corporales', name: 'Cremas Faciales y Corporales', description: 'Hidratación profunda con ingredientes naturales', sort_order: 6 },
  { id: 'esenciales', name: 'Esenciales Sophía', description: 'Productos esenciales para tu rutina de cuidado personal', sort_order: 7 },
];

// ============================================================
// PRODUCTS DATA (optimized content)
// ============================================================

const PRODUCTS = [
  // ── JABONES ARTESANALES ──
  {
    imageFile: 'jabon-intimo-salvia-m.webp',
    name: 'Jabón Íntimo de Salvia',
    description: 'Jabón artesanal formulado con salvia para el cuidado íntimo diario. Mantiene el equilibrio del pH natural, previene la resequedad y proporciona protección antiséptica suave.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'íntimo', 'salvia', 'pH', 'antiséptico', 'higiene'],
    ingredients: ['Salvia', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar durante el baño con agua tibia. Uso exclusivamente externo.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-aloe-vera-m.webp',
    name: 'Jabón de Aloe Vera',
    description: 'Jabón artesanal con aloe vera, rico en antioxidantes. Combate el acné, restaura el colágeno y protege la piel de los radicales libres.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'aloe vera', 'antioxidante', 'antiacné', 'colágeno'],
    ingredients: ['Aloe vera', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Humedecer la piel, masajear con la espuma y enjuagar con abundante agua.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-curcuma-m.webp',
    name: 'Jabón de Cúrcuma',
    description: 'Jabón artesanal con cúrcuma que aclara manchas, combate el envejecimiento prematuro y aporta luminosidad al rostro gracias a su poder antioxidante.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'cúrcuma', 'antimanchas', 'antioxidante', 'luminosidad'],
    ingredients: ['Cúrcuma', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre el rostro húmedo, masajear suavemente y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-carbon-activado-m.webp',
    name: 'Jabón de Carbón Activado',
    description: 'Jabón detoxificante con carbón activado que absorbe toxinas, controla el exceso de grasa y combate bacterias. Ideal para pieles mixtas y grasas.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'carbón activado', 'detox', 'control grasa', 'antibacterial'],
    ingredients: ['Carbón activado', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Usar 2-3 veces por semana. Evitar uso diario para no resecar la piel.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-neem-m.webp',
    name: 'Jabón de Neem',
    description: 'Jabón artesanal con neem, conocido por sus propiedades despigmentantes y regeneradoras. Controla el sebo y puede usarse como champú anticaspa.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'neem', 'despigmentante', 'regenerador', 'anticaspa'],
    ingredients: ['Neem', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, masajear y enjuagar. También funciona como champú.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-arroz-m.webp',
    name: 'Jabón de Arroz',
    description: 'Jabón hidratante con extracto de arroz que exfolia suavemente, combate el acné y deja la piel luminosa y nutrida.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'arroz', 'hidratante', 'exfoliante', 'antiacné'],
    ingredients: ['Extracto de arroz', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Masajear sobre la piel húmeda con movimientos circulares y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'jabon-avena-m.webp',
    name: 'Jabón de Avena',
    description: 'Jabón exfoliante suave con avena que elimina bacterias, regula la producción de grasa y es apto para pieles sensibles.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'avena', 'exfoliante', 'piel sensible', 'antibacterial'],
    ingredients: ['Avena', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, masajear suavemente y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-coco-m.webp',
    name: 'Jabón de Coco',
    description: 'Jabón artesanal de coco con propiedades antisépticas y antienvejecimiento. Previene manchas y es apto para toda la familia.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'coco', 'antiséptico', 'antienvejecimiento', 'familiar'],
    ingredients: ['Aceite de coco', 'Glicerina vegetal'],
    usage: 'Aplicar sobre la piel húmeda, hacer espuma y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'jabon-avena-miel-m.webp',
    name: 'Jabón de Avena y Miel',
    description: 'Jabón hidratante con avena y miel que calma la piel irritada, mejora la elasticidad y es especialmente recomendado para pieles con psoriasis.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'avena', 'miel', 'hidratante', 'psoriasis', 'calmante'],
    ingredients: ['Avena', 'Miel', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, masajear con suavidad y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-pepino-m.webp',
    name: 'Jabón de Pepino',
    description: 'Jabón refrescante con pepino que repara e hidrata la piel en profundidad. Ideal después de la exposición solar.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'pepino', 'refrescante', 'hidratante', 'post-solar'],
    ingredients: ['Extracto de pepino', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, masajear y enjuagar con agua fresca.',
    weight: 90, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'jabon-cafe-m.webp',
    name: 'Jabón de Café',
    description: 'Jabón exfoliante con café que activa la circulación, combate la celulitis y reduce las ojeras. Efecto tonificante y energizante.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'café', 'exfoliante', 'anticelulitis', 'antiojeras'],
    ingredients: ['Café', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Usar 2-3 veces por semana máximo. Masajear con movimientos circulares.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-remolacha-m.webp',
    name: 'Jabón de Remolacha',
    description: 'Jabón antioxidante con remolacha, rico en vitamina C. Combate el envejecimiento prematuro y nutre la piel desde la primera aplicación.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'remolacha', 'antioxidante', 'vitamina C', 'antienvejecimiento'],
    ingredients: ['Remolacha', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar diariamente sobre la piel húmeda, masajear y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'jabon-manzanilla-m.webp',
    name: 'Jabón de Manzanilla',
    description: 'Jabón calmante con manzanilla que regula el pH, controla el sebo y es ideal para pieles sensibles. Recomendado también para bebés.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'manzanilla', 'calmante', 'pH', 'bebés', 'piel sensible'],
    ingredients: ['Manzanilla', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda con suavidad. Apto para uso diario.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-miel-m.webp',
    name: 'Jabón de Miel',
    description: 'Jabón antibacterial con miel que hidrata en profundidad, previene el envejecimiento y ayuda en la cicatrización de heridas y quemaduras.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'miel', 'antibacterial', 'hidratante', 'cicatrizante'],
    ingredients: ['Miel', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, hacer espuma y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'jabon-romero-m.webp',
    name: 'Jabón de Romero',
    description: 'Jabón antiséptico con romero que regula la producción de grasa, estimula la circulación y es ideal para pieles grasas y con tendencia acneica.',
    price: 5.00,
    category_id: 'jabones-artesanales',
    tags: ['jabón', 'romero', 'antiséptico', 'control grasa', 'piel grasa'],
    ingredients: ['Romero', 'Glicerina vegetal', 'Aceite de coco'],
    usage: 'Aplicar sobre la piel húmeda, masajear y enjuagar.',
    weight: 90, weight_unit: 'g',
    out_of_stock: false,
  },

  // ── ACEITES NATURALES ──
  {
    imageFile: 'aceite-calendula-m.webp',
    name: 'Aceite de Caléndula',
    description: 'Oleato de caléndula con propiedades cicatrizantes y antisépticas. Estimula la producción de colágeno y alivia contusiones y esguinces.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'caléndula', 'cicatrizante', 'antiséptico', 'colágeno'],
    ingredients: ['Oleato de caléndula', 'Vitamina E'],
    usage: 'Aplicar unas gotas en las yemas de los dedos y masajear suavemente.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'aceite-rosas-m.webp',
    name: 'Aceite de Rosas',
    description: 'Oleato de rosas regenerador que reduce cicatrices, previene arrugas y unifica el tono de la piel. Hidratación profunda con aroma exquisito.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'rosas', 'regenerador', 'antiarrugas', 'cicatrices'],
    ingredients: ['Oleato de rosas', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la piel limpia y masajear con movimientos ascendentes.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-romero-m.webp',
    name: 'Aceite de Romero',
    description: 'Oleato de romero con acción astringente y antiinflamatoria. Fortalece el cabello, alivia dolores musculares y mejora la circulación.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'romero', 'astringente', 'fortalecedor', 'muscular'],
    ingredients: ['Oleato de romero', 'Vitamina E'],
    usage: 'Masajear sobre la zona deseada. Para el cabello, aplicar de raíz a puntas.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-limon-m.webp',
    name: 'Aceite de Limón',
    description: 'Oleato de limón rico en vitamina C con propiedades hidratantes y antibacterianas. Aclara manchas oscuras y unifica el tono.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'limón', 'vitamina C', 'antimanchas', 'hidratante'],
    ingredients: ['Oleato de limón', 'Vitamina E'],
    usage: 'Aplicar por la noche. Evitar exposición solar después de la aplicación.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-aguacate-m.webp',
    name: 'Aceite de Aguacate',
    description: 'Oleato de aguacate antiinflamatorio que estimula el colágeno y nutre la piel en profundidad. Fortalece el cabello y sella las puntas abiertas.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'aguacate', 'colágeno', 'nutritivo', 'cabello'],
    ingredients: ['Oleato de aguacate', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear. Para cabello, aplicar en puntas.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-almendras-m.webp',
    name: 'Aceite de Almendras',
    description: 'Oleato de almendras rico en Omega que previene estrías, combate arrugas y funciona como desmaquillante natural.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'almendras', 'antiestrías', 'antiarrugas', 'omega', 'desmaquillante'],
    ingredients: ['Oleato de almendras', 'Vitamina E'],
    usage: 'Masajear sobre la piel limpia. Como desmaquillante, aplicar con algodón.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-ricino-m.webp',
    name: 'Aceite de Ricino',
    description: 'Oleato de ricino antimicrobiano y no comedogénico. Reduce el acné, fortalece el cabello débil y estimula el crecimiento.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'ricino', 'antimicrobiano', 'fortalecedor', 'crecimiento capilar'],
    ingredients: ['Oleato de ricino', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la zona deseada y masajear.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-aloe-vera-m.webp',
    name: 'Aceite de Aloe Vera',
    description: 'Oleato de aloe vera cicatrizante y regenerador. Trata quemaduras, dermatitis, eczema y psoriasis con su poder antioxidante.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'aloe vera', 'cicatrizante', 'regenerador', 'dermatitis'],
    ingredients: ['Oleato de aloe vera', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la piel afectada y masajear suavemente.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-manzanilla-m.webp',
    name: 'Aceite de Manzanilla',
    description: 'Oleato de manzanilla antiinflamatorio que hidrata y calma el cuero cabelludo. Promueve el crecimiento natural del cabello.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'manzanilla', 'antiinflamatorio', 'cuero cabelludo', 'crecimiento'],
    ingredients: ['Oleato de manzanilla', 'Vitamina E'],
    usage: 'Aplicar unas gotas en el cuero cabelludo o la piel y masajear.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-moringa-m.webp',
    name: 'Aceite de Moringa',
    description: 'Oleato de moringa regenerador y antimicrobiano con potente acción antienvejecimiento. Reduce la pigmentación desigual.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'moringa', 'regenerador', 'antimicrobiano', 'despigmentante'],
    ingredients: ['Oleato de moringa', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la piel limpia, preferiblemente por la noche.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'aceite-cafe-m.webp',
    name: 'Aceite de Café',
    description: 'Oleato de café anticelulítico y rejuvenecedor, rico en antioxidantes. Para cabello, usar como tratamiento de aceite caliente en puntas.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'café', 'anticelulítico', 'rejuvenecedor', 'antioxidante'],
    ingredients: ['Oleato de café', 'Vitamina E'],
    usage: 'Masajear sobre la zona deseada. Para cabello, aplicar tibio en puntas.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'aceite-flor-jamaica-m.webp',
    name: 'Aceite de Flor de Jamaica',
    description: 'Oleato de flor de jamaica rico en vitamina E con acción antioxidante y antiinflamatoria. Trata psoriasis, dermatitis y eczema.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'flor de jamaica', 'vitamina E', 'antiinflamatorio', 'psoriasis'],
    ingredients: ['Oleato de flor de jamaica', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la piel afectada y masajear.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-albahaca-m.webp',
    name: 'Aceite de Albahaca',
    description: 'Oleato de albahaca antiinflamatorio y reafirmante que mejora la elasticidad de la piel. Acelera el crecimiento del cabello.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'albahaca', 'reafirmante', 'elasticidad', 'crecimiento capilar'],
    ingredients: ['Oleato de albahaca', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear sobre piel o cabello.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-jengibre-m.webp',
    name: 'Aceite de Jengibre',
    description: 'Oleato de jengibre antioxidante que combate el acné, alivia quemaduras solares y reduce dolores articulares y artritis.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'jengibre', 'antioxidante', 'antiacné', 'articulaciones'],
    ingredients: ['Oleato de jengibre', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear sobre la zona deseada.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-canela-m.webp',
    name: 'Aceite de Canela',
    description: 'Oleato de canela antibacterial y antiinflamatorio con potentes antioxidantes. Alivia dolores de artritis y problemas óseos.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'canela', 'antibacterial', 'antiinflamatorio', 'artritis'],
    ingredients: ['Oleato de canela', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear. Para dolor articular, aplicar tibio.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'aceite-oregano-m.webp',
    name: 'Aceite de Orégano',
    description: 'Oleato de orégano con poderosa acción antifúngica y antiséptica. Trata el acné y problemas de hongos en la piel.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'orégano', 'antifúngico', 'antiséptico', 'antiacné'],
    ingredients: ['Oleato de orégano', 'Vitamina E'],
    usage: 'Aplicar unas gotas sobre la zona afectada.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'aceite-fresa-m.webp',
    name: 'Aceite de Fresa',
    description: 'Oleato de fresa antienvejecimiento que estimula el colágeno e hidrata en profundidad. Ideal también como aceite de masaje.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'fresa', 'antienvejecimiento', 'colágeno', 'hidratante', 'masaje'],
    ingredients: ['Oleato de fresa', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear con movimientos circulares.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'aceite-coco-m.webp',
    name: 'Aceite de Coco',
    description: 'Oleato de coco hidratante que combate arrugas y estrías. Funciona como desmaquillante natural y protege la piel.',
    price: 5.00,
    category_id: 'aceites-naturales',
    tags: ['aceite', 'coco', 'hidratante', 'antiarrugas', 'antiestrías', 'desmaquillante'],
    ingredients: ['Oleato de coco', 'Vitamina E'],
    usage: 'Aplicar unas gotas y masajear. Como desmaquillante, usar con algodón.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },

  // ── MASCARILLAS FACIALES ──
  {
    imageFile: 'mascarilla-cafe-hialuronico-m.webp',
    name: 'Mascarilla de Café y Ácido Hialurónico',
    description: 'Mascarilla en crema con café y ácido hialurónico que hidrata profundamente, combate la celulitis y reduce la inflamación.',
    price: 8.00,
    category_id: 'mascarillas-faciales',
    tags: ['mascarilla', 'café', 'ácido hialurónico', 'hidratante', 'anticelulitis'],
    ingredients: ['Café', 'Ácido hialurónico', 'Manteca de karité'],
    usage: 'Aplicar 1-2 veces por semana durante 20-30 min sobre piel limpia. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'mascarilla-carbon-maicena-m.webp',
    name: 'Mascarilla de Carbón Activado y Maicena',
    description: 'Mascarilla en polvo de carbón activado y maicena que cierra poros, renueva la piel y elimina el exceso de grasa.',
    price: 5.50,
    category_id: 'mascarillas-faciales',
    tags: ['mascarilla', 'carbón activado', 'maicena', 'poros', 'control grasa'],
    ingredients: ['Carbón activado', 'Maicena'],
    usage: 'Mezclar con agua tibia, aplicar 15 min, máximo 2 veces por semana. Hidratar después.',
    weight: 60, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'mascarilla-carbon-hialuronico-m.webp',
    name: 'Mascarilla de Carbón y Ácido Hialurónico',
    description: 'Mascarilla en crema con carbón activado y ácido hialurónico. Limpia poros en profundidad, absorbe toxinas y aporta luminosidad.',
    price: 8.00,
    category_id: 'mascarillas-faciales',
    tags: ['mascarilla', 'carbón', 'ácido hialurónico', 'detox', 'luminosidad'],
    ingredients: ['Carbón activado', 'Ácido hialurónico', 'Manteca de karité'],
    usage: 'Aplicar 20-30 min, 1-2 veces por semana. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },

  // ── SÉRUMS FACIALES ──
  {
    imageFile: 'serum-antiojeras-m.webp',
    name: 'Sérum Antiojeras',
    description: 'Sérum concentrado para el contorno de ojos que reduce ojeras y previene el envejecimiento prematuro. Rico en antioxidantes.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'antiojeras', 'contorno de ojos', 'antioxidante', 'antienvejecimiento'],
    ingredients: ['Aceite de almendras', 'Aceite de salvia', 'Aceite de coco', 'Vitamina E'],
    usage: 'Aplicar solo por la noche con masaje suave. Fotosensible, evitar el sol.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-labial-m.webp',
    name: 'Sérum Labial',
    description: 'Sérum revitalizante para labios que hidrata en profundidad y protege contra la resequedad. Acción reparadora intensiva.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'labios', 'hidratante', 'revitalizante', 'reparador'],
    ingredients: ['Aceite de fresa', 'Aceite de almendras', 'Aceite de coco', 'Vitamina E'],
    usage: 'Exfoliar los labios antes. Aplicar solo por la noche.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-facial-regenerador-m.webp',
    name: 'Sérum Facial Regenerador',
    description: 'Sérum facial hidratante y rejuvenecedor que repara los tejidos en profundidad. Puede usarse como mascarilla semanal de 5-7 minutos.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'facial', 'regenerador', 'hidratante', 'rejuvenecedor'],
    ingredients: ['Aceite de coco', 'Aceite de rosas', 'Aceite de sésamo', 'Aceite de flor de jamaica', 'Vitamina E'],
    usage: 'Aplicar por la noche sobre piel limpia. Fotosensible.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-pestanas-cejas-m.webp',
    name: 'Sérum para Pestañas y Cejas',
    description: 'Sérum fortalecedor que estimula el crecimiento de pestañas y cejas, aumentando su grosor y densidad de forma natural.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'pestañas', 'cejas', 'crecimiento', 'fortalecedor'],
    ingredients: ['Aceite de ricino', 'Aceite de coco', 'Aceite de almendras', 'Vitamina E'],
    usage: 'Aplicar cada noche con cepillo de pestañas o bastoncillo de algodón.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-antimanchas-m.webp',
    name: 'Sérum Antimanchas',
    description: 'Sérum unificador del tono que combate manchas con potentes antioxidantes y acción antiséptica. Apto para todo tipo de piel.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'antimanchas', 'unificador', 'antioxidante', 'todo tipo de piel'],
    ingredients: ['Aceite de limón', 'Aceite de aguacate', 'Aceite de albahaca', 'Vitamina E'],
    usage: 'Aplicar solo por la noche sobre piel limpia. Fotosensible.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-antiarrugas-m.webp',
    name: 'Sérum Antiarrugas',
    description: 'Sérum concentrado que promueve la producción de colágeno, combate los signos del envejecimiento y controla el acné.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'antiarrugas', 'colágeno', 'antienvejecimiento', 'antiacné'],
    ingredients: ['Aceite de salvia', 'Aceite de albahaca', 'Aceite de moringa', 'Vitamina E'],
    usage: 'Aplicar por la noche sobre piel limpia. Fotosensible.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-antiacne-m.webp',
    name: 'Sérum Antiacné',
    description: 'Sérum terapéutico con propiedades cicatrizantes y calmantes. Trata el acné activo y previene nuevos brotes.',
    price: 6.00,
    category_id: 'serums-faciales',
    tags: ['sérum', 'antiacné', 'cicatrizante', 'calmante', 'tratamiento'],
    ingredients: ['Aceite de salvia', 'Aceite de verbena', 'Aceite de aloe vera', 'Vitamina E'],
    usage: 'Aplicar por la noche sobre piel limpia. Fotosensible.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },

  // ── CUIDADO CAPILAR ──
  {
    imageFile: 'champu-aloe-vera-m.webp',
    name: 'Champú de Aloe Vera',
    description: 'Champú natural con aloe vera que repara puntas abiertas, fortalece la fibra capilar y controla el frizz. Apto para todo tipo de cabello.',
    price: 12.00,
    category_id: 'cuidado-capilar',
    tags: ['champú', 'aloe vera', 'reparador', 'antifrizz', 'fortalecedor'],
    ingredients: ['Aloe vera', 'Tensioactivos naturales'],
    usage: 'Aplicar sobre el cabello mojado, masajear y enjuagar.',
    weight: 250, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'acondicionador-aloe-vera-m.webp',
    name: 'Acondicionador de Aloe Vera',
    description: 'Acondicionador reparador con aloe vera que hidrata, mejora la manejabilidad y deja el cabello suave y brillante.',
    price: 12.00,
    category_id: 'cuidado-capilar',
    tags: ['acondicionador', 'aloe vera', 'hidratante', 'reparador', 'brillo'],
    ingredients: ['Aloe vera', 'Aceites naturales'],
    usage: 'Aplicar después del champú, dejar 2-3 minutos y enjuagar. Mejor con champú de aloe vera.',
    weight: 250, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'serum-capilar-fortalecedor-m.webp',
    name: 'Sérum Capilar Fortalecedor',
    description: 'Sérum concentrado que previene la caída del cabello, acelera el crecimiento y nutre desde la raíz hasta las puntas.',
    price: 5.50,
    category_id: 'cuidado-capilar',
    tags: ['sérum capilar', 'fortalecedor', 'anticaída', 'crecimiento', 'nutritivo'],
    ingredients: ['Aceite de aguacate', 'Aceite de ricino', 'Aceite de romero', 'Aceite de jengibre', 'Vitamina E'],
    usage: 'Aplicar como mascarilla semanal de raíz a puntas, o cada 3 días después del lavado.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-anticaspa-m.webp',
    name: 'Sérum Anticaspa',
    description: 'Sérum capilar que elimina hongos del cuero cabelludo, hidrata y equilibra el pH. Su uso continuo promueve el crecimiento natural.',
    price: 5.50,
    category_id: 'cuidado-capilar',
    tags: ['sérum capilar', 'anticaspa', 'antifúngico', 'pH', 'crecimiento'],
    ingredients: ['Aceite de coco', 'Aceite de limón', 'Aceite de romero', 'Vitamina E'],
    usage: 'Aplicar diariamente sobre el cuero cabelludo y masajear.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'serum-reparador-puntas-m.webp',
    name: 'Sérum Reparador de Puntas',
    description: 'Sérum capilar que sella y repara puntas abiertas, controla el frizz y mejora la calidad general del cabello.',
    price: 5.50,
    category_id: 'cuidado-capilar',
    tags: ['sérum capilar', 'puntas', 'reparador', 'antifrizz', 'calidad capilar'],
    ingredients: ['Aceite de aguacate', 'Aceite de aloe vera', 'Aceite de moringa', 'Vitamina E'],
    usage: 'Aplicar a diario sobre cabello seco o húmedo, de medios a puntas.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },

  // ── CREMAS FACIALES Y CORPORALES ──
  {
    imageFile: 'crema-protectora-solar-m.webp',
    name: 'Crema Protectora Solar',
    description: 'Protector solar natural con aloe vera, cera de abeja y óxido de zinc. Hidrata mientras protege de los rayos UV y estimula el colágeno.',
    price: 10.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'protector solar', 'UV', 'hidratante', 'natural'],
    ingredients: ['Aloe vera', 'Cera de abeja', 'Manteca de mango', 'Óxido de zinc'],
    usage: 'Aplicar 15-30 min antes del sol sobre piel limpia. Reaplicar cada 2 horas. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'crema-antiestrias-rosa-mosqueta-m.webp',
    name: 'Crema Antiestrías de Rosa Mosqueta',
    description: 'Crema con manteca de karité y aceite esencial de rosa mosqueta que unifica la piel, cicatriza y previene nuevas estrías. Recomendada desde el inicio del embarazo.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'antiestrías', 'rosa mosqueta', 'embarazo', 'cicatrizante'],
    ingredients: ['Manteca de karité', 'Aceite esencial de rosa mosqueta'],
    usage: 'Masajear diariamente con movimientos circulares. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'crema-antiacne-calendula-m.webp',
    name: 'Crema Antiacné de Caléndula',
    description: 'Crema humectante con caléndula, naranja y colágeno. Cicatrizante y antibacteriana, ideal para pieles secas y sensibles.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'antiacné', 'caléndula', 'colágeno', 'piel seca'],
    ingredients: ['Manteca de karité', 'Caléndula', 'Aceite esencial de naranja', 'Colágeno'],
    usage: 'Aplicar con suavidad sobre las zonas afectadas. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'crema-azufrada-m.webp',
    name: 'Crema Azufrada',
    description: 'Crema queratolítica con azufre que regula el sebo, matifica y purifica la piel. Ideal para pieles grasas, mixtas y acneicas.',
    price: 10.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'azufre', 'matificante', 'piel grasa', 'purificante'],
    ingredients: ['Azufre', 'Base cremosa natural'],
    usage: 'Aplicar sobre las zonas grasas o con acné. Uso diario.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'crema-hidratante-coco-avena-m.webp',
    name: 'Crema Súper Hidratante de Coco y Avena',
    description: 'Crema ultranutritiva con coco y avena que hidrata pieles secas y agrietadas. Antiinflamatoria y estimulante del colágeno.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'hidratante', 'coco', 'avena', 'piel seca', 'colágeno'],
    ingredients: ['Aceite de coco', 'Avena', 'Manteca de karité'],
    usage: 'Masajear suavemente sobre la piel limpia. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'crema-antienvejecimiento-m.webp',
    name: 'Crema Antienvejecimiento con Ácido Hialurónico',
    description: 'Crema con manteca de karité y ácido hialurónico que hidrata profundamente, reduce arrugas y mejora la elasticidad de la piel.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'antienvejecimiento', 'ácido hialurónico', 'antiarrugas', 'elasticidad'],
    ingredients: ['Manteca de karité', 'Ácido hialurónico'],
    usage: 'Masajear sobre la piel limpia con movimientos ascendentes. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'crema-chia-m.webp',
    name: 'Crema de Chía',
    description: 'Crema rejuvenecedora con chía que estimula el colágeno y calma pieles sensibles, secas e irritadas.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'chía', 'rejuvenecedora', 'colágeno', 'piel sensible'],
    ingredients: ['Chía', 'Manteca de karité'],
    usage: 'Masajear suavemente sobre la piel limpia. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'crema-linaza-m.webp',
    name: 'Crema de Linaza',
    description: 'Crema rica en Omega-3 y ácido linoleico con propiedades antioxidantes y cicatrizantes. Hidratación profunda con acción reparadora.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'linaza', 'omega-3', 'antioxidante', 'cicatrizante'],
    ingredients: ['Linaza', 'Ácido linoleico', 'Manteca de karité'],
    usage: 'Masajear sobre la piel limpia. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'crema-nocturna-pepino-hialuronico-m.webp',
    name: 'Crema Nocturna de Pepino y Ácido Hialurónico',
    description: 'Crema nocturna aclarante con pepino y ácido hialurónico. Repara células, regula el sebo y refresca el contorno de ojos.',
    price: 8.00,
    category_id: 'cremas-faciales-corporales',
    tags: ['crema', 'nocturna', 'pepino', 'ácido hialurónico', 'aclarante', 'contorno ojos'],
    ingredients: ['Pepino', 'Ácido hialurónico', 'Vitamina C'],
    usage: 'Aplicar solo por la noche sobre piel limpia. Conservar refrigerada.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },

  // ── ESENCIALES SOPHÍA ──
  {
    imageFile: 'balsamo-labial-coco-m.webp',
    name: 'Bálsamo Labial de Coco',
    description: 'Bálsamo labial hidratante con cera de abeja, manteca de cacao y aceite de coco. Protege contra UV y deja un brillo natural.',
    price: 4.50,
    category_id: 'esenciales',
    tags: ['bálsamo', 'labial', 'coco', 'hidratante', 'UV', 'brillo'],
    ingredients: ['Cera de abeja', 'Manteca de cacao', 'Miel', 'Aceite de coco', 'Vitamina E'],
    usage: 'Aplicar sobre labios limpios cuantas veces sea necesario.',
    weight: 5, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'balsamo-labial-chocolate-m.webp',
    name: 'Bálsamo Labial de Chocolate',
    description: 'Bálsamo labial con manteca de cacao y cacao en polvo que mejora la elasticidad, protege de los UV y deja un brillo natural con aroma a chocolate.',
    price: 4.50,
    category_id: 'esenciales',
    tags: ['bálsamo', 'labial', 'chocolate', 'elasticidad', 'UV', 'brillo'],
    ingredients: ['Cera de abeja', 'Manteca de cacao', 'Aceite de almendras', 'Cacao en polvo', 'Vitamina E'],
    usage: 'Aplicar sobre labios limpios cuantas veces sea necesario.',
    weight: 5, weight_unit: 'g',
    out_of_stock: true,
  },
  {
    imageFile: 'cera-aloe-vera-m.webp',
    name: 'Cera de Aloe Vera',
    description: 'Crema sólida de aloe vera y coco que se derrite con el calor corporal. Cicatrizante y regeneradora, ideal para pies secos, codos y piel dañada.',
    price: 4.00,
    category_id: 'esenciales',
    tags: ['cera', 'aloe vera', 'cicatrizante', 'regeneradora', 'pies', 'codos'],
    ingredients: ['Aloe vera', 'Aceite de coco'],
    usage: 'Aplicar directamente sobre la piel seca. Se derrite sola, no necesita agua.',
    weight: 50, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'endurecedor-unas-m.webp',
    name: 'Endurecedor de Uñas',
    description: 'Tratamiento natural que fortalece las uñas, promueve su crecimiento y actúa como antifúngico. También funciona como aceite de cutículas.',
    price: 4.75,
    category_id: 'esenciales',
    tags: ['uñas', 'endurecedor', 'fortalecedor', 'antifúngico', 'cutículas'],
    ingredients: ['Aceite de romero', 'Aceite de coco', 'Ajo'],
    usage: 'Aplicar 2 veces al día durante 4 semanas sobre uñas limpias, del borde a la cutícula.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'exfoliante-corporal-cafe-m.webp',
    name: 'Exfoliante Corporal de Café',
    description: 'Exfoliante corporal con granos de café molido que estimula el colágeno, combate la celulitis y cicatriza. Ideal para abdomen, glúteos y caderas.',
    price: 6.50,
    category_id: 'esenciales',
    tags: ['exfoliante', 'café', 'corporal', 'anticelulitis', 'colágeno'],
    ingredients: ['Granos de café molido', 'Aceite de café'],
    usage: 'Usar 2-3 veces por semana sobre piel húmeda con movimientos circulares. Hidratar después.',
    weight: 120, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'tonico-romero-pepino-m.webp',
    name: 'Tónico de Romero y Pepino',
    description: 'Tónico hidratante con romero y pepino que cierra poros, reduce manchas oscuras y estimula la producción de colágeno.',
    price: 4.00,
    category_id: 'esenciales',
    tags: ['tónico', 'romero', 'pepino', 'poros', 'colágeno', 'antimanchas'],
    ingredients: ['Romero', 'Pepino', 'Antioxidantes naturales'],
    usage: 'Aplicar después de la limpieza facial con algodón. Conservar refrigerado.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: true,
  },
  {
    imageFile: 'contorno-ojos-m.webp',
    name: 'Contorno de Ojos',
    description: 'Tratamiento intensivo con retinol y vitamina C para el contorno de ojos. Reduce arrugas, ojeras y bolsas estimulando colágeno y elastina.',
    price: 10.00,
    category_id: 'esenciales',
    tags: ['contorno de ojos', 'retinol', 'vitamina C', 'antiarrugas', 'antiojeras'],
    ingredients: ['Retinol', 'Vitamina C'],
    usage: 'Aplicar con el dedo anular dando toquecitos suaves. Conservar refrigerado.',
    weight: 60, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'desmaquillante-aceite-m.webp',
    name: 'Desmaquillante en Aceite',
    description: 'Desmaquillante natural en aceite que elimina el maquillaje sin agredir la piel. Antioxidante, regenerador y no comedogénico.',
    price: 6.00,
    category_id: 'esenciales',
    tags: ['desmaquillante', 'aceite', 'antioxidante', 'regenerador', 'no comedogénico'],
    ingredients: ['Aceite esencial de coco', 'Aceite de almendras', 'Aceite de moringa', 'Glicerina vegetal'],
    usage: 'Aplicar con disco de algodón con movimientos circulares suaves.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'mantequilla-corporal-coco-m.webp',
    name: 'Mantequilla Corporal de Coco',
    description: 'Mantequilla corporal con cera de abeja, manteca de cacao y aceite de coco. Hidrata, regenera y previene estrías. Ideal post-depilación.',
    price: 6.50,
    category_id: 'esenciales',
    tags: ['mantequilla corporal', 'coco', 'hidratante', 'antiestrías', 'post-depilación'],
    ingredients: ['Cera de abeja', 'Manteca de cacao', 'Aceite de coco'],
    usage: 'Masajear después del baño con movimientos circulares.',
    weight: 120, weight_unit: 'g',
    out_of_stock: false,
  },
  {
    imageFile: 'agua-micelar-m.webp',
    name: 'Agua Micelar',
    description: 'Agua micelar enriquecida con aloe vera que limpia, tonifica y nutre la piel respetando su pH natural.',
    price: 4.00,
    category_id: 'esenciales',
    tags: ['agua micelar', 'aloe vera', 'limpieza', 'tónico', 'pH'],
    ingredients: ['Aloe vera', 'Agua purificada'],
    usage: 'Aplicar con disco de algodón con movimientos circulares ascendentes.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
  {
    imageFile: 'locion-antihongos-m.webp',
    name: 'Loción Antihongos',
    description: 'Loción natural antifúngica para el tratamiento de hongos en los pies. Acción antimicrobiana y reparadora.',
    price: 5.00,
    category_id: 'esenciales',
    tags: ['loción', 'antihongos', 'antifúngico', 'pies', 'antimicrobiano'],
    ingredients: ['Extractos naturales antifúngicos'],
    usage: 'Aplicar sobre la zona afectada 2 veces al día hasta mejoría.',
    weight: 30, weight_unit: 'ml',
    out_of_stock: false,
  },
];

// ============================================================
// UPLOAD IMAGES TO CLOUDINARY
// ============================================================

async function uploadImage(filePath, productName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products',
      resource_type: 'image',
    });
    console.log(`  ✓ ${productName} → ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  ✗ FAILED: ${productName} — ${err.message}`);
    return null;
  }
}

// ============================================================
// MAIN MIGRATION
// ============================================================

async function migrate() {
  console.log('=== MIGRACIÓN EL YERRO → SOPHIA ECOMMERCE ===\n');

  // Step 1: Create categories
  console.log('1. Creando categorías...');
  for (const cat of CATEGORIES) {
    const existing = await firestoreGet('categories', cat.id);
    if (existing) {
      console.log(`  → Categoría "${cat.name}" ya existe, saltando.`);
    } else {
      await firestoreSet('categories', cat.id, {
        name: cat.name,
        description: cat.description,
        image: '',
        sort_order: cat.sort_order,
        active: true,
        product_count: 0,
      });
      console.log(`  ✓ Categoría "${cat.name}" creada.`);
    }
  }

  // Step 2: Upload images & create products
  console.log('\n2. Subiendo imágenes y creando productos...');
  let success = 0;
  let failed = 0;

  for (const product of PRODUCTS) {
    const imgPath = join(IMAGES_DIR, product.imageFile);
    console.log(`\n  → ${product.name}`);

    // Upload image
    const imageUrl = await uploadImage(imgPath, product.name);
    if (!imageUrl) {
      failed++;
      continue;
    }

    // Create product document
    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      image: imageUrl,
      rating: 0,
      reviews_count: 0,
      tags: product.tags,
      ingredients: product.ingredients,
      active: false,
      featured: false,
      created_date: new Date().toISOString(),
      usage: product.usage,
      weight: product.weight,
      weight_unit: product.weight_unit,
      out_of_stock: product.out_of_stock || false,
    };

    try {
      await firestoreAdd('products', productData);
      console.log(`  ✓ Producto creado en Firestore`);
      success++;
    } catch (err) {
      console.error(`  ✗ Error Firestore: ${err.message}`);
      failed++;
    }
  }

  // Step 3: Update category product counts
  console.log('\n3. Actualizando conteo de productos por categoría...');
  for (const cat of CATEGORIES) {
    const results = await firestoreQuery('products', 'category_id', 'EQUAL', cat.id);
    await firestorePatch('categories', cat.id, { product_count: results.length });
    console.log(`  ✓ ${cat.name}: ${results.length} productos`);
  }

  console.log(`\n=== MIGRACIÓN COMPLETA ===`);
  console.log(`  ✓ Exitosos: ${success}`);
  console.log(`  ✗ Fallidos: ${failed}`);
  console.log(`  Total: ${PRODUCTS.length}`);
}

migrate().catch(console.error);
