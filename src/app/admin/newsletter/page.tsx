"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/store';
import {
  SubscriberService,
  NewsletterHistoryService,
  Subscriber,
  SubscriberStats,
  NewsletterRecord,
} from '@/lib/firestore-services';
import { AdminGuard, PageHeader } from '@/components/ui/admin-components';
import {
  Mail,
  Users,
  Send,
  History,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  UserPlus,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Link2,
  Image,
  Eye,
  Code,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type ActiveTab = 'subscribers' | 'send' | 'history';

const SOURCE_STYLES: Record<string, { classes: string; label: string }> = {
  popup: { classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Popup' },
  footer: { classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Footer' },
  admin: { classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Manual' },
};

// ==================== VISUAL EDITOR ====================
function VisualEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync content → editor (only when content changes externally)
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
    isInternalChange.current = false;
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertHeading = (level: 1 | 2) => {
    document.execCommand('formatBlock', false, `h${level}`);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('URL del enlace:');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('URL de la imagen:');
    if (url) {
      execCmd('insertImage', url);
    }
  };

  const toolbarBtnClass = "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:border-[#505A4A]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <button type="button" onClick={() => insertHeading(1)} className={toolbarBtnClass} title="Título">
          <Heading1 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertHeading(2)} className={toolbarBtnClass} title="Subtítulo">
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button type="button" onClick={() => execCmd('bold')} className={toolbarBtnClass} title="Negrita">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('italic')} className={toolbarBtnClass} title="Cursiva">
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className={toolbarBtnClass} title="Lista">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={insertLink} className={toolbarBtnClass} title="Enlace">
          <Link2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={insertImage} className={toolbarBtnClass} title="Imagen">
          <Image className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button type="button" onClick={() => execCmd('formatBlock', 'p')} className={toolbarBtnClass} title="Párrafo">
          <Type className="w-4 h-4" />
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[280px] px-4 py-3 text-sm text-gray-800 dark:text-gray-100 dark:bg-gray-900 focus:outline-none prose prose-sm dark:prose-invert max-w-none [&:empty]:before:content-['Escribe_tu_newsletter_aquí...'] [&:empty]:before:text-gray-400 [&:empty]:before:dark:text-gray-500"
        suppressContentEditableWarning
      />
    </div>
  );
}

