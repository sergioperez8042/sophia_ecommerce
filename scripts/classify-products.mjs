/**
 * Bulk classification + description refresh for Sophia catalog.
 *
 * Updates 69 products with:
 *   - beneficios[]   (Hidratante | Purificante | Exfoliante | Calmante | Nutritivo | Reparador)
 *   - zona_uso[]     (Facial | Corporal | Capilar)
 *   - tipo_piel[]    (Seca | Grasa | Mixta | Sensible | Normal)
 *   - tipo_cabello[] (Seco | Graso | Mixto | Normal | Dañado | Rizado)
 *   - description    (rewritten in Sophia style for products without prior style; active ones keep theirs)
 *
 * Usage:
 *   node scripts/classify-products.mjs           → dry-run (no writes)
 *   node scripts/classify-products.mjs --apply   → applies to Firestore
 */

const FIREBASE_PROJECT_ID = 'liquid-fulcrum-464516-e6';
const FIREBASE_API_KEY = 'AIzaSyD_AKtE4D87Oyk2qxcnOiPdu0ZnBUPgCJo';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const APPLY = process.argv.includes('--apply');

// ── Firestore REST helpers ─────────────────────────────────────────────────

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
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
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) obj[k] = fromFirestoreValue(v);
    return obj;
  }
  return null;
}

function docToObject(doc) {
  const id = doc.name.split('/').pop();
  const obj = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) obj[k] = fromFirestoreValue(v);
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
  for (const [k, v] of Object.entries(fields)) firestoreFields[k] = toFirestoreValue(v);
  const updateMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?${updateMask}&key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) throw new Error(`PATCH ${collection}/${docId}: ${res.status} ${await res.text()}`);
}

// ── Target updates, keyed by product name (exact match, trimmed) ───────────

