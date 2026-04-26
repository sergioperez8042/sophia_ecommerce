/**
 * Sincroniza el catálogo Firestore con la TABLA GENERAL ACTUALIZADA oficial.
 *
 * 1. Renombra subcategorías para coincidir exactamente con la tabla
 * 2. Reasigna cada producto a su subcategoría correcta según su nombre
 * 3. Crea categoría ACCESORIOS si no existe
 * 4. Actualiza product_count
 *
 * Usage: node scripts/sync-catalog-to-official-table.mjs
 */

const KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const BASE = `https://firestore.googleapis.com/v1/projects/liquid-fulcrum-464516-e6/databases/(default)/documents`;

function toFV(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  return { stringValue: String(v) };
}

async function list(col) {
  const r = []; let pt = null;
  while (true) {
    let u = `${BASE}/${col}?key=${KEY}&pageSize=300`;
    if (pt) u += '&pageToken=' + pt;
    const res = await fetch(u); const d = await res.json();
    if (d.documents) r.push(...d.documents);
    if (d.nextPageToken) pt = d.nextPageToken; else break;
  }
  return r;
}

async function patch(col, id, fields) {
  const ff = {};
  for (const [k, v] of Object.entries(fields)) ff[k] = toFV(v);
  const mask = Object.keys(fields).map(f => 'updateMask.fieldPaths=' + f).join('&');
  const res = await fetch(`${BASE}/${col}/${id}?${mask}&key=${KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: ff }),
  });
  if (!res.ok) throw new Error(`PATCH ${id}: ${res.status}`);
}

async function create(col, id, fields) {
  const ff = {};
  for (const [k, v] of Object.entries(fields)) ff[k] = toFV(v);
  const res = await fetch(`${BASE}/${col}/${id}?key=${KEY}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: ff }),
  });
  if (!res.ok) throw new Error(`CREATE ${id}: ${res.status}`);
}

// ── NOMBRES OFICIALES DE SUBCATEGORÍAS ──
const SUBCATEGORY_NAME_FIXES = {
  'jabones': 'Jabones',
  'agua-micelar': 'Agua micelar',
  'desmaquillante': 'Desmaquillante',
  'exfoliantes-corporales': 'Exfoliantes corporales',
  'mascarillas-exfoliantes': 'Mascarillas exfoliantes',
  'tonicos-faciales': 'Tónicos faciales',
  'cremas': 'Cremas',
  'balsamos': 'Bálsamos',
  'aceite-multiproposito': 'Aceites naturales',
  'aceite-para-masaje': 'Aceites para masaje',
  'serums-faciales': 'Sérums faciales',
  'contorno-de-ojos': 'Contorno de ojos',
  'mascarillas': 'Mascarillas faciales',
  'tratamiento-de-unas': 'Tratamientos para uñas',
  'champu': 'Champú',
  'acondicionador': 'Acondicionador',
  'serum-capilar': 'Sérum capilar',
  'velas-aromaticas': 'Velas aromáticas',
};

// ── MAPEO DE PRODUCTO → SUBCATEGORÍA ──
function getSubcategoryForProduct(name) {
  const n = name.toLowerCase().trim();

  // ACCESORIOS
  if (n.includes('neceser') || n.includes('jabonera')) return 'accesorios-general';

  // CUIDADO CAPILAR
  if (n.includes('champú') || n.includes('champu') || n.includes('shampoo')) return 'champu';
  if (n.includes('acondicionador')) return 'acondicionador';
  if (n.includes('sérum') || n.includes('serum')) {
    // Sérums capilares (van a CUIDADO CAPILAR)
    if (n.includes('capilar') || n.includes('puntas') || n.includes('anticaspa') || n.includes('fortalecedor')) {
      return 'serum-capilar';
    }
    return 'serums-faciales';
  }

  // LIMPIEZA
  if (n.includes('jabón') || n.includes('jabon')) return 'jabones';
  if (n.includes('agua micelar')) return 'agua-micelar';
  if (n.includes('desmaquillante')) return 'desmaquillante';

  // EXFOLIACIÓN
  if (n.includes('exfoliante')) return 'exfoliantes-corporales';
  // Mascarillas con café o carbón = exfoliantes (según tabla oficial)
  if (n.includes('mascarilla') && (n.includes('café') || n.includes('cafe') || n.includes('carbón') || n.includes('carbon'))) {
    return 'mascarillas-exfoliantes';
  }
  // Mascarillas sin café/carbón = faciales no exfoliantes
  if (n.includes('mascarilla')) return 'mascarillas';

  // TONIFICACIÓN
  if (n.includes('tónico') || n.includes('tonico')) return 'tonicos-faciales';

  // TRATAMIENTOS
  if (n.includes('contorno de ojos')) return 'contorno-de-ojos';
  if (n.includes('endurecedor') && (n.includes('uñas') || n.includes('unas'))) return 'tratamiento-de-unas';

  // HIDRATACIÓN
  if (n.includes('bálsamo') || n.includes('balsamo')) return 'balsamos';
  if (n.includes('crema') && !n.includes('sólida') && !n.includes('solida')) return 'cremas';
  if (n.includes('mantequilla') || n.includes('loción') || n.includes('locion') || n.includes('cera de')) return 'cremas';

  // NUTRICIÓN
  if (n.includes('aceite') && n.includes('masaje')) return 'aceite-para-masaje';
  if (n.includes('aceite')) return 'aceite-multiproposito';

  // BIENESTAR
  if (n.includes('vela')) return 'velas-aromaticas';
  if (n.includes('incienso')) return 'inciensos';

  return null;
}