export default function NewsletterAdminPage() {
  const { user, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('subscribers');

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  // Send state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');

  // History state
  const [history, setHistory] = useState<NewsletterRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSubscribers = async () => {
    setIsLoadingSubs(true);
    try {
      const [allSubs, subStats] = await Promise.all([
        SubscriberService.getAll(),
        SubscriberService.getStats(),
      ]);
      setSubscribers(allSubs);
      setStats(subStats);
      setActiveCount(subStats.active);
    } catch {
      toast.error('Error al cargar suscriptores');
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await NewsletterHistoryService.getAll();
      setHistory(records);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    // Wait for user to be authenticated before querying Firestore
    if (!user) return;

    if (activeTab === 'subscribers' || activeTab === 'send') {
      loadSubscribers();
    }
    if (activeTab === 'history') {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) return;
    setAddingSubscriber(true);
    try {
      const exists = await SubscriberService.exists(newEmail);
      if (exists) {
        toast.error('Este email ya está suscrito');
        return;
      }
      await SubscriberService.add(newEmail, 'admin', newName || undefined);
      toast.success('Suscriptor añadido');
      setNewEmail('');
      setNewName('');
      setShowAddForm(false);
      await loadSubscribers();
    } catch {
      toast.error('Error al añadir suscriptor');
    } finally {
      setAddingSubscriber(false);
    }
  };

  const handleToggleActive = async (sub: Subscriber) => {
    try {
      if (sub.active) {
        await SubscriberService.deactivate(sub.id);
        toast.success('Suscriptor desactivado');
      } else {
        await SubscriberService.activate(sub.id);
        toast.success('Suscriptor activado');
      }
      await loadSubscribers();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await SubscriberService.delete(id);
      toast.success('Suscriptor eliminado');
      setDeletingId(null);
      await loadSubscribers();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSendTest = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Completa el asunto y contenido');
      return;
    }
    setIsSending(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, content, testEmail: user?.email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Email de prueba enviado');
      } else {
        toast.error(data.error || 'Error al enviar prueba');
      }
    } catch {
      toast.error('Error al enviar');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAll = async () => {
    setShowConfirmSend(false);
    setIsSending(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, content }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Newsletter enviada');
        setSubject('');
        setContent('');
      } else {
        toast.error(data.error || 'Error al enviar');
      }
    } catch {
      toast.error('Error al enviar newsletter');
    } finally {
      setIsSending(false);
    }
  };

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#505A4A] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Link>

          <PageHeader
            title="Newsletter"
            description="Gestiona suscriptores y envía boletines"
          />

          {/* Tab bar */}
          <div className="flex gap-1 mt-6 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {[
              { key: 'subscribers' as ActiveTab, label: 'Suscriptores', icon: Users },
              { key: 'send' as ActiveTab, label: 'Enviar', icon: Send },
              { key: 'history' as ActiveTab, label: 'Historial', icon: History },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#505A4A] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========== SUBSCRIBERS TAB ========== */}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Activos</p>
                    <p className="text-2xl font-semibold text-green-600 mt-1">{stats.active}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Inactivos</p>
                    <p className="text-2xl font-semibold text-gray-400 dark:text-gray-500 mt-1">{stats.inactive}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fuentes</p>
                    <div className="flex gap-2 mt-1.5">
                      {Object.entries(stats.bySource).map(([src, count]) => {
                        if (count === 0) return null;
                        const style = SOURCE_STYLES[src as keyof typeof SOURCE_STYLES];
                        return (
                          <span key={src} className={`text-xs px-2 py-0.5 rounded-full ${style.classes}`}>
                            {style.label}: {count}
                          </span>
                        );
                      })}
                      {Object.values(stats.bySource).every((v) => v === 0) && (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search + Add */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por email o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {showAddForm ? 'Cancelar' : 'Añadir'}
                </button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Email *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Nombre (opcional)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    onClick={handleAddSubscriber}
                    disabled={addingSubscriber || !newEmail.trim()}
                    className="flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {addingSubscriber ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Guardar
                  </button>
                </div>
              )}

              {/* Subscribers list */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                {isLoadingSubs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
                  </div>
                ) : filteredSubscribers.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No se encontraron suscriptores' : 'No hay suscriptores aún'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredSubscribers.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                          sub.active ? 'bg-[#505A4A] text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {(sub.name || sub.email)[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sub.email}</p>
                            {!sub.active && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactivo</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sub.name && <span className="text-xs text-gray-500 dark:text-gray-400">{sub.name}</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${SOURCE_STYLES[sub.source]?.classes || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {SOURCE_STYLES[sub.source]?.label || sub.source}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(sub.subscribedAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(sub)}
                            title={sub.active ? 'Desactivar' : 'Activar'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              sub.active
                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {sub.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>

                          {deletingId === sub.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(sub.id)}
                                className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(sub.id)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== SEND TAB ========== */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Componer Newsletter
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Asunto</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Novedades de primavera 🌿"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Contenido</label>

                    {/* Mode tabs */}
                    <div className="flex items-center gap-1 mb-2">
                      <button
                        type="button"
                        onClick={() => setEditorMode('visual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          editorMode === 'visual' ? 'bg-[#505A4A] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Type className="w-3.5 h-3.5" />
                        Visual
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('html')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          editorMode === 'html' ? 'bg-[#505A4A] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          editorMode === 'preview' ? 'bg-[#505A4A] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>

                    {/* Visual editor with toolbar */}
                    {editorMode === 'visual' && (
                      <VisualEditor content={content} onChange={setContent} />
                    )}

                    {/* Raw HTML editor */}
                    {editorMode === 'html' && (
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={'<h1>Hola!</h1>\n<p>Tenemos novedades...</p>'}
                        rows={12}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] font-mono text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    )}

                    {/* Preview */}
                    {editorMode === 'preview' && (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[300px] bg-white dark:bg-gray-900">
                        {content ? (
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: content }}
                          />
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">El preview aparecerá aquí cuando escribas contenido...</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Se enviará a <span className="font-semibold text-[#505A4A]">{activeCount}</span> suscriptores activos
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSendTest}
                        disabled={isSending || !subject.trim() || !content.trim()}
                        className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        Enviar prueba
                      </button>
                      <button
                        onClick={() => setShowConfirmSend(true)}
                        disabled={isSending || !subject.trim() || !content.trim() || activeCount === 0}
                        className="flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        Enviar a todos
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm dialog */}
              {showConfirmSend && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ¿Enviar newsletter a <strong>{activeCount} suscriptores</strong>? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setShowConfirmSend(false)}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendAll}
                      className="text-sm bg-[#505A4A] text-white px-3 py-1.5 rounded-lg hover:bg-[#414A3C]"
                    >
                      Sí, enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== HISTORY TAB ========== */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Newsletters enviadas</h3>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aún no has enviado newsletters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {history.map((record) => (
                    <div key={record.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{record.subject}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.sentAt)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {record.recipientCount} destinatario{record.recipientCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {record.success ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Enviada
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
