// Phase suivante - Edge Function pour envoyer les relances de solde (J-5)
// Planifiée toutes les heures via cron Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'contact@guylocationevents.com';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://sndrush.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const packNames: Record<string, string> = {
  'conference': 'Pack Conférence',
  'soiree': 'Pack Soirée',
  'mariage': 'Pack Mariage'
};

serve(async (req) => {
  try {
    // Vérifier que c'est un appel cron (optionnel, pour sécurité)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();

    // Sélectionner les réservations éligibles pour relance solde :
    // - Acompte payé (deposit_paid_at IS NOT NULL)
    // - Solde non payé (balance_paid_at IS NULL)
    // - balance_due_at atteint ou dépassé (J-1)
    // - balance_reminder_count < 2 (max 2 relances)
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .not('deposit_paid_at', 'is', null) // Acompte payé
      .is('balance_paid_at', null) // Solde non payé
      .not('balance_due_at', 'is', null) // Date de solde définie
      .lte('balance_due_at', now.toISOString()) // Date de solde atteinte
      .lt('balance_reminder_count', 2) // Moins de 2 relances
      .not('customer_email', 'is', null); // Email requis

    if (fetchError) {
      console.error('[BALANCE_REMINDERS] Erreur récupération réservations:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erreur récupération réservations', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!reservations || reservations.length === 0) {
      console.log('[BALANCE_REMINDERS] Aucune réservation éligible pour relance solde');
      return new Response(
        JSON.stringify({ success: true, count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BALANCE_REMINDERS] ${reservations.length} réservation(s) éligible(s) pour relance solde`);

    let successCount = 0;
    let errorCount = 0;

    for (const reservation of reservations) {
      try {
        // Générer un nouveau token pour le paiement du solde (même logique que send-payment-reminders)
        function generatePublicToken(): string {
          const randomBytes = crypto.getRandomValues(new Uint8Array(32));
          return btoa(String.fromCharCode(...randomBytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        }

        async function hashToken(token: string): Promise<string> {
          const encoder = new TextEncoder();
          const data = encoder.encode(token);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        const token = generatePublicToken();
        const publicTokenHash = await hashToken(token);
        const publicTokenExpiresAt = new Date();
        publicTokenExpiresAt.setDate(publicTokenExpiresAt.getDate() + 7);

        // Mettre à jour le token dans la réservation
        await supabaseAdmin
          .from('client_reservations')
          .update({
            public_token_hash: publicTokenHash,
            public_token_expires_at: publicTokenExpiresAt.toISOString(),
          })
          .eq('id', reservation.id);

        // Calculer le montant du solde
        const balanceAmount = reservation.balance_amount 
          ? parseFloat(reservation.balance_amount.toString())
          : Math.round(parseFloat(reservation.price_total.toString()) * 0.7 * 100) / 100;

        // Construire le lien de paiement (l'API sera appelée côté client)
        const paymentLink = `${SITE_URL}/checkout/${reservation.id}?token=${publicToken}&type=balance`;

        // Préparer l'email de relance
        const firstName = reservation.customer_name?.split(' ')[0] || reservation.customer_email.split('@')[0];
        const packName = packNames[reservation.pack_key] || reservation.pack_key;
        const eventDate = reservation.start_at 
          ? new Date(reservation.start_at).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })
          : 'Date à confirmer';

        const reminderNumber = (reservation.balance_reminder_count || 0) + 1;
        const isLastReminder = reminderNumber === 2;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F2431E; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .button { display: inline-block; padding: 12px 24px; background: #F2431E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .info-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
              .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SoundRush Paris</h1>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                
                ${isLastReminder ? `
                  <div class="warning-box">
                    <strong>⚠️ Dernier rappel</strong><br>
                    Votre événement approche ! Pour confirmer votre réservation, veuillez régler le solde restant.
                  </div>
                ` : ''}
                
                <p>Votre événement <strong>${packName}</strong> approche (${eventDate}).</p>
                
                <div class="info-box">
                  <p><strong>Solde restant à régler :</strong> ${balanceAmount.toFixed(2)}€</p>
                  <p>Ce montant correspond à 70% du total de votre prestation. Il est demandé 1 jour avant votre événement pour confirmer votre réservation.</p>
                </div>
                
                <p>Pour régler le solde, cliquez sur le bouton ci-dessous :</p>
                
                <a href="${paymentLink}" class="button">Payer le solde maintenant</a>
                
                <p>Ou copiez ce lien dans votre navigateur :<br>
                <a href="${paymentLink}">${paymentLink}</a></p>
                
                <p><strong>Rappel :</strong> Vous avez déjà payé l'acompte de 30% qui a bloqué votre date. Le solde restant est demandé pour finaliser votre réservation.</p>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter :<br>
                📞 07 44 78 27 54<br>
                📧 contact@guylocationevents.com</p>
                
                <p>Cordialement,<br>L'équipe SoundRush Paris</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Envoyer l'email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: reservation.customer_email,
            subject: isLastReminder 
              ? `⚠️ Dernier rappel — Solde à régler pour votre événement SoundRush`
              : `Solde à régler pour votre événement SoundRush (${packName})`,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          throw new Error(`Erreur envoi email: ${errorData.message || resendResponse.statusText}`);
        }

        // Mettre à jour le compteur de relances
        await supabaseAdmin
          .from('client_reservations')
          .update({
            balance_reminder_count: reminderNumber,
            // Note: last_reminder_at pourrait être ajouté si nécessaire
          })
          .eq('id', reservation.id);

        console.log(`[BALANCE_REMINDERS] Relance solde envoyée pour réservation ${reservation.id} (relance #${reminderNumber})`);
        successCount++;

      } catch (error) {
        console.error(`[BALANCE_REMINDERS] Erreur envoi relance solde pour réservation ${reservation.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: reservations.length,
        successCount,
        errorCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BALANCE_REMINDERS] Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
