import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { generateTokenWithHash } from '@/lib/token';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    let { pack_key, payload, customer_email, customer_phone, customer_name } = body;

    // Validation
    if (!pack_key || !['conference', 'soiree', 'mariage'].includes(pack_key)) {
      return NextResponse.json(
        { error: 'pack_key invalide. Doit être: conference, soiree, ou mariage' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'payload requis (objet JSON)' },
        { status: 400 }
      );
    }

    // Essayer de récupérer l'email depuis la session si pas fourni
    if (!customer_email) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && supabaseUrl && supabaseAnonKey) {
        const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.email) {
          customer_email = user.email;
          // Récupérer aussi le nom depuis user_metadata ou user_profiles si disponible
          if (!customer_name && user.user_metadata?.full_name) {
            customer_name = user.user_metadata.full_name;
          }
        }
      }
    }

    // Si toujours pas d'email, utiliser celui du payload
    if (!customer_email && payload.customerEmail) {
      customer_email = payload.customerEmail;
    }

    if (!customer_email || typeof customer_email !== 'string' || !customer_email.includes('@')) {
      return NextResponse.json(
        { error: 'customer_email requis et valide. Veuillez vous connecter ou fournir votre email.' },
        { status: 400 }
      );
    }

    // V1.5 - Générer un token public pour le suivi sans compte
    const { token: publicToken, hash: publicTokenHash, expiresAt: publicTokenExpiresAt } = generateTokenWithHash(7);

    // Créer la demande de réservation
    const { data, error } = await supabaseAdmin
      .from('reservation_requests')
      .insert({
        pack_key,
        status: 'NEW',
        customer_email: customer_email.toLowerCase().trim(),
        customer_phone: customer_phone || null,
        customer_name: customer_name || null,
        payload,
        public_token_hash: publicTokenHash, // V1.5 - Stocker le hash du token
        public_token_expires_at: publicTokenExpiresAt.toISOString(), // V1.5 - Expiration dans 7 jours
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création demande réservation:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la demande', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Demande de réservation créée:', data.id);

    // V1.5 - Construire l'URL de suivi public
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const publicTrackingUrl = `${baseUrl}/suivi?rid=${data.id}&token=${publicToken}`;

    return NextResponse.json({
      success: true,
      request_id: data.id,
      message: 'Demande de réservation créée avec succès',
      publicTrackingUrl, // V1.5 - URL de suivi public
    });
  } catch (error: any) {
    console.error('Erreur API reservation-requests:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}

