import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Erreur lors de l\'échange du code:', error);
      // Rediriger vers la page d'accueil en cas d'erreur
      return NextResponse.redirect(new URL('/', redirectUrl));
    }

    // Si c'est une réinitialisation de mot de passe, rediriger vers la page de réinitialisation
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/reinitialiser-mot-de-passe', redirectUrl));
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
}

