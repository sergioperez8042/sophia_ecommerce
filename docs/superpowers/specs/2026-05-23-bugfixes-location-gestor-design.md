# Spec — Fix-all de 9 bugs del flujo Location/Gestor

**Fecha:** 2026-05-23
**Origen:** `/code-review` sobre los commits `00794b8` (granular location flow) y `45e7927` (admin consejos UI).
**Autor del review:** Claude + 3 ángulos de finder + 1-vote verifier.
**Resultado del review:** 9 hallazgos confirmados/plausibles, 1 refutado (race condition en LocationPopup ya protegido por flag `cancelled`).

---

## Objetivo

Arreglar los 9 bugs sin romper nada que ya funcione. Tres fases independientes, cada una deployable y reversible por sí sola.

## Principios rectores

1. **Compatibilidad hacia atrás** con sesiones existentes (localStorage legacy).
2. **Sin cambios de UX visibles** salvo los que arreglan el bug. Nada de refactors "ya que estoy".
3. **Cada fase es atómica:** un `git revert <sha>` deja el sistema en estado consistente.
4. **Validación manual antes del siguiente paso.** No avanzamos a la Fase N+1 hasta que Fase N esté verde en Vercel.

---

## Fase 1 — Urgente: usuarios bloqueados HOY

### Bug #2 — Matanzas atrapada en loop de popup

**Archivo:** `src/store/LocationContext.tsx` línea 76.

**Cambio:**
```ts
// ANTES
const hasFullLocation = hasLocation && !!location.consejoPopular;

// DESPUÉS
const hasFullLocation =
  hasLocation &&
  (!requiresConsejoPopular(location.province) || !!location.consejoPopular);
```

**Por qué es seguro:**
- Solo afloja la condición — La Habana sigue exigiendo `consejoPopular`.
- No toca persistencia ni shape de datos.
- Sin breaking change para callers (`hasFullLocation` es un boolean, su semántica solo se vuelve más permisiva para provincias con `usesConsejos:false`).

**Validación:**
- Manual: location Matanzas/Cárdenas en localStorage → recargar → popup NO se abre.
- Manual: location La Habana/Centro Habana sin consejo → popup SÍ se abre (regresión-check).

---

### Bug #3 — Acentos rompen el grid de consejos en el admin

**Archivos:**
- `src/data/localities.ts` — helper `getConsejos`
- `src/lib/firestore-services.ts` — `findByLocation`, `findByMunicipality`, `getCoveredConsejosInMunicipality`

**Cambio:**

Añadir helper de normalización en `src/data/localities.ts`:
```ts
export function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
```

Aplicar en ambos lados de toda comparación de `municipality` o `consejo`:

```ts
// localities.ts — getConsejos
export function getConsejos(province: string, municipality: string): string[] {
  const target = normalizeForMatch(municipality);
  const p = PROVINCES_DATA.find(...);
  return p?.municipalities.find(m => normalizeForMatch(m.municipality) === target)?.consejos ?? [];
}
```

```ts
// firestore-services.ts — findByLocation / findByMunicipality
const muniN = normalizeForMatch(municipality);
const conN = consejoPopular ? normalizeForMatch(consejoPopular) : undefined;
// match: normalizeForMatch(g.municipalities[i]) === muniN
// match consejos: normalizeForMatch(c.municipality) === muniN && normalizeForMatch(c.consejo) === conN
```

**Por qué es seguro:**
- **No tocamos** los strings guardados en Firestore ni en `localities.ts`. La comparación es la que se normaliza.
- Simétrico: ambos lados de toda igualdad pasan por `normalizeForMatch`.
- Idempotente: aplicar dos veces da el mismo resultado.

**Validación:**
- Manual: admin abre form de gestor La Habana → marca municipio (esté en CUBA_PROVINCES con o sin acento) → ve los consejos.
- Manual: cliente confirma Centro Habana/Cayo Hueso → en /cart ve gestor Maday (sin acento en Firestore matchea con acento en input, o viceversa).
- Regresión: cliente Matanzas/Cárdenas → ve Deborah.

---

### Fase 1 — Validación final
- Build pasa (`pnpm build` localmente).
- Preview deploy en Vercel verde.
- Checklist manual completo arriba.
- → Push a `main` → Vercel deploy producción.

---

## Fase 2 — Refactor del contrato `findByLocation`

