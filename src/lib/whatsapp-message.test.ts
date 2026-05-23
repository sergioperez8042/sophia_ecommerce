import { buildOrderMessage } from './whatsapp-message';

const baseItems = [
  { productName: 'Crema hidratante', quantity: 2, lineSubtotal: 30 },
  { productName: 'Jabón natural', quantity: 1, lineSubtotal: 12 },
];

describe('buildOrderMessage', () => {
  it('greets the gestor by name when present', () => {
    const msg = buildOrderMessage({
      gestorName: 'Maday',
      items: baseItems,
      subtotal: 42,
    });
    expect(msg.startsWith('Hola Maday, te envío mi pedido de Sophia.')).toBe(
      true,
    );
  });

  it('falls back to generic greeting when no gestor', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
    });
    expect(msg.startsWith('Hola, te envío mi pedido de Sophia.')).toBe(true);
  });

  it('includes Cliente section when any field is present', () => {
    const msg = buildOrderMessage({
      customerName: 'Sergio',
      customerPhone: '53123456',
      customerEmail: 'sergio@example.com',
      municipality: 'Centro Habana',
      province: 'La Habana',
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).toContain('*Cliente*');
    expect(msg).toContain('Sergio');
    expect(msg).toContain('Centro Habana, La Habana');
    expect(msg).toContain('53123456');
    expect(msg).toContain('sergio@example.com');
  });

  it('omits Cliente section entirely when no client field provided', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).not.toContain('*Cliente*');
  });

  it('includes Cliente section with only location when name/phone/email empty', () => {
    // Caso /cart antes de añadir los inputs faltantes — debe seguir mostrando la zona
    const msg = buildOrderMessage({
      municipality: 'Cárdenas',
      province: 'Matanzas',
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).toContain('*Cliente*');
    expect(msg).toContain('Cárdenas, Matanzas');
  });

  it('renders all items with quantity and subtotal', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).toContain('2x Crema hidratante — $30.00');
    expect(msg).toContain('1x Jabón natural — $12.00');
  });

  it('uses default $X.XX formatter', () => {
    const msg = buildOrderMessage({
      items: [{ productName: 'Item', quantity: 1, lineSubtotal: 9.5 }],
      subtotal: 9.5,
    });
    expect(msg).toContain('1x Item — $9.50');
    expect(msg).toContain('*Total: $9.50*');
  });

  it('accepts custom formatPrice', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
      formatPrice: (n) => `€${n}`,
    });
    expect(msg).toContain('*Total: €42*');
  });

  it('includes shipping note (productos vs mensajería)', () => {
    const msg = buildOrderMessage({
      gestorName: 'Arturo',
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).toContain(
      'El total cubre únicamente los productos, en caso de necesitar mensajería se coordinará directamente con Arturo',
    );
  });

  it('uses generic gestor ref in shipping note when no gestor', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
    });
    expect(msg).toContain(
      'se coordinará directamente con tu gestor de zona',
    );
  });

  it('appends Notas section when provided', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
      notes: 'Por favor, entrega en horario de mañana.',
    });
    expect(msg).toContain('*Notas*');
    expect(msg).toContain('Por favor, entrega en horario de mañana.');
  });

  it('omits Notas section when notes is empty or whitespace-only', () => {
    const msg = buildOrderMessage({
      items: baseItems,
      subtotal: 42,
      notes: '   ',
    });
    expect(msg).not.toContain('*Notas*');
  });

  it('trims customer name', () => {
    const msg = buildOrderMessage({
      customerName: '  Sergio  ',
      items: baseItems,
      subtotal: 42,
    });
    // No leading/trailing spaces around the name line
    const lines = msg.split('\n');
    expect(lines).toContain('Sergio');
  });
});
