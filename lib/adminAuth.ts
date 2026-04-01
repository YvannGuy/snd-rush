import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  error?: string;
}

/**
 * Vérifie si un utilisateur est admin via token Bearer.
 * Source de vérité : user_profiles.role === 'admin' (côté base de données).
 */
export async function verifyAdmin(token: string): Promise<AdminAuthResult> {
  if (!supabaseAdmin) {
    return { isAdmin: false, error: 'Configuration Supabase manquante' };
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return { isAdmin: false, error: 'Token invalide ou expiré' };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erreur vérification profil admin:', profileError);
      return { isAdmin: false, error: 'Erreur vérification profil' };
    }

    return { isAdmin: profile?.role === 'admin', userId: user.id };
  } catch (error: any) {
    console.error('Erreur vérification admin:', error);
    return { isAdmin: false, error: error.message || 'Erreur serveur' };
  }
}
