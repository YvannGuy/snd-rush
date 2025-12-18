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

    // Gérer les erreurs d'authentification
    if (error) {
      console.error('❌ Erreur d\'authentification:', error, errorDescription);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const redirectUrl = baseUrl.includes('0.0.0.0') 
        ? baseUrl.replace('0.0.0.0', 'localhost')
        : baseUrl;
      
      // Rediriger vers la page de mot de passe oublié avec un message d'erreur
      const errorPage = new URL('/mot-de-passe-oublie', redirectUrl);
      errorPage.searchParams.set('error', 'Lien invalide ou expiré');
      return NextResponse.redirect(errorPage);
    }

    // Utiliser NEXT_PUBLIC_BASE_URL ou localhost correctement
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Si l'URL contient 0.0.0.0, utiliser localhost à la place
    const redirectUrl = baseUrl.includes('0.0.0.0') 
      ? baseUrl.replace('0.0.0.0', 'localhost')
      : baseUrl;

    if (code) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      });
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
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

      // Rattacher les réservations à l'utilisateur si c'est une nouvelle inscription
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
        } catch (attachError) {
          // Ne pas bloquer la redirection en cas d'erreur
          console.warn('Erreur rattachement réservations (non bloquant):', attachError);
        }
      }

      // Vérifier s'il y a un panier dans localStorage (via cookie ou paramètre)
      // Rediriger vers le panier si l'utilisateur avait un panier avant de créer son compte
      // Sinon, rediriger vers le dashboard
      const hasCart = requestUrl.searchParams.get('has_cart') === 'true';
      if (hasCart) {
        return NextResponse.redirect(new URL('/panier', redirectUrl));
      }

      // Sinon, rediriger vers le dashboard
      return NextResponse.redirect(new URL('/dashboard', redirectUrl));
    }

    // Si pas de code, rediriger vers la page d'accueil
    return NextResponse.redirect(new URL('/', redirectUrl));
  } catch (err: any) {
    console.error('❌ Erreur dans le callback:', err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = baseUrl.includes('0.0.0.0') 
      ? baseUrl.replace('0.0.0.0', 'localhost')
      : baseUrl;
    return NextResponse.redirect(new URL('/', redirectUrl));
  }
}

