import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Créer le client Supabase avec la clé anon (suffisante pour auth.getUser)
// On peut aussi utiliser SERVICE_ROLE_KEY si disponible
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Préférer service_role si disponible, sinon utiliser anon
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabaseAdmin = (supabaseUrl && supabaseKey && supabaseUrl.trim() !== '' && supabaseKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }
  
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      // Retourner un panier vide au lieu d'une erreur 401
      return NextResponse.json({
        success: true,
        cart: { items: [], total_price: 0, deposit_total: 0 },
      });
    }

    // Extraire le token Bearer
    const token = authHeader.replace('Bearer ', '');
    
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }
    
    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    
    if (authError || !user) {
      // Retourner un panier vide au lieu d'une erreur 401 si le token est invalide
      console.warn('Token invalide ou expiré, retour d\'un panier vide');
      return NextResponse.json({
        success: true,
        cart: { items: [], total_price: 0, deposit_total: 0 },
      });
    }

    // Récupérer le panier de l'utilisateur
    const { data: cart, error: cartError } = await client
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est OK (panier vide)
      console.error('Erreur récupération panier:', cartError);
      return NextResponse.json(
        { success: false, error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: cart || { items: [], total_price: 0, deposit_total: 0 },
    });
  } catch (error: any) {
    console.error('Erreur API get cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }
  
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Extraire le token Bearer
    const token = authHeader.replace('Bearer ', '');
    
    const client = supabaseAdmin;
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }
    
    // Vérifier le token et obtenir l'utilisateur
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Supprimer le panier de l'utilisateur
    const { error: deleteError } = await client
      .from('carts')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erreur suppression panier:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Panier vidé avec succès',
    });
  } catch (error: any) {
    console.error('Erreur API delete cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

