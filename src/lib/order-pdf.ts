/**
 * Generación del PDF de pedido de Sophia (jsPDF, client-side).
 *
 * Diseño profesional alineado a la marca: cabecera verde (#2E4A3A) con
 * crema (#FEFCF7) y dorado (#C9A96E), tipografía legible, tabla de
 * productos clara, total destacado y tarjeta del gestor de zona.
 *
 * Helper ÚNICO compartido por CartDrawer y /cart (antes estaba duplicado
 * y con la letra muy pequeña). Todos los campos del cliente/gestor son
 * opcionales: solo se pinta lo que existe.
 */

export interface OrderPdfItem {
  name: string;
  price: number;
  quantity: number;
}

export interface OrderPdfGestor {
  name: string;
  whatsapp: string;
  municipalities: string[];
  provinces: string[];
}

export interface OrderPdfData {
  items: OrderPdfItem[];
  subtotal: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  province?: string;
  municipality?: string;
  gestor?: OrderPdfGestor | null;
  notes?: string;
}

// ── Paleta de marca (RGB) ───────────────────────────────────────────────────
const GREEN: [number, number, number] = [46, 74, 58]; // #2E4A3A
const GOLD: [number, number, number] = [201, 169, 110]; // #C9A96E
const CREAM: [number, number, number] = [254, 252, 247]; // #FEFCF7
const INK: [number, number, number] = [45, 45, 42];
const MUTED: [number, number, number] = [120, 116, 108];
const TINT: [number, number, number] = [238, 241, 236]; // verde muy claro
const HAIR: [number, number, number] = [228, 224, 216];

const money = (n: number) => `$${n.toFixed(2)}`;

/** Carga el logo de marca como dataURL (mismo origen → sin taint). */
async function loadBrandLogo(): Promise<{ dataUrl: string; ratio: number } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            ratio: img.naturalWidth / img.naturalHeight || 1,
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/images/sophia_logo_nuevo.jpeg';
    } catch {
      resolve(null);
    }
  });
}