// `description: null` means: keep the current Firestore description (do not overwrite).
const UPDATES = [
  // ── NUTRICIÓN — Aceites naturales ────────────────────────────────────────
  { name: 'Aceite de Orégano', description: 'Oleato artesanal con la acción antifúngica y antiséptica más potente de los aceites botánicos, gracias al carvacrol y al timol. Tratamiento localizado eficaz contra acné, hongos cutáneos e infecciones de la piel.', beneficios: ['Purificante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Aceite de Aguacate', description: 'Oleato rico en ácidos grasos esenciales y vitaminas A, D y E que nutre las capas profundas y estimula el colágeno restaurando la elasticidad. En el cabello sella puntas abiertas, controla el frizz y aporta brillo natural.', beneficios: ['Nutritivo', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: ['Seco', 'Normal', 'Dañado'] },
  { name: 'Aceite de Fresa', description: 'Oleato con alto contenido en vitamina C y ácido elágico que estimula la producción de colágeno y mejora la firmeza sin dejar residuo graso. Hidrata, ilumina y aporta un sutil aroma frutal en cada aplicación.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Seca', 'Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Aceite de Jengibre', description: 'Oleato antioxidante y antiinflamatorio con efecto calor que estimula la circulación y alivia dolores articulares y musculares. El gingerol combate el acné, atenúa quemaduras solares y estimula los folículos del cuero cabelludo.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Corporal', 'Capilar'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: ['Graso', 'Normal', 'Mixto'] },
  { name: 'Aceite de Caléndula', description: 'Oleato cicatrizante y antiséptico que estimula la producción de colágeno y acelera la reparación de tejidos dañados. Calma irritaciones, alivia contusiones y suaviza el cuero cabelludo en pieles y cabelleras delicadas.', beneficios: ['Calmante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Sensible', 'Seca'], tipo_cabello: ['Seco', 'Normal'] },
  { name: 'Aceite de Moringa', description: 'Oleato del "árbol milagroso", regenerador celular con potente acción antimicrobiana y antienvejecimiento que reduce visiblemente la pigmentación desigual. Sus antioxidantes (zeaxantina, quercetina) protegen frente al daño ambiental.', beneficios: ['Reparador', 'Nutritivo'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: ['Seco', 'Normal', 'Dañado'] },
  { name: 'Aceite de Limón', description: 'Oleato rico en vitamina C con propiedades hidratantes, antibacterianas y aclarantes que trata manchas oscuras y unifica el tono. En el cuero cabelludo aporta una acción clarificante natural ideal para cabellos grasos.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Mixta', 'Grasa'], tipo_cabello: ['Graso', 'Mixto'] },
  { name: 'Aceite de Canela', description: 'Oleato antibacteriano y antiinflamatorio con efecto calor que alivia dolores de artritis, molestias óseas y tensiones musculares. El cinamaldehído estimula la circulación local y aporta un alto poder antioxidante.', beneficios: ['Purificante', 'Calmante'], zona_uso: ['Corporal'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Aceite de Coco', description: null, beneficios: ['Hidratante', 'Nutritivo', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: ['Seco', 'Normal', 'Dañado'] },
  { name: 'Aceite de Flor de Jamaica', description: 'Oleato rico en vitamina E y antocianinas con potente acción antioxidante y antiinflamatoria. Especialmente eficaz para calmar pieles con psoriasis, dermatitis o eccema, y para tonificar el cabello aportándole un brillo natural.', beneficios: ['Calmante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Sensible', 'Seca'], tipo_cabello: ['Seco', 'Normal', 'Dañado'] },
  { name: 'Aceite de Manzanilla', description: 'Oleato con suave acción antiinflamatoria que calma e hidrata piel y cuero cabelludo. Promueve el crecimiento capilar al mejorar la circulación en los folículos y alivia enrojecimientos, irritaciones y picor.', beneficios: ['Calmante', 'Nutritivo'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Sensible', 'Seca', 'Normal'], tipo_cabello: ['Normal', 'Seco'] },
  { name: 'Aceite de Romero', description: 'Oleato astringente, antiinflamatorio y estimulante de la circulación que fortalece el cabello desde la raíz y previene la caída. Aplicado en la piel, alivia dolores musculares y articulares con un efecto calor revitalizante.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Corporal', 'Capilar'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: ['Graso', 'Normal', 'Mixto'] },
  { name: 'Aceite de Café', description: 'Oleato anticelulítico y rejuvenecedor con cafeína que activa la circulación y el drenaje linfático reduciendo la celulitis y la retención de líquidos. Sus antioxidantes combaten el envejecimiento prematuro y revitalizan el cuero cabelludo.', beneficios: ['Exfoliante', 'Reparador'], zona_uso: ['Corporal', 'Capilar'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: ['Graso', 'Normal'] },
  { name: 'Aceite de Rosas', description: 'Oleato de pétalos de rosa con vitaminas A, C y E que regenera la piel en profundidad y atenúa cicatrices, marcas y arrugas finas. Unifica el tono e hidrata mientras aporta un exquisito aroma floral y suaviza el cabello.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Seca', 'Sensible', 'Normal'], tipo_cabello: ['Seco', 'Normal'] },
  { name: 'Aceite de Almendras', description: 'Oleato versátil rico en ácidos grasos Omega-3, -6 y -9 que previene estrías, combate arrugas finas y mejora la elasticidad. Funciona como desmaquillante suave y nutre el cabello sin sensación grasa.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: ['Seco', 'Normal', 'Dañado'] },
  { name: 'Aceite de Ricino', description: 'Oleato antimicrobiano no comedogénico que regula el sebo, fortalece cabello quebradizo y estimula notablemente el crecimiento de pestañas y cejas. El ácido ricinoleico penetra profundamente nutriendo desde el folículo.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Facial', 'Capilar'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: ['Seco', 'Dañado', 'Normal'] },
  { name: 'Aceite de Albahaca', description: 'Oleato reafirmante y antiinflamatorio que mejora la elasticidad de la piel con la acción del eugenol y el linalol. Tonifica los tejidos, combate las bacterias del acné y estimula los folículos capilares.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Mixta', 'Normal'], tipo_cabello: ['Normal', 'Mixto'] },
  { name: 'Aceite de Aloe Vera', description: 'Oleato cicatrizante, regenerador y antioxidante con más de 75 compuestos activos que tratan eficazmente quemaduras, dermatitis, eccema y psoriasis. Alivia picor e inflamación desde la primera aplicación.', beneficios: ['Calmante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Sensible', 'Seca', 'Mixta'], tipo_cabello: ['Seco', 'Normal', 'Dañado', 'Rizado'] },

  // ── TRATAMIENTOS — Sérums y específicos ──────────────────────────────────
  { name: 'Sérum Antiacné', description: 'Sérum concentrado con propiedades cicatrizantes, antibacterianas y calmantes que trata el acné activo desde su origen. Regula la producción de sebo y previene nuevos brotes con una fórmula no comedogénica apta para pieles grasas y mixtas.', beneficios: ['Purificante', 'Calmante'], zona_uso: ['Facial'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Sérum Antiarrugas', description: 'Sérum antiedad que activa la producción de colágeno y elastina combatiendo líneas de expresión, arrugas finas y pérdida de firmeza. Su doble acción controla además el acné en pieles maduras con tendencia mixta.', beneficios: ['Reparador', 'Nutritivo'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Sérum Antimanchas', description: 'Sérum unificador de alta potencia que inhibe el exceso de melanina y aclara progresivamente manchas, hiperpigmentación y marcas de acné. Su fórmula antioxidante actúa en todo tipo de piel sin alterar el equilibrio cutáneo.', beneficios: ['Reparador', 'Purificante'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Mixta', 'Grasa'], tipo_cabello: [] },
  { name: 'Sérum Antiojeras', description: 'Sérum de alta potencia formulado para el delicado contorno de ojos que reduce visiblemente las ojeras oscuras y previene el envejecimiento de la zona. Estimula la microcirculación y aporta luminosidad inmediata.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Sensible', 'Seca'], tipo_cabello: [] },
  { name: 'Sérum Facial Regenerador', description: 'Sérum multiacción con activos botánicos concentrados que hidrata, rejuvenece y repara los tejidos en profundidad. Su textura ligera penetra rápido sin residuo graso y puede usarse como tratamiento intensivo de día o noche.', beneficios: ['Reparador', 'Hidratante', 'Nutritivo'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Sérum para Pestañas y Cejas', description: 'Sérum fortalecedor de acción progresiva que estimula el crecimiento natural de pestañas y cejas aumentando grosor, longitud y densidad. Nutre cada folículo desde la raíz y previene la caída y el quiebre.', beneficios: ['Nutritivo', 'Reparador'], zona_uso: ['Facial'], tipo_piel: ['Normal'], tipo_cabello: [] },
  { name: 'Endurecedor de Uñas', description: 'Tratamiento concentrado que fortalece uñas frágiles y quebradizas desde la primera aplicación. Sus aceites esenciales y vitaminas promueven el crecimiento saludable y actúan como antifúngico natural contra infecciones por hongos.', beneficios: ['Nutritivo', 'Reparador'], zona_uso: ['Corporal'], tipo_piel: ['Normal'], tipo_cabello: [] },
  { name: 'Contorno de Ojos', description: 'Tratamiento intensivo de alta concentración con retinol y vitamina C que reduce visiblemente arrugas finas, ojeras y bolsas. El retinol acelera la renovación celular mientras la vitamina C ilumina y protege frente a los radicales libres.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Seca', 'Sensible'], tipo_cabello: [] },
  { name: 'Sérum Labial', description: null, beneficios: ['Hidratante', 'Reparador', 'Nutritivo'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },

  // ── LIMPIEZA — Jabones, agua micelar, desmaquillante ─────────────────────
  { name: 'Jabón de Remolacha', description: 'Jabón antioxidante con extracto de remolacha, naturalmente rico en vitamina C, betacarotenos y minerales que combaten el envejecimiento prematuro. Estimula la renovación celular y mejora visiblemente el tono y la textura cutánea.', beneficios: ['Reparador', 'Nutritivo'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Normal', 'Mixta', 'Seca'], tipo_cabello: [] },
  { name: 'Jabón de Coco', description: null, beneficios: ['Hidratante', 'Nutritivo'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Seca', 'Sensible', 'Normal'], tipo_cabello: [] },
  { name: 'Agua Micelar', description: 'Agua micelar enriquecida con aloe vera puro que limpia impurezas y maquillaje ligero, tonifica equilibrando el pH y nutre la piel en un solo paso. Las micelas atrapan suciedad y exceso de grasa sin necesidad de enjuagar.', beneficios: ['Purificante', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Mixta', 'Sensible', 'Seca', 'Grasa'], tipo_cabello: [] },
  { name: 'Jabón de Arroz', description: 'Jabón hidratante con extracto de arroz, un secreto ancestral asiático rico en vitaminas del grupo B, aminoácidos y minerales. Exfolia suavemente, combate el acné desde su origen y deja el rostro luminoso y nutrido.', beneficios: ['Hidratante', 'Exfoliante', 'Purificante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Jabón de Neem', description: 'Jabón con extracto de neem, el "árbol de la vida" ayurvédico, con extraordinarias propiedades despigmentantes y regeneradoras. Controla la producción de sebo y combate las bacterias del acné, también apto para uso capilar.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Facial', 'Corporal', 'Capilar'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: ['Graso', 'Normal'] },
  { name: 'Jabón de Aloe Vera', description: null, beneficios: ['Purificante', 'Calmante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Mixta', 'Grasa', 'Sensible'], tipo_cabello: [] },
  { name: 'Jabón de Romero', description: 'Jabón antiséptico con romero fresco que regula la producción de grasa sin resecar y estimula la circulación sanguínea para mejorar el aspecto general. Su aroma herbal revitaliza y su acción astringente es ideal para pieles acneicas.', beneficios: ['Purificante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Jabón Íntimo de Salvia', description: null, beneficios: ['Purificante', 'Calmante'], zona_uso: ['Corporal'], tipo_piel: ['Sensible', 'Normal'], tipo_cabello: [] },
  { name: 'Jabón de Pepino', description: 'Jabón refrescante con extracto de pepino fresco, rico en vitaminas C y K, ácido cafeico y sílice. Repara e hidrata la piel tras la exposición solar reduciendo inflamación, enrojecimiento y sensación de tirantez.', beneficios: ['Hidratante', 'Calmante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Sensible', 'Normal', 'Seca'], tipo_cabello: [] },
  { name: 'Jabón de Avena y Miel', description: null, beneficios: ['Calmante', 'Hidratante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Sensible', 'Seca'], tipo_cabello: [] },
  { name: 'Jabón de Avena', description: 'Jabón exfoliante suave con copos de avena natural que elimina bacterias superficiales sin alterar el manto protector. La avena coloidal calma el picor, reduce el enrojecimiento y es uno de los ingredientes más recomendados para pieles delicadas.', beneficios: ['Exfoliante', 'Calmante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Sensible', 'Seca', 'Normal'], tipo_cabello: [] },
  { name: 'Jabón de Carbón Activado', description: null, beneficios: ['Purificante', 'Exfoliante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Jabón de Manzanilla', description: null, beneficios: ['Calmante', 'Purificante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Sensible', 'Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Jabón de Cúrcuma', description: null, beneficios: ['Reparador', 'Purificante'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Mixta', 'Normal', 'Grasa'], tipo_cabello: [] },
  { name: 'Jabón de Miel', description: 'Jabón antibacteriano con miel pura, humectante natural utilizado desde la antigüedad. Atrae humedad del ambiente hacia la piel, previene los signos del envejecimiento y acelera la cicatrización de heridas menores y quemaduras leves.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Jabón de Café', description: 'Jabón exfoliante con granos de café natural que activa la microcirculación, combate la celulitis y reduce las ojeras gracias a la cafeína. Sus antioxidantes protegen contra el envejecimiento mientras tonifican la piel desde la ducha.', beneficios: ['Exfoliante', 'Purificante'], zona_uso: ['Corporal', 'Facial'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Desmaquillante en Aceite', description: 'Desmaquillante en aceite que disuelve y elimina todo tipo de maquillaje, incluso el waterproof, sin agredir ni resecar la piel. Su fórmula antioxidante limpia profundamente los poros mientras nutre y respeta el manto cutáneo.', beneficios: ['Purificante', 'Nutritivo'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Sensible', 'Mixta'], tipo_cabello: [] },

  // ── HIDRATACIÓN — Cremas y bálsamos ──────────────────────────────────────
  { name: 'Crema Antienvejecimiento con Ácido Hialurónico', description: 'Crema antiedad con manteca de karité orgánica y ácido hialurónico de bajo peso molecular que penetra en las capas profundas. Hidrata intensamente, rellena arrugas finas desde el interior y mejora visiblemente la elasticidad y firmeza del rostro.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Crema Azufrada', description: 'Crema queratolítica con azufre purificado que regula la producción de sebo y purifica la piel en profundidad. Matifica zonas brillantes, reduce poros dilatados y elimina las bacterias responsables del acné con acción exfoliante.', beneficios: ['Purificante', 'Exfoliante'], zona_uso: ['Facial'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Crema Antiacné de Caléndula', description: 'Crema humectante con caléndula, aceite esencial de naranja y colágeno activo. Su triple acción cicatrizante, antibacteriana e hidratante trata el acné sin resecar, reparando los tejidos dañados por los brotes.', beneficios: ['Purificante', 'Calmante', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Grasa', 'Mixta', 'Sensible'], tipo_cabello: [] },
  { name: 'Mantequilla Corporal de Coco', description: 'Mantequilla artesanal con cera de abeja, manteca de cacao y aceite de coco virgen que aporta hidratación profunda y duradera. Regenera pieles secas, previene la formación de estrías y calma la irritación post-depilación.', beneficios: ['Hidratante', 'Nutritivo', 'Reparador'], zona_uso: ['Corporal'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Crema Nocturna de Pepino y Ácido Hialurónico', description: 'Crema de noche con extracto de pepino fresco y ácido hialurónico que repara las células dañadas durante el descanso. Regula el sebo, aclara manchas oscuras y refresca el delicado contorno de ojos.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Mixta', 'Seca'], tipo_cabello: [] },
  { name: 'Bálsamo Labial de Chocolate', description: 'Bálsamo labial con manteca de cacao pura y cacao en polvo que mejora la elasticidad de los labios y los protege de los rayos UV. La teobromina del cacao estimula la circulación aportando un sutil color natural y brillo.', beneficios: ['Hidratante', 'Nutritivo'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Loción Antihongos', description: 'Loción antifúngica concentrada formulada para el tratamiento de hongos en los pies y otras zonas afectadas. Sus activos antimicrobianos combaten la infección desde su origen, alivian el picor y reparan la piel dañada.', beneficios: ['Purificante', 'Reparador'], zona_uso: ['Corporal'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Crema de Chía', description: 'Crema rejuvenecedora con aceite de semillas de chía, una de las fuentes vegetales más ricas en Omega-3. Estimula el colágeno, mejora la firmeza y calma pieles sensibles, secas e irritadas con acción antiinflamatoria natural.', beneficios: ['Reparador', 'Calmante', 'Hidratante'], zona_uso: ['Facial'], tipo_piel: ['Sensible', 'Seca', 'Normal'], tipo_cabello: [] },
  { name: 'Cera de Aloe Vera', description: 'Crema sólida concentrada de aloe vera y aceite de coco que se derrite con el calor corporal transformándose en un tratamiento líquido. Su doble acción cicatrizante y regeneradora repara talones agrietados, codos resecos y manos castigadas.', beneficios: ['Reparador', 'Hidratante'], zona_uso: ['Corporal'], tipo_piel: ['Seca', 'Sensible'], tipo_cabello: [] },
  { name: 'Crema de Linaza', description: 'Crema enriquecida con aceite de linaza, rica en Omega-3 y ácido linoleico con propiedades antioxidantes y cicatrizantes. Repara la barrera cutánea dañada, reduce la inflamación y proporciona hidratación profunda que restaura la elasticidad.', beneficios: ['Reparador', 'Hidratante', 'Nutritivo'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Bálsamo Labial de Coco', description: 'Bálsamo labial con cera de abeja, manteca de cacao y aceite de coco virgen que crea una barrera protectora sellando la humedad. Protege frente a rayos UV y agresiones climáticas dejando un brillo natural sutil.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Facial'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Crema Antiestrías de Rosa Mosqueta', description: 'Crema corporal intensiva con manteca de karité y aceite esencial de rosa mosqueta. Unifica el tono, cicatriza marcas existentes y previene la formación de nuevas estrías fortaleciendo las fibras de colágeno y elastina.', beneficios: ['Reparador', 'Hidratante', 'Nutritivo'], zona_uso: ['Corporal'], tipo_piel: ['Seca', 'Normal', 'Sensible'], tipo_cabello: [] },
  { name: 'Crema Protectora Solar', description: null, beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Normal', 'Mixta', 'Seca', 'Sensible'], tipo_cabello: [] },
  { name: 'Crema Súper Hidratante de Coco y Avena', description: 'Crema ultranutritiva que combina aceite de coco con avena coloidal calmante. Pensada para pieles secas, agrietadas y deshidratadas con propiedades antiinflamatorias que reducen enrojecimiento y restauran la barrera cutánea.', beneficios: ['Hidratante', 'Calmante', 'Nutritivo'], zona_uso: ['Facial', 'Corporal'], tipo_piel: ['Seca', 'Sensible', 'Normal'], tipo_cabello: [] },

  // ── TONIFICACIÓN ──────────────────────────────────────────────────────────
  { name: 'Tónico de Romero y Pepino', description: 'Tónico refrescante con romero y pepino que cierra poros dilatados, reduce manchas oscuras y estimula la producción de colágeno. El romero tonifica y el pepino refresca, desinflama y aclara el tono.', beneficios: ['Purificante', 'Calmante', 'Reparador'], zona_uso: ['Facial'], tipo_piel: ['Mixta', 'Grasa', 'Normal'], tipo_cabello: [] },

  // ── CUIDADO CAPILAR ──────────────────────────────────────────────────────
  { name: 'Acondicionador de Aloe Vera', description: 'Acondicionador reparador con aloe vera concentrado que hidrata cada hebra de raíz a puntas. Mejora la manejabilidad, elimina enredos y deja el cabello suave, brillante y con movimiento natural.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Capilar'], tipo_piel: [], tipo_cabello: ['Seco', 'Normal', 'Dañado', 'Rizado', 'Mixto'] },
  { name: 'Sérum Reparador de Puntas', description: 'Sérum capilar reparador que sella puntas abiertas y dañadas, controla el frizz rebelde y mejora visiblemente la textura del cabello. Sus aceites naturales restauran la hidratación perdida por calor y tratamientos químicos.', beneficios: ['Reparador', 'Nutritivo'], zona_uso: ['Capilar'], tipo_piel: [], tipo_cabello: ['Dañado', 'Seco', 'Rizado'] },
  { name: 'Sérum Anticaspa', description: 'Sérum capilar especializado que elimina los hongos responsables de la caspa, hidrata el cuero cabelludo reseco y equilibra su pH natural. Su acción antifúngica progresiva trata la causa raíz y previene la reaparición.', beneficios: ['Purificante', 'Calmante'], zona_uso: ['Capilar'], tipo_piel: [], tipo_cabello: ['Graso', 'Normal', 'Mixto'] },
  { name: 'Champú de Aloe Vera', description: 'Champú natural con aloe vera puro que repara puntas abiertas, fortalece la fibra capilar y controla el encrespamiento. Sin sulfatos ni siliconas, respeta el equilibrio del cuero cabelludo mientras limpia suavemente.', beneficios: ['Hidratante', 'Reparador'], zona_uso: ['Capilar'], tipo_piel: [], tipo_cabello: ['Seco', 'Normal', 'Dañado', 'Rizado'] },
  { name: 'Sérum Capilar Fortalecedor', description: null, beneficios: ['Nutritivo', 'Reparador'], zona_uso: ['Capilar'], tipo_piel: [], tipo_cabello: ['Seco', 'Dañado', 'Normal', 'Mixto'] },

  // ── ACCESORIOS ────────────────────────────────────────────────────────────
  { name: 'Neceser Sophia', description: null, beneficios: [], zona_uso: [], tipo_piel: [], tipo_cabello: [] },

  // ── EXFOLIACIÓN ───────────────────────────────────────────────────────────
  { name: 'Mascarilla de Carbón Activado y Maicena', description: 'Mascarilla facial en polvo con carbón activado y maicena natural. El carbón absorbe toxinas y exceso de grasa de los poros mientras la maicena suaviza la textura cerrando poros dilatados con acabado mate.', beneficios: ['Purificante', 'Exfoliante'], zona_uso: ['Facial'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
  { name: 'Exfoliante Corporal de Café', description: 'Exfoliante corporal con granos de café finamente molidos que elimina células muertas y estimula la renovación celular. La cafeína activa la circulación, combate la celulitis y promueve la producción de colágeno para una piel firme.', beneficios: ['Exfoliante', 'Reparador'], zona_uso: ['Corporal'], tipo_piel: ['Normal', 'Mixta'], tipo_cabello: [] },
  { name: 'Mascarilla de Café y Ácido Hialurónico', description: 'Mascarilla en crema que combina el poder estimulante del café con la hidratación profunda del ácido hialurónico. La cafeína activa la microcirculación y reduce la inflamación mientras el ácido hialurónico rellena líneas finas.', beneficios: ['Hidratante', 'Exfoliante'], zona_uso: ['Facial'], tipo_piel: ['Normal', 'Mixta', 'Seca'], tipo_cabello: [] },
  { name: 'Mascarilla de Carbón y Ácido Hialurónico', description: 'Mascarilla en crema que fusiona la limpieza profunda del carbón activado con el poder hidratante del ácido hialurónico. Elimina puntos negros y toxinas mientras compensa con una hidratación intensa que devuelve la luminosidad.', beneficios: ['Purificante', 'Hidratante', 'Exfoliante'], zona_uso: ['Facial'], tipo_piel: ['Grasa', 'Mixta'], tipo_cabello: [] },
];

// ── Diff helpers ───────────────────────────────────────────────────────────

function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function buildPatch(current, target) {
  const patch = {};
  const arrayFields = ['beneficios', 'zona_uso', 'tipo_piel', 'tipo_cabello'];
  for (const f of arrayFields) {
    if (!arraysEqual(current[f] || [], target[f] || [])) patch[f] = target[f] || [];
  }
  if (target.description !== null && (current.description || '') !== target.description) {
    patch.description = target.description;
  }
  return patch;
}

// ── Main ──────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  Sophia — bulk classification ${APPLY ? '— APPLY MODE 🚀' : '(dry-run)'}`);
  console.log(`${'═'.repeat(70)}\n`);

  const products = await firestoreList('products');
  const byName = new Map();
  for (const p of products) byName.set((p.name || '').trim(), p);

  let touched = 0, skipped = 0, missing = 0, errors = 0;
  const changeLog = [];

  for (const upd of UPDATES) {
    const current = byName.get(upd.name);
    if (!current) {
      console.log(`  ⚠️  MISSING in Firestore: "${upd.name}"`);
      missing++;
      continue;
    }
    const patch = buildPatch(current, upd);
    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }
    const fields = Object.keys(patch).join(', ');
    const descNote = patch.description ? ` [+desc ${patch.description.length}c]` : '';
    console.log(`  ✦ ${upd.name.padEnd(48)} → ${fields}${descNote}`);

    if (APPLY) {
      try {
        await firestorePatch('products', current.id, patch);
        touched++;
      } catch (e) {
        console.log(`     ✖ ${e.message}`);
        errors++;
      }
    } else {
      touched++;
    }
    changeLog.push({ id: current.id, name: upd.name, patch });
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  Resumen: ${touched} a actualizar · ${skipped} sin cambios · ${missing} no encontrados${errors ? ` · ${errors} errores` : ''}`);
  console.log(`  Productos totales en Firestore: ${products.length} / propuesta: ${UPDATES.length}`);
  if (!APPLY) console.log(`\n  Dry-run completado. Para aplicar:  node scripts/classify-products.mjs --apply\n`);
  else console.log(`\n  ✅ Cambios aplicados a Firestore.\n`);
})();
