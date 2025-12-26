import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/token';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET /api/auth/magic-link/[token]
 * Lien magique : vérifie le token, crée un compte si nécessaire, et redirige vers le dashboard
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token?: string }> | { token?: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.redirect(new URL('/?error=config_missing', req.url));
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const token = resolvedParams.token;

    if (!token) {
      return NextResponse.redirect(new URL('/?error=token_missing', req.url));
    }

    // Trouver la réservation avec ce token
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('id, customer_email, public_token_hash, public_token_expires_at')
      .not('public_token_hash', 'is', null);

    if (fetchError) {
      console.error('[MAGIC-LINK] Erreur récupération réservations:', fetchError);
      return NextResponse.redirect(new URL('/?error=reservation_not_found', req.url));
    }

    // Trouver la réservation avec le token correspondant
    let reservation = null;
    for (const res of reservations || []) {
      if (res.public_token_hash && verifyToken(token, res.public_token_hash)) {
        // Vérifier l'expiration
        if (res.public_token_expires_at) {
          const expiresAt = new Date(res.public_token_expires_at);
          if (expiresAt <= new Date()) {
            continue; // Token expiré
          }
        }
        reservation = res;
        break;
      }
    }

    if (!reservation || !reservation.customer_email) {
      console.error('[MAGIC-LINK] Réservation non trouvée ou email manquant');
      return NextResponse.redirect(new URL('/?error=invalid_token', req.url));
    }

    const customerEmail = reservation.customer_email.toLowerCase().trim();
    const siteUrlEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const baseUrl = siteUrlEnv || 'http://localhost:3000';
    const redirectUrl = new URL('/auth/callback', baseUrl);
    redirectUrl.searchParams.set('type', 'magic_link');
    redirectUrl.searchParams.set('reservation_id', reservation.id);

    // Vérifier si l'utilisateur existe déjà
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error('[MAGIC-LINK] Erreur liste utilisateurs:', listUsersError);
      return NextResponse.redirect(new URL('/?error=server_error', req.url));
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === customerEmail);
    let isNewUser = false;

    if (!existingUser) {
      // Créer un nouvel utilisateur avec un mot de passe temporaire
      isNewUser = true;
      const temporaryPassword = randomBytes(16).toString('base64url'); // Mot de passe temporaire sécurisé
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: temporaryPassword,
        email_confirm: true, // Confirmer l'email automatiquement
        user_metadata: {
          created_via: 'magic_link',
          reservation_id: reservation.id,
          needs_password_setup: true, // Flag pour indiquer qu'il faut créer un mot de passe permanent
        },
      });

      if (createError || !newUser.user) {
        console.error('[MAGIC-LINK] Erreur création utilisateur:', createError);
        return NextResponse.redirect(new URL('/?error=user_creation_failed', req.url));
      }

      console.log('[MAGIC-LINK] Nouvel utilisateur créé:', customerEmail);
      
      // Rattacher la réservation à l'utilisateur
      await supabaseAdmin
        .from('client_reservations')
        .update({ user_id: newUser.user.id })
        .eq('id', reservation.id);
    } else {
      // Rattacher la réservation à l'utilisateur existant si pas déjà fait
      await supabaseAdmin
        .from('client_reservations')
        .update({ user_id: existingUser.id })
        .eq('id', reservation.id)
        .is('user_id', null);
    }

    // Créer un magic link Supabase pour connexion automatique
    console.log('[MAGIC-LINK] Génération magic link Supabase pour:', customerEmail);
    console.log('[MAGIC-LINK] RedirectTo:', redirectToUrl.toString());
    console.log('[MAGIC-LINK] IsNewUser:', isNewUser);
    
    const redirectToUrl = new URL(redirectUrl.toString());
    if (isNewUser) {
      redirectToUrl.searchParams.set('new_user', 'true');
      redirectToUrl.searchParams.set('setup_password', 'true');
    }
    const finalRedirectTo = redirectToUrl.toString();
    
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: customerEmail,
      options: {
        redirectTo: finalRedirectTo,
      },
    });

    console.log('[MAGIC-LINK] Résultat génération magic link:');
    console.log('  - Erreur:', magicLinkError ? JSON.stringify(magicLinkError, null, 2) : 'Aucune');
    console.log('  - Data présente:', !!magicLinkData);
    if (magicLinkData) {
      console.log('  - Properties:', Object.keys(magicLinkData.properties || {}));
      console.log('  - Action link:', magicLinkData.properties?.action_link ? 'Présent' : 'Absent');
      console.log('  - Hashed token:', magicLinkData.properties?.hashed_token ? 'Présent' : 'Absent');
    }

    if (magicLinkError) {
      console.error('[MAGIC-LINK] ❌ Erreur génération magic link:', JSON.stringify(magicLinkError, null, 2));
      return NextResponse.json({ error: 'Erreur génération magic link' }, { status: 500 });
    }

    if (!magicLinkData) {
      console.error('[MAGIC-LINK] ❌ Aucune donnée retournée par generateLink');
      return NextResponse.json({ error: 'action_link manquant' }, { status: 500 });
    }

    // Le action_link est l'URL complète du magic link Supabase
    const actionLink = magicLinkData.properties?.action_link;
    if (!actionLink) {
      console.error('[MAGIC-LINK] ❌ action_link manquant');
      return NextResponse.json({ error: 'action_link manquant' }, { status: 500 });
    }

    console.log('[MAGIC-LINK] ✅ Magic link généré avec succès');
    console.log('[MAGIC-LINK] URL (premiers 100 caractères):', actionLink.substring(0, 100) + '...');
    // Retourner l'URL dans le body pour que la page client puisse rediriger
    return NextResponse.json({ 
      success: true, 
      redirectUrl: actionLink,
      isNewUser 
    });
  } catch (error: any) {
    console.error('[MAGIC-LINK] Erreur serveur:', error);
    return NextResponse.redirect(new URL('/?error=server_error', req.url));
  }
}
