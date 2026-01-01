// Phase C1 - Edge Function pour envoyer les relances paiement
// Planifiée toutes les heures via cron Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') || 'http://localhost:3000';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Fonction pour générer un token et son hash (identique à lib/token.ts)
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

async function ensureValidCheckoutToken(
  reservationId: string,
  supabaseAdmin: any
): Promise<string> {
  // Récupérer la réservation
  const { data: reservation, error } = await supabaseAdmin
    .from('client_reservations')
    .select('public_token_hash, public_token_expires_at')
    .eq('id', reservationId)
    .single();

  if (error || !reservation) {
    throw new Error(`Réservation ${reservationId} introuvable`);
  }

  const now = new Date();
  const expiresAt = reservation.public_token_expires_at 
    ? new Date(reservation.public_token_expires_at) 
    : null;

  // Vérifier si le token existe et est valide (expire dans plus de 1 jour)
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  if (reservation.public_token_hash && expiresAt && expiresAt > oneDayFromNow) {
    // Token valide existe, mais on régénère pour les relances (plus simple MVP)
  }

  // Générer un nouveau token (7 jours d'expiration)
  const token = generatePublicToken();
  const hash = await hashToken(token);
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  // Mettre à jour la réservation avec le nouveau token
  const { error: updateError } = await supabaseAdmin
    .from('client_reservations')
    .update({
      public_token_hash: hash,
      public_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', reservationId);

  if (updateError) {
    throw new Error(`Erreur mise à jour token: ${updateError.message}`);
  }

  return token;
}

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
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Sélectionner les réservations éligibles pour relance
    const { data: eligibleReservations, error: fetchError } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .eq('status', 'AWAITING_PAYMENT')
      .lt('reminder_count', 2)
      .not('customer_email', 'is', null)
      .or(`and(reminder_count.eq.0,created_at.lt.${twoHoursAgo.toISOString()}),and(reminder_count.eq.1,last_reminder_at.lt.${oneDayAgo.toISOString()})`);

    if (fetchError) {
      console.error('[PAYMENT_REMINDERS] Erreur récupération réservations:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erreur récupération réservations', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!eligibleReservations || eligibleReservations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucune réservation éligible', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PAYMENT_REMINDERS] ${eligibleReservations.length} réservation(s) éligible(s)`);

    const packNames: Record<string, string> = {
      'conference': 'Pack Conférence',
      'soiree': 'Pack Soirée',
      'mariage': 'Pack Mariage'
    };

    let sentCount = 0;
    let errorCount = 0;

    for (const reservation of eligibleReservations) {
      try {
        // Assurer un token valide
        const token = await ensureValidCheckoutToken(reservation.id, supabaseAdmin);
        const checkoutUrl = `${SITE_URL}/checkout/${reservation.id}?token=${token}`;

        // Formater la date
        const eventDate = reservation.start_at 
          ? new Date(reservation.start_at).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : 'Date à confirmer';

        // Extraire le prénom depuis customer_email ou customer_name
        const firstName = reservation.customer_name?.split(' ')[0] || 
                         reservation.customer_email?.split('@')[0] || 
                         'Client';

        const reminderIndex = reservation.reminder_count + 1;

        // Template email (simplifié pour Edge Function)
        const emailHtml = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Sound Rush Paris — Rappel paiement</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:22px 18px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Ceci est un <strong>${reminderIndex === 1 ? 'premier' : 'dernier'} rappel</strong> concernant votre réservation <strong>${packNames[reservation.pack_key] || reservation.pack_key}</strong> prévue le <strong>${eventDate}</strong>.</p>
              <div style="margin:0 0 16px;padding:14px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;">
                <div style="font-weight:700;color:#92400e;margin-bottom:6px;">⏰ Action requise</div>
                <div style="font-size:14px;line-height:1.6;color:#78350f;">Pour confirmer votre créneau et garantir la disponibilité du matériel, veuillez finaliser votre paiement.</div>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:14px 14px;">
                    <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Montant à régler</div>
                    <div style="font-size:16px;line-height:1.6;color:#111827;">
                      <div><strong>Total :</strong> ${reservation.price_total}€</div>
                      ${reservation.deposit_amount > 0 ? `<div style="margin-top:6px;font-size:14px;color:#6b7280;">Caution : ${reservation.deposit_amount}€</div>` : ''}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 18px;font-size:16px;line-height:1.5;">Finalisez votre réservation en quelques clics :</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;">
                <tr>
                  <td bgcolor="#e27431" style="border-radius:12px;">
                    <a href="${checkoutUrl}" style="display:inline-block;padding:14px 18px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Payer & confirmer</a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Si le bouton ne fonctionne pas, copiez-collez ce lien :<br /><span style="word-break:break-all;color:#374151;">${checkoutUrl}</span></p>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Des questions ? Répondez directement à cet email ou appelez-nous au <strong>07 44 78 27 54</strong>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
            subject: `Rappel paiement — ${packNames[reservation.pack_key] || reservation.pack_key}`,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error(`[PAYMENT_REMINDERS] Erreur envoi email pour ${reservation.id}:`, errorData);
          errorCount++;
          continue;
        }

        // Mettre à jour reminder_count et last_reminder_at
        const { error: updateError } = await supabaseAdmin
          .from('client_reservations')
          .update({
            reminder_count: reservation.reminder_count + 1,
            last_reminder_at: now.toISOString(),
          })
          .eq('id', reservation.id);

        if (updateError) {
          console.error(`[PAYMENT_REMINDERS] Erreur mise à jour pour ${reservation.id}:`, updateError);
          errorCount++;
          continue;
        }

        sentCount++;
        console.log(`[PAYMENT_REMINDERS] Relance envoyée pour réservation ${reservation.id} (relance #${reminderIndex})`);

      } catch (error) {
        console.error(`[PAYMENT_REMINDERS] Erreur traitement réservation ${reservation.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Relances paiement traitées',
        sent: sentCount,
        errors: errorCount,
        total: eligibleReservations.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PAYMENT_REMINDERS] Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});


