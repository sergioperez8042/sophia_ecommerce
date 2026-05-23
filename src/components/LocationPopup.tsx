"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getProvinces,
  getMunicipalities,
  getConsejos,
  findGestorNameForLocality,
  findGestorNameForMunicipality,
  getNearbyConsejosWithGestor,
  requiresConsejoPopular,
} from '@/data/localities';
import { useLocation } from '@/store/LocationContext';
import { useTheme } from '@/store/ThemeContext';

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
  const provinceRef = useRef<HTMLDivElement>(null);
  const municipalityRef = useRef<HTMLDivElement>(null);
  const consejoRef = useRef<HTMLDivElement>(null);

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

  // Click outside cierra cualquier dropdown abierto
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setShowProvinceDropdown(false);
      }
      if (municipalityRef.current && !municipalityRef.current.contains(e.target as Node)) {
        setShowMunicipalityDropdown(false);
      }
      if (consejoRef.current && !consejoRef.current.contains(e.target as Node)) {
        setShowConsejoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lista de provincias con cobertura (solo La Habana por ahora)
  const allProvinces = useMemo(() => getProvinces(), []);
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return allProvinces;
    const term = provinceSearch.toLowerCase();
    return allProvinces.filter((p) => p.toLowerCase().includes(term));
  }, [allProvinces, provinceSearch]);

  // Municipios de la provincia seleccionada
  const municipalities = useMemo(
    () => (selectedProvince ? getMunicipalities(selectedProvince) : []),
    [selectedProvince],
  );
  const filteredMunicipalities = useMemo(() => {
    if (!municipalitySearch) return municipalities;
    const term = municipalitySearch.toLowerCase();
    return municipalities.filter((m) => m.toLowerCase().includes(term));
  }, [municipalities, municipalitySearch]);

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
    if (!consejoSearch) return consejos;
    const term = consejoSearch.toLowerCase();
    return consejos.filter((c) => c.toLowerCase().includes(term));
  }, [consejos, consejoSearch]);

  // Estado del gestor — la lógica depende de si la provincia usa consejos
  // o no:
  //   - Con consejos: el feedback aparece al seleccionar el consejo
  //   - Sin consejos: el feedback aparece al seleccionar el municipio
  const gestorStatus = useMemo(() => {
    if (!selectedProvince || !selectedMunicipality) {
      return { state: 'idle' as const };
    }
    if (showConsejoStep) {
      if (!selectedConsejo) return { state: 'idle' as const };
      const gestorName = findGestorNameForLocality(
        selectedProvince,
        selectedMunicipality,
        selectedConsejo,
      );
      if (gestorName) return { state: 'available' as const, gestorName };
      return {
        state: 'unavailable' as const,
        nearby: getNearbyConsejosWithGestor(selectedProvince, selectedMunicipality),
      };
    }
    // Flujo 2-niveles (Matanzas y futuras)
    const gestorName = findGestorNameForMunicipality(
      selectedProvince,
      selectedMunicipality,
    );
    if (gestorName) return { state: 'available' as const, gestorName };
    return { state: 'unavailable' as const, nearby: [] };
  }, [
    showConsejoStep,
    selectedProvince,
    selectedMunicipality,
    selectedConsejo,
  ]);

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

  // Theme-aware colors
  const bg = isDark ? 'bg-[#1a1d19]' : 'bg-white';
  const border = isDark ? 'border-[#C4B590]/20' : 'border-[#505A4A]/15';
  const accent = isDark ? 'text-[#C4B590]' : 'text-[#505A4A]';
  const accentBg = isDark ? 'bg-[#C4B590]/10' : 'bg-[#505A4A]/10';
  const textSecondary = isDark ? 'text-[#d4cdc0]/80' : 'text-gray-500';
  const labelColor = isDark ? 'text-[#C4B590]/60' : 'text-[#505A4A]/60';
  const inputBg = isDark ? 'bg-white/5' : 'bg-gray-50';
  const inputBorder = isDark ? 'border-[#C4B590]/20' : 'border-gray-200';
  const inputText = isDark ? 'text-[#e8e0d0]' : 'text-gray-900';
  const inputPlaceholder = isDark ? 'placeholder-[#C4B590]/30' : 'placeholder-gray-400';
  const inputFocus = isDark ? 'focus:border-[#C4B590]/50' : 'focus:border-[#505A4A]/40';
  const iconColor = isDark ? 'text-[#C4B590]/40' : 'text-[#505A4A]/40';
  const dropdownBg = isDark ? 'bg-[#22261f]' : 'bg-white';
  const dropdownBorder = isDark ? 'border-[#C4B590]/20' : 'border-gray-200';
  const optionHover = isDark ? 'hover:bg-[#C4B590]/10' : 'hover:bg-[#505A4A]/5';
  const optionText = isDark ? 'text-[#d4cdc0]' : 'text-gray-700';
  const optionActive = isDark ? 'text-[#C4B590] bg-[#C4B590]/5' : 'text-[#505A4A] bg-[#505A4A]/5';
  const emptyText = isDark ? 'text-[#C4B590]/50' : 'text-gray-400';
  const btnBg = isDark ? 'bg-[#C4B590] hover:bg-[#b5a680] text-[#1a1d19]' : 'bg-[#505A4A] hover:bg-[#414A3C] text-white';
  // Colores del feedback de gestor (success verde, warning ámbar)
  const successBg = isDark ? 'bg-green-500/10' : 'bg-green-50';
  const successBorder = isDark ? 'border-green-500/30' : 'border-green-200';
  const successText = isDark ? 'text-green-300' : 'text-green-800';
  const warnBg = isDark ? 'bg-amber-500/10' : 'bg-amber-50';
  const warnBorder = isDark ? 'border-amber-500/30' : 'border-amber-200';
  const warnText = isDark ? 'text-amber-300' : 'text-amber-800';
  const warnLink = isDark ? 'text-amber-200 hover:text-amber-100' : 'text-amber-900 hover:text-amber-700';

  // En modo controlado permitimos cerrar con ESC / click fuera (el user inició
  // un "Cambiar" intencional, debe poder cancelarlo). En modo auto (primera
  // visita) bloqueamos el dismiss para forzar la selección.
  const dismissProps = isControlled
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
              <m.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`${bg} border ${border} rounded-2xl p-6 sm:p-8 relative shadow-2xl`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${accentBg} flex items-center justify-center mb-4`}>
                    <MapPin className={`w-6 h-6 ${accent}`} />
                  </div>

                  <Dialog.Title className={`text-xl font-semibold ${accent} mb-2`}>
                    Selecciona tu ubicación
                  </Dialog.Title>
                  <Dialog.Description className={`text-sm ${textSecondary} mb-6 leading-relaxed`}>
                    Para asignarte un gestor de venta, necesitamos saber tu zona exacta.
                  </Dialog.Description>

                  <div className="space-y-4">
                    {/* Province selector */}
                    <div ref={provinceRef} className="relative">
                      <label className={`text-xs ${labelColor} uppercase tracking-wider mb-1.5 block`}>
                        Provincia
                      </label>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                        <input
                          type="text"
                          value={provinceSearch}
                          onChange={(e) => {
                            setProvinceSearch(e.target.value);
                            setShowProvinceDropdown(true);
                            if (selectedProvince && e.target.value !== selectedProvince) {
                              setSelectedProvince('');
                              setSelectedMunicipality('');
                              setMunicipalitySearch('');
                              setSelectedConsejo('');
                              setConsejoSearch('');
                            }
                          }}
                          onFocus={() => setShowProvinceDropdown(true)}
                          placeholder="Buscar provincia..."
                          className={`w-full pl-10 pr-10 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${inputPlaceholder} text-sm focus:outline-none ${inputFocus}`}
                        />
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                      </div>
                      {showProvinceDropdown && (
                        <div className={`absolute z-10 w-full mt-1 ${dropdownBg} border ${dropdownBorder} rounded-xl max-h-48 overflow-y-auto shadow-xl`}>
                          {filteredProvinces.length === 0 ? (
                            <div className={`px-4 py-3 text-sm ${emptyText}`}>
                              No se encontraron provincias
                            </div>
                          ) : (
                            filteredProvinces.map((p) => (
                              <button
                                key={p}
                                onClick={() => handleSelectProvince(p)}
                                className={`w-full text-left px-4 py-2.5 text-sm ${optionHover} transition-colors ${
                                  selectedProvince === p ? optionActive : optionText
                                }`}
                              >
                                {p}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Municipality selector */}
                    <div ref={municipalityRef} className="relative">
                      <label className={`text-xs ${labelColor} uppercase tracking-wider mb-1.5 block`}>
                        Municipio
                      </label>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                        <input
                          type="text"
                          value={municipalitySearch}
                          onChange={(e) => {
                            setMunicipalitySearch(e.target.value);
                            setShowMunicipalityDropdown(true);
                            if (selectedMunicipality && e.target.value !== selectedMunicipality) {
                              setSelectedMunicipality('');
                              setSelectedConsejo('');
                              setConsejoSearch('');
                            }
                          }}
                          onFocus={() => {
                            if (selectedProvince) setShowMunicipalityDropdown(true);
                          }}
                          placeholder={selectedProvince ? 'Buscar municipio...' : 'Selecciona primero una provincia'}
                          disabled={!selectedProvince}
                          className={`w-full pl-10 pr-10 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${inputPlaceholder} text-sm focus:outline-none ${inputFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
                        />
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                      </div>
                      {showMunicipalityDropdown && selectedProvince && (
                        <div className={`absolute z-10 w-full mt-1 ${dropdownBg} border ${dropdownBorder} rounded-xl max-h-48 overflow-y-auto shadow-xl`}>
                          {filteredMunicipalities.length === 0 ? (
                            <div className={`px-4 py-3 text-sm ${emptyText}`}>
                              No se encontraron municipios
                            </div>
                          ) : (
                            filteredMunicipalities.map((m) => (
                              <button
                                key={m}
                                onClick={() => handleSelectMunicipality(m)}
                                className={`w-full text-left px-4 py-2.5 text-sm ${optionHover} transition-colors ${
                                  selectedMunicipality === m ? optionActive : optionText
                                }`}
                              >
                                {m}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Consejo Popular selector — el 3er nivel.
                        Solo se renderiza si la provincia seleccionada lo usa
                        (por ahora, solo La Habana). El resto de provincias
                        cobran cobertura a nivel municipio. */}
                    {showConsejoStep && (
                    <div ref={consejoRef} className="relative">
                      <label className={`text-xs ${labelColor} uppercase tracking-wider mb-1.5 block`}>
                        Consejo Popular / Localidad
                      </label>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                        <input
                          type="text"
                          value={consejoSearch}
                          onChange={(e) => {
                            setConsejoSearch(e.target.value);
                            setShowConsejoDropdown(true);
                            if (selectedConsejo && e.target.value !== selectedConsejo) {
                              setSelectedConsejo('');
                            }
                          }}
                          onFocus={() => {
                            if (selectedMunicipality) setShowConsejoDropdown(true);
                          }}
                          placeholder={selectedMunicipality ? 'Buscar consejo popular...' : 'Selecciona primero un municipio'}
                          disabled={!selectedMunicipality}
                          className={`w-full pl-10 pr-10 py-3 ${inputBg} border ${inputBorder} rounded-xl ${inputText} ${inputPlaceholder} text-sm focus:outline-none ${inputFocus} disabled:opacity-40 disabled:cursor-not-allowed`}
                        />
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                      </div>
                      {showConsejoDropdown && selectedMunicipality && (
                        <div className={`absolute z-10 w-full mt-1 ${dropdownBg} border ${dropdownBorder} rounded-xl max-h-48 overflow-y-auto shadow-xl`}>
                          {filteredConsejos.length === 0 ? (
                            <div className={`px-4 py-3 text-sm ${emptyText}`}>
                              No se encontraron consejos populares
                            </div>
                          ) : (
                            filteredConsejos.map((c) => (
                              <button
                                key={c}
                                onClick={() => handleSelectConsejo(c)}
                                className={`w-full text-left px-4 py-2.5 text-sm ${optionHover} transition-colors ${
                                  selectedConsejo === c ? optionActive : optionText
                                }`}
                              >
                                {c}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
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

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className={`w-full mt-6 ${btnBg} py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Confirmar ubicación
                  </button>
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
