/**
 * Migración: Reestructuración del catálogo Sophia
 *
 * 1. Elimina todas las categorías actuales
 * 2. Crea nueva jerarquía padre/subcategoría
 * 3. Reasigna los 76 productos a subcategorías según nombre
 * 4. Mapea tags existentes a beneficios
 * 5. Actualiza product_count
 *
 * Usage: node scripts/migrate-catalog-restructure.mjs
 */

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ── FIRESTORE HELPERS (reutilizados de reassign-products.mjs) ──

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

async function firestoreCreate(collection, docId, fields) {
  const firestoreFields = {};
  for (const [k, v] of Object.entries(fields)) {
    firestoreFields[k] = toFirestoreValue(v);
  }
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) throw new Error(`CREATE ${collection}/${docId}: ${res.status} ${await res.text()}`);
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

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── CATEGORY TREE ──

const CATEGORY_TREE = [
  { name: 'LIMPIEZA', sort_order: 1, children: ['Jabones', 'Agua micelar', 'Desmaquillante'] },
  { name: 'EXFOLIACIÓN', sort_order: 2, children: ['Exfoliantes corporales', 'Mascarillas exfoliantes'] },
  { name: 'TONIFICACIÓN', sort_order: 3, children: ['Tónicos faciales'] },
  { name: 'HIDRATACIÓN', sort_order: 4, children: ['Cremas', 'Bálsamos', 'Cremas Sólidas'] },
  { name: 'TRATAMIENTOS', sort_order: 5, children: ['Sérums faciales', 'Tratamiento de uñas', 'Contorno de Ojos', 'Mascarillas'] },
  { name: 'ACEITES NATURALES', sort_order: 6, children: ['Aceite multipropósito', 'Aceite para masaje'] },
  { name: 'CUIDADO CAPILAR', sort_order: 7, children: ['Champú', 'Acondicionador', 'Sérum Capilar', 'Mascarilla Capilar', 'Tratamiento Capilar'] },
  { name: 'BIENESTAR', sort_order: 8, children: ['Velas aromáticas', 'Inciensos'] },
];

// ── PRODUCT → SUBCATEGORY MAPPING ──
// Maps product name patterns to subcategory slugs

function getSubcategoryForProduct(product) {
  const name = product.name.toLowerCase();

  // LIMPIEZA
  if (name.includes('jabón') || name.includes('jabon')) return 'jabones';
  if (name.includes('agua micelar')) return 'agua-micelar';
  if (name.includes('desmaquillante')) return 'desmaquillante';
  if (name.includes('jabón íntimo') || name.includes('intimo')) return 'jabones';

  // EXFOLIACION
  if (name.includes('exfoliante')) return 'exfoliantes-corporales';
  if (name.includes('mascarilla') && name.includes('exfoli')) return 'mascarillas-exfoliantes';

  // TONIFICACION
  if (name.includes('tónico') || name.includes('tonico')) return 'tonicos-faciales';

  // HIDRATACION
  if (name.includes('crema') && !name.includes('sólida') && !name.includes('solida')) return 'cremas';
  if (name.includes('crema sólida') || name.includes('crema solida')) return 'cremas-solidas';
  if (name.includes('bálsamo') || name.includes('balsamo')) return 'balsamos';
  if (name.includes('mantequilla')) return 'cremas'; // mantequilla corporal → cremas
  if (name.includes('loción') || name.includes('locion')) return 'cremas';
  if (name.includes('cera de')) return 'cremas';

  // TRATAMIENTOS
  if (name.includes('sérum') || name.includes('serum')) {
    // Capilares van a CUIDADO CAPILAR
    if (name.includes('capilar') || name.includes('puntas') || name.includes('anticaspa') || name.includes('fortalecedor')) {
      return 'serum-capilar';
    }
    if (name.includes('pestañas') || name.includes('cejas')) return 'serums-faciales';
    if (name.includes('labial')) return 'serums-faciales';
    return 'serums-faciales';
  }
  if (name.includes('contorno de ojos')) return 'contorno-de-ojos';
  if (name.includes('endurecedor de uñas') || name.includes('endurecedor de unas')) return 'tratamiento-de-unas';
  if (name.includes('mascarilla')) return 'mascarillas';

  // ACEITES NATURALES
  if (name.includes('aceite')) return 'aceite-multiproposito';

  // CUIDADO CAPILAR
  if (name.includes('champú') || name.includes('champu') || name.includes('shampoo')) return 'champu';
  if (name.includes('acondicionador')) return 'acondicionador';

  // Fallback — try current category
  return null;
}

