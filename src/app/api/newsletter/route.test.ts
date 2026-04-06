/**
 * @jest-environment node
 */

import { GET } from './route';

describe('GET /api/newsletter', () => {
  it('devuelve mensaje de redirección', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain('/api/newsletter/send');
  });
});
