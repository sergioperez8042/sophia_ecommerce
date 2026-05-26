"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/store';
import { GestorService, GestorAccountService } from '@/lib/firestore-services';
import { IGestor, GESTOR_PERMISSIONS, GestorPermission, DEFAULT_GESTOR_PERMISSIONS } from '@/entities/all';
import { CUBA_PROVINCES } from '@/data/cuba-locations';
import { getConsejos, requiresConsejoPopular } from '@/data/localities';
import {
  Users,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Loader2,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Camera,
  Pencil,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  PhoneInput,
  digitsToE164,
  e164ToDigits,
  isValidPhoneNumber,
} from '@/components/ui/phone-input';
import MultiSearchableDropdown from '@/components/ui/multi-searchable-dropdown';
import Switch from '@/components/ui/switch';

export default function GestoresAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated, getIdToken } = useAuth();
  const [gestores, setGestores] = useState<IGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  // Errores ahora van por toast.error (sonner, auto-cierre 4s). No más
  // banner persistente — el state `error` se eliminó.

  // Form state
  const [name, setName] = useState('');
  // El input almacena el número en formato E.164 (+5352010900). Para
  // Firestore guardamos solo dígitos (5352010900) — los helpers
  // digitsToE164 / e164ToDigits se ocupan de la conversión.
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined);
  // Multi-provincia: un gestor puede cubrir varias (ej. Marian → Santiago de
  // Cuba + Granma). En la UI se renderiza como checkbox grid.
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  // Consejos populares cubiertos por el gestor (solo cuando alguna provincia
  // seleccionada tiene usesConsejos=true en localities.ts, ej. La Habana).
  // Cada item identifica un consejo específico dentro de un municipio.
  const [selectedConsejos, setSelectedConsejos] = useState<Array<{ municipality: string; consejo: string }>>([]);
  // (provinceSearch / municipalitySearch eliminados — el buscador vive ahora
  // dentro de cada MultiSearchableDropdown)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Account credentials
  const [gestorEmail, setGestorEmail] = useState('');
  const [gestorPassword, setGestorPassword] = useState('');
  const [showGestorPassword, setShowGestorPassword] = useState(false);
  const [createAccount, setCreateAccount] = useState(true);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Permissions
  const [permissions, setPermissions] = useState<GestorPermission[]>([...DEFAULT_GESTOR_PERMISSIONS]);

  useEffect(() => {
    if (isLoaded && (!isAuthenticated || !isAdmin)) {
      router.push('/auth');
    }
  }, [isLoaded, isAuthenticated, isAdmin, router]);

  const loadGestores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await GestorService.getAll();
      setGestores(data);
    } catch {
      // Error loading
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadGestores();
  }, [isAdmin, loadGestores]);

  const resetForm = () => {
    setName('');
    setWhatsapp(undefined);
    setProvinces([]);
    setSelectedMunicipalities([]);
    setSelectedConsejos([]);
    setPhotoFile(null);
    setPhotoPreview('');
    setEditingId(null);
    setShowForm(false);
    setGestorEmail('');
    setGestorPassword('');
    setShowGestorPassword(false);
    setCreateAccount(true);
    setCreatedCredentials(null);
    setPermissions([...DEFAULT_GESTOR_PERMISSIONS]);
  };

  const handleEdit = (gestor: IGestor) => {
    setEditingId(gestor.id);
    setName(gestor.name);
    // Firestore guarda dígitos sueltos ('5352010900') — el componente
    // necesita E.164 con + ('+5352010900').
    setWhatsapp(digitsToE164(gestor.whatsapp));
    // Backward-compat: tolerar docs viejos con `province` singular hasta que
    // el re-seed actualice todos a `provinces: []`.
    const gestorAsLegacy = gestor as IGestor & { province?: string };
    const provs = gestor.provinces ?? (gestorAsLegacy.province ? [gestorAsLegacy.province] : []);
    setProvinces(provs);
    setSelectedMunicipalities([...gestor.municipalities]);
    setSelectedConsejos(gestor.consejos ? [...gestor.consejos] : []);
    setPhotoFile(null);
    setPhotoPreview(gestor.photoUrl || '');
    setGestorEmail(gestor.email || '');
    setGestorPassword('');
    // Importante: al editar, NUNCA forzamos el checkbox de "Crear cuenta".
    // Si lo hacíamos, un admin que solo quería cambiar la foto se topaba con
    // la validación de email+password al guardar. Si quieren crear/reparar
    // la cuenta, marcan el checkbox manualmente.
    setCreateAccount(false);
    setPermissions(gestor.permissions ? [...gestor.permissions] : [...DEFAULT_GESTOR_PERMISSIONS]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;
    setUploadingPhoto(true);
    try {
      const token = await getIdToken();
      const formData = new FormData();
      formData.append('file', photoFile);
      formData.append('folder', 'gestores');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir foto');
      return data.url;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedField(field);
    toast.success('Copiado');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setGestorPassword(pwd);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSave = async () => {
    // Validación contextual: en lugar de un early-return silencioso, decimos
    // exactamente qué campo falta para que el admin no se quede mirando el
    // botón "Guardar" pensando que la web no funciona.
    if (!name.trim()) {
      toast.error('Falta el nombre del gestor.');
      return;
    }
    if (!whatsapp) {
      toast.error('Falta el número de WhatsApp.');
      return;
    }
    if (provinces.length === 0) {
      toast.error('Selecciona al menos una provincia.');
      return;
    }
    if (selectedMunicipalities.length === 0) {
      toast.error('Selecciona al menos un municipio.');
      return;
    }

    // Validación E.164: el `PhoneInput` formatea visualmente mientras se
    // tipea, pero permite estados intermedios incompletos ("+535"). Si
    // el usuario intenta guardar sin terminar de teclear, libphonenumber
    // lo rechaza y avisamos por toast.
    if (!isValidPhoneNumber(whatsapp)) {
      toast.error('Número de teléfono inválido. Verifica el código de país y el largo.');
      return;
    }

    const editingGestor = editingId ? gestores.find(g => g.id === editingId) : null;

    // Validación de duplicados (excluye al propio gestor cuando editamos).
    //
    // Permitimos nombres repetidos — el cliente puede tener dos "Marian" o dos
    // "Heydi" cubriendo zonas distintas, y obligarles a inventarse alias
    // ("Marian 2") rompe la naturalidad. El gestor se identifica internamente
    // por su `id` en Firestore, no por el nombre, así que duplicarlo no
    // genera ambigüedad en findByLocation.
    //
    // Lo que SÍ bloqueamos: teléfono WhatsApp duplicado (dos gestores con
    // el mismo número causaría que un mensaje al gestor X llegara a una
    // persona que cubre la zona Y). Y email duplicado (login de cuenta).
    const cleanWhatsapp = e164ToDigits(whatsapp);
    const duplicatePhone = gestores.find(g => g.whatsapp === cleanWhatsapp && g.id !== editingId);
    if (duplicatePhone) {
      toast.error(`Ya existe un gestor con ese número de WhatsApp (${duplicatePhone.name}).`);
      return;
    }
    if (gestorEmail) {
      const duplicateEmail = gestores.find(g => g.email?.toLowerCase() === gestorEmail.trim().toLowerCase() && g.id !== editingId);
      if (duplicateEmail) {
        toast.error(`Ya existe un gestor con ese email (${duplicateEmail.name}).`);
        return;
      }
    }

    const needsAccount = createAccount && !editingGestor?.userId;
    if (needsAccount && (!gestorEmail || !gestorPassword)) {
      toast.error('Email y contraseña son requeridos para crear la cuenta del gestor.');
      return;
    }
    if (needsAccount && gestorEmail && !isValidEmail(gestorEmail)) {
      toast.error('El email no es válido. Verifica que tenga formato correcto (ej: nombre@email.com)');
      return;
    }
    if (needsAccount && gestorPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    // (banner persistente eliminado — los errores van por toast.error)
    let accountCreated = false;
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Filtrar consejos: solo guardar los que corresponden a municipios
      // todavía seleccionados (evita orphans si admin deseleccionó un muni
      // después de marcar sus consejos)
      const cleanConsejos = selectedConsejos.filter((c) =>
        selectedMunicipalitiesSet.has(c.municipality),
      );

      const gestorData = {
        name,
        whatsapp: e164ToDigits(whatsapp),
        provinces,
        municipalities: selectedMunicipalities,
        consejos: cleanConsejos,
        active: true,
        permissions,
        ...(photoUrl ? { photoUrl } : {}),
        ...(gestorEmail ? { email: gestorEmail.trim().toLowerCase() } : {}),
      };

      if (editingId) {
        await GestorService.update(editingId, gestorData);
        // If editing and needs account, create it now
        if (needsAccount && gestorEmail && gestorPassword) {
          try {
            await GestorAccountService.createAccount({
              email: gestorEmail.trim(),
              password: gestorPassword,
              name,
              gestorId: editingId,
            });
            setCreatedCredentials({ email: gestorEmail.trim(), password: gestorPassword });
            accountCreated = true;
            toast.success('Gestor actualizado y cuenta creada');
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error al crear la cuenta';
            toast.error(`Gestor actualizado pero error al crear cuenta: ${errorMsg}`);
          }
        } else {
          toast.success('Gestor actualizado correctamente');
        }
      } else {
        // Create the gestor doc first
        const newGestor = await GestorService.create(gestorData);

        // If account creation is enabled, create the Firebase Auth account
        if (createAccount && gestorEmail && gestorPassword) {
          try {
            await GestorAccountService.createAccount({
              email: gestorEmail.trim(),
              password: gestorPassword,
              name,
              gestorId: newGestor.id,
            });
            setCreatedCredentials({ email: gestorEmail.trim(), password: gestorPassword });
            accountCreated = true;
            toast.success('Gestor y cuenta creados correctamente');
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error al crear la cuenta';
            toast.error(`Gestor creado pero error al crear cuenta: ${errorMsg}`);
          }
        } else {
          toast.success('Gestor creado correctamente');
        }
      }

      // Don't reset form if we just showed credentials
      if (!accountCreated) {
        resetForm();
      }
      await loadGestores();
    } catch (err) {
      console.error('Error saving gestor:', err);
      toast.error(err instanceof Error ? err.message : 'Error al guardar gestor. Revisa las reglas de Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gestorToDelete: IGestor) => {
    if (!confirm(`¿Eliminar el gestor "${gestorToDelete.name}"? Esto también eliminará su cuenta de acceso.`)) return;
    try {
      // If gestor has an Auth account, delete it too
      if (gestorToDelete.userId) {
        const token = await getIdToken();
        if (token) {
          await GestorAccountService.deleteAccount(gestorToDelete.id, gestorToDelete.userId, token);
        }
      }
      // Delete the gestor doc
      await GestorService.delete(gestorToDelete.id);
      toast.success(`Gestor "${gestorToDelete.name}" eliminado`);
      await loadGestores();
    } catch (err) {
      console.error('Error deleting gestor:', err);
      toast.error('Error al eliminar el gestor');
    }
  };

  const handleToggleActive = async (gestor: IGestor) => {
    try {
      await GestorService.update(gestor.id, { active: !gestor.active });
      await loadGestores();
    } catch {
      // Error
    }
  };

  // Municipios disponibles = unión de los municipios de TODAS las provincias
  // seleccionadas. Memoizamos para evitar recomputar en cada render.
  const availableMunicipalities = useMemo(() => {
    if (provinces.length === 0) return [];
    const all = provinces.flatMap(
      (p) => CUBA_PROVINCES.find((x) => x.name === p)?.municipalities ?? [],
    );
    // Deduplicar (un nombre de municipio podría existir en dos provincias,
    // ej. "Matanzas" provincia + "Matanzas" municipio; aquí solo viene como
    // municipio porque iteramos sobre municipalities[])
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, 'es'));
  }, [provinces]);

  // Map municipio → provincia. Necesario para llamar getConsejos(provincia,
  // municipio) en el grid de consejos cuando un gestor cubre varias
  // provincias con consejos (ej. Marian futuro caso).
  const municipalityToProvince = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of provinces) {
      const munis = CUBA_PROVINCES.find((x) => x.name === p)?.municipalities ?? [];
      for (const muni of munis) {
        // Si un municipio aparece en dos provincias, el primero gana —
        // suficientemente raro en la práctica para asumir 1:1.
        if (!m.has(muni)) m.set(muni, p);
      }
    }
    return m;
  }, [provinces]);

  // Wrappers para `MultiSearchableDropdown` (recibe array completo, no toggle
  // individual). Mantienen la lógica de cascade-cleanup: cuando se deselecciona
  // una provincia, los municipios que solo pertenecían a ella se limpian, y
  // sus consejos huérfanos también. Análogo para municipios → consejos.
  const handleProvincesChange = useCallback((next: string[]) => {
    setProvinces(next);
    const coveredSet = new Set(
      next.flatMap(
        (q) => CUBA_PROVINCES.find((x) => x.name === q)?.municipalities ?? [],
      ),
    );
    setSelectedMunicipalities((munis) => munis.filter((m) => coveredSet.has(m)));
    setSelectedConsejos((cs) => cs.filter((c) => coveredSet.has(c.municipality)));
  }, []);

  const handleMunicipalitiesChange = useCallback((next: string[]) => {
    setSelectedMunicipalities(next);
    const nextSet = new Set(next);
    setSelectedConsejos((cs) => cs.filter((c) => nextSet.has(c.municipality)));
  }, []);

  const toggleConsejo = (municipality: string, consejo: string) => {
    setSelectedConsejos((prev) => {
      const exists = prev.some(
        (c) => c.municipality === municipality && c.consejo === consejo,
      );
      return exists
        ? prev.filter(
            (c) => !(c.municipality === municipality && c.consejo === consejo),
          )
        : [...prev, { municipality, consejo }];
    });
  };

  // Sets memoizados — ahora solo los usan los consejos (que siguen siendo
  // un grid de checkboxes manual) y el cleanup de gestorData en handleSave.
  const selectedMunicipalitiesSet = useMemo(
    () => new Set(selectedMunicipalities),
    [selectedMunicipalities],
  );
  const selectedConsejosSet = useMemo(
    () => new Set(selectedConsejos.map((c) => `${c.municipality}|${c.consejo}`)),
    [selectedConsejos],
  );

  const isConsejoSelected = useCallback(
    (municipality: string, consejo: string) =>
      selectedConsejosSet.has(`${municipality}|${consejo}`),
    [selectedConsejosSet],
  );

  // Mostramos la sección de consejos si CUALQUIERA de las provincias
  // seleccionadas los usa (La Habana). Para Matanzas/Mayabeque/Granma/SdC
  // y demás sin consejos detallados, la sección queda oculta.
  const showConsejosSection = provinces.some(requiresConsejoPopular);

  if (!isLoaded || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#505A4A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestores de Zona</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Gestiona los repartidores por municipio
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              if (editingId) resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#414A3C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Gestor
          </button>
        </div>

        {/* Error Banner */}
        {/* Banner persistente de error eliminado — ahora todos los errores
            del form se muestran como toasts vía sonner (auto-cierre en 4s,
            posición top-right, configurado globalmente en app/layout.tsx). */}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Editar Gestor' : 'Nuevo Gestor'}
            </h3>

            {/* Photo upload */}
            <div className="flex items-center gap-4 mb-5">
              <label className="relative cursor-pointer group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed transition-colors ${
                  photoPreview
                    ? 'border-[#505A4A]/30'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-[#505A4A]'
                }`}>
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Preview" width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-[#505A4A] transition-colors" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {photoPreview ? 'Foto seleccionada' : 'Subir foto (opcional)'}
                </p>
                {photoPreview && (
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                    className="text-xs text-red-500 hover:underline mt-0.5"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>

            {/* Credentials success banner */}
            {createdCredentials && (
              <div className="mb-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">
                  Cuenta creada. Comparte estos datos con el gestor:
                </p>
                <div className="space-y-2">
                  {/* Login URL */}
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                    <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-mono text-[11px] sm:text-sm truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'sophia-product.vercel.app/auth'}
                    </span>
                    <button onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'https://sophia-product.vercel.app/auth', 'url')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0">
                      {copiedField === 'url' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  {/* Email */}
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-mono">{createdCredentials.email}</span>
                    <button onClick={() => handleCopy(createdCredentials.email, 'email')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0">
                      {copiedField === 'email' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                  {/* Password */}
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-mono">{createdCredentials.password}</span>
                    <button onClick={() => handleCopy(createdCredentials.password, 'password')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0">
                      {copiedField === 'password' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                {/* Copy all button */}
                <button
                  onClick={() => {
                    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'https://sophia-product.vercel.app/auth';
                    const allText = `Portal Sophia - Acceso Gestor\n\nURL: ${loginUrl}\nEmail: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}\n\nInicia sesión y cambia tu contraseña.`;
                    handleCopy(allText, 'all');
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:underline"
                >
                  {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'all' ? 'Copiado todo' : 'Copiar todo para enviar por WhatsApp'}
                </button>
                <button
                  onClick={resetForm}
                  className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:underline block"
                >
                  Cerrar y continuar
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  Nombre <span className="text-red-500" aria-hidden>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del gestor"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="gestor-phone" className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  WhatsApp <span className="text-red-500" aria-hidden>*</span>
                </label>
                <PhoneInput
                  id="gestor-phone"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  defaultCountry="CU"
                  placeholder="Número de WhatsApp"
                />
              </div>
              {/* Account fields - show for new gestores OR editing gestores without account */}
              {(() => {
                const editingGestor = editingId ? gestores.find(g => g.id === editingId) : null;
                const hasAccount = editingGestor?.userId;
                if (hasAccount) return (
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                      <Check className="w-4 h-4" />
                      <span>Este gestor ya tiene cuenta: <strong className="font-mono">{editingGestor.email}</strong></span>
                    </div>
                    {/* Gestor portal URL */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180 flex-shrink-0" />
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 flex-1 font-mono truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'sophia-product.vercel.app/auth'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'https://sophia-product.vercel.app/auth', 'gestor-url')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                      >
                        {copiedField === 'gestor-url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                );
                return (
                  <>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="rounded border-gray-300 text-[#505A4A] focus:ring-[#505A4A]"
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {editingId ? 'Crear cuenta de acceso para este gestor' : 'Crear cuenta de acceso al portal de gestor'}
                        </span>
                      </label>
                    </div>
                    {createAccount && (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            Email de acceso <span className="text-red-500" aria-hidden>*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={gestorEmail}
                              onChange={(e) => setGestorEmail(e.target.value)}
                              placeholder="gestor@email.com"
                              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              Contraseña <span className="text-red-500" aria-hidden>*</span>
                            </span>
                            <button
                              type="button"
                              onClick={generatePassword}
                              className="text-[#505A4A] hover:underline normal-case tracking-normal"
                            >
                              Generar
                            </button>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showGestorPassword ? 'text' : 'password'}
                              value={gestorPassword}
                              onChange={(e) => setGestorPassword(e.target.value)}
                              placeholder="Mín. 6 caracteres"
                              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowGestorPassword(!showGestorPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showGestorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Permissions */}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 block">
                  <Shield className="w-3.5 h-3.5" />
                  Permisos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {(Object.entries(GESTOR_PERMISSIONS) as [GestorPermission, string][]).map(([key, label]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        permissions.includes(key)
                          ? 'border-[#505A4A]/30 bg-[#505A4A]/5 dark:border-[#C4B590]/30 dark:bg-[#C4B590]/5'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(key)}
                        onChange={() => {
                          setPermissions(prev =>
                            prev.includes(key)
                              ? prev.filter(p => p !== key)
                              : [...prev, key]
                          );
                        }}
                        className="rounded border-gray-300 text-[#505A4A] focus:ring-[#505A4A]"
                      />
                      <span className={`text-xs font-medium ${
                        permissions.includes(key)
                          ? 'text-[#505A4A] dark:text-[#C4B590]'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPermissions(Object.keys(GESTOR_PERMISSIONS) as GestorPermission[])}
                    className="text-[10px] text-[#505A4A] dark:text-[#C4B590] hover:underline"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={() => setPermissions([])}
                    className="text-[10px] text-gray-500 dark:text-gray-400 hover:underline"
                  >
                    Quitar todos
                  </button>
                </div>
              </div>

              {/* Provincia multi-select. Un gestor puede cubrir más de una
                  (ej. Marian → Santiago de Cuba + Granma). El filtro por
                  texto permanece pero ahora marca/desmarca via checkbox en
                  lugar de seleccionar uno solo. */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  Provincias ({provinces.length})
                  <span className="text-red-500" aria-hidden>*</span>
                </label>
                <MultiSearchableDropdown
                  selected={provinces}
                  onChange={handleProvincesChange}
                  options={CUBA_PROVINCES.map((p) => ({ id: p.name, label: p.name }))}
                  placeholder="Selecciona provincias..."
                  itemLabel="provincia"
                  searchPlaceholder="Filtrar provincias..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  Municipios ({selectedMunicipalities.length})
                  <span className="text-red-500" aria-hidden>*</span>
                </label>
                {provinces.length > 0 ? (
                  <MultiSearchableDropdown
                    selected={selectedMunicipalities}
                    onChange={handleMunicipalitiesChange}
                    options={availableMunicipalities.map((m) => ({ id: m, label: m }))}
                    placeholder="Selecciona municipios..."
                    itemLabel="municipio"
                    searchPlaceholder="Filtrar municipios..."
                  />
                ) : (
                  <p className="text-sm text-gray-400 py-2">Selecciona primero al menos una provincia</p>
                )}
              </div>
            </div>

            {/* Consejos Populares — solo aparece para provincias con
                usesConsejos=true (La Habana). Si el admin desmarca un municipio,
                sus consejos se limpian automáticamente. */}
            {showConsejosSection && selectedMunicipalities.length > 0 && (
              <div className="mt-4">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                  Consejos Populares / Localidades ({selectedConsejos.length})
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
                  Marca los consejos populares específicos que cubre el gestor dentro
                  de cada municipio. Solo los consejos marcados aparecerán en el flujo
                  del cliente como cubiertos por este gestor.
                </p>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {selectedMunicipalities.map((muni) => {
                    // Para cada municipio, buscamos a qué provincia pertenece
                    // (puede venir de cualquiera de las seleccionadas) y
                    // resolvemos sus consejos con esa provincia.
                    const muniProvince = municipalityToProvince.get(muni);
                    const consejos = muniProvince ? getConsejos(muniProvince, muni) : [];
                    if (consejos.length === 0) return null;
                    return (
                      <div
                        key={muni}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/30"
                      >
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          {muni}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {consejos.map((consejo) => (
                            <label
                              key={consejo}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isConsejoSelected(muni, consejo)}
                                onChange={() => toggleConsejo(muni, consejo)}
                                className="rounded border-gray-300 text-[#505A4A] focus:ring-[#505A4A]"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {consejo}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving || uploadingPhoto || !name || !whatsapp || provinces.length === 0 || selectedMunicipalities.length === 0}
                className="flex items-center gap-2 bg-[#505A4A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#414A3C] transition-colors disabled:opacity-50"
              >
                {saving || uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {uploadingPhoto ? 'Subiendo foto...' : saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Gestores List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Gestores Activos</h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {gestores.length}
            </span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : gestores.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay gestores creados</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Pulsa &quot;Nuevo Gestor&quot; para agregar el primero
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {gestores.map((gestor) => (
                  <div
                    key={gestor.id}
                    className={`rounded-xl border p-4 sm:p-5 ${
                      gestor.active
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 opacity-60'
                    }`}
                  >
                    {/* Row 1: Name + status + actions */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {gestor.photoUrl ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={gestor.photoUrl} alt={gestor.name} width={36} height={36} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                            gestor.active
                              ? 'bg-[#505A4A] text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                          }`}>
                            {gestor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {gestor.name}
                          </h3>
                          <span className={`text-[10px] font-medium ${
                            gestor.active
                              ? 'text-[#505A4A] dark:text-[#C4B590]'
                              : 'text-gray-400'
                          }`}>
                            {gestor.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(gestor)}
                          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#505A4A] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Switch
                          checked={gestor.active}
                          onChange={() => handleToggleActive(gestor)}
                          ariaLabel={gestor.active ? 'Desactivar gestor' : 'Activar gestor'}
                          title={gestor.active ? 'Desactivar gestor' : 'Activar gestor'}
                        />
                        <button
                          onClick={() => handleDelete(gestor)}
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Phone + Province + Email
                        Phone y email son enlaces (tel:/mailto:) para que el
                        admin pueda llamar o escribirle al gestor con un solo
                        click desde la card. */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2 pl-12">
                      <a
                        href={`tel:+${gestor.whatsapp}`}
                        className="flex items-center gap-1.5 hover:text-[#505A4A] dark:hover:text-[#C4B590] hover:underline transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        +{gestor.whatsapp}
                      </a>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {/* Backward-compat: tolerar docs viejos con `province` singular */}
                        {gestor.provinces?.join(', ') ?? (gestor as IGestor & { province?: string }).province ?? ''}
                      </span>
                      {gestor.email && (
                        <a
                          href={`mailto:${gestor.email}`}
                          className="flex items-center gap-1.5 hover:text-[#505A4A] dark:hover:text-[#C4B590] hover:underline transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {gestor.email}
                        </a>
                      )}
                    </div>

                    {/* Row 2.5: Estado de la cuenta — siempre en línea propia
                        para que la posición sea idéntica en todos los gestores
                        (antes salía intercalado con el email según el ancho). */}
                    <div className="mb-3 pl-12">
                      {gestor.userId ? (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                          Con cuenta
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                          Sin cuenta
                        </span>
                      )}
                    </div>

                    {/* Row 3: Municipalities */}
                    <div className="flex flex-wrap gap-1.5 pl-12">
                      {gestor.municipalities.map((m) => (
                        <span
                          key={m}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F5F1E8] text-[#505A4A] dark:bg-[#C4B590]/10 dark:text-[#C4B590]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* Row 4: Permissions — chips read-only con check verde
                        para que el admin entienda de un vistazo que es estado,
                        no botones interactivos (la edición de permisos vive en
                        el form). */}
                    {gestor.permissions && gestor.permissions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-12 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <Shield className="w-3 h-3" />
                          Permisos
                        </span>
                        {gestor.permissions.map((p) => (
                          <span
                            key={p}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400"
                          >
                            <Check className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                            {GESTOR_PERMISSIONS[p] || p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
