import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabaseAdmin = (supabaseUrl && supabaseKey && supabaseUrl.trim() !== '' && supabaseKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    console.error('❌ verify-order: Configuration Supabase manquante');
    return NextResponse.json(
      { success: false, error: 'Configuration Supabase manquante' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'session_id manquant' },
      { status: 400 }
    );
  }

  try {
    const client = supabaseAdmin;
    
    // Vérifier si l'order existe pour cette session
    const { data: order, error } = await client
      .from('orders')
      .select('id, status, created_at')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error) {
      // PGRST116 = no rows returned (c'est normal si le webhook n'a pas encore traité)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          orderExists: false,
        });
      }
      
      // Autre erreur (table n'existe pas, permissions, etc.)
      console.error('❌ verify-order: Erreur Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
      // Retourner orderExists: false même en cas d'erreur pour ne pas bloquer la page
      return NextResponse.json({
        success: true,
        orderExists: false,
        warning: 'Impossible de vérifier l\'order, mais la page peut continuer',
      });
    }

    if (order) {
      return NextResponse.json({
        success: true,
        orderExists: true,
        order: {
          id: order.id,
          status: order.status,
          created_at: order.created_at,
        },
      });
    }

    // Order n'existe pas encore (webhook pas encore traité)
    return NextResponse.json({
      success: true,
      orderExists: false,
    });
  } catch (error: any) {
    console.error('❌ verify-order: Erreur inattendue:', {
      message: error.message,
      stack: error.stack,
      fullError: error,
    });
    
    // Retourner orderExists: false même en cas d'erreur pour ne pas bloquer la page
    return NextResponse.json({
      success: true,
      orderExists: false,
      warning: 'Erreur lors de la vérification, mais la page peut continuer',
    });
  }
}

