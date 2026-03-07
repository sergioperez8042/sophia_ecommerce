import { createRemoteJWKSSet, jwtVerify } from 'jose';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const ISSUER_PREFIX = 'https://securetoken.google.com/';

let jwks: ReturnType<typeof createRemoteJWKSSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSSet(new URL(GOOGLE_CERTS_URL));
  }
  return jwks;
}

export interface FirebaseTokenPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  [key: string]: unknown;
}

/**
 * Verify a Firebase ID token using Google's public keys.
 * No service account needed — only the Firebase project ID.
 */
export async function verifyFirebaseToken(token: string): Promise<FirebaseTokenPayload | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: `${ISSUER_PREFIX}${projectId}`,
      audience: projectId,
    });

    const sub = payload.sub;
    if (!sub) return null;

    return {
      uid: sub,
      email: payload.email as string | undefined,
      email_verified: payload.email_verified as boolean | undefined,
      name: payload.name as string | undefined,
      ...payload,
    };
  } catch {
    return null;
  }
}
