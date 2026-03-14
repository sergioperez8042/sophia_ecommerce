"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { CUBA_PROVINCES } from '@/data/cuba-locations';
import { useLocation } from '@/store/LocationContext';

export default function LocationPopup() {
  const { hasLocation, setLocation } = useLocation();
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
    // Don't show if already has location
    if (hasLocation) return;

    // Show immediately - mandatory, no dismiss option
    const timer = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(timer);
  }, [hasLocation]);

  // Close dropdowns when clicking outside
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
    return CUBA_PROVINCES.filter((p) =>
      p.name.toLowerCase().includes(term)
    );
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={() => {/* mandatory - cannot close without selecting */}}>
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
                <div className="bg-[#1a1d19] border border-[#C4B590]/20 rounded-2xl p-6 sm:p-8 relative shadow-2xl">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#C4B590]/10 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-[#C4B590]" />
                  </div>

                  <Dialog.Title className="text-xl font-semibold text-[#C4B590] mb-2">
                    Selecciona tu ubicacion
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-[#d4cdc0]/80 mb-6 leading-relaxed">
                    Para ofrecerte el mejor servicio de entrega, necesitamos saber donde te encuentras.
                  </Dialog.Description>

                  {/* Province selector */}
                  <div className="space-y-4">
                    <div ref={provinceRef} className="relative">
                      <label className="text-xs text-[#C4B590]/60 uppercase tracking-wider mb-1.5 block">
                        Provincia
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B590]/40" />
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
                          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-[#C4B590]/20 rounded-xl text-[#e8e0d0] placeholder-[#C4B590]/30 text-sm focus:outline-none focus:border-[#C4B590]/50"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B590]/40" />
                      </div>
                      {showProvinceDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-[#22261f] border border-[#C4B590]/20 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                          {filteredProvinces.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#C4B590]/50">
                              No se encontraron provincias
                            </div>
                          ) : (
                            filteredProvinces.map((p) => (
                              <button
                                key={p.name}
                                onClick={() => handleSelectProvince(p.name)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#C4B590]/10 transition-colors ${
                                  selectedProvince === p.name
                                    ? 'text-[#C4B590] bg-[#C4B590]/5'
                                    : 'text-[#d4cdc0]'
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
                      <label className="text-xs text-[#C4B590]/60 uppercase tracking-wider mb-1.5 block">
                        Municipio
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B590]/40" />
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
                          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-[#C4B590]/20 rounded-xl text-[#e8e0d0] placeholder-[#C4B590]/30 text-sm focus:outline-none focus:border-[#C4B590]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4B590]/40" />
                      </div>
                      {showMunicipalityDropdown && selectedProvince && (
                        <div className="absolute z-10 w-full mt-1 bg-[#22261f] border border-[#C4B590]/20 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                          {filteredMunicipalities.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[#C4B590]/50">
                              No se encontraron municipios
                            </div>
                          ) : (
                            filteredMunicipalities.map((m) => (
                              <button
                                key={m}
                                onClick={() => handleSelectMunicipality(m)}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#C4B590]/10 transition-colors ${
                                  selectedMunicipality === m
                                    ? 'text-[#C4B590] bg-[#C4B590]/5'
                                    : 'text-[#d4cdc0]'
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
                    className="w-full mt-6 bg-[#C4B590] hover:bg-[#b5a680] text-[#1a1d19] py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirmar ubicacion
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
