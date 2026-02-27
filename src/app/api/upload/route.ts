import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

    if (!storage) {
      return NextResponse.json(
        { error: 'Firebase Storage no está configurado. Activa Storage en la consola de Firebase (console.firebase.google.com → Storage → Get Started).' },
        { status: 503 }
      );
    }

    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]+$/, '');
    const fileName = `${timestamp}_${safeName}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

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
    } catch (firebaseError) {
      const errorMessage = firebaseError instanceof Error ? firebaseError.message : 'Error desconocido';

      if (errorMessage.includes('does not exist') || errorMessage.includes('storage/unauthorized')) {
        return NextResponse.json(
          { error: 'Firebase Storage no está habilitado. Ve a console.firebase.google.com → Storage → Click "Get Started" para activarlo.' },
          { status: 503 }
        );
      }

      if (errorMessage.includes('storage/unauthorized') || errorMessage.includes('permission')) {
        return NextResponse.json(
          { error: 'Permisos de Firebase Storage denegados. Configura las reglas de seguridad en la consola de Firebase.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: `Error al subir a Firebase Storage: ${errorMessage}` },
        { status: 500 }
      );
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al procesar el archivo: ${message}` },
      { status: 500 }
    );
  }
}
