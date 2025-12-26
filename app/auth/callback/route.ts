import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get('code');
    const type = requestUrl.searchParams.get('type');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    
    // Log pour déboguer
    console.log('🔍 Callback auth - URL complète:', req.url);
    console.log('🔍 Callback auth - Code:', code ? 'présent' : 'absent');
    console.log('🔍 Callback auth - Type:', type);
    console.log('🔍 Callback auth - Error:', error);

    // Gérer les erreurs d'authentification
    if (error) {
      console.error('❌ Erreur d\'authentification:', error, errorDescription);
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      if (baseUrl.includes('0.0.0.0')) {
        baseUrl = baseUrl.replace('0.0.0.0', 'localhost');
      }
      
      // Valider que l'URL est valide
      let redirectUrl = baseUrl;
      try {
        new URL(baseUrl);
      } catch {
        console.warn('⚠️ NEXT_PUBLIC_BASE_URL invalide, utilisation de localhost par défaut');
        redirectUrl = 'http://localhost:3000';
      }
      
      // Rediriger vers la page de mot de passe oublié avec un message d'erreur
      const errorPage = new URL('/mot-de-passe-oublie', redirectUrl);
      errorPage.searchParams.set('error', 'Lien invalide ou expiré');
      return NextResponse.redirect(errorPage);
    }

    // Utiliser NEXT_PUBLIC_BASE_URL ou localhost correctement
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Si l'URL contient 0.0.0.0, utiliser localhost à la place
    if (baseUrl.includes('0.0.0.0')) {
      baseUrl = baseUrl.replace('0.0.0.0', 'localhost');
    }
    
    // Valider que l'URL est valide
    let redirectUrl = baseUrl;
    try {
      new URL(baseUrl);
    } catch {
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL invalide, utilisation de localhost par défaut');
      redirectUrl = 'http://localhost:3000';
    }

    // Gérer le magic link avec code ou token (type=magiclink ou magic_link)
    const token = requestUrl.searchParams.get('token');
    const magicLinkType = requestUrl.searchParams.get('type') === 'magic_link' || requestUrl.searchParams.get('type') === 'magiclink';
    const codeOrToken = code || token;

    if (codeOrToken && (magicLinkType || code)) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      });
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeOrToken);
      
      if (exchangeError) {
        console.error('❌ Erreur lors de l\'échange du code:', exchangeError);
        
        // Si c'est une réinitialisation de mot de passe et que le code est invalide/expiré
        if (type === 'recovery') {
          const errorPage = new URL('/mot-de-passe-oublie', redirectUrl);
          errorPage.searchParams.set('error', 'Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.');
          return NextResponse.redirect(errorPage);
        }
        
        // Rediriger vers la page d'accueil en cas d'erreur
        return NextResponse.redirect(new URL('/', redirectUrl));
      }

      // Si c'est une réinitialisation de mot de passe, rediriger vers la page de réinitialisation
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reinitialiser-mot-de-passe', redirectUrl));
      }

      // Gérer le magic link depuis l'email de confirmation de paiement
      const reservationId = requestUrl.searchParams.get('reservation_id');
      const isNewUser = requestUrl.searchParams.get('new_user') === 'true';
      const setupPassword = requestUrl.searchParams.get('setup_password') === 'true';

      // Rattacher les réservations à l'utilisateur si c'est une nouvelle inscription ou magic link
      if (data.user && data.user.email && supabaseAdmin) {
        try {
          // Rattacher les client_reservations qui correspondent à cet email mais n'ont pas encore de user_id
          const { error: updateError } = await supabaseAdmin
            .from('client_reservations')
            .update({ user_id: data.user.id })
            .eq('customer_email', data.user.email.toLowerCase().trim())
            .is('user_id', null);

          if (updateError) {
            console.warn('Erreur rattachement réservations (non bloquant):', updateError);
          } else {
            console.log(`✅ Réservations rattachées à l'utilisateur ${data.user.id}`);
          }

          // Si une réservation spécifique est mentionnée, s'assurer qu'elle est rattachée
          if (reservationId) {
            await supabaseAdmin
              .from('client_reservations')
              .update({ user_id: data.user.id })
              .eq('id', reservationId);
          }
        } catch (attachError) {
          // Ne pas bloquer la redirection en cas d'erreur
          console.warn('Erreur rattachement réservations (non bloquant):', attachError);
        }
      }

      // Si c'est un magic link avec nouveau compte, rediriger vers le dashboard avec le flag setup_password
      if (type === 'magic_link' && isNewUser && setupPassword) {
        return NextResponse.redirect(new URL('/dashboard?setup_password=true&new_user=true', redirectUrl));
      }

      // Vérifier s'il y a un panier dans sessionStorage (géré côté client)
      // Le callback redirige toujours vers le dashboard
      // Le client vérifiera sessionStorage et redirigera vers le panier si nécessaire
      // Cela évite les problèmes d'encodage d'URL avec les paramètres de requête

      // Sinon, rediriger vers le dashboard
      return NextResponse.redirect(new URL('/dashboard', redirectUrl));
    }

    // Si pas de code, rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', redirectUrl));
  } catch (err: any) {
    console.error('❌ Erreur dans le callback:', err);
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (baseUrl.includes('0.0.0.0')) {
      baseUrl = baseUrl.replace('0.0.0.0', 'localhost');
    }
    
    // Valider que l'URL est valide
    let redirectUrl = baseUrl;
    try {
      new URL(baseUrl);
    } catch {
      console.warn('⚠️ NEXT_PUBLIC_BASE_URL invalide, utilisation de localhost par défaut');
      redirectUrl = 'http://localhost:3000';
    }
    
    return NextResponse.redirect(new URL('/', redirectUrl));
  }
}

