/**
 * Diagnostic script: List all categories and products from Firestore
 * Shows which categories are from El Yerro vs the new web
 *
 * Usage: node scripts/diagnose-categories.mjs
 */

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const YERRO_CATEGORY_IDS = [
  'jabones-artesanales',
  'aceites-naturales',
  'mascarillas-faciales',
  'serums-faciales',
  'cuidado-capilar',
  'cremas-faciales-corporales',
  'esenciales',
];

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

    if (data.documents) {
      results.push(...data.documents.map(docToObject));
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return results;
}

async function main() {
  console.log('=== DIAGNÓSTICO DE CATEGORÍAS Y PRODUCTOS ===\n');

  // Fetch all categories and products
  const [categories, products] = await Promise.all([
    firestoreList('categories'),
    firestoreList('products'),
  ]);

  // Separate categories
  const yerroCats = categories.filter(c => YERRO_CATEGORY_IDS.includes(c.id));
  const webCats = categories.filter(c => !YERRO_CATEGORY_IDS.includes(c.id));

  // Group products by category_id
  const productsByCategory = {};
  for (const p of products) {
    const catId = p.category_id || 'SIN_CATEGORIA';
    if (!productsByCategory[catId]) productsByCategory[catId] = [];
    productsByCategory[catId].push(p);
  }

  // Print web categories (to keep)
  console.log('━━━ CATEGORÍAS DE LA WEB NUEVA (conservar) ━━━');
  if (webCats.length === 0) {
    console.log('  (ninguna encontrada)');
  }
  for (const cat of webCats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
    const prods = productsByCategory[cat.id] || [];
    console.log(`  📁 [${cat.id}] ${cat.name} — ${prods.length} productos (active: ${cat.active})`);
    if (cat.parent_id) console.log(`     └─ subcategoría de: ${cat.parent_id}`);
  }

  // Print yerro categories (to delete)
  console.log('\n━━━ CATEGORÍAS DEL YERRO (eliminar) ━━━');
  for (const cat of yerroCats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))) {
    const prods = productsByCategory[cat.id] || [];
    console.log(`  🔴 [${cat.id}] ${cat.name} — ${prods.length} productos`);
    for (const p of prods) {
      const status = [];
      if (p.active) status.push('activo');
      if (p.out_of_stock) status.push('agotado');
      if (p.featured) status.push('destacado');
      console.log(`     • ${p.name} — $${p.price} ${status.length ? `(${status.join(', ')})` : ''}`);
    }
  }

  // Check for orphan products
  const orphans = products.filter(p => !categories.find(c => c.id === p.category_id));
  if (orphans.length > 0) {
    console.log('\n━━━ PRODUCTOS HUÉRFANOS (sin categoría válida) ━━━');
    for (const p of orphans) {
      console.log(`  ⚠️  ${p.name} — category_id: "${p.category_id}"`);
    }
  }

  // Summary
  console.log('\n━━━ RESUMEN ━━━');
  console.log(`  Total categorías: ${categories.length} (${webCats.length} web + ${yerroCats.length} yerro)`);
  console.log(`  Total productos: ${products.length}`);
  const yerroProductCount = yerroCats.reduce((sum, cat) => sum + (productsByCategory[cat.id] || []).length, 0);
  console.log(`  Productos del yerro a reasignar: ${yerroProductCount}`);
}

main().catch(console.error);
