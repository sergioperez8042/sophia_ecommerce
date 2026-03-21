"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { CUBA_PROVINCES } from '@/data/cuba-locations';
import { useLocation } from '@/store/LocationContext';
import { useTheme } from '@/store/ThemeContext';

export default function LocationPopup() {
  const { hasLocation, setLocation } = useLocation();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);
  const provinceRef = useRef<HTMLDivElement>(null);
  const municipalityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasLocation) return;
    const timer = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(timer);
  }, [hasLocation]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setShowProvinceDropdown(false);
      }
      if (municipalityRef.current && !municipalityRef.current.contains(e.target as Node)) {
        setShowMunicipalityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return CUBA_PROVINCES;
    const term = provinceSearch.toLowerCase();
    return CUBA_PROVINCES.filter((p) => p.name.toLowerCase().includes(term));
  }, [provinceSearch]);

  const municipalities = useMemo(() => {
    if (!selectedProvince) return [];
    const province = CUBA_PROVINCES.find((p) => p.name === selectedProvince);
    return province?.municipalities || [];
  }, [selectedProvince]);

  const filteredMunicipalities = useMemo(() => {
    if (!municipalitySearch) return municipalities;
    const term = municipalitySearch.toLowerCase();
    return municipalities.filter((m) => m.toLowerCase().includes(term));
  }, [municipalities, municipalitySearch]);

  const handleSelectProvince = (name: string) => {
    setSelectedProvince(name);
    setProvinceSearch(name);
    setSelectedMunicipality('');
    setMunicipalitySearch('');
    setShowProvinceDropdown(false);
  };

  const handleSelectMunicipality = (name: string) => {
    setSelectedMunicipality(name);
    setMunicipalitySearch(name);
    setShowMunicipalityDropdown(false);
  };

  const handleConfirm = () => {
    if (selectedProvince && selectedMunicipality) {
      setLocation({ province: selectedProvince, municipality: selectedMunicipality });
      setIsOpen(false);
    }
  };

  // Theme-aware colors
  const bg = isDark ? 'bg-[#1a1d19]' : 'bg-white';
  const border = isDark ? 'border-[#C4B590]/20' : 'border-[#505A4A]/15';
  const accent = isDark ? 'text-[#C4B590]' : 'text-[#505A4A]';
  const accentBg = isDark ? 'bg-[#C4B590]/10' : 'bg-[#505A4A]/10';
  const textPrimary = isDark ? 'text-[#e8e0d0]' : 'text-gray-900';
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {}}>
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
            <Dialog.Content asChild onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
              <m.div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md"
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
                    Para ofrecerte el mejor servicio de entrega, necesitamos saber donde te encuentras.
                  </Dialog.Description>

                  {/* Province selector */}
                  <div className="space-y-4">
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
                                key={p.name}
                                onClick={() => handleSelectProvince(p.name)}
                                className={`w-full text-left px-4 py-2.5 text-sm ${optionHover} transition-colors ${
                                  selectedProvince === p.name ? optionActive : optionText
                                }`}
                              >
                                {p.name}
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
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedProvince || !selectedMunicipality}
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