async function main() {
  console.log('=== SINCRONIZANDO CATÁLOGO CON TABLA OFICIAL ===\n');

  const cats = await list('categories');
  const prods = await list('products');

  // Step 1: Update subcategory names
  console.log('─── PASO 1: Actualizando nombres de subcategorías ───');
  for (const [id, newName] of Object.entries(SUBCATEGORY_NAME_FIXES)) {
    const cat = cats.find(c => c.name.split('/').pop() === id);
    if (!cat) {
      console.log(`  ⚠ Subcategoría "${id}" no existe, omitiendo`);
      continue;
    }
    const currentName = cat.fields?.name?.stringValue;
    if (currentName === newName) {
      console.log(`  ✓ ${id}: ya correcto (${newName})`);
    } else {
      await patch('categories', id, { name: newName });
      console.log(`  → ${id}: "${currentName}" → "${newName}"`);
    }
  }

  // Step 2: Ensure ACCESORIOS structure
  console.log('\n─── PASO 2: Estructura ACCESORIOS ───');
  const accesorioRoot = cats.find(c => {
    const id = c.name.split('/').pop();
    const name = c.fields?.name?.stringValue?.trim();
    return id === 'accesorios' || (name && name.toLowerCase() === 'accesorios');
  });

  let accesoriosId = 'accesorios';
  if (accesorioRoot) {
    const oldId = accesorioRoot.name.split('/').pop();
    if (oldId !== 'accesorios') {
      // Create new with stable id
      await create('categories', 'accesorios', {
        name: 'ACCESORIOS', description: '', image: '', sort_order: 9,
        active: true, product_count: 0, parent_id: '',
      });
      console.log(`  → Creado "accesorios" (limpiando id antiguo "${oldId}")`);
    } else {
      await patch('categories', 'accesorios', { name: 'ACCESORIOS', sort_order: 9 });
      console.log(`  ✓ accesorios: ya existe`);
    }
  } else {
    await create('categories', 'accesorios', {
      name: 'ACCESORIOS', description: '', image: '', sort_order: 9,
      active: true, product_count: 0, parent_id: '',
    });
    console.log(`  → Creado "accesorios"`);
  }

  // Subcategoría general para accesorios
  await create('categories', 'accesorios-general', {
    name: 'General', description: '', image: '', sort_order: 1,
    active: true, product_count: 0, parent_id: 'accesorios',
  });
  console.log(`  → Creado "accesorios-general"`);

  // Step 3: Reassign products
  console.log('\n─── PASO 3: Reasignando productos ───');
  const items = prods.map(p => ({
    id: p.name.split('/').pop(),
    name: p.fields?.name?.stringValue,
    category_id: p.fields?.category_id?.stringValue,
    active: p.fields?.active?.booleanValue,
  }));

  let reassigned = 0, unchanged = 0, unmatched = 0;
  for (const p of items) {
    const target = getSubcategoryForProduct(p.name);
    if (!target) {
      console.log(`  ⚠ SIN MATCH: "${p.name}" (queda en ${p.category_id})`);
      unmatched++;
      continue;
    }
    if (p.category_id === target) {
      unchanged++;
      continue;
    }
    await patch('products', p.id, { category_id: target });
    console.log(`  ✓ "${p.name}": ${p.category_id} → ${target}`);
    reassigned++;
  }
  console.log(`\n  Reasignados: ${reassigned} | Sin cambios: ${unchanged} | Sin match: ${unmatched}`);

  // Step 4: Update product_count
  console.log('\n─── PASO 4: Actualizando conteos ───');
  const updatedCats = await list('categories');
  const updatedProds = await list('products');
  for (const cat of updatedCats) {
    const id = cat.name.split('/').pop();
    const count = updatedProds.filter(p => p.fields?.category_id?.stringValue === id).length;
    await patch('categories', id, { product_count: count });
    if (count > 0) {
      const name = cat.fields?.name?.stringValue;
      console.log(`  ${name}: ${count} productos`);
    }
  }

  console.log('\n=== SINCRONIZACIÓN COMPLETA ===');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
