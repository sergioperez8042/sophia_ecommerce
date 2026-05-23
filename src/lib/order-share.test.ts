import { generateOrderFileName } from './order-share';

describe('generateOrderFileName', () => {
  it('returns a filename matching the canonical pattern', () => {
    const name = generateOrderFileName();
    expect(name).toMatch(/^Pedido_Sophia_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('uses today’s ISO date', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(generateOrderFileName()).toBe(`Pedido_Sophia_${today}.pdf`);
  });
});

// Nota: sendOrderViaWhatsApp NO se testea aquí porque depende de
// navigator.canShare / navigator.share / URL.createObjectURL /
// document.createElement('a').click() / window.location.href. Cada
// dependencia tiene side-effects irreversibles en jsdom y mockearlas
// individualmente da poco valor frente al riesgo de falsos positivos.
// Se cubre con un smoke test E2E manual: ver checklist del spec.