export async function generateOrderPdf(data: OrderPdfData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF(); // a4, mm, portrait
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const M = 18;
  const contentW = pw - M * 2;

  const fillCream = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, pw, ph, 'F');
  };
  fillCream();

  // ── Cabecera (banda verde) ───────────────────────────────────────────────
  const HB = 46;
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pw, HB, 'F');

  const logo = await loadBrandLogo();
  let wordmarkX = M;
  if (logo) {
    // Badge crema redondeado con el logo dentro (igual que el header del sitio)
    doc.setFillColor(...CREAM);
    doc.roundedRect(M, 12, 22, 22, 3, 3, 'F');
    const box = 17;
    let w = box;
    let h = box;
    if (logo.ratio >= 1) h = box / logo.ratio;
    else w = box * logo.ratio;
    const ix = M + 2.5 + (box - w) / 2;
    const iy = 14.5 + (box - h) / 2;
    try {
      doc.addImage(logo.dataUrl, 'PNG', ix, iy, w, h);
    } catch {
      /* si falla, el badge crema queda como marca de agua sutil */
    }
    wordmarkX = M + 28;
  }

  // Wordmark "Sophia" (serif elegante) sobre la banda
  doc.setTextColor(...CREAM);
  doc.setFont('times', 'normal');
  doc.setFontSize(30);
  doc.text('Sophia', wordmarkX, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text('PRODUCTOS NATURALES', wordmarkX + 1, 34, { charSpace: 0.8 });

  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const rightX = pw - M;
  doc.setTextColor(...CREAM);
  doc.setFontSize(8);
  doc.text('RESUMEN DE PEDIDO', rightX, 19, { align: 'right', charSpace: 0.5 });
  doc.setFontSize(11);
  doc.text(dateStr, rightX, 28, { align: 'right' });

  // ── Datos de cliente / entrega ────────────────────────────────────────────
  let y = HB + 16;
  const infoRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(label, M, y, { charSpace: 0.5 });
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(value, M + 34, y);
    y += 8;
  };
  if (data.customerName?.trim()) infoRow('CLIENTE', data.customerName.trim());
  if (data.customerPhone?.trim()) infoRow('TELÉFONO', data.customerPhone.trim());
  if (data.customerEmail?.trim()) infoRow('EMAIL', data.customerEmail.trim());
  if (data.municipality && data.province)
    infoRow('ENTREGA', `${data.municipality}, ${data.province}`);
  infoRow('FECHA', dateStr);

  y += 5;

  // ── Detalle del pedido ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text('DETALLE DEL PEDIDO', M, y, { charSpace: 0.5 });
  y += 5;

  const subtotalX = pw - M - 3;
  const priceX = subtotalX - 30;
  const qtyX = priceX - 22;
  const nameX = M + 3;

  // Fila de encabezado con fondo tenue
  doc.setFillColor(...TINT);
  doc.rect(M, y, contentW, 9, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREEN);
  const hb = y + 6;
  doc.text('PRODUCTO', nameX, hb);
  doc.text('CANT.', qtyX, hb, { align: 'right' });
  doc.text('PRECIO', priceX, hb, { align: 'right' });
  doc.text('SUBTOTAL', subtotalX, hb, { align: 'right' });
  y += 9;

  const rowH = 11;
  for (const item of data.items) {
    if (y + rowH > ph - 38) {
      doc.addPage();
      fillCream();
      y = 22;
    }
    const itemSub = item.price * item.quantity;
    const base = y + 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(item.name, 100) as string[];
    const name = lines.length > 1 ? `${lines[0]}…` : lines[0];
    doc.text(name, nameX, base);

    doc.setFontSize(10.5);
    doc.setTextColor(...MUTED);
    doc.text(String(item.quantity), qtyX, base, { align: 'right' });
    doc.text(money(item.price), priceX, base, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text(money(itemSub), subtotalX, base, { align: 'right' });

    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.2);
    doc.line(M, y + rowH, pw - M, y + rowH);
    y += rowH;
  }

  // ── Total (caja destacada) ────────────────────────────────────────────────
  y += 6;
  const boxW = contentW * 0.5;
  const boxX = pw - M - boxW;
  const boxH = 22;
  if (y + boxH > ph - 30) {
    doc.addPage();
    fillCream();
    y = 22;
  }
  doc.setFillColor(...GREEN);
  doc.roundedRect(boxX, y, boxW, boxH, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...CREAM);
  doc.text('TOTAL PRODUCTOS', boxX + 7, y + 9, { charSpace: 0.5 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(money(data.subtotal), boxX + boxW - 7, y + 16, { align: 'right' });
  y += boxH + 8;

  // Nota de envío
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const note = data.gestor
    ? `Este total cubre solo los productos. La mensajería se gestiona directamente con ${data.gestor.name}.`
    : 'Este total cubre solo los productos. La mensajería se gestiona directamente con tu gestor de zona.';
  const noteLines = doc.splitTextToSize(note, contentW) as string[];
  doc.text(noteLines, M, y);
  y += noteLines.length * 4.5 + 6;

  // ── Tarjeta del gestor ────────────────────────────────────────────────────
  if (data.gestor) {
    const cardH = 42;
    if (y + cardH > ph - 22) {
      doc.addPage();
      fillCream();
      y = 22;
    }
    doc.setFillColor(...TINT);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, contentW, cardH, 2, 2, 'FD');

    const px = M + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text('TU GESTOR DE ZONA', px, y + 10, { charSpace: 0.5 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...GREEN);
    doc.text(data.gestor.name, px, y + 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...INK);
    doc.text(`WhatsApp: +${data.gestor.whatsapp}`, px, y + 27);

    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const zona = doc.splitTextToSize(
      `Zona: ${data.gestor.municipalities.join(', ')}`,
      contentW - 16,
    ) as string[];
    doc.text(zona[0], px, y + 34);
    doc.text(`Provincia: ${data.gestor.provinces.join(', ')}`, px, y + 40);
    y += cardH;
  }

  // ── Pie ───────────────────────────────────────────────────────────────────
  const footerY = ph - 14;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.3);
  doc.line(M, footerY - 6, pw - M, footerY - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GREEN);
  doc.text('Sophia · Productos Naturales · sophiacatalog.com', pw / 2, footerY, {
    align: 'center',
  });

  return doc.output('blob');
}
