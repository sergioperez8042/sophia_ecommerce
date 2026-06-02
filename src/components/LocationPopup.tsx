"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
  getProvinces,
  getMunicipalities,
  getConsejos,
  requiresConsejoPopular,
} from '@/data/localities';
import { lookupGestorByLocation } from '@/lib/gestor-lookup-client';
import { useLocation } from '@/store/LocationContext';
import { useTheme } from '@/store/ThemeContext';
import { InlineSearchSelect } from '@/components/ui/inline-search-select';

interface LocationPopupProps {
  // Pasando `open` → modo controlado (cancelable con ESC / click fuera).
  // Sin `open` → auto-abre una sola vez si no hay location guardada y
  // fuerza la selección. Modo controlado lo usa el botón "Cambiar".
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LocationPopup({ open, onOpenChange }: LocationPopupProps = {}) {
  const { hasFullLocation, setLocation, location } = useLocation();
  const { isDark } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };

  // Estado de los 3 dropdowns
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedConsejo, setSelectedConsejo] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [consejoSearch, setConsejoSearch] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);
  const [showConsejoDropdown, setShowConsejoDropdown] = useState(false);

  // Auto-abrir solo si no hay location COMPLETA (con consejo). Esto cubre
  // sesiones antiguas que tienen province+municipality guardado pero todavía
  // les falta el consejo del rollout nuevo.
  useEffect(() => {
    if (isControlled) return;
    if (hasFullLocation) return;
    const timer = setTimeout(() => setInternalOpen(true), 500);
    return () => clearTimeout(timer);
  }, [hasFullLocation, isControlled]);

  // Pre-rellenar SOLO en la transición closed→open. Sin este guard, cualquier
  // re-render del padre que cambie la identidad de `location` (el provider
  // crea objeto nuevo cada render) re-corre el efecto y pisa lo que el
  // usuario haya tipeado en la búsqueda mientras el popup está abierto.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (justOpened && location) {
      setSelectedProvince(location.province);
      setSelectedMunicipality(location.municipality);
      setSelectedConsejo(location.consejoPopular ?? '');
      setProvinceSearch(location.province);
      setMunicipalitySearch(location.municipality);
      setConsejoSearch(location.consejoPopular ?? '');
    }
  }, [isOpen, location]);

  // Click-outside: cada InlineSearchSelect lo maneja internamente.

  // Lista de provincias con cobertura (solo La Habana por ahora)
  const allProvinces = useMemo(() => getProvinces(), []);
  // Filtrado tolerante al estado "ya hay algo seleccionado":
  //   - searchTerm vacío → mostramos toda la lista.
  //   - searchTerm === valor seleccionado → mostramos toda la lista
  //     también. Sin esto, al re-abrir el popup pre-rellenado con
  //     "La Habana", el filtro lo cierra a 1 opción y el cliente no
  //     puede ver las otras provincias para cambiar.
  //   - searchTerm distinto al seleccionado → filtramos normal.
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch || provinceSearch === selectedProvince) return allProvinces;
    const term = provinceSearch.toLowerCase();
    return allProvinces.filter((p) => p.toLowerCase().includes(term));
  }, [allProvinces, provinceSearch, selectedProvince]);

  // Municipios de la provincia seleccionada
  const municipalities = useMemo(
    () => (selectedProvince ? getMunicipalities(selectedProvince) : []),
    [selectedProvince],
  );
  const filteredMunicipalities = useMemo(() => {
    if (!municipalitySearch || municipalitySearch === selectedMunicipality) return municipalities;
    const term = municipalitySearch.toLowerCase();
    return municipalities.filter((m) => m.toLowerCase().includes(term));
  }, [municipalities, municipalitySearch, selectedMunicipality]);

  // Si la provincia usa consejos populares (solo La Habana por ahora),
  // mostramos el 3er dropdown. Si no, el flujo es Provincia + Municipio.
  const showConsejoStep = useMemo(
    () => (selectedProvince ? requiresConsejoPopular(selectedProvince) : false),
    [selectedProvince],
  );

  // Consejos del municipio seleccionado (solo cuando la provincia los usa)
  const consejos = useMemo(
    () => (showConsejoStep && selectedProvince && selectedMunicipality
      ? getConsejos(selectedProvince, selectedMunicipality)
      : []),
    [showConsejoStep, selectedProvince, selectedMunicipality],
  );
  const filteredConsejos = useMemo(() => {
    if (!consejoSearch || consejoSearch === selectedConsejo) return consejos;
    const term = consejoSearch.toLowerCase();
    return consejos.filter((c) => c.toLowerCase().includes(term));
  }, [consejos, consejoSearch, selectedConsejo]);

  // Estado del gestor — ahora viene de Firestore (no de localities.ts), así
  // que es asíncrono y vive en useState + useEffect en lugar de useMemo.
  // Aceptamos un pequeño "loading" mientras se resuelve el lookup.
  type GestorStatus =
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'available'; gestorName: string }
    | { state: 'unavailable'; nearby: Array<{ consejo: string; gestorName: string }> };

  const [gestorStatus, setGestorStatus] = useState<GestorStatus>({ state: 'idle' });

  useEffect(() => {
    if (!selectedProvince || !selectedMunicipality) {
      setGestorStatus({ state: 'idle' });
      return;
    }
    if (showConsejoStep && !selectedConsejo) {
      setGestorStatus({ state: 'idle' });
      return;
    }
    let cancelled = false;
    setGestorStatus({ state: 'loading' });

    (async () => {
      try {
        // Lookup server-side (vía /api/gestor-lookup). El navegador NO lee
        // Firestore directo — clave para que funcione desde Cuba, donde esa
        // conexión está restringida. El endpoint devuelve gestor + nearby.
        const { available, gestor, nearby } = await lookupGestorByLocation(
          selectedProvince,
          selectedMunicipality,
          showConsejoStep ? selectedConsejo : undefined,
        );
        if (cancelled) return;
        if (available && gestor) {
          setGestorStatus({ state: 'available', gestorName: gestor.name });
        } else {
          setGestorStatus({ state: 'unavailable', nearby });
        }
      } catch {
        if (cancelled) return;
        setGestorStatus({ state: 'unavailable', nearby: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showConsejoStep, selectedProvince, selectedMunicipality, selectedConsejo]);

  const handleSelectProvince = (name: string) => {
    setSelectedProvince(name);
    setProvinceSearch(name);
    setSelectedMunicipality('');
    setMunicipalitySearch('');
    setSelectedConsejo('');
    setConsejoSearch('');
    setShowProvinceDropdown(false);
  };

  const handleSelectMunicipality = (name: string) => {
    setSelectedMunicipality(name);
    setMunicipalitySearch(name);
    setSelectedConsejo('');
    setConsejoSearch('');
    setShowMunicipalityDropdown(false);
  };

  const handleSelectConsejo = (name: string) => {
    setSelectedConsejo(name);
    setConsejoSearch(name);
    setShowConsejoDropdown(false);
  };

  // El botón Confirmar requiere que se hayan completado los niveles que
  // aplican según la provincia, Y que haya gestor disponible. En el flujo
  // 2-niveles (sin consejo), solo provincia + municipio + gestor.
  const canConfirm =
    !!selectedProvince &&
    !!selectedMunicipality &&
    (!showConsejoStep || !!selectedConsejo) &&
    gestorStatus.state === 'available';

  const handleConfirm = () => {
    if (canConfirm) {
      setLocation({
        province: selectedProvince,
        municipality: selectedMunicipality,
        // El consejo solo se guarda si la provincia lo usa
        ...(showConsejoStep && selectedConsejo
          ? { consejoPopular: selectedConsejo }
          : {}),
      });
      setIsOpen(false);
    }
  };

  // Theme-aware colors (los selectores de provincia/municipio/consejo viven
  // ahora en InlineSearchSelect; aquí quedan solo los colores del modal
  // wrapper y los banners de status)
  const bg = isDark ? 'bg-[#15241B]' : 'bg-white';
  const border = isDark ? 'border-[#C9A96E]/20' : 'border-[#2E4A3A]/15';
  const accent = isDark ? 'text-[#C9A96E]' : 'text-[#2E4A3A]';
  const accentBg = isDark ? 'bg-[#C9A96E]/10' : 'bg-[#2E4A3A]/10';
  const textSecondary = isDark ? 'text-[#d4cdc0]/80' : 'text-gray-500';
  const btnBg = isDark ? 'bg-[#C9A96E] hover:bg-[#b5a680] text-[#15241B]' : 'bg-[#2E4A3A] hover:bg-[#26402F] text-white';
  // Colores del feedback de gestor (success verde, warning ámbar)
  const successBg = isDark ? 'bg-green-500/10' : 'bg-green-50';
  const successBorder = isDark ? 'border-green-500/30' : 'border-green-200';
  const successText = isDark ? 'text-green-300' : 'text-green-800';
  const warnBg = isDark ? 'bg-amber-500/10' : 'bg-amber-50';
  const warnBorder = isDark ? 'border-amber-500/30' : 'border-amber-200';
  const warnText = isDark ? 'text-amber-300' : 'text-amber-800';
  const warnLink = isDark ? 'text-amber-200 hover:text-amber-100' : 'text-amber-900 hover:text-amber-700';

  // Permitir cerrar con ESC / click fuera SOLO cuando ya hay una location
  // completa guardada (el cliente está cambiando algo que ya eligió antes,
  // debe poder cancelar). Primera visita o location incompleta → forzamos
  // selección bloqueando el dismiss. Esta condición sirve tanto si el popup
  // se abrió automáticamente como si se abrió desde el botón "Cambiar".
  const dismissProps = hasFullLocation
    ? {}
    : {
        onEscapeKeyDown: (e: Event) => e.preventDefault(),
        onPointerDownOutside: (e: Event) => e.preventDefault(),
        onInteractOutside: (e: Event) => e.preventDefault(),
      };

  return (
    <Dialog.Root open={isOpen} onOpenChange={isControlled ? setIsOpen : () => {}}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <m.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild {...dismissProps}>
              {/* Posicionamiento responsive del popup:
                  - Mobile (< sm): anclado arriba (top-3) y alto máximo
                    100dvh - margen. Sin centrar verticalmente porque al
                    aparecer el teclado iOS el popup centrado quedaría detrás.
                    `dvh` (dynamic viewport height) SÍ se ajusta al teclado,
                    a diferencia de `vh`. Soporte: iOS 15.4+, Android Chrome.
                  - Desktop (sm+): centrado normal como antes.
                  El popup mismo es flex column para que el CTA quede sticky
                  abajo y el contenido scrollee por dentro. */}
              <m.div
                className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] sm:w-[90vw] max-w-md
                           top-3 sm:top-1/2 sm:-translate-y-1/2
                           max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh]
                           flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`${bg} border ${border} rounded-2xl relative shadow-2xl flex flex-col overflow-hidden`}>
                  {/* Contenido scrolleable */}
                  <div className="overflow-y-auto p-5 sm:p-8 pb-3 sm:pb-3 overscroll-contain">
                  {/* Botón X de cerrar — solo visible cuando ya hay una
                      location completa guardada (el cliente está cambiando,
                      puede cancelar). Primera visita: forzar selección, no
                      mostramos X. Coherente con dismissProps de arriba. */}
                  {hasFullLocation && (
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Cerrar"
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center h-10 w-10 rounded-xl transition-colors z-10 ${isDark ? 'text-[#C9A96E]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10' : 'text-[#2E4A3A]/60 hover:text-[#2E4A3A] hover:bg-[#2E4A3A]/10'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${accentBg} flex items-center justify-center mb-4`}>
                    <MapPin className={`w-6 h-6 ${accent}`} />
                  </div>

                  <Dialog.Title className={`text-xl font-semibold ${accent} mb-2`}>
                    Selecciona tu ubicación
                  </Dialog.Title>
                  <Dialog.Description className={`text-sm ${textSecondary} mb-4 leading-relaxed`}>
                    Para asignarte un gestor de venta, necesitamos saber tu zona exacta.
                  </Dialog.Description>

                  {/* Cobertura actual — aviso al cliente de que solo las
                      provincias listadas en el dropdown tienen entregas.
                      Reduce confusión cuando alguien busca una provincia
                      que aún no incorporamos. */}
                  <div
                    className={`flex items-start gap-2.5 mb-5 px-3 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-[#C9A96E]/8 border-[#C9A96E]/25 text-[#d4cdc0]'
                        : 'bg-[#2E4A3A]/5 border-[#2E4A3A]/20 text-[#2E4A3A]'
                    }`}
                    role="note"
                  >
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
                    <p className="text-xs leading-relaxed">
                      Por el momento solo hacemos entregas en las provincias listadas abajo. Estamos sumando más zonas progresivamente.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Province */}
                    <InlineSearchSelect
                      label="Provincia"
                      searchTerm={provinceSearch}
                      onSearchTermChange={(v) => {
                        setProvinceSearch(v);
                        // Si el usuario empieza a tipear algo distinto al
                        // canónico ya elegido, limpiamos cascada
                        if (selectedProvince && v !== selectedProvince) {
                          setSelectedProvince('');
                          setSelectedMunicipality('');
                          setMunicipalitySearch('');
                          setSelectedConsejo('');
                          setConsejoSearch('');
                        }
                      }}
                      selected={selectedProvince}
                      options={filteredProvinces}
                      onSelect={handleSelectProvince}
                      isOpen={showProvinceDropdown}
                      onOpenChange={setShowProvinceDropdown}
                      placeholder="Buscar provincia..."
                      emptyMessage="No se encontraron provincias"
                      isDark={isDark}
                      testId="province-select"
                    />

                    {/* Municipality */}
                    <InlineSearchSelect
                      label="Municipio"
                      searchTerm={municipalitySearch}
                      onSearchTermChange={(v) => {
                        setMunicipalitySearch(v);
                        if (selectedMunicipality && v !== selectedMunicipality) {
                          setSelectedMunicipality('');
                          setSelectedConsejo('');
                          setConsejoSearch('');
                        }
                      }}
                      selected={selectedMunicipality}
                      options={filteredMunicipalities}
                      onSelect={handleSelectMunicipality}
                      isOpen={showMunicipalityDropdown}
                      onOpenChange={setShowMunicipalityDropdown}
                      placeholder={selectedProvince ? 'Buscar municipio...' : 'Selecciona primero una provincia'}
                      emptyMessage="No se encontraron municipios"
                      disabled={!selectedProvince}
                      isDark={isDark}
                      testId="municipality-select"
                    />

                    {/* Consejo Popular — solo si la provincia lo usa (La Habana) */}
                    {showConsejoStep && (
                      <InlineSearchSelect
                        label="Consejo Popular / Localidad"
                        searchTerm={consejoSearch}
                        onSearchTermChange={(v) => {
                          setConsejoSearch(v);
                          if (selectedConsejo && v !== selectedConsejo) {
                            setSelectedConsejo('');
                          }
                        }}
                        selected={selectedConsejo}
                        options={filteredConsejos}
                        onSelect={handleSelectConsejo}
                        isOpen={showConsejoDropdown}
                        onOpenChange={setShowConsejoDropdown}
                        placeholder={selectedMunicipality ? 'Buscar consejo popular...' : 'Selecciona primero un municipio'}
                        emptyMessage="No se encontraron consejos populares"
                        disabled={!selectedMunicipality}
                        isDark={isDark}
                        testId="consejo-select"
                      />
                    )}
                  </div>

                  {/* Feedback del gestor — aparece cuando hay datos suficientes
                      para el lookup (consejo si la provincia lo usa, municipio
                      si no) */}
                  {gestorStatus.state === 'available' && (
                    <div
                      className={`mt-4 ${successBg} border ${successBorder} rounded-xl p-3 flex items-start gap-2.5`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${successText} flex-shrink-0 mt-0.5`} />
                      <div className={`text-sm ${successText} leading-relaxed`}>
                        <span className="font-semibold">Cobertura disponible.</span>{' '}
                        Tu gestor de zona es <span className="font-semibold">{gestorStatus.gestorName}</span>.
                      </div>
                    </div>
                  )}
                  {gestorStatus.state === 'unavailable' && (
                    <div
                      className={`mt-4 ${warnBg} border ${warnBorder} rounded-xl p-3`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className={`w-5 h-5 ${warnText} flex-shrink-0 mt-0.5`} />
                        <div className={`text-sm ${warnText} leading-relaxed`}>
                          <span className="font-semibold">Aún no tenemos gestor en esta zona.</span>
                          {gestorStatus.nearby.length > 0 ? (
                            <> Selecciona un consejo cercano del mismo municipio:</>
                          ) : (
                            <> Por favor, elige otro municipio.</>
                          )}
                        </div>
                      </div>
                      {gestorStatus.nearby.length > 0 && (
                        <div className="mt-2 ml-7 flex flex-wrap gap-1.5">
                          {gestorStatus.nearby.map((n) => (
                            <button
                              key={n.consejo}
                              onClick={() => handleSelectConsejo(n.consejo)}
                              className={`text-xs ${warnLink} underline underline-offset-2`}
                            >
                              {n.consejo} ({n.gestorName})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  </div>
                  {/* Sticky footer con el CTA: el botón Confirmar SIEMPRE
                      queda visible aunque el teclado virtual de iOS aparezca
                      o la lista de opciones sea larga. Si lo dejábamos al
                      final del scrollable, en mobile con teclado abierto el
                      cliente perdía el botón. */}
                  <div className={`flex-shrink-0 px-5 sm:px-8 py-3 sm:py-4 ${bg} border-t ${border}`}>
                    <button
                      onClick={handleConfirm}
                      disabled={!canConfirm}
                      className={`w-full min-h-[44px] ${btnBg} py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      Confirmar ubicación
                    </button>
                  </div>
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
