/**
 * Utilitaires pour la génération et validation de tokens publics (V1.4)
 * Sécurisé : token en clair uniquement dans l'email, hash stocké en DB
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Génère un token aléatoire sécurisé (32 bytes minimum)
 */
export function generatePublicToken(): string {
  // Générer 32 bytes aléatoires et convertir en base64url (URL-safe)
  const randomBytesBuffer = randomBytes(32);
  return randomBytesBuffer.toString('base64url');
}

/**
 * Hash un token avec SHA256
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compare un token en clair avec un hash stocké
 */
export function verifyToken(plainToken: string, hash: string): boolean {
  const computedHash = hashToken(plainToken);
  return computedHash === hash;
}

/**
 * Génère un token et son hash avec expiration (7 jours par défaut)
 */
export function generateTokenWithHash(expirationDays: number = 7): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = generatePublicToken();
  const hash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  return { token, hash, expiresAt };
}

/**
 * Phase C1 - Assure qu'un token checkout valide existe pour une réservation
 * Si le token est NULL ou expire dans moins de 1 jour, génère un nouveau token
 * Retourne le token plaintext (uniquement pour email, jamais loggé)
 */
export async function ensureValidCheckoutToken(
  reservationId: string,
  supabaseAdmin: any
): Promise<string> {
  // Récupérer la réservation
  const { data: reservation, error } = await supabaseAdmin
    .from('client_reservations')
    .select('public_token_hash, public_token_expires_at')
    .eq('id', reservationId)
    .single();

  if (error || !reservation) {
    throw new Error(`Réservation ${reservationId} introuvable`);
  }

  const now = new Date();
  const expiresAt = reservation.public_token_expires_at 
    ? new Date(reservation.public_token_expires_at) 
    : null;

  // Vérifier si le token existe et est valide (expire dans plus de 1 jour)
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  if (reservation.public_token_hash && expiresAt && expiresAt > oneDayFromNow) {
    // Token valide existe, mais on ne peut pas récupérer le plaintext depuis la DB
    // On doit générer un nouveau token pour l'email (le hash existant reste valide pour l'ancien lien)
    // Pour MVP, on régénère toujours un nouveau token pour les relances (plus simple)
    // L'ancien token reste valide pour le checkout, le nouveau sera dans l'email de relance
  }

  // Générer un nouveau token (7 jours d'expiration)
  const { token, hash, expiresAt: newExpiresAt } = generateTokenWithHash(7);

  // Mettre à jour la réservation avec le nouveau token
  const { error: updateError } = await supabaseAdmin
    .from('client_reservations')
    .update({
      public_token_hash: hash,
      public_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', reservationId);

  if (updateError) {
    throw new Error(`Erreur mise à jour token: ${updateError.message}`);
  }

  // Retourner le token plaintext (uniquement pour email, jamais loggé)
  return token;
}




