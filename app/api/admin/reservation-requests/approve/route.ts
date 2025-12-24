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

    // Vérifier que l'utilisateur est admin (simplifié, à améliorer avec useAdmin pattern)
    const isAdmin = user.user_metadata?.role === 'admin' || 
                    user.email === 'yvann.guyonnet@gmail.com' ||
                    user.email === 'sndrush12@gmail.com';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { request_id, price_total, deposit_amount, notes, final_items, customer_summary, base_pack_price, extras_total } = body;

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

    // V1.4 - Générer un token public pour le checkout sans compte
    const { token: publicToken, hash: publicTokenHash, expiresAt: publicTokenExpiresAt } = generateTokenWithHash(7);

    // Calculer les dates de paiement en 3 temps
    const startDate = request.payload.startDate ? new Date(request.payload.startDate) : null;
    let balanceDueAt: string | null = null;
    let depositRequestedAt: string | null = null;
    
    if (startDate) {
      // Solde à payer J-5 avant l'événement
      const balanceDueDate = new Date(startDate);
      balanceDueDate.setDate(balanceDueDate.getDate() - 5);
      balanceDueDate.setHours(9, 0, 0, 0); // 9h du matin
      balanceDueAt = balanceDueDate.toISOString();
      
      // Caution à demander J-2 avant l'événement
      const depositRequestDate = new Date(startDate);
      depositRequestDate.setDate(depositRequestDate.getDate() - 2);
      depositRequestDate.setHours(9, 0, 0, 0); // 9h du matin
      depositRequestedAt = depositRequestDate.toISOString();
    }
    
    // Calculer le montant du solde (70% du total)
    const balanceAmount = Math.round((parseFloat(price_total.toString()) * 0.7) * 100) / 100;

    // Créer la réservation client
    const { data: reservation, error: createError } = await supabaseAdmin
      .from('client_reservations')
      .insert({
        request_id: request.id,
        customer_email: request.customer_email,
        pack_key: request.pack_key,
        status: 'AWAITING_PAYMENT',
        price_total: price_total,
        deposit_amount: deposit_amount,
        balance_amount: balanceAmount, // Montant du solde (70%)
        start_at: startDate ? startDate.toISOString() : null,
        end_at: request.payload.endDate ? new Date(request.payload.endDate).toISOString() : null,
        address: request.payload.address || null,
        notes: notes || null,
        final_items: final_items || null,
        customer_summary: customer_summary || null,
        base_pack_price: base_pack_price || null,
        extras_total: extras_total || 0,
        balance_due_at: balanceDueAt, // J-5 avant l'événement
        deposit_requested_at: depositRequestedAt, // J-2 avant l'événement
        public_token_hash: publicTokenHash, // V1.4 - Stocker le hash du token
        public_token_expires_at: publicTokenExpiresAt.toISOString(), // V1.4 - Expiration dans 7 jours
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur création réservation:', createError);
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 });
    }

    // Mettre à jour le statut de la demande
    await supabaseAdmin
      .from('reservation_requests')
      .update({ status: 'APPROVED' })
      .eq('id', request_id);

    // Vérifier si l'utilisateur existe déjà
    let userExists = false;
    try {
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(request.customer_email);
      userExists = !!existingUser?.user;
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
    console.error('Erreur API approve:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}
