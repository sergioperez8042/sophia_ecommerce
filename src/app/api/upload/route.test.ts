/**
 * @jest-environment node
 */

/**
 * Tests para la ruta API /api/upload
 *
 * Esta ruta recibe un archivo de imagen via FormData,
 * verifica autorizacion via Firebase token, valida tipo/tamano
 * y lo sube a Cloudinary.
 */

import { NextRequest } from 'next/server';
import { POST } from './route';

// Mock de cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

// Mock de api-auth
const mockVerifyFirebaseAuth = jest.fn();
jest.mock('@/lib/api-auth', () => ({
  verifyFirebaseAuth: (...args: unknown[]) => mockVerifyFirebaseAuth(...args),
  unauthorizedResponse: jest.fn(() => {
    const { NextResponse } = require('next/server');
    return NextResponse.json(
      { error: 'No autorizado. Se requiere autenticación.' },
      { status: 401 }
    );
  }),
}));

import { v2 as cloudinary } from 'cloudinary';

const mockUpload = cloudinary.uploader.upload as jest.MockedFunction<typeof cloudinary.uploader.upload>;

function crearArchivoImagen(
  nombre = 'test.jpg',
  tipo = 'image/jpeg',
  tamano = 1024
): File {
  const buffer = new ArrayBuffer(tamano);
  return new File([buffer], nombre, { type: tipo });
}

function crearRequestConArchivo(
  archivo?: File,
  folder?: string,
  headers?: Record<string, string>
): NextRequest {
  const formData = new FormData();
  if (archivo) {
    formData.append('file', archivo);
  }
  if (folder) {
    formData.append('folder', folder);
  }

  return new NextRequest('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
    headers: headers || { Authorization: 'Bearer firebase-id-token' },
  });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyFirebaseAuth.mockResolvedValue({ uid: 'test-uid', email: 'admin@test.com' });
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  // ---------------------------------------------------
  // Autorizacion
  // ---------------------------------------------------
  describe('Autorizacion', () => {
    it('deberia devolver 401 si no esta autorizado', async () => {
      mockVerifyFirebaseAuth.mockResolvedValue(null);

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe('No autorizado. Se requiere autenticación.');
    });
  });

  // ---------------------------------------------------
  // Subida exitosa
  // ---------------------------------------------------
  describe('Subida exitosa', () => {
    it('deberia subir imagen y responder con la URL', async () => {
      mockUpload.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image/upload/products/test.jpg',
        public_id: 'products/test',
      } as never);

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://res.cloudinary.com/test/image/upload/products/test.jpg');
      expect(data.fileName).toBe('products/test');
      expect(data.storage).toBe('cloudinary');
    });

    it('deberia usar la carpeta por defecto "products" si no se especifica', async () => {
      mockUpload.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'products/img',
      } as never);

      await POST(crearRequestConArchivo(crearArchivoImagen()));

      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'products' })
      );
    });

    it('deberia usar la carpeta personalizada si se especifica', async () => {
      mockUpload.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'banners/img',
      } as never);

      await POST(crearRequestConArchivo(crearArchivoImagen(), 'banners'));

      expect(mockUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ folder: 'banners' })
      );
    });

    it('deberia configurar cloudinary con las credenciales del entorno', async () => {
      mockUpload.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'img',
      } as never);

      await POST(crearRequestConArchivo(crearArchivoImagen()));

      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-key',
        api_secret: 'test-secret',
      });
    });
  });

  // ---------------------------------------------------
  // Validacion del archivo
  // ---------------------------------------------------
  describe('Validacion del archivo', () => {
    it('deberia devolver 400 si no se proporciona archivo', async () => {
      const res = await POST(crearRequestConArchivo());
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('No se proporcionó ningún archivo');
    });

    it.each([
      ['image/jpeg', true],
      ['image/png', true],
      ['image/gif', true],
      ['image/webp', true],
      ['application/pdf', false],
      ['image/svg+xml', false],
      ['text/plain', false],
      ['video/mp4', false],
    ])('deberia %s tipo %s', async (tipo, aceptado) => {
      if (aceptado) {
        mockUpload.mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image.jpg',
          public_id: 'img',
        } as never);
      }

      const archivo = crearArchivoImagen('test.file', tipo);
      const res = await POST(crearRequestConArchivo(archivo));

      if (aceptado) {
        expect(res.status).toBe(200);
      } else {
        const data = await res.json();
        expect(res.status).toBe(400);
        expect(data.error).toBe(
          'Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)'
        );
      }
    });

    it('deberia rechazar archivos mayores a 5MB', async () => {
      const archivoGrande = crearArchivoImagen('grande.jpg', 'image/jpeg', 6 * 1024 * 1024);
      const res = await POST(crearRequestConArchivo(archivoGrande));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('El archivo es demasiado grande. Máximo 5MB');
    });

    it('deberia aceptar archivos de exactamente 5MB', async () => {
      mockUpload.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'img',
      } as never);

      const archivo = crearArchivoImagen('justo.jpg', 'image/jpeg', 5 * 1024 * 1024);
      const res = await POST(crearRequestConArchivo(archivo));

      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------
  // Configuracion de Cloudinary
  // ---------------------------------------------------
  describe('Configuracion de Cloudinary', () => {
    it('deberia devolver 503 si falta CLOUDINARY_CLOUD_NAME', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.error).toBe(
        'Cloudinary no está configurado correctamente. Contacta al administrador.'
      );
    });

    it('deberia devolver 503 si falta CLOUDINARY_API_KEY', async () => {
      delete process.env.CLOUDINARY_API_KEY;

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(503);
    });

    it('deberia devolver 503 si falta CLOUDINARY_API_SECRET', async () => {
      delete process.env.CLOUDINARY_API_SECRET;

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(503);
    });
  });

  // ---------------------------------------------------
  // Errores de Cloudinary
  // ---------------------------------------------------
  describe('Errores de Cloudinary', () => {
    it('deberia devolver 500 si cloudinary.uploader.upload lanza Error', async () => {
      mockUpload.mockRejectedValueOnce(new Error('Upload failed'));

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Error al subir a Cloudinary');
      expect(data.error).toContain('Upload failed');
    });

    it('deberia devolver 500 si cloudinary lanza un objeto de error', async () => {
      mockUpload.mockRejectedValueOnce({ message: 'Rate limit exceeded' });

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Error al subir a Cloudinary');
      expect(data.error).toContain('Rate limit exceeded');
    });

    it('deberia manejar error desconocido de cloudinary', async () => {
      mockUpload.mockRejectedValueOnce('error string');

      const res = await POST(crearRequestConArchivo(crearArchivoImagen()));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toContain('Error al subir a Cloudinary');
    });
  });
});
