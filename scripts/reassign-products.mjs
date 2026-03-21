/**
 * Reassign products from El Yerro categories to new web categories,
 * then delete the Yerro categories.
 *
 * Usage: node scripts/reassign-products.mjs
 */

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ── NEW WEB CATEGORIES ──
const CAT = {
  LIMPIEZA:       'makeup',                // Limpieza Facial y Corporal
  PREPARACION:    'skincare',              // Preparación y Tonificación
  CONCENTRADOS:   'haircare',              // Concentrados de Tratamiento
  HIDRATACION:    'bodycare',              // Hidratación y Protección
  BOTANICA:       'H1nFZNSRsuQTkOsLtO4h', // Botánica Líquida Pura
  ATMOSFERA:      'PhhLz9ZShFv7HMVx1WtQ', // Atmósfera y Bienestar
  ACCESORIOS:     'gbzRrZocSFdEuzzUHu4l', // Accesorios y Estilo de Vida
};

// ── MAPPING: Yerro category → new category ──
// Most categories map 1:1, "esenciales" products are mapped individually
const CATEGORY_MAPPING = {
  'jabones-artesanales':       CAT.LIMPIEZA,      // Jabones → Limpieza Facial y Corporal
  'aceites-naturales':         CAT.BOTANICA,       // Aceites → Botánica Líquida Pura
  'mascarillas-faciales':      CAT.PREPARACION,    // Mascarillas → Preparación y Tonificación
  'serums-faciales':           CAT.CONCENTRADOS,   // Sérums → Concentrados de Tratamiento
  'cuidado-capilar':           CAT.CONCENTRADOS,   // Cuidado Capilar → Concentrados de Tratamiento
  'cremas-faciales-corporales': CAT.HIDRATACION,   // Cremas → Hidratación y Protección
};

// Special per-product mapping for "esenciales" (mixed types)
const ESENCIALES_MAPPING = {
  'Tónico de Romero y Pepino':      CAT.PREPARACION,  // Tónico → Preparación
  'Agua Micelar':                   CAT.LIMPIEZA,      // Limpieza
  'Desmaquillante en Aceite':       CAT.LIMPIEZA,      // Limpieza
  'Contorno de Ojos':               CAT.CONCENTRADOS,  // Tratamiento concentrado
  'Mantequilla Corporal de Coco':   CAT.HIDRATACION,   // Hidratación
  'Bálsamo Labial de Chocolate':    CAT.HIDRATACION,   // Hidratación
  'Bálsamo Labial de Coco':         CAT.HIDRATACION,   // Hidratación
  'Loción Antihongos':              CAT.HIDRATACION,   // Protección
  'Cera de Aloe Vera':              CAT.HIDRATACION,   // Hidratación
  'Exfoliante Corporal de Café':    CAT.PREPARACION,   // Preparación/exfoliación
  'Endurecedor de Uñas':            CAT.ACCESORIOS,    // Accesorios
};

const YERRO_CATEGORY_IDS = [
  'jabones-artesanales',
  'aceites-naturales',
  'mascarillas-faciales',
  'serums-faciales',
  'cuidado-capilar',
  'cremas-faciales-corporales',
  'esenciales',
];

// ── FIRESTORE HELPERS ──

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  return { stringValue: String(value) };
}

function fromFirestoreValue(val) {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

function docToObject(doc) {
  const id = doc.name.split('/').pop();
  const obj = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

async function firestoreList(collection) {
  const results = [];
  let pageToken = null;
  while (true) {
    let url = `${FIRESTORE_BASE}/${collection}?key=${FIREBASE_API_KEY}&pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LIST ${collection}: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (data.documents) results.push(...data.documents.map(docToObject));
    if (data.nextPageToken) pageToken = data.nextPageToken;
    else break;
  }
  return results;
}

async function firestorePatch(collection, docId, fields) {
  const firestoreFields = {};
  for (const [k, v] of Object.entries(fields)) {
    firestoreFields[k] = toFirestoreValue(v);
  }
  const updateMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?${updateMask}&key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) throw new Error(`PATCH ${collection}/${docId}: ${res.status} ${await res.text()}`);
}

async function firestoreDelete(collection, docId) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${collection}/${docId}: ${res.status} ${await res.text()}`);
}

// ── MAIN ──

async function main() {
  console.log('=== REASIGNACIÓN DE PRODUCTOS DEL YERRO ===\n');

  const [categories, products] = await Promise.all([
    firestoreList('categories'),
    firestoreList('products'),
  ]);

  // Verify all target categories exist
  const catIds = new Set(categories.map(c => c.id));
  for (const targetId of Object.values(CAT)) {
    if (!catIds.has(targetId)) {
      console.error(`❌ Categoría destino "${targetId}" no existe en Firestore!`);
      process.exit(1);
    }
  }
  console.log('✓ Todas las categorías destino existen\n');

  // Find products to reassign
  const yerroProducts = products.filter(p =>
    YERRO_CATEGORY_IDS.includes(p.category_id)
  );

  console.log(`Productos a reasignar: ${yerroProducts.length}\n`);

  // Track counts for updating product_count
  const countDelta = {}; // categoryId → delta

  // Reassign each product
  let reassigned = 0;
  let errors = 0;

  for (const product of yerroProducts) {
    let newCategoryId;

    if (product.category_id === 'esenciales') {
      // Per-product mapping for esenciales
      newCategoryId = ESENCIALES_MAPPING[product.name];
      if (!newCategoryId) {
        console.error(`  ⚠️  No mapping for esencial: "${product.name}" — skipping`);
        errors++;
        continue;
      }
    } else {
      newCategoryId = CATEGORY_MAPPING[product.category_id];
      if (!newCategoryId) {
        console.error(`  ⚠️  No mapping for category: "${product.category_id}" — skipping`);
        errors++;
        continue;
      }
    }

    try {
      await firestorePatch('products', product.id, { category_id: newCategoryId });
      const targetCat = categories.find(c => c.id === newCategoryId);
      console.log(`  ✓ ${product.name} → ${targetCat?.name || newCategoryId}`);
      countDelta[newCategoryId] = (countDelta[newCategoryId] || 0) + 1;
      reassigned++;
    } catch (err) {
      console.error(`  ✗ Error: ${product.name} — ${err.message}`);
      errors++;
    }
  }

  console.log(`\nReasignados: ${reassigned} | Errores: ${errors}\n`);

  // Delete Yerro categories
  console.log('Eliminando categorías del Yerro...');
  for (const catId of YERRO_CATEGORY_IDS) {
    if (!catIds.has(catId)) {
      console.log(`  → ${catId} ya no existe, saltando`);
      continue;
    }
    try {
      await firestoreDelete('categories', catId);
      console.log(`  ✓ Eliminada: ${catId}`);
    } catch (err) {
      console.error(`  ✗ Error eliminando ${catId}: ${err.message}`);
    }
  }

  // Update product_count on target categories
  console.log('\nActualizando conteo de productos...');
  // Recount from scratch for accuracy
  const allProducts = await firestoreList('products');
  const updatedCategories = await firestoreList('categories');

  for (const cat of updatedCategories) {
    const count = allProducts.filter(p => p.category_id === cat.id).length;
    await firestorePatch('categories', cat.id, { product_count: count });
    console.log(`  ✓ ${cat.name}: ${count} productos`);
  }

  console.log('\n=== REASIGNACIÓN COMPLETA ===');
}

main().catch(console.error);
