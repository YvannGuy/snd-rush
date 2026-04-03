import { supabase } from '@/lib/supabase';

/**
 * Récupère le token d'accès admin depuis la session Supabase
 * @throws Error('NO_SESSION') si pas de session
 */
export async function getAdminAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error('NO_SESSION');
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session || !session.access_token) {
    throw new Error('NO_SESSION');
  }

  return session.access_token;
}

/** Init fetch admin : body peut être un objet sérialisé en JSON (en plus des BodyInit standards). */
export type AdminFetchInit = Omit<RequestInit, 'body'> & {
  body?: RequestInit['body'] | Record<string, unknown>;
};

/**
 * Effectue un fetch vers une API route admin avec authentification Bearer
 * @param path - Chemin relatif (ex: '/api/admin/pending-actions')
 * @param init - Options RequestInit supplémentaires
 * @returns Promise<T> - Données JSON parsées
 * @throws Error avec message lisible en cas d'erreur
 */
export async function adminFetch<T = any>(
  path: string,
  init?: AdminFetchInit
): Promise<T> {
  try {
    const token = await getAdminAccessToken();
    
    // Build headers TypeScript-safe avec Headers API
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    
    // Préparer le body pour fetch
    let bodyToSend: BodyInit | null = null;
    
    // Gérer Content-Type et body selon le type
    if (init?.body) {
      const b = init.body;
      if (b instanceof FormData) {
        bodyToSend = b;
      } else if (b instanceof URLSearchParams) {
        bodyToSend = b;
      } else if (b instanceof Blob) {
        bodyToSend = b;
      } else if (b instanceof ArrayBuffer) {
        bodyToSend = b;
      } else if (ArrayBuffer.isView(b)) {
        bodyToSend = b;
      } else if (typeof ReadableStream !== 'undefined' && b instanceof ReadableStream) {
        bodyToSend = b;
      } else if (typeof b === 'string') {
        bodyToSend = b;
        const trimmed = b.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          headers.set('Content-Type', 'application/json');
        }
      } else {
        bodyToSend = JSON.stringify(b);
        headers.set('Content-Type', 'application/json');
      }
    } else if (init?.method && init.method !== 'GET') {
      // Pour les requêtes non-GET sans body, définir Content-Type quand même
      headers.set('Content-Type', 'application/json');
    }
    
    const { body: _initBody, headers: _initHeaders, ...restInit } = init ?? {};
    const response = await fetch(path, {
      ...restInit,
      headers,
      body: bodyToSend !== null ? bodyToSend : undefined,
    });

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const parsed = await response.json();
          errorMessage = parsed.error || parsed.message || errorMessage;
        } else {
          const errorBody = await response.text();
          errorMessage = errorBody || errorMessage;
        }
      } catch {
        // Ignorer erreur parsing
      }
      throw new Error(`${errorMessage} (${response.status})`);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NO_SESSION') {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'appel API admin';
    throw new Error(errorMessage);
  }
}
