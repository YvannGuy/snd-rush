/**
 * Règles d’identité admin partagées entre le client (useAdmin) et le serveur (verifyAdmin).
 * Ne contient aucun secret.
 */
export const ADMIN_FALLBACK_EMAILS = ['yvann.guyonnet@gmail.com'] as const;

/** Même logique que l’ancien « admin via metadata / email » dans useAdmin. */
export function isAdminMetadataOrFallbackEmail(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): boolean {
  const metaRole = String(user.user_metadata?.role ?? '').toLowerCase() === 'admin';
  const email = user.email?.toLowerCase() ?? '';
  const emailAllow = ADMIN_FALLBACK_EMAILS.some((e) => e === email);
  return metaRole || emailAllow;
}
