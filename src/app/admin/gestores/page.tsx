"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/store';
import { GestorService, GestorAccountService } from '@/lib/firestore-services';
import { IGestor, GESTOR_PERMISSIONS, GestorPermission, DEFAULT_GESTOR_PERMISSIONS } from '@/entities/all';
import { CUBA_PROVINCES } from '@/data/cuba-locations';
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
  Search,
  ChevronDown,
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

export default function GestoresAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoaded, isAuthenticated, getIdToken } = useAuth();
  const [gestores, setGestores] = useState<IGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [province, setProvince] = useState('');
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [municipalitySearch, setMunicipalitySearch] = useState('');
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
    setWhatsapp('');
    setProvince('');
    setProvinceSearch('');
    setSelectedMunicipalities([]);
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
    setWhatsapp(gestor.whatsapp);
    setProvince(gestor.province);
    setProvinceSearch('');
    setSelectedMunicipalities([...gestor.municipalities]);
    setPhotoFile(null);
    setPhotoPreview(gestor.photoUrl || '');
    setGestorEmail(gestor.email || '');
    setGestorPassword('');
    setCreateAccount(!gestor.userId); // Show account fields if no account yet
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
    if (!name || !whatsapp || !province || selectedMunicipalities.length === 0) return;
    const editingGestor = editingId ? gestores.find(g => g.id === editingId) : null;

    // Check for duplicates (exclude current gestor when editing)
    const duplicateName = gestores.find(g => g.name.trim().toLowerCase() === name.trim().toLowerCase() && g.id !== editingId);
    if (duplicateName) {
      setError(`Ya existe un gestor con el nombre "${duplicateName.name}".`);
      return;
    }
    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
    const duplicatePhone = gestores.find(g => g.whatsapp === cleanWhatsapp && g.id !== editingId);
    if (duplicatePhone) {
      setError(`Ya existe un gestor con ese número de WhatsApp (${duplicatePhone.name}).`);
      return;
    }
    if (gestorEmail) {
      const duplicateEmail = gestores.find(g => g.email?.toLowerCase() === gestorEmail.trim().toLowerCase() && g.id !== editingId);
      if (duplicateEmail) {
        setError(`Ya existe un gestor con ese email (${duplicateEmail.name}).`);
        return;
      }
    }

    const needsAccount = createAccount && !editingGestor?.userId;
    if (needsAccount && (!gestorEmail || !gestorPassword)) {
      setError('Email y contraseña son requeridos para crear la cuenta del gestor.');
      return;
    }
    if (needsAccount && gestorEmail && !isValidEmail(gestorEmail)) {
      setError('El email no es válido. Verifica que tenga formato correcto (ej: nombre@email.com)');
      return;
    }
    if (needsAccount && gestorPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    let accountCreated = false;
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const gestorData = {
        name,
        whatsapp: whatsapp.replace(/[^0-9]/g, ''),
        province,
        municipalities: selectedMunicipalities,
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
            setError(`Gestor actualizado pero error al crear cuenta: ${errorMsg}`);
            toast.error('Error al crear la cuenta del gestor');
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
            setError(`Gestor creado pero error al crear cuenta: ${errorMsg}`);
            toast.error('Error al crear la cuenta del gestor');
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
      setError(err instanceof Error ? err.message : 'Error al guardar gestor. Revisa las reglas de Firestore.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este gestor?')) return;
    try {
      await GestorService.delete(id);
      await loadGestores();
    } catch {
      // Error
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

  const availableMunicipalities = province
    ? CUBA_PROVINCES.find((p) => p.name === province)?.municipalities || []
    : [];

  const filteredMunicipalities = municipalitySearch
    ? availableMunicipalities.filter((m) =>
        m.toLowerCase().includes(municipalitySearch.toLowerCase())
      )
    : availableMunicipalities;

  const filteredProvinces = provinceSearch
    ? CUBA_PROVINCES.filter((p) =>
        p.name.toLowerCase().includes(provinceSearch.toLowerCase())
      )
    : CUBA_PROVINCES;

  const toggleMunicipality = (m: string) => {
    setSelectedMunicipalities((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  if (!isLoaded || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#505A4A]" />
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
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'sophia-cosmetic.vercel.app/auth'}
                    </span>
                    <button onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'https://sophia-cosmetic.vercel.app/auth', 'url')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0">
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
                    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'https://sophia-cosmetic.vercel.app/auth';
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
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del gestor"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ej: +53 5 2010900"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {/* Account fields - show for new gestores OR editing gestores without account */}
              {(() => {
                const editingGestor = editingId ? gestores.find(g => g.id === editingId) : null;
                const hasAccount = editingGestor?.userId;
                if (hasAccount) return (
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                      <Check className="w-4 h-4" />
                      <span>Este gestor ya tiene cuenta: <strong className="font-mono">{editingGestor.email}</strong></span>
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
                          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email de acceso</label>
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
                            <span>Contraseña</span>
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

              <div className="relative">
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Provincia</label>
                <div className="relative">
                  <input
                    type="text"
                    value={provinceSearch || province}
                    onChange={(e) => {
                      setProvinceSearch(e.target.value);
                      setShowProvinceDropdown(true);
                      if (province) {
                        setProvince('');
                        setSelectedMunicipalities([]);
                      }
                    }}
                    onFocus={() => setShowProvinceDropdown(true)}
                    placeholder="Buscar provincia..."
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {showProvinceDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                    {filteredProvinces.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setProvince(p.name);
                          setProvinceSearch('');
                          setShowProvinceDropdown(false);
                          setSelectedMunicipalities([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">
                  Municipios ({selectedMunicipalities.length})
                </label>
                {province ? (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={municipalitySearch}
                        onChange={(e) => setMunicipalitySearch(e.target.value)}
                        placeholder="Filtrar municipios..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredMunicipalities.map((m) => (
                        <label key={m} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMunicipalities.includes(m)}
                            onChange={() => toggleMunicipality(m)}
                            className="rounded border-gray-300 text-[#505A4A] focus:ring-[#505A4A]"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{m}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Selecciona primero una provincia</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving || uploadingPhoto || !name || !whatsapp || !province || selectedMunicipalities.length === 0}
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
                        <button
                          onClick={() => handleToggleActive(gestor)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            gestor.active
                              ? 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              : 'border-[#505A4A]/20 text-[#505A4A] dark:text-[#C4B590] hover:bg-[#505A4A]/5'
                          }`}
                        >
                          {gestor.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(gestor.id)}
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Phone + Province + Email */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3 pl-12">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        +{gestor.whatsapp}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {gestor.province}
                      </span>
                      {gestor.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {gestor.email}
                        </span>
                      )}
                      {gestor.userId ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                          Con cuenta
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
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

                    {/* Row 4: Permissions */}
                    {gestor.permissions && gestor.permissions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pl-12 mt-2">
                        <Shield className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-0.5" />
                        {gestor.permissions.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          >
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
