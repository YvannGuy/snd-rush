import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getRejectedEmailTemplate } from '@/lib/reservation-email-templates';

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
    const { request_id, reason } = body;

    if (!request_id || !reason) {
      return NextResponse.json({ error: 'request_id et reason requis' }, { status: 400 });
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

    // Mettre à jour le statut
    await supabaseAdmin
      .from('reservation_requests')
      .update({ 
        status: 'REJECTED',
        rejection_reason: reason
      })
      .eq('id', request_id);

    // Envoyer l'email
    const firstName = request.customer_name?.split(' ')[0] || request.customer_email.split('@')[0];
    const packNames: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };

    const emailHtml = getRejectedEmailTemplate({
      firstName,
      packName: packNames[request.pack_key] || request.pack_key,
      eventType: request.payload.eventType || 'Événement',
      eventDate: request.payload.startDate || 'Date à confirmer',
      eventLocation: request.payload.address || request.payload.location || 'Lieu à confirmer',
      peopleCount: request.payload.peopleCount || 0,
      reasonShort: reason,
    });

    await resend.emails.send({
      from: 'Sound Rush Paris <noreply@guylocationevents.com>',
      to: request.customer_email,
      subject: `Votre demande Sound Rush Paris — indisponibilité sur ce créneau`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur API reject:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}