### Decisión arquitectónica
**Mover la invariante "La Habana requiere consejo, no fallback al municipio" desde comentarios y UI hacia la firma del servicio.** Esto mata 4 bugs (#1, #5, #4-parcial, #7-cart-side) y previene que cualquier futuro caller los reintroduzca.

### Cambio en la firma

```ts
// firestore-services.ts — ANTES
async findByLocation(municipality: string, consejoPopular?: string): Promise<IGestor | null>

// DESPUÉS
async findByLocation(
  province: string,
  municipality: string,
  consejoPopular?: string
): Promise<IGestor | null> {
  // Si la provincia requiere consejo pero no lo recibimos → null inmediato
  if (requiresConsejoPopular(province) && !consejoPopular) return null;

  // Si el consejo está dado: match estricto (municipality, consejo) en g.consejos[]
  if (consejoPopular) {
    // ... iterar gestores, match por (muniN, conN) con normalizeForMatch
    // Si no hay match: return null. NO fallback a municipio.
    return null;
  }

  // Provincia sin consejos (Matanzas etc): match por municipality en g.municipalities[]
  return /* match por muniN */;
}
```

### Sitios que cambian

1. **`src/components/CartDrawer.tsx`** líneas ~48–62:
   - Pasar `location.province` como primer arg.
   - **Eliminar** el fallback `else await GestorService.findByMunicipality(...)`.
   - Cuando `findByLocation` devuelve `null` → setear `gestor=null` (el banner `noGestorMessage` ya existe en el componente, solo falta dispararlo).

2. **`src/app/cart/page.tsx`** líneas ~39–53:
   - Mismo cambio.

3. **`findByMunicipality`** sigue exportada (la usa el admin), pero ya **no** se llama desde el flujo de checkout.

### Pre-flight check obligatorio antes del deploy

Antes de subir Fase 2 a producción, verificar en Firebase console que **todos los gestores con `province='La Habana'` tienen `consejos[]` poblado**. Si alguno está vacío, correr:
```bash
node scripts/seed-gestores.mjs --apply
```

Esto previene que clientes existentes vean "no hay gestor" cuando antes recibían un fallback de municipio.

### Por qué es seguro

- La firma cambia pero **todos** los call-sites (2) se actualizan en el mismo PR.
- TypeScript bloqueará llamadas con la firma vieja en `pnpm build`.
- El banner "no hay gestor en tu zona" ya existe en el código del cart — solo cambiamos qué lo dispara.

### Validación
- Manual: cliente Centro Habana/Cayo Hueso → cart muestra "entrega disponible" + Maday.
- Manual: cliente La Habana del Este/Campo Florido (no cubierto) → cart muestra banner amber "no hay gestor", botón WhatsApp deshabilitado o dirigido a general (según UX actual).
- Manual: cliente Matanzas/Cárdenas (Deborah) → cart muestra "entrega disponible" + Deborah.
- Regresión: el LocationPopup sigue funcionando idéntico (su lógica de gestor también pasa por `findByLocation` con la nueva firma).

---

## Fase 3 — Pulido

### Bug #6 — Mensaje WhatsApp diverge entre drawer y cart/page

**Cambio:**
1. Crear `src/lib/whatsapp-message.ts` con `buildOrderMessage(args)` que reciba customerName, customerPhone, customerEmail, municipality, province, items, total, gestorRef, notes.
2. `CartDrawer.tsx` y `cart/page.tsx` importan y usan ese helper.
3. Añadir a `cart/page.tsx` los inputs faltantes (name, phone, email, notes) idénticos al drawer, con la misma validación de "nombre requerido".

**Riesgo:** medio — añade UI nueva a una ruta existente. Mitigación: copiar exactamente los componentes del drawer (mismos placeholders, mismas clases Tailwind, mismo orden).

### Bug #7 — `getCoveredConsejosInMunicipality` sesgo por orden Firestore

**Cambio:**
```ts
async getCoveredConsejosInMunicipality(province, municipality): Promise<{consejo, gestorName}[]> {
  const allConsejos = getConsejos(province, municipality); // orden geográfico
  const gestores = await this.getAll();
  const covered = new Map<string /*consejo*/, string /*gestorName*/>();
  for (const c of allConsejos) {
    const g = gestores.find(g => g.consejos?.some(
      x => normalizeForMatch(x.municipality)===normalizeForMatch(municipality)
        && normalizeForMatch(x.consejo)===normalizeForMatch(c)
    ));
    if (g) covered.set(c, g.name);
    if (covered.size >= 3) break;
  }
  return Array.from(covered.entries()).map(([consejo, gestorName]) => ({consejo, gestorName}));
}
```

Orden ahora es por aparición en `localities.ts` (geografía), no por orden de documentos Firestore. Mantiene el cap de 3 pero después de barrer en orden geográfico.

### Bug #8 — Legacy localStorage sin `province`

**Cambio en `src/store/LocationContext.tsx`** al hidratar desde localStorage:
```ts
const parsed = JSON.parse(saved);
// Guard contra shape legacy
if (parsed.municipality && !parsed.province) {
  // No intentar inferir — forzar re-confirmación
  setLocation(null);
  setHasLocation(false);
  return;
}
setLocation(parsed);
setHasLocation(true);
```

**Por qué NO inferimos `province` desde `municipality`:** un municipio podría existir en varias provincias o ser ambiguo; meter al usuario en la wrong province es peor que pedirle re-confirmar una vez.

### Bug #9 — `toggleMunicipality` stale closure

**Cambio en `src/app/admin/managers/page.tsx`** líneas ~360–370:
```ts
const toggleMunicipality = (m: string) => {
  setSelectedMunicipalities(prev => {
    const next = prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m];
    // Cleanup de consejos huérfanos derivado de next, no de prev
    setSelectedConsejos(consejos =>
      consejos.filter(c => next.includes(c.municipality))
    );
    return next;
  });
};
```

**Riesgo:** cero — lógica equivalente pero sin depender del valor capturado en closure.

### Fase 3 — Validación
- Manual: cart/page (ruta directa) → llenar form completo → mensaje WhatsApp llega al gestor con name/phone/email/notes idéntico al del drawer.
- Manual: cliente en consejo no cubierto → sugerencias "cercanos" muestran consejos del municipio en orden geográfico, no aleatorio.
- Manual: borrar `province` del localStorage → recargar → popup auto-abre forzando re-confirmación.
- Manual: admin marca/desmarca municipios rápidamente → no quedan consejos huérfanos.

---

## Tests automatizados

**Fuera de scope para este fix-all.**

Razón: el repo no tiene test suite configurado (verificado en el code review — no se encontraron archivos `*.test.*` ni `*.spec.*` para estos módulos). Añadir una suite ahora multiplica el riesgo de "no romper nada" porque cualquier mis-configuración de Jest/Vitest podría confundir el deploy de Vercel.

**Plan para después:** abrir issue separado para introducir Vitest + tests para `findByLocation`, `getConsejos`, `buildOrderMessage`. No bloquea ninguna fase de este spec.

---

## Rollback plan

Cada fase es 1 PR / 1 commit-grupo deployable:

```bash
# Si algo se rompe en producción después de la Fase N:
git revert <sha-fase-N>
git push origin main
# Vercel re-despliega estado anterior en ~2 min
```

Las fases son acumulativas pero independientes:
- Revertir Fase 3 no afecta Fase 1 ni 2.
- Revertir Fase 2 deja Fase 1 viva pero re-introduce los 4 bugs del contrato. Aceptable temporalmente.
- Revertir Fase 1 vuelve al estado del review (Matanzas bloqueada). Solo si Fase 1 introduce algo peor.

---

## Checklist global pre-merge a `main`

Por cada fase, antes del `git push`:

- [ ] `pnpm build` local pasa sin errores TypeScript
- [ ] `pnpm lint` pasa (si existe — verificar package.json)
- [ ] Diff revisado con `git diff main` antes del push
- [ ] Mensaje de commit sigue conventional commits (sin "Co-Authored-By" — regla global del usuario)
- [ ] Preview deploy en Vercel verde
- [ ] Checklist manual de validación de la fase ejecutado
- [ ] Solo entonces → `git push origin main` → producción

## Apertura de issue de seguimiento

Tras el merge de las 3 fases, abrir issue para:
1. Introducir test suite (Vitest sugerido, alineado con el resto del ecosistema Next.js).
2. Re-correr `seed-gestores.mjs --apply` periódicamente o automatizarlo en CI.
3. Considerar mover `requiresConsejoPopular`/`usesConsejos` también a Firestore para no depender de re-deploys cuando una nueva provincia adopte el flujo de consejos.
