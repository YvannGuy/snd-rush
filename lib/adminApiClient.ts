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

/**
 * Effectue un fetch vers une API route admin avec authentification Bearer
 * @param path - Chemin relatif (ex: '/api/admin/pending-actions')
 * @param init - Options RequestInit supplémentaires
 * @returns Promise<T> - Données JSON parsées
 * @throws Error avec message lisible en cas d'erreur
 */
export async function adminFetch<T = any>(
  path: string,
  init?: RequestInit
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
      if (init.body instanceof FormData) {
        // FormData => ne jamais définir Content-Type, passer tel quel
        bodyToSend = init.body;
      } else if (init.body instanceof URLSearchParams) {
        // URLSearchParams => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (init.body instanceof Blob) {
        // Blob => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (init.body instanceof ArrayBuffer) {
        // ArrayBuffer => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (ArrayBuffer.isView(init.body)) {
        // ArrayBufferView (ex: Uint8Array) => passer tel quel, ne pas JSON.stringify
        bodyToSend = init.body;
      } else if (typeof ReadableStream !== 'undefined' && init.body instanceof ReadableStream) {
        // ReadableStream => passer tel quel, ne pas JSON.stringify
        // Vérification typeof pour éviter erreurs SSR si ReadableStream undefined
        bodyToSend = init.body;
      } else if (typeof init.body === 'string') {
        // string => passer tel quel, set Content-Type application/json seulement si ressemble à du JSON
        bodyToSend = init.body;
        const trimmed = init.body.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          headers.set('Content-Type', 'application/json');
        }
      } else {
        // plain object => JSON.stringify + Content-Type application/json
        bodyToSend = JSON.stringify(init.body);
        headers.set('Content-Type', 'application/json');
      }
    } else if (init?.method && init.method !== 'GET') {
      // Pour les requêtes non-GET sans body, définir Content-Type quand même
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(path, {
      ...init,
      headers,
      body: bodyToSend !== null ? bodyToSend : init?.body,
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
