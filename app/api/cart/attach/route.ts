import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CartItem } from '@/types/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client avec service role pour bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, items, total, depositTotal } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID requis' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items requis' },
        { status: 400 }
      );
    }

    // Vérifier si un panier existe déjà pour cet utilisateur
    const { data: existingCart, error: fetchError } = await supabaseAdmin
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est OK
      console.error('Erreur lors de la récupération du panier:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    const cartData = {
      user_id: userId,
      items: items as CartItem[],
      total_price: total || 0,
      deposit_total: depositTotal || 0,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expire dans 7 jours
    };

    let result;
    if (existingCart) {
      // Mettre à jour le panier existant
      const { data, error } = await supabaseAdmin
        .from('carts')
        .update(cartData)
        .eq('user_id', userId)
        .select()
        .single();

      result = { data, error };
    } else {
      // Créer un nouveau panier
      const { data, error } = await supabaseAdmin
        .from('carts')
        .insert(cartData)
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Erreur lors de la sauvegarde du panier:', result.error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la sauvegarde du panier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: result.data,
    });
  } catch (error: any) {
    console.error('Erreur API attach cart:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}





