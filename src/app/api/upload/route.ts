import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '');
    const fileName = `${timestamp}_${safeName}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    // Try Firebase Storage first
    if (storage) {
      try {
        const storageRef = ref(storage, `${folder}/${fileName}`);
        await uploadBytes(storageRef, buffer, { contentType: file.type });
        const downloadURL = await getDownloadURL(storageRef);

        return NextResponse.json({
          success: true,
          url: downloadURL,
          fileName,
          storage: 'firebase',
        });
      } catch {
        // Firebase Storage failed, fall through to local storage
      }
    }

    // Fallback: save to local public/uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      storage: 'local',
    });

  } catch {
    return NextResponse.json(
      { error: 'Error al subir el archivo. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
