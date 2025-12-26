import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/payments/verify-session
 * Vérifie manuellement le statut d'une session Stripe et met à jour la réservation
 * Utile en développement quand les webhooks ne fonctionnent pas
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const { session_id, reservation_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
    }

    if (!reservation_id) {
      return NextResponse.json({ error: 'reservation_id requis' }, { status: 400 });
    }

    console.log('[VERIFY-SESSION] Vérification session Stripe:', session_id);
    console.log('[VERIFY-SESSION] Réservation ID:', reservation_id);

    // Récupérer la session depuis Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent'],
    });

    console.log('[VERIFY-SESSION] Statut session:', session.payment_status);
    console.log('[VERIFY-SESSION] Statut checkout:', session.status);

    // Si le paiement est réussi, mettre à jour la réservation
    if (session.payment_status === 'paid' && session.status === 'complete') {
      console.log('[VERIFY-SESSION] ✅ Paiement confirmé, mise à jour de la réservation');

      // Récupérer la réservation
      const { data: reservation, error: fetchError } = await supabaseAdmin
        .from('client_reservations')
        .select('*')
        .eq('id', reservation_id)
        .single();

      if (fetchError || !reservation) {
        console.error('[VERIFY-SESSION] ❌ Réservation non trouvée:', fetchError);
        return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
      }

      // Si déjà payée, ne rien faire
      if (reservation.status === 'PAID' || reservation.status === 'CONFIRMED') {
        console.log('[VERIFY-SESSION] ℹ️ Réservation déjà payée, pas de mise à jour nécessaire');
        return NextResponse.json({ 
          success: true, 
          status: reservation.status,
          message: 'Réservation déjà payée' 
        });
      }

      // Mettre à jour le statut de la réservation
      const { data: updatedReservation, error: updateError } = await supabaseAdmin
        .from('client_reservations')
        .update({
          status: 'PAID',
          stripe_session_id: session.id,
          customer_email: session.customer_email || reservation.customer_email,
        })
        .eq('id', reservation_id)
        .select()
        .single();

      if (updateError) {
        console.error('[VERIFY-SESSION] ❌ Erreur mise à jour réservation:', updateError);
        return NextResponse.json({ error: 'Erreur mise à jour réservation' }, { status: 500 });
      }

      console.log('[VERIFY-SESSION] ✅ Réservation mise à jour avec succès');

      // Créer un order pour l'acompte
      try {
        const depositAmount = parseFloat(updatedReservation.price_total.toString()) * 0.3;
        const orderData = {
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id) : null,
          customer_email: updatedReservation.customer_email || session.customer_email || '',
          customer_name: updatedReservation.customer_name || '',
          customer_phone: null,
          delivery_address: updatedReservation.address || '',
          delivery_option: null,
          delivery_fee: 0,
          subtotal: depositAmount,
          total: depositAmount,
          deposit_total: 0,
          status: 'PAID',
          client_reservation_id: reservation_id,
          metadata: {
            type: 'client_reservation_deposit',
            reservation_id: reservation_id,
            pack_key: updatedReservation.pack_key,
            paymentType: 'deposit',
          },
        };
        
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .insert(orderData);
        
        if (orderError) {
          console.warn('[VERIFY-SESSION] ⚠️ Erreur création order (non bloquant):', orderError);
        } else {
          console.log('[VERIFY-SESSION] ✅ Order créé pour acompte');
        }
      } catch (orderErr) {
        console.warn('[VERIFY-SESSION] ⚠️ Erreur création order (non bloquant):', orderErr);
      }

      // Envoyer l'email de confirmation (même logique que le webhook)
      try {
        const customerEmail = updatedReservation.customer_email || session.customer_email || '';
        
        if (customerEmail && customerEmail !== 'pending@stripe.com' && customerEmail.trim() !== '' && process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
          // Récupérer le token depuis la réservation
          const { data: reservationWithToken } = await supabaseAdmin
            .from('client_reservations')
            .select('public_token_hash')
            .eq('id', reservation_id)
            .single();

          // Pour l'instant, on va utiliser le token depuis les métadonnées de la session
          const metadata = session.metadata || {};
          let checkoutToken = metadata.checkout_token || '';

          // Si pas de token, essayer de le récupérer depuis la DB
          if (!checkoutToken && reservationWithToken?.public_token_hash) {
            // On ne peut pas récupérer le token plaintext depuis le hash
            // On va générer un nouveau token
            const { ensureValidCheckoutToken } = await import('@/lib/token');
            try {
              checkoutToken = await ensureValidCheckoutToken(reservation_id, supabaseAdmin);
            } catch (tokenError) {
              console.warn('[VERIFY-SESSION] ⚠️ Erreur génération token:', tokenError);
            }
          }

          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sndrush.com';
          const magicLinkUrl = checkoutToken 
            ? `${baseUrl}/auth/magic-link/${checkoutToken}`
            : `${baseUrl}/checkout/${reservation_id}`;

          const packNames: Record<string, string> = {
            'conference': 'Pack Conférence',
            'soiree': 'Pack Soirée',
            'mariage': 'Pack Mariage'
          };
          const packName = packNames[updatedReservation.pack_key] || updatedReservation.pack_key || 'Pack';
          const depositAmount = parseFloat(updatedReservation.price_total.toString()) * 0.3;
          const balanceAmount = parseFloat(updatedReservation.price_total.toString()) - depositAmount;

          const { resend } = await import('@/lib/resend');
          
          const emailHtml = `
            <!DOCTYPE html>
            <html style="background-color: #ffffff;">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff !important; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff !important; padding: 40px 20px;">
                  <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #F2431E;">
                    <div style="background-color: #F2431E; color: #ffffff; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 15px;">
                      <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">SoundRush Paris</h1>
                    </div>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">La location sono express à Paris en 2min</p>
                  </div>
                  
                  <div style="background-color: #ffffff !important;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                      <h2 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 28px; font-weight: bold;">Acompte payé avec succès !</h2>
                      <p style="color: #000000; font-size: 18px; margin-bottom: 30px;">
                        Votre date est maintenant bloquée. Votre réservation pour <strong>${packName}</strong> est confirmée.
                      </p>
                    </div>
                    
                    <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 25px; margin-bottom: 30px;">
                      <h3 style="color: #111827; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">Récapitulatif de votre réservation</h3>
                      <div style="color: #000000; font-size: 16px; line-height: 2;">
                        <div style="margin-bottom: 10px;"><strong>Pack :</strong> ${packName}</div>
                        <div style="margin-bottom: 10px;"><strong>Acompte payé (30%) :</strong> ${depositAmount.toFixed(2)}€</div>
                        <div style="margin-bottom: 10px;"><strong>Solde restant (70%) :</strong> ${balanceAmount.toFixed(2)}€</div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;"><strong>Total :</strong> ${parseFloat(updatedReservation.price_total.toString()).toFixed(2)}€</div>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${magicLinkUrl}" 
                         style="display: inline-block; background-color: #F2431E; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px rgba(242, 67, 30, 0.4);">
                        📋 Accéder à mon dashboard
                      </a>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `;

          await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: customerEmail,
            subject: `✅ Acompte payé - Votre réservation ${packName} est confirmée`,
            html: emailHtml,
          });

          console.log('[VERIFY-SESSION] ✅ Email de confirmation envoyé à:', customerEmail);
        }
      } catch (emailError: any) {
        console.error('[VERIFY-SESSION] ❌ Erreur envoi email:', emailError);
        // Ne pas faire échouer la vérification si l'email échoue
      }

      return NextResponse.json({ 
        success: true, 
        status: 'PAID',
        reservation: updatedReservation 
      });
    } else {
      console.log('[VERIFY-SESSION] ⚠️ Paiement non confirmé:', {
        payment_status: session.payment_status,
        status: session.status,
      });
      return NextResponse.json({ 
        success: false, 
        payment_status: session.payment_status,
        status: session.status,
        message: 'Paiement non confirmé' 
      });
    }
  } catch (error: any) {
    console.error('[VERIFY-SESSION] ❌ Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