// Tags → Beneficios mapping
const BENEFICIO_MAP = {
  'hidratante': 'Hidratante',
  'humectante': 'Hidratante',
  'purificante': 'Purificante',
  'limpieza': 'Purificante',
  'exfoliante': 'Exfoliante',
  'calmante': 'Calmante',
  'suavizante': 'Calmante',
  'nutritivo': 'Nutritivo',
  'nutrición': 'Nutritivo',
  'reparador': 'Reparador',
  'regenerador': 'Reparador',
  'antienvejecimiento': 'Reparador',
  'antiarrugas': 'Reparador',
  'antiacné': 'Purificante',
  'antimanchas': 'Reparador',
};

// ── MAIN ──

async function main() {
  console.log('=== MIGRACIÓN: REESTRUCTURACIÓN DEL CATÁLOGO ===\n');

  // Step 0: Fetch current data
  const [oldCategories, products] = await Promise.all([
    firestoreList('categories'),
    firestoreList('products'),
  ]);

  console.log(`Categorías actuales: ${oldCategories.length}`);
  console.log(`Productos actuales: ${products.length}\n`);

  // Step 1: Delete all old categories
  console.log('─── PASO 1: Eliminando categorías antiguas ───');
  for (const cat of oldCategories) {
    await firestoreDelete('categories', cat.id);
    console.log(`  ✗ Eliminada: ${cat.name} [${cat.id}]`);
  }
  console.log('');

  // Step 2: Create new parent + subcategory hierarchy
  console.log('─── PASO 2: Creando nueva jerarquía ───');
  const subcategoryMap = {}; // slug → { id, name, parent_slug }

  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.name);

    await firestoreCreate('categories', parentSlug, {
      name: parent.name,
      description: '',
      image: '',
      sort_order: parent.sort_order,
      active: true,
      product_count: 0,
      parent_id: '',
    });
    console.log(`  📁 ${parent.name} [${parentSlug}]`);

    for (let i = 0; i < parent.children.length; i++) {
      const childName = parent.children[i];
      const childSlug = slugify(childName);

      await firestoreCreate('categories', childSlug, {
        name: childName,
        description: '',
        image: '',
        sort_order: i + 1,
        active: true,
        product_count: 0,
        parent_id: parentSlug,
      });
      subcategoryMap[childSlug] = { id: childSlug, name: childName, parent_slug: parentSlug };
      console.log(`    ↳ ${childName} [${childSlug}]`);
    }
  }
  console.log('');

  // Step 3: Reassign products to subcategories
  console.log('─── PASO 3: Reasignando productos ───');
  let assigned = 0;
  let skipped = 0;

  for (const product of products) {
    const subcategorySlug = getSubcategoryForProduct(product);

    if (!subcategorySlug) {
      console.log(`  ⚠️  Sin mapeo: "${product.name}" — desactivando`);
      await firestorePatch('products', product.id, { active: false });
      skipped++;
      continue;
    }

    if (!subcategoryMap[subcategorySlug]) {
      console.log(`  ⚠️  Subcategoría "${subcategorySlug}" no existe para "${product.name}" — desactivando`);
      await firestorePatch('products', product.id, { active: false });
      skipped++;
      continue;
    }

    // Map tags to beneficios
    const tags = product.tags || [];
    const beneficios = [...new Set(
      tags.map(t => {
        const lower = t.toLowerCase().trim();
        return BENEFICIO_MAP[lower] || null;
      }).filter(Boolean)
    )];

    // Also infer beneficios from product name
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('hidrat') && !beneficios.includes('Hidratante')) beneficios.push('Hidratante');
    if (nameLower.includes('exfoliant') && !beneficios.includes('Exfoliante')) beneficios.push('Exfoliante');
    if (nameLower.includes('reparad') && !beneficios.includes('Reparador')) beneficios.push('Reparador');
    if (nameLower.includes('antiacn') && !beneficios.includes('Purificante')) beneficios.push('Purificante');

    const updates = {
      category_id: subcategorySlug,
      beneficios,
      zona_uso: [],
      tipo_piel: [],
      tipo_cabello: [],
    };

    await firestorePatch('products', product.id, updates);
    const sub = subcategoryMap[subcategorySlug];
    console.log(`  ✓ ${product.name} → ${sub.name} (${sub.parent_slug})${beneficios.length ? ` [${beneficios.join(', ')}]` : ''}`);
    assigned++;
  }

  console.log(`\nAsignados: ${assigned} | Omitidos: ${skipped}\n`);

  // Step 4: Update product_count
  console.log('─── PASO 4: Actualizando conteos ───');
  const allProducts = await firestoreList('products');
  const allCategories = await firestoreList('categories');

  for (const cat of allCategories) {
    const count = allProducts.filter(p => p.category_id === cat.id && p.active !== false).length;
    await firestorePatch('categories', cat.id, { product_count: count });
    if (count > 0 || !cat.parent_id) {
      console.log(`  ✓ ${cat.name}: ${count} productos`);
    }
  }

  console.log('\n=== MIGRACIÓN COMPLETA ===');
}

main().catch(console.error);
