// Phase C2 - Edge Function pour envoyer les rappels événement (J-1 et H-3)
// Planifiée toutes les 15 minutes via cron Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
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

    // Fenêtre J-1 : entre 23h et 25h avant start_at
    const j1WindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const j1WindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Fenêtre H-3 : entre 2h45 et 3h15 avant start_at
    const h3WindowStart = new Date(now.getTime() + 2.75 * 60 * 60 * 1000); // 2h45
    const h3WindowEnd = new Date(now.getTime() + 3.25 * 60 * 60 * 1000); // 3h15

    // Sélectionner les réservations éligibles pour rappel J-1
    const { data: j1Reservations, error: j1Error } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .in('status', ['PAID', 'CONFIRMED'])
      .not('start_at', 'is', null)
      .not('customer_email', 'is', null)
      .is('event_reminder_j1_sent', false)
      .gte('start_at', j1WindowStart.toISOString())
      .lte('start_at', j1WindowEnd.toISOString());

    if (j1Error) {
      console.error('[EVENT_REMINDERS] Erreur récupération J-1:', j1Error);
    }

    // Sélectionner les réservations éligibles pour rappel H-3
    const { data: h3Reservations, error: h3Error } = await supabaseAdmin
      .from('client_reservations')
      .select('*')
      .in('status', ['PAID', 'CONFIRMED'])
      .not('start_at', 'is', null)
      .not('customer_email', 'is', null)
      .is('event_reminder_h3_sent', false)
      .gte('start_at', h3WindowStart.toISOString())
      .lte('start_at', h3WindowEnd.toISOString());

    if (h3Error) {
      console.error('[EVENT_REMINDERS] Erreur récupération H-3:', h3Error);
    }

    let j1Sent = 0;
    let h3Sent = 0;
    let errorCount = 0;

    // Traiter les rappels J-1
    if (j1Reservations && j1Reservations.length > 0) {
      console.log(`[EVENT_REMINDERS] ${j1Reservations.length} réservation(s) éligible(s) pour rappel J-1`);

      for (const reservation of j1Reservations) {
        try {
          const startAt = new Date(reservation.start_at);
          const eventDate = startAt.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const eventTime = startAt.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const firstName = reservation.customer_name?.split(' ')[0] || 
                           reservation.customer_email?.split('@')[0] || 
                           'Client';

          const finalItems = reservation.final_items || [];
          const customerSummary = reservation.customer_summary || '';

          // Template email J-1 (simplifié)
          const emailHtml = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Sound Rush Paris — Rappel événement demain</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:22px 18px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Votre événement avec <strong>${packNames[reservation.pack_key] || reservation.pack_key}</strong> a lieu <strong>demain</strong> !</p>
              <div style="margin:0 0 16px;padding:14px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                <div style="font-weight:700;color:#1e40af;margin-bottom:6px;">📅 Détails de l'événement</div>
                <div style="font-size:14px;line-height:1.6;color:#1e3a8a;">
                  <div><strong>Date :</strong> ${eventDate}</div>
                  <div><strong>Heure :</strong> ${eventTime}</div>
                  <div><strong>Lieu :</strong> ${reservation.address || 'À confirmer'}</div>
                </div>
              </div>
              ${customerSummary ? `
              <div style="margin:0 0 16px;padding:14px 14px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;">
                <div style="font-weight:700;color:#166534;margin-bottom:6px;">📦 Matériel prévu</div>
                <div style="font-size:14px;line-height:1.6;color:#15803d;font-style:italic;">${customerSummary}</div>
              </div>
              ` : ''}
              ${finalItems.length > 0 ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:14px 14px;">
                    <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Matériel inclus</div>
                    <ul style="margin:0;padding-left:20px;list-style-type:disc;font-size:14px;line-height:1.6;color:#111827;">
                      ${finalItems.map((item: any) => `<li>${item.qty} ${item.label.toLowerCase()}${item.qty > 1 ? 's' : ''}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              </table>
              ` : ''}
              <div style="margin:16px 0;padding:14px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                <div style="font-weight:700;color:#9a3412;margin-bottom:6px;">📞 Contact & Consignes</div>
                <div style="font-size:14px;line-height:1.6;color:#7c2d12;">
                  <div>• <strong>Téléphone :</strong> 06 51 08 49 94</div>
                  <div>• <strong>Email :</strong> contact@guylocationevents.com</div>
                  <div style="margin-top:8px;">• Assurez-vous que l'accès au lieu est possible à l'heure prévue</div>
                  <div>• Parking ou zone de déchargement disponible si nécessaire</div>
                </div>
              </div>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#374151;">Une question ou un changement de dernière minute ? Répondez directement à cet email ou appelez-nous.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: RESEND_FROM_EMAIL,
              to: reservation.customer_email,
              subject: `Rappel événement demain — ${packNames[reservation.pack_key] || reservation.pack_key}`,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error(`[EVENT_REMINDERS] Erreur envoi email J-1 pour ${reservation.id}:`, errorData);
            errorCount++;
            continue;
          }

          // Mettre à jour event_reminder_j1_sent
          const { error: updateError } = await supabaseAdmin
            .from('client_reservations')
            .update({ event_reminder_j1_sent: true })
            .eq('id', reservation.id);

          if (updateError) {
            console.error(`[EVENT_REMINDERS] Erreur mise à jour J-1 pour ${reservation.id}:`, updateError);
            errorCount++;
            continue;
          }

          j1Sent++;
          console.log(`[EVENT_REMINDERS] Rappel J-1 envoyé pour réservation ${reservation.id}`);

        } catch (error) {
          console.error(`[EVENT_REMINDERS] Erreur traitement J-1 réservation ${reservation.id}:`, error);
          errorCount++;
        }
      }
    }

    // Traiter les rappels H-3
    if (h3Reservations && h3Reservations.length > 0) {
      console.log(`[EVENT_REMINDERS] ${h3Reservations.length} réservation(s) éligible(s) pour rappel H-3`);

      for (const reservation of h3Reservations) {
        try {
          const startAt = new Date(reservation.start_at);
          const eventDate = startAt.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const eventTime = startAt.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const firstName = reservation.customer_name?.split(' ')[0] || 
                           reservation.customer_email?.split('@')[0] || 
                           'Client';

          const finalItems = reservation.final_items || [];

          // Template email H-3 (simplifié)
          const emailHtml = `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Sound Rush Paris — Rappel événement dans 3h</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:22px 18px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Bonjour <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Votre événement avec <strong>${packNames[reservation.pack_key] || reservation.pack_key}</strong> a lieu dans <strong>3 heures</strong> !</p>
              <div style="margin:0 0 16px;padding:14px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;">
                <div style="font-weight:700;color:#92400e;margin-bottom:6px;">⏰ Dernières vérifications</div>
                <div style="font-size:14px;line-height:1.6;color:#78350f;">
                  <div><strong>Date :</strong> ${eventDate}</div>
                  <div><strong>Heure :</strong> ${eventTime}</div>
                  <div><strong>Lieu :</strong> ${reservation.address || 'À confirmer'}</div>
                </div>
              </div>
              ${finalItems.length > 0 ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                <tr>
                  <td style="padding:14px 14px;">
                    <div style="font-size:14px;color:#6b7280;margin-bottom:10px;">Matériel prévu</div>
                    <ul style="margin:0;padding-left:20px;list-style-type:disc;font-size:14px;line-height:1.6;color:#111827;">
                      ${finalItems.map((item: any) => `<li>${item.qty} ${item.label.toLowerCase()}${item.qty > 1 ? 's' : ''}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              </table>
              ` : ''}
              <div style="margin:16px 0;padding:14px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;">
                <div style="font-weight:700;color:#9a3412;margin-bottom:6px;">📞 Contact urgent</div>
                <div style="font-size:14px;line-height:1.6;color:#7c2d12;">
                  <div>• <strong>Téléphone :</strong> 06 51 08 49 94</div>
                  <div>• <strong>Email :</strong> contact@guylocationevents.com</div>
                  <div style="margin-top:8px;">• Vérifiez que l'accès au lieu est possible</div>
                  <div>• Parking ou zone de déchargement disponible</div>
                  <div>• Contactez-nous immédiatement en cas de problème</div>
                </div>
              </div>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#374151;">Tout est prêt de notre côté. À très bientôt !</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: RESEND_FROM_EMAIL,
              to: reservation.customer_email,
              subject: `Rappel événement dans 3h — ${packNames[reservation.pack_key] || reservation.pack_key}`,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error(`[EVENT_REMINDERS] Erreur envoi email H-3 pour ${reservation.id}:`, errorData);
            errorCount++;
            continue;
          }

          // Mettre à jour event_reminder_h3_sent
          const { error: updateError } = await supabaseAdmin
            .from('client_reservations')
            .update({ event_reminder_h3_sent: true })
            .eq('id', reservation.id);

          if (updateError) {
            console.error(`[EVENT_REMINDERS] Erreur mise à jour H-3 pour ${reservation.id}:`, updateError);
            errorCount++;
            continue;
          }

          h3Sent++;
          console.log(`[EVENT_REMINDERS] Rappel H-3 envoyé pour réservation ${reservation.id}`);

        } catch (error) {
          console.error(`[EVENT_REMINDERS] Erreur traitement H-3 réservation ${reservation.id}:`, error);
          errorCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Rappels événement traités',
        j1_sent: j1Sent,
        h3_sent: h3Sent,
        errors: errorCount
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EVENT_REMINDERS] Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
