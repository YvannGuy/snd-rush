import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getAcceptedEmailTemplate } from '@/lib/reservation-email-templates';
import { generateTokenWithHash } from '@/lib/token';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    // Vérifier l'authentification admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'yvann.guyonnet@gmail.com' ||
                    user.email === 'sndrush12@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { request_id, price_total, deposit_amount, notes, client_message, final_items, customer_summary, base_pack_price, extras_total } = body;

    if (!request_id || !price_total || deposit_amount === undefined) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Récupérer la demande
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('reservation_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Créer ou mettre à jour la réservation client
    const { data: existingReservation } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('request_id', request_id)
      .maybeSingle();

    // V1.4 - Générer un token public pour le checkout sans compte
    // Si réservation existe déjà, régénérer le token (nouveau lien)
    const { token: publicToken, hash: publicTokenHash, expiresAt: publicTokenExpiresAt } = generateTokenWithHash(7);

    let reservation;
    if (existingReservation) {
      // Mettre à jour (inclure le nouveau token)
      const { data, error } = await supabaseAdmin
        .from('client_reservations')
        .update({
          price_total,
          deposit_amount,
          notes: notes || null,
          status: 'AWAITING_PAYMENT',
          final_items: final_items || null,
          customer_summary: customer_summary || null,
          base_pack_price: base_pack_price || null,
          extras_total: extras_total || 0,
          public_token_hash: publicTokenHash, // V1.4 - Nouveau token
          public_token_expires_at: publicTokenExpiresAt.toISOString(), // V1.4 - Nouvelle expiration
        })
        .eq('id', existingReservation.id)
        .select()
        .single();
      
      if (error) throw error;
      reservation = data;
    } else {
      // Créer
      const { data, error } = await supabaseAdmin
        .from('client_reservations')
        .insert({
          request_id: request.id,
          customer_email: request.customer_email,
          pack_key: request.pack_key,
          status: 'AWAITING_PAYMENT',
          price_total,
          deposit_amount,
          start_at: request.payload.startDate ? new Date(request.payload.startDate).toISOString() : null,
          end_at: request.payload.endDate ? new Date(request.payload.endDate).toISOString() : null,
          address: request.payload.address || null,
          notes: notes || null,
          final_items: final_items || null,
          customer_summary: customer_summary || null,
          base_pack_price: base_pack_price || null,
          extras_total: extras_total || 0,
          public_token_hash: publicTokenHash, // V1.4 - Stocker le hash du token
          public_token_expires_at: publicTokenExpiresAt.toISOString(), // V1.4 - Expiration dans 7 jours
        })
        .select()
        .single();
      
      if (error) throw error;
      reservation = data;
    }

    // Mettre à jour le statut de la demande
    await supabaseAdmin
      .from('reservation_requests')
      .update({ status: 'ADJUSTED' })
      .eq('id', request_id);

    // Vérifier si l'utilisateur existe déjà
    let userExists = false;
    try {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find(u => u.email?.toLowerCase() === request.customer_email.toLowerCase());
      userExists = !!existingUser;
    } catch (e) {
      // Si erreur, considérer que l'utilisateur n'existe pas
      userExists = false;
    }
    
    // V1.4 - Envoyer l'email avec lien checkout public
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // Lien checkout public (sans compte requis)
    const checkoutLink = `${baseUrl}/checkout/${reservation.id}?token=${publicToken}`;
    // Lien dashboard (fallback pour utilisateurs connectés)
    const dashboardLink = `${baseUrl}/dashboard?reservation=${reservation.id}`;
    
    const firstName = request.customer_name?.split(' ')[0] || request.customer_email.split('@')[0];
    const packNames: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };

    // Parser final_items si disponible
    let finalItems: Array<{ label: string; qty: number }> | undefined = undefined;
    try {
      if (body.final_items) {
        finalItems = typeof body.final_items === 'string' 
          ? JSON.parse(body.final_items)
          : body.final_items;
      }
    } catch (e) {
      console.error('Erreur parsing final_items:', e);
    }

    const emailHtml = getAcceptedEmailTemplate({
      firstName,
      packName: packNames[request.pack_key] || request.pack_key,
      eventType: request.payload.eventType || 'Événement',
      eventDate: request.payload.startDate || 'Date à confirmer',
      eventLocation: request.payload.address || request.payload.location || 'Lieu à confirmer',
      peopleCount: request.payload.peopleCount || 0,
      priceTotal: price_total,
      depositAmount: deposit_amount,
      finalizeLink: checkoutLink, // V1.4 - Lien checkout public
      dashboardLink, // V1.4 - Lien dashboard (fallback)
      clientMessage: client_message || undefined,
      finalItems,
      customerSummary: body.customer_summary || undefined,
      userExists,
    });

    await resend.emails.send({
      from: 'Sound Rush Paris <noreply@guylocationevents.com>',
      to: request.customer_email,
      subject: `Votre demande Sound Rush Paris est acceptée — finalisez votre réservation`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, reservation_id: reservation.id });
  } catch (error: any) {
    console.error('Erreur API adjust:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
