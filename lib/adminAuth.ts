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
 * Vérifie si un utilisateur est admin via token Bearer
 * - Whitelist emails (fallback)
 * - user_profiles.is_admin (source de vérité)
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

    // Whitelist emails (fallback)
    const whitelistEmails = ['yvann.guyonnet@gmail.com', 'sndrush12@gmail.com'];
    if (user.email && whitelistEmails.includes(user.email.toLowerCase())) {
      return { isAdmin: true, userId: user.id };
    }

    // Vérifier user_profiles.is_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erreur vérification profil admin:', profileError);
      return { isAdmin: false, error: 'Erreur vérification profil' };
    }

    return { isAdmin: profile?.is_admin === true, userId: user.id };
  } catch (error: any) {
    console.error('Erreur vérification admin:', error);
    return { isAdmin: false, error: error.message || 'Erreur serveur' };
  }
}
