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
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Image,
  Eye,
  Code,
  Type,
  Save,
  FileText,
  ChevronDown,
  Check,
  UserCheck,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Palette,
  Highlighter,
  PaintBucket,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type ActiveTab = 'subscribers' | 'send' | 'history';

const SOURCE_STYLES: Record<string, { classes: string; label: string }> = {
  popup: { classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Popup' },
  footer: { classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Footer' },
  admin: { classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Manual' },
};

// ==================== TEMPLATES ====================
interface NewsletterTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: string;
}

const TEMPLATES_KEY = 'sophia_newsletter_templates';

const DEFAULT_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'default-bienvenida',
    name: 'Bienvenida',
    subject: 'Bienvenida a Sophia Cosmetica Botanica',
    content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #C4B590; padding-bottom: 20px;">
    <h1 style="color: #C4B590; font-size: 28px; margin: 0;">Sophia</h1>
    <p style="color: #C4B590; font-size: 13px; margin: 5px 0 0; letter-spacing: 2px;">COSMETICA BOTANICA</p>
  </div>
  <h2 style="color: #C4B590; font-size: 22px; text-align: center;">Bienvenida a nuestra comunidad</h2>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px;">
    Gracias por unirte a Sophia. Ahora formas parte de una comunidad que valora la belleza natural y el cuidado consciente de la piel.
  </p>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px;">
    En cada newsletter recibiras:
  </p>
  <ul style="color: #d4cdc0; font-size: 15px; line-height: 2;">
    <li>Tips de cuidado natural para tu piel</li>
    <li>Novedades y lanzamientos exclusivos</li>
    <li>Ofertas especiales solo para suscriptoras</li>
  </ul>
  <div style="background: #2a2d25; border: 1px solid #C4B590; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
    <p style="margin: 0 0 8px; color: #C4B590; font-size: 14px;">Tu codigo de descuento de bienvenida:</p>
    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #C4B590; letter-spacing: 4px;">BIENVENIDA10</p>
    <p style="margin: 10px 0 0; color: #a09880; font-size: 13px;">10% de descuento en tu primer pedido</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://sophia-ecommerce.vercel.app" style="display: inline-block; background: #C4B590; color: #1a1d19; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Explorar productos</a>
  </div>
  <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
    Sophia Cosmetica Botanica
  </p>
</div>`,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'default-novedades',
    name: 'Novedades de temporada',
    subject: 'Novedades de temporada - Sophia',
    content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #C4B590; padding-bottom: 20px;">
    <h1 style="color: #C4B590; font-size: 28px; margin: 0;">Sophia</h1>
    <p style="color: #C4B590; font-size: 13px; margin: 5px 0 0; letter-spacing: 2px;">COSMETICA BOTANICA</p>
  </div>
  <h2 style="color: #C4B590; font-size: 22px; text-align: center;">Novedades de temporada</h2>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px;">
    Descubre los nuevos productos que hemos preparado para ti esta temporada. Formulaciones naturales inspiradas en la botanica para el cuidado de tu piel.
  </p>
  <div style="background: #2a2d25; border-radius: 12px; padding: 25px; margin: 25px 0;">
    <h3 style="color: #C4B590; font-size: 18px; margin: 0 0 15px;">Producto destacado</h3>
    <p style="color: #d4cdc0; font-size: 15px; line-height: 1.7; margin: 0;">
      [Nombre del producto] - [Descripcion breve del producto y sus beneficios principales para la piel]
    </p>
    <p style="color: #C4B590; font-size: 18px; font-weight: bold; margin: 15px 0 0;">$XX.XX</p>
  </div>
  <div style="background: #2a2d25; border-radius: 12px; padding: 25px; margin: 25px 0;">
    <h3 style="color: #C4B590; font-size: 18px; margin: 0 0 15px;">Tambien te puede interesar</h3>
    <p style="color: #d4cdc0; font-size: 15px; line-height: 1.7; margin: 0;">
      [Nombre del producto] - [Descripcion breve]
    </p>
    <p style="color: #C4B590; font-size: 18px; font-weight: bold; margin: 15px 0 0;">$XX.XX</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://sophia-ecommerce.vercel.app" style="display: inline-block; background: #C4B590; color: #1a1d19; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Ver todos los productos</a>
  </div>
  <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
    Sophia Cosmetica Botanica
  </p>
</div>`,
    createdAt: '2025-01-01T00:00:01.000Z',
  },
  {
    id: 'default-promocion',
    name: 'Promocion especial',
    subject: 'Oferta exclusiva para ti - Sophia',
    content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #C4B590; padding-bottom: 20px;">
    <h1 style="color: #C4B590; font-size: 28px; margin: 0;">Sophia</h1>
    <p style="color: #C4B590; font-size: 13px; margin: 5px 0 0; letter-spacing: 2px;">COSMETICA BOTANICA</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <p style="color: #C4B590; font-size: 14px; letter-spacing: 3px; margin: 0;">OFERTA EXCLUSIVA</p>
    <h2 style="color: #C4B590; font-size: 36px; margin: 10px 0;">XX% DESCUENTO</h2>
    <p style="color: #d4cdc0; font-size: 16px; margin: 0;">En toda nuestra linea de [categoria]</p>
  </div>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px; text-align: center;">
    Solo por tiempo limitado. Aprovecha esta oportunidad para probar nuestros productos mas vendidos con un descuento especial.
  </p>
  <div style="background: #2a2d25; border: 2px solid #C4B590; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
    <p style="margin: 0 0 8px; color: #C4B590; font-size: 14px;">Usa el codigo:</p>
    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #C4B590; letter-spacing: 4px;">CODIGOXX</p>
    <p style="margin: 10px 0 0; color: #a09880; font-size: 13px;">Valido hasta [fecha]</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://sophia-ecommerce.vercel.app" style="display: inline-block; background: #C4B590; color: #1a1d19; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Comprar ahora</a>
  </div>
  <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
    Sophia Cosmetica Botanica
  </p>
</div>`,
    createdAt: '2025-01-01T00:00:02.000Z',
  },
  {
    id: 'default-tips',
    name: 'Tips de cuidado',
    subject: 'Consejos para el cuidado de tu piel - Sophia',
    content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #C4B590; padding-bottom: 20px;">
    <h1 style="color: #C4B590; font-size: 28px; margin: 0;">Sophia</h1>
    <p style="color: #C4B590; font-size: 13px; margin: 5px 0 0; letter-spacing: 2px;">COSMETICA BOTANICA</p>
  </div>
  <h2 style="color: #C4B590; font-size: 22px; text-align: center;">Consejos de cuidado natural</h2>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px;">
    Tu piel merece lo mejor. Aqui te compartimos algunos consejos para mantenerla radiante con ingredientes naturales.
  </p>
  <div style="background: #2a2d25; border-left: 3px solid #C4B590; padding: 20px 25px; margin: 25px 0; border-radius: 0 12px 12px 0;">
    <h3 style="color: #C4B590; font-size: 16px; margin: 0 0 10px;">1. [Titulo del consejo]</h3>
    <p style="color: #d4cdc0; font-size: 14px; line-height: 1.7; margin: 0;">
      [Descripcion del consejo con detalles practicos sobre como aplicarlo en la rutina diaria]
    </p>
  </div>
  <div style="background: #2a2d25; border-left: 3px solid #C4B590; padding: 20px 25px; margin: 25px 0; border-radius: 0 12px 12px 0;">
    <h3 style="color: #C4B590; font-size: 16px; margin: 0 0 10px;">2. [Titulo del consejo]</h3>
    <p style="color: #d4cdc0; font-size: 14px; line-height: 1.7; margin: 0;">
      [Descripcion del consejo con detalles practicos sobre como aplicarlo en la rutina diaria]
    </p>
  </div>
  <div style="background: #2a2d25; border-left: 3px solid #C4B590; padding: 20px 25px; margin: 25px 0; border-radius: 0 12px 12px 0;">
    <h3 style="color: #C4B590; font-size: 16px; margin: 0 0 10px;">3. [Titulo del consejo]</h3>
    <p style="color: #d4cdc0; font-size: 14px; line-height: 1.7; margin: 0;">
      [Descripcion del consejo con detalles practicos sobre como aplicarlo en la rutina diaria]
    </p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://sophia-ecommerce.vercel.app" style="display: inline-block; background: #C4B590; color: #1a1d19; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Descubrir productos</a>
  </div>
  <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
    Sophia Cosmetica Botanica
  </p>
</div>`,
    createdAt: '2025-01-01T00:00:03.000Z',
  },
  {
    id: 'default-restock',
    name: 'Producto de vuelta',
    subject: 'De vuelta en stock - Sophia',
    content: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #1a1d19; color: #e8e0d0; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #C4B590; padding-bottom: 20px;">
    <h1 style="color: #C4B590; font-size: 28px; margin: 0;">Sophia</h1>
    <p style="color: #C4B590; font-size: 13px; margin: 5px 0 0; letter-spacing: 2px;">COSMETICA BOTANICA</p>
  </div>
  <h2 style="color: #C4B590; font-size: 22px; text-align: center;">De vuelta en stock</h2>
  <p style="line-height: 1.8; color: #d4cdc0; font-size: 15px; text-align: center;">
    El producto que tanto esperabas ya esta disponible otra vez. No dejes pasar esta oportunidad, las unidades son limitadas.
  </p>
  <div style="background: #2a2d25; border: 1px solid #C4B590; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
    <p style="color: #a09880; font-size: 13px; margin: 0 0 5px;">DISPONIBLE AHORA</p>
    <h3 style="color: #C4B590; font-size: 22px; margin: 0 0 10px;">[Nombre del producto]</h3>
    <p style="color: #d4cdc0; font-size: 14px; line-height: 1.7; margin: 0 0 15px;">
      [Descripcion del producto y por que es tan popular entre nuestras clientas]
    </p>
    <p style="color: #C4B590; font-size: 22px; font-weight: bold; margin: 0;">$XX.XX</p>
  </div>
  <div style="text-align: center; margin-top: 30px;">
    <a href="https://sophia-ecommerce.vercel.app" style="display: inline-block; background: #C4B590; color: #1a1d19; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">Comprar antes de que se agote</a>
  </div>
  <p style="color: #a09880; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
    Sophia Cosmetica Botanica
  </p>
</div>`,
    createdAt: '2025-01-01T00:00:04.000Z',
  },
];

function loadTemplates(): NewsletterTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as NewsletterTemplate[];
      return saved.length > 0 ? saved : DEFAULT_TEMPLATES;
    }
    return DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function saveTemplates(templates: NewsletterTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ==================== VISUAL EDITOR ====================
const FONT_SIZES = [
  { label: '10', value: '1' },
  { label: '12', value: '2' },
  { label: '14', value: '3' },
  { label: '18', value: '4' },
  { label: '24', value: '5' },
  { label: '32', value: '6' },
  { label: '48', value: '7' },
];

const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#ffffff',
  '#C4B590', '#1a1d19', '#2a2d25', '#d4cdc0', '#a09880',
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db',
  '#9b59b6', '#1abc9c', '#e91e63', '#795548', '#607d8b',
];

function VisualEditor({ content, onChange, getIdToken, bgColor, onBgColorChange }: { content: string; onChange: (html: string) => void; getIdToken?: () => Promise<string | null>; bgColor?: string; onBgColorChange?: (color: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInternalChange = useRef(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const [uploading, setUploading] = useState(false);

  // Active state tracking
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showEmailBg, setShowEmailBg] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('transparent');
  const [emailBgColor, setEmailBgColor] = useState(bgColor || 'transparent');

  // Update active states based on current selection
  const updateActiveStates = () => {
    try {
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
      });
      const fgColor = document.queryCommandValue('foreColor');
      const bgColor = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
      if (fgColor) setCurrentTextColor(fgColor);
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') setCurrentBgColor(bgColor);
    } catch {
      // queryCommandState can throw in some browsers
    }
  };

  // Listen for selection changes to update toolbar state
  useEffect(() => {
    const handler = () => {
      if (editorRef.current?.contains(document.activeElement) || editorRef.current === document.activeElement) {
        updateActiveStates();
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  // Close color pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-color-picker]')) {
        setShowTextColor(false);
        setShowBgColor(false);
        setShowFontSize(false);
        setShowEmailBg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync content -> editor (only when content changes externally)
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
    updateActiveStates();
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
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imagenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = getIdToken ? await getIdToken() : null;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        execCmd('insertImage', data.url);
      } else {
        alert(data.error || 'Error al subir imagen');
      }
    } catch {
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = savedSelectionRef.current;
    if (range) {
      editorRef.current?.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  const closeAllDropdowns = () => {
    setShowTextColor(false);
    setShowBgColor(false);
    setShowFontSize(false);
    setShowEmailBg(false);
  };

  const setEmailBackground = (color: string) => {
    setEmailBgColor(color);
    if (editorRef.current) {
      editorRef.current.style.backgroundColor = color === 'transparent' ? '' : color;
    }
    onBgColorChange?.(color);
  };

  const btnBase = "p-1.5 rounded transition-colors";
  const btnInactive = "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400";
  const btnActive = "bg-[#505A4A] text-white dark:bg-[#C4B590] dark:text-gray-900";
  const toolbarBtn = (active: boolean) => `${btnBase} ${active ? btnActive : btnInactive}`;
  const divider = <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:border-[#505A4A]">
      {/* Toolbar Row 1: Text formatting */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {/* Undo / Redo */}
        <button type="button" onClick={() => execCmd('undo')} className={`${btnBase} ${btnInactive}`} title="Deshacer">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('redo')} className={`${btnBase} ${btnInactive}`} title="Rehacer">
          <Redo2 className="w-4 h-4" />
        </button>
        {divider}

        {/* Headings */}
        <button type="button" onClick={() => insertHeading(1)} className={`${btnBase} ${btnInactive}`} title="Titulo">
          <Heading1 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => insertHeading(2)} className={`${btnBase} ${btnInactive}`} title="Subtitulo">
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('formatBlock', 'p')} className={`${btnBase} ${btnInactive}`} title="Parrafo">
          <Type className="w-4 h-4" />
        </button>
        {divider}

        {/* Text style */}
        <button type="button" onClick={() => execCmd('bold')} className={toolbarBtn(activeStates.bold)} title="Negrita">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('italic')} className={toolbarBtn(activeStates.italic)} title="Cursiva">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('underline')} className={toolbarBtn(activeStates.underline)} title="Subrayado">
          <Underline className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('strikeThrough')} className={toolbarBtn(activeStates.strikeThrough)} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </button>
        {divider}

        {/* Font size */}
        <div className="relative" data-color-picker>
          <button
            type="button"
            onClick={() => { saveSelection(); const next = !showFontSize; closeAllDropdowns(); setShowFontSize(next); }}
            className={`${btnBase} ${btnInactive} flex items-center gap-0.5 text-xs font-medium min-w-[40px] justify-center`}
            title="Tamano de fuente"
          >
            <span>Aa</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 min-w-[80px]">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  type="button"
                  onClick={() => { restoreSelection(); execCmd('fontSize', fs.value); setShowFontSize(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {fs.label}px
                </button>
              ))}
            </div>
          )}
        </div>
        {divider}

        {/* Text color */}
        <div className="relative" data-color-picker>
          <button
            type="button"
            onClick={() => { saveSelection(); const next = !showTextColor; closeAllDropdowns(); setShowTextColor(next); }}
            className={`${btnBase} ${btnInactive} flex flex-col items-center`}
            title="Color de texto"
          >
            <Palette className="w-4 h-4" />
            <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: currentTextColor }} />
          </button>
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2 w-[180px]" data-color-picker>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { restoreSelection(); execCmd('foreColor', color); setCurrentTextColor(color); setShowTextColor(false); }}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Otro:</span>
                <input
                  type="color"
                  value={currentTextColor}
                  onChange={(e) => { restoreSelection(); execCmd('foreColor', e.target.value); setCurrentTextColor(e.target.value); }}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                />
              </label>
            </div>
          )}
        </div>

        {/* Highlight text */}
        <div className="relative" data-color-picker>
          <button
            type="button"
            onClick={() => { saveSelection(); const next = !showBgColor; closeAllDropdowns(); setShowBgColor(next); }}
            className={`${btnBase} ${btnInactive} flex flex-col items-center`}
            title="Resaltar texto"
          >
            <Highlighter className="w-4 h-4" />
            <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: currentBgColor === 'transparent' ? '#f1c40f' : currentBgColor }} />
          </button>
          {showBgColor && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2 w-[180px]" data-color-picker>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { restoreSelection(); execCmd('hiliteColor', color); setCurrentBgColor(color); setShowBgColor(false); }}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Otro:</span>
                  <input
                    type="color"
                    value={currentBgColor === 'transparent' ? '#ffffff' : currentBgColor}
                    onChange={(e) => { restoreSelection(); execCmd('hiliteColor', e.target.value); setCurrentBgColor(e.target.value); }}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => { restoreSelection(); execCmd('hiliteColor', 'transparent'); setCurrentBgColor('transparent'); setShowBgColor(false); }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar Row 2: Structure & media */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {/* Email background color */}
        <div className="relative" data-color-picker>
          <button
            type="button"
            onClick={() => { const next = !showEmailBg; closeAllDropdowns(); setShowEmailBg(next); }}
            className={`${btnBase} ${btnInactive} flex items-center gap-1 text-xs`}
            title="Fondo del email"
          >
            <PaintBucket className="w-4 h-4" />
            <span className="hidden sm:inline">Fondo</span>
            <div className="w-3 h-3 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: emailBgColor === 'transparent' ? '#ffffff' : emailBgColor }} />
          </button>
          {showEmailBg && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-2 w-[200px]" data-color-picker>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Fondo completo del email</p>
              <div className="grid grid-cols-5 gap-1 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setEmailBackground(color); setShowEmailBg(false); }}
                    className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Otro:</span>
                  <input
                    type="color"
                    value={emailBgColor === 'transparent' ? '#ffffff' : emailBgColor}
                    onChange={(e) => { setEmailBackground(e.target.value); }}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => { setEmailBackground('transparent'); setShowEmailBg(false); }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Quitar
                </button>
              </div>
            </div>
          )}
        </div>
        {divider}

        {/* Alignment */}
        <button type="button" onClick={() => execCmd('justifyLeft')} className={toolbarBtn(activeStates.justifyLeft)} title="Alinear izquierda">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('justifyCenter')} className={toolbarBtn(activeStates.justifyCenter)} title="Centrar">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('justifyRight')} className={toolbarBtn(activeStates.justifyRight)} title="Alinear derecha">
          <AlignRight className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('justifyFull')} className={toolbarBtn(activeStates.justifyFull)} title="Justificar">
          <AlignJustify className="w-4 h-4" />
        </button>
        {divider}

        {/* Lists */}
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className={toolbarBtn(activeStates.insertUnorderedList)} title="Lista">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => execCmd('insertOrderedList')} className={toolbarBtn(activeStates.insertOrderedList)} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </button>
        {divider}

        {/* Media & links */}
        <button type="button" onClick={insertLink} className={`${btnBase} ${btnInactive}`} title="Enlace">
          <Link2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={insertImage} className={`${btnBase} ${btnInactive}`} title="Imagen" disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button type="button" onClick={() => execCmd('insertHorizontalRule')} className={`${btnBase} ${btnInactive}`} title="Linea horizontal">
          <Minus className="w-4 h-4" />
        </button>
        {divider}

        {/* Clear formatting */}
        <button type="button" onClick={() => execCmd('removeFormat')} className={`${btnBase} ${btnInactive}`} title="Limpiar formato">
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveStates}
        onMouseUp={updateActiveStates}
        className="min-h-[280px] px-4 py-3 text-sm text-gray-800 dark:text-gray-100 focus:outline-none prose prose-sm dark:prose-invert max-w-none [&:empty]:before:content-['Escribe_tu_newsletter_aqui...'] [&:empty]:before:text-gray-400 [&:empty]:before:dark:text-gray-500"
        style={emailBgColor && emailBgColor !== 'transparent' ? { backgroundColor: emailBgColor } : undefined}
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

  // Template state
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Email background color (independent of content)
  const [emailBgColor, setEmailBgColor] = useState('transparent');

  // Subscriber selection state
  const [recipientMode, setRecipientMode] = useState<'all' | 'select'>('all');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');

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

  // Load templates from localStorage on mount
  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

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

  const handleSendAll = async () => {
    setShowConfirmSend(false);
    setIsSending(true);
    try {
      const token = await getIdToken();
      const finalContent = emailBgColor && emailBgColor !== 'transparent'
        ? `<div style="background-color: ${emailBgColor}; padding: 20px;">${content}</div>`
        : content;
      const payload: { subject: string; content: string; recipients?: string[] } = { subject, content: finalContent };
      if (recipientMode === 'select') {
        payload.recipients = Array.from(selectedEmails);
      }
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Newsletter enviada');
        setSubject('');
        setContent('');
        setEmailBgColor('transparent');
        setRecipientMode('all');
        setSelectedEmails(new Set());
        loadHistory();
      } else {
        toast.error(data.error || 'Error al enviar');
      }
    } catch {
      toast.error('Error al enviar newsletter');
    } finally {
      setIsSending(false);
    }
  };

  // Template handlers
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Escribe un nombre para la plantilla');
      return;
    }
    if (!subject.trim() && !content.trim()) {
      toast.error('Escribe asunto o contenido antes de guardar');
      return;
    }
    const newTemplate: NewsletterTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      subject,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setNewTemplateName('');
    setShowSaveTemplate(false);
    toast.success('Plantilla guardada');
  };

  const handleLoadTemplate = (template: NewsletterTemplate) => {
    setSubject(template.subject);
    setContent(template.content);
    setSelectedTemplateId(template.id);
    setShowTemplateDropdown(false);
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
    if (selectedTemplateId === id) setSelectedTemplateId('');
    toast.success('Plantilla eliminada');
  };

  // Subscriber selection helpers
  const activeSubscribers = subscribers.filter((s) => s.active);
  const filteredActiveSubscribers = activeSubscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(recipientSearch.toLowerCase()))
  );

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      filteredActiveSubscribers.forEach((s) => next.add(s.email));
      return next;
    });
  };

  const handleDeselectAllVisible = () => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      filteredActiveSubscribers.forEach((s) => next.delete(s.email));
      return next;
    });
  };

  const sendRecipientCount = recipientMode === 'all' ? activeCount : selectedEmails.size;

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
              {/* Templates section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Plantillas
                  </h4>
                  <button
                    onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                    className="flex items-center gap-1.5 text-xs text-[#505A4A] hover:text-[#414A3C] dark:text-[#8B9A7B] dark:hover:text-[#A0B090] font-medium transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar como plantilla
                  </button>
                </div>

                {/* Save template form */}
                {showSaveTemplate && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Nombre de la plantilla..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                    />
                    <button
                      onClick={handleSaveTemplate}
                      className="flex items-center gap-1.5 bg-[#505A4A] hover:bg-[#414A3C] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Guardar
                    </button>
                    <button
                      onClick={() => { setShowSaveTemplate(false); setNewTemplateName(''); }}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Template selector dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800 hover:border-[#505A4A] transition-colors"
                  >
                    <span className={templates.length === 0 ? 'text-gray-400 dark:text-gray-500' : ''}>
                      {selectedTemplateId
                        ? templates.find((t) => t.id === selectedTemplateId)?.name || 'Seleccionar plantilla...'
                        : templates.length === 0
                        ? 'No hay plantillas guardadas'
                        : 'Seleccionar plantilla...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showTemplateDropdown && templates.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {templates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
                        >
                          <button
                            onClick={() => handleLoadTemplate(tpl)}
                            className="flex-1 text-left text-sm text-gray-900 dark:text-gray-100 truncate"
                          >
                            <span className="font-medium">{tpl.name}</span>
                            {tpl.subject && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">— {tpl.subject}</span>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id); }}
                            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                      placeholder="Ej: Novedades de primavera"
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
                      <VisualEditor content={content} onChange={setContent} getIdToken={getIdToken} bgColor={emailBgColor} onBgColorChange={setEmailBgColor} />
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
                            style={emailBgColor && emailBgColor !== 'transparent' ? { backgroundColor: emailBgColor, padding: '20px', borderRadius: '8px' } : undefined}
                            dangerouslySetInnerHTML={{ __html: content }}
                          />
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">El preview aparecerá aquí cuando escribas contenido...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Subscriber selection */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Destinatarios
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientMode"
                          checked={recipientMode === 'all'}
                          onChange={() => setRecipientMode('all')}
                          className="w-4 h-4 text-[#505A4A] border-gray-300 dark:border-gray-600 focus:ring-[#505A4A]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Todos los activos (<span className="font-semibold text-[#505A4A]">{activeCount}</span>)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientMode"
                          checked={recipientMode === 'select'}
                          onChange={() => setRecipientMode('select')}
                          className="w-4 h-4 text-[#505A4A] border-gray-300 dark:border-gray-600 focus:ring-[#505A4A]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Seleccionar destinatarios
                          {recipientMode === 'select' && selectedEmails.size > 0 && (
                            <span className="ml-1.5 text-xs bg-[#505A4A] text-white px-1.5 py-0.5 rounded-full">{selectedEmails.size}</span>
                          )}
                        </span>
                      </label>

                      {recipientMode === 'select' && (
                        <div className="ml-6 space-y-2">
                          {/* Search + select all/none */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                              <input
                                type="text"
                                placeholder="Buscar suscriptor..."
                                value={recipientSearch}
                                onChange={(e) => setRecipientSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#505A4A] text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                              />
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleSelectAllVisible}
                                className="text-xs text-[#505A4A] dark:text-[#8B9A7B] hover:bg-gray-100 dark:hover:bg-gray-700 px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Seleccionar todos
                              </button>
                              <button
                                onClick={handleDeselectAllVisible}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-2.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Deseleccionar todos
                              </button>
                            </div>
                          </div>

                          {/* Subscriber checklist */}
                          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoadingSubs ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-gray-500" />
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Cargando...</span>
                              </div>
                            ) : filteredActiveSubscribers.length === 0 ? (
                              <div className="text-center py-6">
                                <p className="text-xs text-gray-400 dark:text-gray-500">No se encontraron suscriptores</p>
                              </div>
                            ) : (
                              filteredActiveSubscribers.map((sub) => (
                                <label
                                  key={sub.id}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                    selectedEmails.has(sub.email)
                                      ? 'bg-[#505A4A] border-[#505A4A]'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}>
                                    {selectedEmails.has(sub.email) && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{sub.email}</p>
                                    {sub.name && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub.name}</p>}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={selectedEmails.has(sub.email)}
                                    onChange={() => handleToggleEmail(sub.email)}
                                    className="sr-only"
                                  />
                                </label>
                              ))
                            )}
                          </div>

                          {selectedEmails.size > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-[#505A4A]">{selectedEmails.size}</span> suscriptor{selectedEmails.size !== 1 ? 'es' : ''} seleccionado{selectedEmails.size !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Se enviará a{' '}
                      <span className="font-semibold text-[#505A4A]">{sendRecipientCount}</span>{' '}
                      {recipientMode === 'all' ? 'suscriptores activos' : `suscriptor${sendRecipientCount !== 1 ? 'es' : ''} seleccionado${sendRecipientCount !== 1 ? 's' : ''}`}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmSend(true)}
                        disabled={isSending || !subject.trim() || !content.trim() || sendRecipientCount === 0}
                        className="flex items-center gap-2 bg-[#505A4A] hover:bg-[#414A3C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar newsletter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm dialog */}
              {showConfirmSend && (
                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {recipientMode === 'select'
                      ? <>¿Enviar newsletter a <strong>{selectedEmails.size} suscriptor{selectedEmails.size !== 1 ? 'es' : ''} seleccionado{selectedEmails.size !== 1 ? 's' : ''}</strong>? Esta acción no se puede deshacer.</>
                      : <>¿Enviar newsletter a <strong>todos los {activeCount} suscriptores activos</strong>? Esta acción no se puede deshacer.</>
                    }
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
