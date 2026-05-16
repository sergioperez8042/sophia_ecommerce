/**
 * Sube una imagen al endpoint /api/upload y devuelve la URL de Cloudinary.
 *
 * Maneja el caso en el que la respuesta NO sea JSON (HTML de error 500 de
 * Vercel, body vacío, gateway timeout), en lugar de dejar que
 * `response.json()` tire un SyntaxError nativo críptico (que en Safari iOS
 * se muestra como "The string did not match the expected pattern" — el
 * mensaje del JSON parser que no le dice nada al usuario).
 */

export interface UploadSuccess {
  ok: true;
  url: string;
  fileName?: string;
}

export interface UploadFailure {
  ok: false;
  /** Mensaje legible para mostrarle al usuario. */
  message: string;
  /** Status HTTP si la respuesta llegó; undefined si fue error de red. */
  status?: number;
  /** Causa cruda para logging (no para UI). */
  cause?: unknown;
}

export type UploadResult = UploadSuccess | UploadFailure;

export type UploadFolder = 'products' | 'categories';

/**
 * Envuelve fetch + response parsing con manejo robusto de errores.
 * Nunca lanza una excepción: siempre devuelve un UploadResult.
 */
export async function uploadImage(params: {
  file: File;
  folder: UploadFolder;
  token: string | null;
}): Promise<UploadResult> {
  const { file, folder, token } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  let response: Response;
  try {
    response = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch (cause) {
    console.error('[uploadImage] fetch fail:', cause);
    return {
      ok: false,
      message: 'No se pudo conectar con el servidor. Revisá tu conexión a internet.',
      cause,
    };
  }

  // Leer SIEMPRE como texto primero. Si parseamos directo con .json() y el
  // body no es JSON (HTML, vacío), el SyntaxError nativo cae en el catch del
  // caller con un mensaje inútil ("expected pattern" en Safari iOS).
  const rawText = await response.text().catch(() => '');

  let parsed: { url?: string; error?: string; fileName?: string } | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // El body no es JSON. Probablemente HTML de error de Vercel o lambda crash.
      parsed = null;
    }
  }

  if (!response.ok) {
    const apiMessage = parsed?.error;
    const friendly =
      apiMessage ||
      (response.status === 401
        ? 'Sesión expirada. Volvé a iniciar sesión y reintentá.'
        : response.status === 413
        ? 'La imagen es demasiado grande. Máximo 5MB.'
        : response.status >= 500
        ? `Error del servidor (${response.status}). Reintentá en unos segundos.`
        : `Error al subir (HTTP ${response.status}).`);

    console.error('[uploadImage] HTTP error', {
      status: response.status,
      body: rawText.slice(0, 300),
    });

    return { ok: false, message: friendly, status: response.status };
  }

  if (!parsed?.url) {
    console.error('[uploadImage] response OK but no url field:', rawText.slice(0, 300));
    return {
      ok: false,
      message: 'El servidor respondió sin URL de imagen. Reintentá.',
      status: response.status,
    };
  }

  return { ok: true, url: parsed.url, fileName: parsed.fileName };
}
