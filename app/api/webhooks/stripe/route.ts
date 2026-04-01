import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend';
import { ensureValidCheckoutToken, hashToken } from '@/lib/token';
import { sendTelegramMessage } from '@/lib/telegram';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Créer le client Supabase seulement si les variables sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (supabaseUrl && supabaseServiceKey && supabaseUrl.trim() !== '' && supabaseServiceKey.trim() !== '')
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Configuration pour Stripe webhook
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Stripe signature manquante');
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: 'Signature manquante' }, { status: 200 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET manquante dans les variables d\'environnement');
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: 'Configuration webhook manquante' }, { status: 200 });
    }

    let event: Stripe.Event;

    try {
      // Vérifier la signature du webhook
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Erreur vérification signature Stripe:', err.message);
      // Retourner 200 pour éviter que Stripe réessaie
      return NextResponse.json({ received: false, error: `Webhook signature verification failed: ${err.message}` }, { status: 200 });
    }

    console.log('✅ Webhook Stripe reçu:', event.type);
    console.log('📋 Détails événement:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Paiement réussi - Session ID:', session.id);
        console.log('📋 Métadonnées de la session:', JSON.stringify(session.metadata || {}, null, 2));
        
        if (!supabaseAdmin) {
          console.error('❌ Supabase non configuré');
          return NextResponse.json({ received: true });
        }
        
        const supabaseClient = supabaseAdmin;
        
        try {
          // Récupérer les métadonnées de la session
          const metadata = session.metadata || {};
          const paymentType = metadata.type || 'cart'; // 'cart' pour paiement principal, 'deposit' pour caution, 'client_reservation_deposit' pour acompte, 'client_reservation_balance' pour solde, 'client_reservation_security_deposit' pour caution
          
          console.log('🔍 Type de paiement détecté:', paymentType);
          console.log('🔍 Métadonnées complètes:', JSON.stringify(metadata, null, 2));
          
          // Si c'est un paiement d'acompte (30%) pour client_reservation
          if (paymentType === 'client_reservation_deposit') {
            const reservationId = metadata.reservation_id;
            
            console.log('📋 Webhook client_reservation_deposit reçu:', {
              sessionId: session.id,
              reservationId,
              paymentStatus: session.payment_status,
              paymentType,
              metadata: JSON.stringify(metadata),
            });
            
            if (!reservationId) {
              console.warn('⚠️ reservation_id manquant dans les métadonnées');
              return NextResponse.json({ received: true, warning: 'reservation_id manquant' });
            }
            
            // Vérifier que le paiement est bien complété
            if (session.payment_status !== 'paid') {
              console.warn('⚠️ Paiement non complété, statut:', session.payment_status);
              return NextResponse.json({ received: true, warning: 'Paiement non complété' });
            }
            
            console.log('🔄 Mise à jour client_reservation:', reservationId);
            
            // Vérifier d'abord si la réservation existe
            const { data: existingReservation, error: fetchError } = await supabaseClient
              .from('client_reservations')
              .select('id, status, stripe_session_id, customer_email')
              .eq('id', reservationId)
              .single();
            
            if (fetchError || !existingReservation) {
              console.error('❌ Réservation non trouvée:', reservationId);
              console.error('❌ Erreur:', fetchError);
              return NextResponse.json({ received: true, error: 'Réservation non trouvée' });
            }
            
            console.log('📊 Statut actuel avant mise à jour:', existingReservation.status);
            console.log('📊 Session ID actuelle:', existingReservation.stripe_session_id);
            console.log('📧 Email dans la réservation (avant):', existingReservation.customer_email || 'VIDE/NULL');
            console.log('📧 Email dans la session Stripe:', session.customer_email || session.customer_details?.email || 'VIDE/NULL');
            console.log('📧 customer_details complet:', JSON.stringify(session.customer_details || {}, null, 2));
            
            // Si déjà payée, ne pas refaire la mise à jour
            if (existingReservation.status === 'PAID' || existingReservation.status === 'paid') {
              console.log('✅ Réservation déjà payée, pas de mise à jour nécessaire');
              return NextResponse.json({ received: true, alreadyPaid: true });
            }
            
            // Préparer les données de mise à jour pour l'ACOMPTE (30%)
            const updateData: any = {
              status: 'AWAITING_BALANCE', // Nouveau statut : attend le solde
              stripe_session_id: session.id, // Session de l'acompte
              deposit_paid_at: new Date().toISOString(), // Date de paiement de l'acompte
            };
            
            // Mettre à jour l'email depuis Stripe si disponible et valide
            // Priorité : toujours utiliser l'email de Stripe s'il est valide (même si la réservation en a déjà un)
            const customerEmailFromStripe = session.customer_email || session.customer_details?.email || null;
            const existingEmail = existingReservation.customer_email;
            const isValidEmail = (email: string | null | undefined) => {
              if (!email || email.trim() === '' || email === 'pending@stripe.com') return false;
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            };
            
            console.log('🔍 Analyse email:');
            console.log('  - Email Stripe:', customerEmailFromStripe || 'VIDE');
            console.log('  - Email réservation:', existingEmail || 'VIDE');
            console.log('  - Email Stripe valide?', isValidEmail(customerEmailFromStripe || ''));
            console.log('  - Email réservation valide?', isValidEmail(existingEmail || ''));
            
            // Utiliser l'email de Stripe s'il est valide, sinon garder celui de la réservation s'il est valide
            if (customerEmailFromStripe && isValidEmail(customerEmailFromStripe)) {
              console.log('✅ Utilisation email Stripe:', customerEmailFromStripe);
              updateData.customer_email = customerEmailFromStripe;
            } else if (existingEmail && isValidEmail(existingEmail)) {
              console.log('✅ Utilisation email réservation existant:', existingEmail);
              // Ne pas modifier, garder l'email existant
            } else {
              console.warn('⚠️ Aucun email valide trouvé !');
              console.warn('  - Email Stripe:', customerEmailFromStripe || 'VIDE');
              console.warn('  - Email réservation:', existingEmail || 'VIDE');
            }
            
            // Mettre à jour la réservation après paiement de l'acompte
            const { data: updatedReservation, error: updateError } = await supabaseClient
              .from('client_reservations')
              .update(updateData)
              .eq('id', reservationId)
              .select()
              .single();
            
            if (updateError) {
              console.error('❌ Erreur mise à jour client_reservation:', updateError);
              console.error('❌ Code erreur:', updateError.code);
              console.error('❌ Message erreur:', updateError.message);
              console.error('❌ Détails erreur:', JSON.stringify(updateError, null, 2));
              return NextResponse.json({ received: true, error: 'Erreur mise à jour' });
            }
            
            if (!updatedReservation) {
              console.error('❌ Aucune donnée retournée après mise à jour');
              return NextResponse.json({ received: true, error: 'Aucune donnée retournée' });
            }
            
            console.log('✅ client_reservation payée avec succès:', reservationId);
            console.log('✅ Nouveau statut:', updatedReservation.status);
            console.log('✅ Nouveau session_id:', updatedReservation.stripe_session_id);
            
            // HOLD v1 - Consommer le hold si présent dans les métadonnées
            const holdId = metadata.hold_id;
            if (holdId) {
              try {
                console.log('🔄 Consommation du hold:', holdId);
                const { error: consumeHoldError } = await supabaseClient
                  .from('reservation_holds')
                  .update({
                    status: 'CONSUMED',
                    reservation_id: reservationId,
                  })
                  .eq('id', holdId)
                  .eq('status', 'ACTIVE'); // Seulement si encore actif

                if (consumeHoldError) {
                  // Ne pas faire échouer le webhook si la consommation échoue
                  console.warn('⚠️ Erreur consommation hold (non bloquant):', consumeHoldError);
                } else {
                  console.log('✅ Hold consommé avec succès:', holdId);
                }
              } catch (holdError) {
                // Ne pas faire échouer le webhook si erreur
                console.warn('⚠️ Erreur consommation hold (non bloquant):', holdError);
              }
            }
            
            // Créer un order pour l'acompte payé
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
                client_reservation_id: reservationId, // Lier à client_reservations
                metadata: {
                  type: 'client_reservation_deposit',
                  reservation_id: reservationId,
                  pack_key: updatedReservation.pack_key,
                  paymentType: 'deposit',
                },
              };
              
              const { error: orderError } = await supabaseClient
                .from('orders')
                .insert(orderData);
              
              if (orderError) {
                console.warn('⚠️ Erreur création order pour acompte (non bloquant):', orderError);
              } else {
                console.log('✅ Order créé pour acompte:', reservationId);
              }
            } catch (orderErr) {
              console.warn('⚠️ Erreur création order pour acompte (non bloquant):', orderErr);
            }
            
            console.log('✅ Acompte payé avec succès:', reservationId);
            console.log('🔔 Début section notification Telegram');
            
            // Envoyer une notification Telegram après paiement de l'acompte
            try {
              console.log('📱 Tentative envoi notification Telegram pour acompte:', reservationId);
              
              // Fonction locale pour échapper les caractères HTML
              const escapeHtml = (text: string | null | undefined): string => {
                if (!text) return '—';
                return text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
              };

              const customerName = escapeHtml(
                session.customer_details?.name || updatedReservation.customer_name || null
              );
              const customerEmail = escapeHtml(
                updatedReservation.customer_email || session.customer_email || session.customer_details?.email || null
              );
              const amount = session.amount_total
                ? `${(session.amount_total / 100).toFixed(2)}€`
                : `${(parseFloat(updatedReservation.price_total.toString()) * 0.3).toFixed(2)}€`;
              const packKey = escapeHtml(updatedReservation.pack_key || metadata.pack_key || null);
              const address = escapeHtml(updatedReservation.address || metadata.address || null);

              const telegramMessage = `<b>✅ Acompte 30% reçu</b>

<b>Nom:</b> ${customerName}
<b>Email:</b> ${customerEmail}
<b>Montant:</b> ${amount}
<b>Réservation:</b> ${reservationId}
<b>Pack:</b> ${packKey}
<b>Adresse:</b> ${address}
<b>Session Stripe:</b> <code>${session.id}</code>`;

              console.log('📱 Message Telegram préparé:', telegramMessage.substring(0, 100) + '...');
              await sendTelegramMessage(telegramMessage);
              console.log('✅ Notification Telegram envoyée pour acompte:', reservationId);
            } catch (telegramError) {
              console.error('⚠️ Telegram notification failed (non bloquant):', telegramError);
              if (telegramError instanceof Error) {
                console.error('⚠️ Détails erreur Telegram:', telegramError.message);
              }
            }
            
            // Envoyer un email de confirmation après paiement de l'acompte
            console.log('📧 Début section envoi email de confirmation');
            try {
              // Priorité : email mis à jour > email Stripe > email réservation
              const customerEmail = updatedReservation.customer_email || session.customer_email || session.customer_details?.email || '';
              
              console.log('📧 Tentative envoi email de confirmation:');
              console.log('  - Email final utilisé:', customerEmail || 'VIDE');
              console.log('  - Email dans updatedReservation:', updatedReservation.customer_email || 'VIDE');
              console.log('  - Email dans session.customer_email:', session.customer_email || 'VIDE');
              console.log('  - Email dans session.customer_details:', session.customer_details?.email || 'VIDE');
              console.log('  - RESEND_API_KEY présent?', !!process.env.RESEND_API_KEY);
              console.log('  - RESEND_FROM présent?', !!process.env.RESEND_FROM);
              
              if (customerEmail && customerEmail !== 'pending@stripe.com' && customerEmail.trim() !== '' && process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
                // Récupérer le token depuis les métadonnées Stripe (généré lors de la création de la session)
                // Si pas présent, générer un nouveau token
                const metadata = session.metadata || {};
                let checkoutToken: string = metadata.checkout_token || '';
                
                if (!checkoutToken) {
                  // Si le token n'est pas dans les métadonnées, générer un nouveau token
                  console.warn('⚠️ Token non trouvé dans métadonnées Stripe, génération d\'un nouveau token');
                  try {
                    checkoutToken = await ensureValidCheckoutToken(reservationId, supabaseClient);
                    console.log('✅ Nouveau token checkout généré pour email');
                  } catch (tokenError: any) {
                    console.error('❌ Erreur génération token checkout:', tokenError);
                    checkoutToken = '';
                  }
                } else {
                  console.log('✅ Token récupéré depuis métadonnées Stripe');
                  console.log('📋 Token (premiers caractères):', checkoutToken.substring(0, 20) + '...');
                  
                  // Vérifier que le token correspond au hash en DB
                  const { data: tokenCheck } = await supabaseClient
                    .from('client_reservations')
                    .select('public_token_hash, public_token_expires_at')
                    .eq('id', reservationId)
                    .single();
                  
                  if (tokenCheck?.public_token_hash) {
                    const expectedHash = hashToken(checkoutToken);
                    if (tokenCheck.public_token_hash === expectedHash) {
                      console.log('✅ Token vérifié et correspond au hash en DB');
                    } else {
                      console.error('❌ Token ne correspond PAS au hash en DB !');
                      console.error('  - Hash attendu:', expectedHash);
                      console.error('  - Hash en DB:', tokenCheck.public_token_hash);
                      // Générer un nouveau token si le token ne correspond pas
                      try {
                        checkoutToken = await ensureValidCheckoutToken(reservationId, supabaseClient);
                        console.log('✅ Nouveau token généré car ancien token invalide');
                      } catch (tokenError: any) {
                        console.error('❌ Erreur génération nouveau token:', tokenError);
                        checkoutToken = '';
                      }
                    }
                  } else {
                    console.warn('⚠️ Hash token non trouvé en DB, utilisation du token des métadonnées');
                  }
                }
                
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sndrush.com';
                // Utiliser le magic link au lieu du checkout : crée automatiquement le compte et redirige vers le dashboard
                const signupUrl = `${baseUrl}/auth/signup?reservation_id=${reservationId}`;
                const magicLinkUrl = checkoutToken 
                  ? `${baseUrl}/auth/magic-link/${checkoutToken}` // Lien magique qui crée le compte et connecte automatiquement
                  : signupUrl; // Fallback si pas de token
                
                console.log('🔗 Lien d\'inscription généré pour email:', signupUrl.substring(0, 100) + '...');
                console.log('🔗 Token dans URL:', checkoutToken.substring(0, 20) + '...');
                const packNames: Record<string, string> = {
                  'conference': 'Pack Conférence',
                  'soiree': 'Pack Soirée',
                  'mariage': 'Pack Mariage'
                };
                const packName = packNames[updatedReservation.pack_key] || updatedReservation.pack_key || 'Pack';
                const depositAmount = parseFloat(updatedReservation.price_total.toString()) * 0.3;
                const balanceAmount = parseFloat(updatedReservation.price_total.toString()) - depositAmount;
                const totalAmount = parseFloat(updatedReservation.price_total.toString());
                
                // Formatage des dates
                const formatDate = (dateString: string | null) => {
                  if (!dateString) return '—';
                  const date = new Date(dateString);
                  return date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                };
                
                const formatDateTime = (dateString: string | null) => {
                  if (!dateString) return '—';
                  const date = new Date(dateString);
                  const dateStr = date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const timeStr = date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return `${dateStr} à ${timeStr}`;
                };
                
                const currentDate = new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                const currentYear = new Date().getFullYear();
                
                const customerName = updatedReservation.customer_name || session.customer_details?.name || '—';
                const customerPhone = updatedReservation.customer_phone || '—';
                const eventAddress = updatedReservation.address || '—';
                const startDateTime = formatDateTime(updatedReservation.start_at);
                const endDateTime = formatDateTime(updatedReservation.end_at);
                
                const emailHtml = `
                  <!DOCTYPE html>
                  <html style="background:#ffffff;">
                    <head>
                      <meta charset="utf-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Acompte payé - SoundRush Paris</title>
                      <style type="text/css">
                        /* Mobile-first base styles */
                        body {
                          margin: 0 !important;
                          padding: 0 !important;
                          -webkit-text-size-adjust: 100%;
                          -ms-text-size-adjust: 100%;
                        }
                        table {
                          border-collapse: collapse;
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                        }
                        img {
                          border: 0;
                          height: auto;
                          line-height: 100%;
                          outline: none;
                          text-decoration: none;
                          -ms-interpolation-mode: bicubic;
                        }
                        a {
                          text-decoration: none;
                        }
                        /* Media queries pour desktop */
                        @media only screen and (min-width: 600px) {
                          .email-container {
                            width: 600px !important;
                            max-width: 600px !important;
                          }
                          .header-logo {
                            font-size: 20px !important;
                            padding: 12px 14px !important;
                          }
                          .hero-title {
                            font-size: 18px !important;
                          }
                          .section-label {
                            font-size: 15px !important;
                          }
                          .table-cell {
                            font-size: 14px !important;
                          }
                          .cta-button {
                            padding: 14px 22px !important;
                            font-size: 15px !important;
                          }
                        }
                        /* Media queries pour mobile */
                        @media only screen and (max-width: 599px) {
                          .email-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            padding: 20px 12px !important;
                          }
                          .email-table {
                            padding: 20px 15px !important;
                          }
                          .header-logo {
                            font-size: 18px !important;
                            padding: 10px 12px !important;
                          }
                          .header-status {
                            display: block !important;
                            margin-top: 10px !important;
                            text-align: left !important;
                          }
                          .hero-title {
                            font-size: 16px !important;
                          }
                          .section-label {
                            font-size: 14px !important;
                          }
                          .table-cell {
                            font-size: 13px !important;
                            padding: 8px 10px !important;
                          }
                          .table-header {
                            font-size: 13px !important;
                            padding: 10px !important;
                          }
                          .cta-button {
                            padding: 12px 18px !important;
                            font-size: 14px !important;
                            width: 100% !important;
                            display: block !important;
                            box-sizing: border-box !important;
                          }
                          .footer-text {
                            font-size: 11px !important;
                          }
                        }
                      </style>
                    </head>
                    <body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;color:#000;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
                        <tr>
                          <td align="center" style="padding:28px 12px;">
                            <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #f1f1f1;border-radius:12px;overflow:hidden;">
                              <!-- Header -->
                              <tr>
                                <td class="email-table" style="padding:26px 22px 18px 22px;border-bottom:3px solid #F2431E;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td>
                                        <div style="display:inline-block;background:#F2431E;color:#fff;padding:12px 14px;border-radius:10px;font-weight:700;font-size:18px;">
                                          SoundRush Paris
                                        </div>
                                        <div style="margin-top:8px;color:#666;font-size:13px;">
                                          La location sono express à Paris en 2min
                                        </div>
                                      </td>
                                      <td align="right" class="header-status" style="color:#666;font-size:13px;">
                                        <div><strong>Statut :</strong> Acompte reçu ✅</div>
                                        <div><strong>Date :</strong> ${currentDate}</div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- Hero -->
                              <tr>
                                <td class="email-table" style="padding:26px 22px 10px 22px;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7ed;border:2px solid #F2431E;border-radius:12px;">
                                    <tr>
                                      <td style="padding:18px 18px;">
                                        <div class="hero-title" style="font-size:16px;font-weight:700;color:#F2431E;margin:0 0 8px 0;">
                                          ✅ Acompte payé avec succès
                                        </div>
                                        <div style="color:#000;font-size:14px;line-height:1.7;">
                                          Votre date est maintenant bloquée. Votre réservation pour <strong>${packName}</strong> est confirmée.
                                        </div>
                                        <div style="margin-top:10px;color:#666;font-size:13px;">
                                          Référence réservation : <strong>${reservationId}</strong>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- Infos client -->
                              <tr>
                                <td class="email-table" style="padding:0 22px 12px 22px;">
                                  <div class="section-label" style="font-weight:700;margin:14px 0 8px 0;font-size:14px;">📋 Informations client</div>
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;width:40%;font-size:13px;"><strong>Nom</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${customerName}</td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;font-size:13px;"><strong>Email</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${customerEmail}</td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;font-size:13px;"><strong>Téléphone</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${customerPhone}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- Détails événement -->
                              <tr>
                                <td class="email-table" style="padding:0 22px 12px 22px;">
                                  <div class="section-label" style="font-weight:700;margin:14px 0 8px 0;font-size:14px;">📅 Détails événement</div>
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;width:40%;font-size:13px;"><strong>Adresse</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${eventAddress}</td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;font-size:13px;"><strong>Début</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${startDateTime}</td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:10px 12px;background:#fafafa;font-size:13px;"><strong>Fin</strong></td>
                                      <td class="table-cell" style="padding:10px 12px;font-size:13px;">${endDateTime}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- Tableau paiement -->
                              <tr>
                                <td class="email-table" style="padding:0 22px 18px 22px;">
                                  <div class="section-label" style="font-weight:700;margin:14px 0 8px 0;font-size:14px;">🧾 Récapitulatif</div>
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eaeaea;border-radius:10px;overflow:hidden;">
                                    <!-- Header table -->
                                    <tr>
                                      <td class="table-header" style="padding:12px;background:#111827;color:#fff;font-weight:700;font-size:13px;">Élément</td>
                                      <td align="right" class="table-header" style="padding:12px;background:#111827;color:#fff;font-weight:700;font-size:13px;">Montant</td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:12px;background:#ffffff;font-size:13px;">
                                        Pack : <strong>${packName}</strong>
                                      </td>
                                      <td align="right" class="table-cell" style="padding:12px;background:#ffffff;font-size:13px;">
                                        <strong>${totalAmount.toFixed(2)}€</strong>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:12px;background:#fafafa;font-size:13px;">
                                        Acompte payé (30%)
                                      </td>
                                      <td align="right" class="table-cell" style="padding:12px;background:#fafafa;font-size:13px;">
                                        <strong>${depositAmount.toFixed(2)}€</strong>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:12px;background:#ffffff;font-size:13px;">
                                        Solde restant (70%)
                                      </td>
                                      <td align="right" class="table-cell" style="padding:12px;background:#ffffff;font-size:13px;">
                                        <strong>${balanceAmount.toFixed(2)}€</strong>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="table-cell" style="padding:12px;background:#fff7ed;border-top:1px solid #eaeaea;font-size:13px;">
                                        <strong>Total</strong>
                                      </td>
                                      <td align="right" class="table-cell" style="padding:12px;background:#fff7ed;border-top:1px solid #eaeaea;font-size:13px;">
                                        <strong>${totalAmount.toFixed(2)}€</strong>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- Next steps -->
                              <tr>
                                <td class="email-table" style="padding:0 22px 18px 22px;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
                                    <tr>
                                      <td style="padding:16px 16px;">
                                        <div style="font-weight:700;margin-bottom:6px;color:#111827;font-size:14px;">✅ Prochaines étapes</div>
                                        <div style="font-size:14px;line-height:1.7;color:#000;">
                                          • Le solde sera demandé automatiquement <strong>1 jour avant</strong> l'événement.<br/>
                                          • La caution sera demandée <strong>2 jours avant</strong> (non débitée sauf incident).<br/>
                                          • Vous recevrez un rappel email avant chaque échéance.
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <!-- CTA -->
                              <tr>
                                <td align="center" class="email-table" style="padding:10px 22px 26px 22px;">
                                  <a href="${signupUrl}" class="cta-button" style="display:inline-block;background:#F2431E;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;font-size:15px;">
                                    Voir ma réservation
                                  </a>
                                  <div style="margin-top:10px;color:#666;font-size:12px;">
                                    Si le bouton ne fonctionne pas, copiez ce lien : ${signupUrl}
                                  </div>
                                </td>
                              </tr>
                              <!-- Footer -->
                              <tr>
                                <td class="email-table" style="padding:18px 22px;background:#ffffff;border-top:1px solid #f1f1f1;">
                                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td class="footer-text" style="color:#666;font-size:12px;line-height:1.7;">
                                        <strong style="color:#F2431E;">SoundRush Paris</strong><br/>
                                        📧 contact@guylocationevents.com • 📞 07 44 78 27 54<br/>
                                        Service disponible 24h/24 • 7j/7 (selon disponibilité)
                                      </td>
                                      <td align="right" class="footer-text" style="color:#999;font-size:12px;">
                                        ©️ ${currentYear} SoundRush Paris
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                  </html>
                `;

                console.log('📧 Tentative envoi email avec Resend:');
                console.log('  - From:', process.env.RESEND_FROM);
                console.log('  - To:', customerEmail);
                console.log('  - Subject:', `✅ Acompte payé - Votre réservation ${packName} est confirmée`);
                console.log('  - Magic Link URL:', magicLinkUrl);
                
                const emailResult = await resend.emails.send({
                  from: process.env.RESEND_FROM!,
                  to: customerEmail,
                  subject: `✅ Acompte payé - Votre réservation ${packName} est confirmée`,
                  html: emailHtml,
                });

                console.log('✅ Email de confirmation d\'acompte envoyé à:', customerEmail);
                console.log('✅ Résultat Resend:', JSON.stringify(emailResult, null, 2));
              } else {
                console.warn('⚠️ Email non envoyé - Raisons:');
                if (!customerEmail || customerEmail === 'pending@stripe.com' || customerEmail.trim() === '') {
                  console.warn('  - Email invalide ou vide:', customerEmail || 'VIDE');
                }
                if (!process.env.RESEND_API_KEY) {
                  console.warn('  - RESEND_API_KEY manquant');
                }
                if (!process.env.RESEND_FROM) {
                  console.warn('  - RESEND_FROM manquant');
                }
              }
            } catch (emailError: any) {
              console.error('❌ Erreur envoi email de confirmation acompte:', emailError);
              console.error('❌ Détails erreur:', JSON.stringify(emailError, null, 2));
              // Ne pas faire échouer le webhook si l'email échoue
            }
            
            console.log('✅ Fin traitement acompte, retour réponse webhook');
            return NextResponse.json({ received: true, success: true, status: updatedReservation.status, paymentType: 'deposit' });
          }
          
          // Si c'est un paiement de SOLDE (70%) pour client_reservation
          if (paymentType === 'client_reservation_balance') {
            const reservationId = metadata.reservation_id;
            
            console.log('💰 Webhook solde reçu:', {
              sessionId: session.id,
              reservationId,
              paymentStatus: session.payment_status,
            });
            
            if (!reservationId) {
              console.warn('⚠️ reservation_id manquant dans les métadonnées');
              return NextResponse.json({ received: true, warning: 'reservation_id manquant' });
            }
            
            if (session.payment_status !== 'paid') {
              console.warn('⚠️ Paiement solde non complété, statut:', session.payment_status);
              return NextResponse.json({ received: true, warning: 'Paiement non complété' });
            }
            
            // Mettre à jour la réservation avec le paiement du solde
            const { data: updatedReservation, error: updateError } = await supabaseClient
              .from('client_reservations')
              .update({
                balance_paid_at: new Date().toISOString(),
                balance_session_id: session.id,
                status: 'CONFIRMED', // Réservation confirmée après paiement du solde
              })
              .eq('id', reservationId)
              .select()
              .single();
            
            if (updateError) {
              console.error('❌ Erreur mise à jour solde:', updateError);
              return NextResponse.json({ received: true, error: 'Erreur mise à jour' });
            }
            
            // Créer un order pour le solde payé
            try {
              const balanceAmount = updatedReservation.balance_amount 
                ? parseFloat(updatedReservation.balance_amount.toString())
                : parseFloat(updatedReservation.price_total.toString()) * 0.7;
              
              const orderData = {
                stripe_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent ? (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id) : null,
                customer_email: updatedReservation.customer_email || session.customer_email || '',
                customer_name: updatedReservation.customer_name || '',
                customer_phone: null,
                delivery_address: updatedReservation.address || '',
                delivery_option: null,
                delivery_fee: 0,
                subtotal: balanceAmount,
                total: balanceAmount,
                deposit_total: 0,
                status: 'PAID',
                client_reservation_id: reservationId, // Lier à client_reservations
                metadata: {
                  type: 'client_reservation_balance',
                  reservation_id: reservationId,
                  pack_key: updatedReservation.pack_key,
                  paymentType: 'balance',
                },
              };
              
              const { error: orderError } = await supabaseClient
                .from('orders')
                .insert(orderData);
              
              if (orderError) {
                console.warn('⚠️ Erreur création order pour solde (non bloquant):', orderError);
              } else {
                console.log('✅ Order créé pour solde:', reservationId);
              }
            } catch (orderErr) {
              console.warn('⚠️ Erreur création order pour solde (non bloquant):', orderErr);
            }
            
            console.log('✅ Solde payé avec succès:', reservationId);
            return NextResponse.json({ received: true, success: true, status: updatedReservation.status, paymentType: 'balance' });
          }
          
          // Si c'est un paiement de CAUTION pour client_reservation
          if (paymentType === 'client_reservation_security_deposit') {
            const reservationId = metadata.reservation_id;
            
            console.log('🔒 Webhook caution reçu:', {
              sessionId: session.id,
              reservationId,
              paymentStatus: session.payment_status,
            });
            
            if (!reservationId) {
              console.warn('⚠️ reservation_id manquant dans les métadonnées');
              return NextResponse.json({ received: true, warning: 'reservation_id manquant' });
            }
            
            // Pour la caution, on peut utiliser setup_intent ou payment_intent selon le mode
            // Si c'est une autorisation (non débitée), le statut peut être 'unpaid'
            if (session.payment_status !== 'paid' && session.payment_status !== 'unpaid') {
              console.warn('⚠️ Paiement caution non complété, statut:', session.payment_status);
              return NextResponse.json({ received: true, warning: 'Paiement non complété' });
            }
            
            // Mettre à jour la réservation avec le paiement de la caution
            const { data: updatedReservation, error: updateError } = await supabaseClient
              .from('client_reservations')
              .update({
                deposit_session_id: session.id,
                // Note: deposit_paid_at peut rester null si c'est juste une autorisation
              })
              .eq('id', reservationId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Erreur mise à jour caution:', updateError);
              return NextResponse.json({ received: true, error: 'Erreur mise à jour' });
            }

            // Créer un order pour la caution (si payée, pas seulement autorisée)
            if (session.payment_status === 'paid' && updatedReservation) {
              try {
                const depositAmount = parseFloat(updatedReservation.deposit_amount?.toString() || '0');
                
                if (depositAmount > 0) {
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
                    client_reservation_id: reservationId, // Lier à client_reservations
                    metadata: {
                      type: 'client_reservation_security_deposit',
                      reservation_id: reservationId,
                      pack_key: updatedReservation.pack_key,
                      paymentType: 'security_deposit',
                    },
                  };
                  
                  const { error: orderError } = await supabaseClient
                    .from('orders')
                    .insert(orderData);
                  
                  if (orderError) {
                    console.warn('⚠️ Erreur création order pour caution (non bloquant):', orderError);
                  } else {
                    console.log('✅ Order créé pour caution:', reservationId);
                  }
                }
              } catch (orderErr) {
                console.warn('⚠️ Erreur création order pour caution (non bloquant):', orderErr);
              }
            }

            console.log('✅ Caution enregistrée avec succès:', reservationId);
            return NextResponse.json({ received: true, success: true, paymentType: 'security_deposit' });
          }
          
          // Ancien format pour compatibilité (deprecated)
          if (paymentType === 'client_reservation' || paymentType === 'deposit') {
          const reservationId = metadata.reservationId;
          const mainSessionId = metadata.mainSessionId;
          
          console.log('💰 Webhook caution reçu:', {
            sessionId: session.id,
            reservationId,
            mainSessionId,
            metadata: JSON.stringify(metadata),
          });
          
          if (reservationId) {
            // Récupérer le PaymentIntent pour obtenir l'ID de paiement
            let paymentIntentId = null;
            if (session.payment_intent) {
              if (typeof session.payment_intent === 'string') {
                paymentIntentId = session.payment_intent;
              } else {
                paymentIntentId = session.payment_intent.id;
              }
            }

            // Récupérer les notes existantes et les heures de retrait/retour de la réservation
            let existingNotes = {};
            let existingPickupTime = null;
            let existingReturnTime = null;
            try {
              const { data: existingReservation } = await supabaseClient
                .from('reservations')
                .select('notes, pickup_time, return_time')
                .eq('id', reservationId)
                .single();
              
              if (existingReservation?.notes) {
                existingNotes = JSON.parse(existingReservation.notes);
              }
              if (existingReservation?.pickup_time) {
                existingPickupTime = existingReservation.pickup_time;
              }
              if (existingReservation?.return_time) {
                existingReturnTime = existingReservation.return_time;
              }
            } catch (e) {
              console.warn('⚠️ Impossible de récupérer les données existantes:', e);
            }

            // Mettre à jour la réservation pour indiquer que la caution a été autorisée
            // Préserver les heures de retrait et de retour si elles existent
            const { data: updatedReservation, error: updateError } = await supabaseClient
              .from('reservations')
              .update({
                status: 'CONFIRMED',
                stripe_deposit_session_id: session.id,
                stripe_deposit_payment_intent_id: paymentIntentId,
                notes: JSON.stringify({
                  ...existingNotes,
                  depositAuthorized: true,
                  depositSessionId: session.id,
                  depositPaymentIntentId: paymentIntentId,
                  depositAuthorizedAt: new Date().toISOString(),
                }),
                pickup_time: existingPickupTime,
                return_time: existingReturnTime,
              })
              .eq('id', reservationId)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Erreur mise à jour réservation pour caution:', updateError);
            } else {
              console.log('✅ Caution autorisée - Réservation mise à jour:', {
                reservationId,
                status: updatedReservation?.status,
                depositSessionId: session.id,
              });

              // Envoyer un email de confirmation après le paiement complet
              if (updatedReservation) {
                try {
                  // Récupérer les informations de la réservation pour l'email
                  const { data: fullReservation } = await supabaseClient
                    .from('reservations')
                    .select('*')
                    .eq('id', reservationId)
                    .single();

                  if (fullReservation) {
                    let notesData: any = {};
                    try {
                      notesData = fullReservation.notes ? JSON.parse(fullReservation.notes) : {};
                    } catch (e) {
                      console.warn('⚠️ Erreur parsing notes:', e);
                    }

                    const customerEmail = notesData.customerEmail || session.customer_email || '';
                    const customerName = notesData.customerName || '';

                    if (customerEmail && process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
                      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sndrush.com';
                      const reservationUrl = `${baseUrl}/mes-reservations/${reservationId}`;
                      const signContractUrl = `${baseUrl}/sign-contract?reservationId=${reservationId}`;

                      const emailHtml = `
                        <!DOCTYPE html>
                        <html style="background-color: #ffffff;">
                          <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          </head>
                          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff !important; margin: 0; padding: 0; background: #ffffff !important;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff !important; background: #ffffff !important; padding: 40px 20px;">
                              <!-- Header avec logo -->
                              <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #F2431E;">
                                <div style="background-color: #F2431E; color: #ffffff; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 15px;">
                                  <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold; letter-spacing: 1px;">SoundRush Paris</h1>
                                </div>
                                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">La location sono express à Paris en 2min</p>
                              </div>
                              
                              <!-- Main Content -->
                              <div style="background-color: #ffffff !important; background: #ffffff !important;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                  <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                                  <h2 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 28px; font-weight: bold;">Merci pour votre achat !</h2>
                                  <p style="color: #000000; font-size: 18px; margin-bottom: 30px;">
                                    Votre paiement a été confirmé avec succès.
                                  </p>
                                </div>
                                
                                <!-- Prochaines étapes -->
                                <div style="background-color: #fff7ed !important; background: #fff7ed !important; padding: 30px; border-radius: 10px; border: 3px solid #F2431E; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(242, 67, 30, 0.15);">
                                  <h3 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 22px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #F2431E;">🚀 Prochaines étapes</h3>
                                  <ol style="color: #000000; font-size: 16px; line-height: 2; padding-left: 20px; margin: 0;">
                                    <li style="margin-bottom: 15px;">
                                      <strong>Allez dans "Mes réservations"</strong> pour voir le détail de votre réservation
                                    </li>
                                    <li style="margin-bottom: 15px;">
                                      <strong>Cliquez sur votre réservation</strong> pour accéder aux détails
                                    </li>
                                    <li style="margin-bottom: 15px;">
                                      <strong>Signez le contrat de location</strong> en cliquant sur le bouton "Signer le contrat"
                                    </li>
                                  </ol>
                                </div>

                                <!-- Boutons CTA -->
                                <div style="text-align: center; margin: 40px 0;">
                                  <a href="${reservationUrl}" 
                                     style="display: inline-block; background-color: #F2431E; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px rgba(242, 67, 30, 0.4); margin-bottom: 15px; margin-right: 10px;">
                                    📋 Voir ma réservation
                                  </a>
                                  <a href="${signContractUrl}" 
                                     style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); margin-bottom: 15px;">
                                    ✍️ Signer le contrat
                                  </a>
                                </div>

                                <!-- Informations importantes -->
                                <div style="background-color: #f0fdf4 !important; background: #f0fdf4 !important; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin-top: 30px;">
                                  <p style="color: #000000; font-size: 15px; margin: 0; line-height: 1.8;">
                                    <strong style="color: #10b981;">📝 Important :</strong> Votre réservation sera finalisée une fois le contrat signé. 
                                    N'hésitez pas à nous contacter si vous avez des questions.
                                  </p>
                                </div>

                                <!-- Footer -->
                                <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #F2431E;">
                                  <p style="color: #000000; font-size: 15px; text-align: center; margin-bottom: 20px; line-height: 1.6;">
                                    Nous sommes ravis de vous accompagner dans votre événement.<br>
                                    Notre équipe reste disponible pour toute question.
                                  </p>
                                  <div style="background-color: #ffffff !important; background: #ffffff !important; padding: 25px; border-radius: 8px; border: 2px solid #F2431E; margin-top: 20px;">
                                    <p style="color: #F2431E; font-size: 16px; font-weight: bold; text-align: center; margin: 0 0 15px 0;">L'équipe SoundRush Paris</p>
                                    <div style="text-align: center; color: #000000; font-size: 14px; line-height: 2;">
                                      <p style="margin: 5px 0;">
                                        <strong style="color: #F2431E;">📧 Email :</strong> 
                                        <a href="mailto:contact@guylocationevents.com" style="color: #0066cc; text-decoration: none;">contact@guylocationevents.com</a>
                                      </p>
                                      <p style="margin: 5px 0;">
                                        <strong style="color: #F2431E;">📞 Téléphone :</strong> 
                                        <a href="tel:+33744782754" style="color: #0066cc; text-decoration: none;">07 44 78 27 54</a>
                                      </p>
                                      <p style="margin: 5px 0;">
                                        <strong style="color: #F2431E;">📍 Adresse :</strong> 
                                        <span style="color: #000000;">Paris, Île-de-France</span>
                                      </p>
                                      <p style="margin: 15px 0 5px 0; color: #666; font-size: 13px;">
                                        Service disponible 24h/24 - 7j/7
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </body>
                        </html>
                      `;

                      await resend.emails.send({
                        from: process.env.RESEND_FROM!,
                        to: customerEmail,
                        subject: '✅ Paiement confirmé - Prochaine étape : Signature du contrat SoundRush',
                        html: emailHtml,
                      });

                      console.log('✅ Email de confirmation envoyé à:', customerEmail);
                    }
                  }
                } catch (emailError: any) {
                  console.error('❌ Erreur envoi email de confirmation:', emailError);
                  // Ne pas faire échouer le webhook si l'email échoue
                }
              }
            }
          } else {
            console.warn('⚠️ Aucun reservationId dans les métadonnées de la session caution');
          }
          
            return NextResponse.json({ received: true });
          }
          
          // Traitement du paiement principal (type: 'cart')
          const userId = metadata.userId;
          let customerEmail = session.customer_email || metadata.customerEmail || '';
          const customerName = metadata.customerName || '';
          const customerPhone = metadata.customerPhone || '';
          const deliveryOption = metadata.deliveryOption || 'paris';
          const deliveryFee = parseFloat(metadata.deliveryFee || '0');
          const total = parseFloat(metadata.total || '0');
          const depositTotal = parseFloat(metadata.depositTotal || '0');
          const address = metadata.address || '';
          const reservationId = metadata.reservationId;

          // Vérifier que les données essentielles sont présentes
          if (!customerEmail) {
            console.error('❌ customerEmail manquant dans les métadonnées:', {
              sessionId: session.id,
              sessionCustomerEmail: session.customer_email,
              sessionCustomer: session.customer,
              metadata: JSON.stringify(metadata),
            });
            
            // Essayer de récupérer depuis le customer Stripe si disponible
            if (session.customer) {
              try {
                const customerId = typeof session.customer === 'string' 
                  ? session.customer 
                  : session.customer.id;
                
                if (customerId) {
                  const customer = await stripe.customers.retrieve(customerId);
                  if (customer && !customer.deleted && customer.email) {
                    customerEmail = customer.email;
                    console.log('✅ customerEmail récupéré depuis le customer Stripe:', customerEmail);
                  }
                }
              } catch (e) {
                console.error('❌ Erreur récupération customerEmail depuis customer Stripe:', e);
              }
            }
            
            // Essayer de récupérer depuis la réservation si userId est présent
            if (!customerEmail && reservationId) {
              try {
                const { data: reservation } = await supabaseClient
                  .from('reservations')
                  .select('notes')
                  .eq('id', reservationId)
                  .single();
                
                if (reservation?.notes) {
                  const notesData = JSON.parse(reservation.notes);
                  if (notesData.customerEmail) {
                    customerEmail = notesData.customerEmail;
                    console.log('✅ customerEmail récupéré depuis la réservation:', customerEmail);
                  }
                }
              } catch (e) {
                console.error('❌ Erreur récupération customerEmail depuis réservation:', e);
              }
            }

            // Si toujours pas d'email, essayer de récupérer depuis l'utilisateur
            if (!customerEmail && userId) {
              try {
                const { data: { user } } = await supabaseClient.auth.admin.getUserById(userId);
                if (user?.email) {
                  customerEmail = user.email;
                  console.log('✅ customerEmail récupéré depuis l\'utilisateur:', customerEmail);
                }
              } catch (e) {
                console.error('❌ Erreur récupération email utilisateur:', e);
              }
            }
          }

          // Si toujours pas d'email, ne pas créer l'order (mais ne pas faire échouer le webhook)
          if (!customerEmail) {
            console.error('❌ Impossible de créer l\'order: customerEmail manquant pour la session:', session.id);
            return NextResponse.json({ received: true, warning: 'customerEmail manquant' }, { status: 200 });
          }
          
          // Récupérer le PaymentIntent pour obtenir l'ID de paiement
          let paymentIntentId = null;
          if (session.payment_intent) {
            if (typeof session.payment_intent === 'string') {
              paymentIntentId = session.payment_intent;
            } else {
              paymentIntentId = session.payment_intent.id;
            }
          }

          // Calculer le subtotal (total - frais de livraison)
          const subtotal = total;

          // Récupérer les items du panier depuis la réservation (au lieu des métadonnées)
          let cartItems: any[] = [];
        
        if (reservationId) {
          try {
            // Récupérer la réservation pour obtenir les cartItems
            const { data: reservation, error: reservationError } = await supabaseClient
              .from('reservations')
              .select('notes')
              .eq('id', reservationId)
              .single();

            if (!reservationError && reservation?.notes) {
              try {
                const notesData = JSON.parse(reservation.notes);
                cartItems = notesData.cartItems || [];
              } catch (e) {
                console.error('Erreur parsing notes de la réservation:', e);
              }
            }
          } catch (e) {
            console.error('Erreur récupération réservation:', e);
          }
        }
        
        // Fallback : essayer de récupérer depuis les métadonnées (pour compatibilité)
        if (cartItems.length === 0) {
          try {
            if (metadata.cartItems) {
              cartItems = JSON.parse(metadata.cartItems);
            }
          } catch (e) {
            console.error('Erreur parsing cartItems depuis métadonnées:', e);
          }
        }

        // Créer l'order dans Supabase
        // Déterminer si c'est une client_reservation ou une ancienne reservation
        let clientReservationId: string | null = null;
        let oldReservationId: string | null = reservationId;
        
        // Si reservationId pointe vers client_reservations (vérifier via metadata ou via l'existence)
        if (reservationId) {
          try {
            const { data: clientReservation } = await supabaseClient
              .from('client_reservations')
              .select('id')
              .eq('id', reservationId)
              .single();
            
            if (clientReservation) {
              clientReservationId = reservationId;
              oldReservationId = null; // Ne pas utiliser reservation_id pour les nouvelles réservations
            }
          } catch (e) {
            // Si erreur, c'est probablement une ancienne reservation, garder oldReservationId
            console.log('Réservation non trouvée dans client_reservations, utilisation ancienne table');
          }
        }
        
        const orderData: any = {
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_address: address,
          delivery_option: deliveryOption,
          delivery_fee: deliveryFee,
          subtotal: subtotal,
          total: (session.amount_total || 0) / 100, // Convertir de centimes en euros
          deposit_total: depositTotal,
          status: 'PAID',
          metadata: {
            userId: userId,
            cartItems: cartItems,
            sessionMetadata: metadata,
          },
        };
        
        // Ajouter le bon ID selon le type de réservation
        if (clientReservationId) {
          orderData.client_reservation_id = clientReservationId;
        } else if (oldReservationId) {
          orderData.reservation_id = oldReservationId;
        }

        console.log('📦 Création de l\'order avec les données:', {
          customer_email: customerEmail,
          customer_name: customerName,
          total: orderData.total,
          stripe_session_id: session.id,
        });

        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          console.error('❌ Erreur création order:', {
            error: orderError,
            orderData: JSON.stringify(orderData, null, 2),
            sessionId: session.id,
          });
          throw orderError;
        }

        console.log('✅ Order créé avec succès:', {
          orderId: order.id,
          customer_email: order.customer_email,
          total: order.total,
          stripe_session_id: order.stripe_session_id,
        });

        // Créer les order_items si on a les données du panier
        let orderItemsToInsert: any[] = [];
        if (cartItems.length > 0 && order) {
          // Récupérer les line items de Stripe pour avoir plus de détails
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
          });

          // Créer les order_items
          for (const lineItem of lineItems.data) {
            // Ignorer les frais de livraison (seront dans delivery_fee)
            if (lineItem.description?.includes('Livraison') || lineItem.description?.includes('delivery')) {
              continue;
            }

            // Trouver l'item correspondant dans cartItems si disponible
            const cartItem = cartItems.find((item: any) => 
              item.name === lineItem.description || item.productName === lineItem.description
            );

            if (cartItem) {
              // Utiliser les données complètes du panier
              orderItemsToInsert.push({
                order_id: order.id,
                product_id: cartItem.productId?.startsWith('pack-') ? null : (cartItem.productId || null),
                product_name: cartItem.productName || lineItem.description || 'Produit',
                product_slug: cartItem.productSlug || null,
                quantity: cartItem.quantity || lineItem.quantity || 1,
                rental_days: cartItem.rentalDays || 1,
                start_date: cartItem.startDate || new Date().toISOString().split('T')[0],
                end_date: cartItem.endDate || new Date().toISOString().split('T')[0],
                daily_price: cartItem.dailyPrice || (lineItem.price?.unit_amount || 0) / 100,
                deposit: cartItem.deposit || 0,
                addons: cartItem.addons || [],
                images: cartItem.images || [],
              });
            } else {
              // Fallback : créer un order_item basique depuis Stripe
              orderItemsToInsert.push({
                order_id: order.id,
                product_id: null,
                product_name: lineItem.description || 'Produit',
                product_slug: null,
                quantity: lineItem.quantity || 1,
                rental_days: 1,
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                daily_price: (lineItem.price?.unit_amount || 0) / 100,
                deposit: 0,
                addons: [],
                images: [],
              });
            }
          }

          if (orderItemsToInsert.length > 0) {
            const { error: itemsError } = await supabaseClient
              .from('order_items')
              .insert(orderItemsToInsert);

            if (itemsError) {
              console.error('❌ Erreur création order_items:', itemsError);
            } else {
              console.log(`✅ ${orderItemsToInsert.length} order_items créés`);
            }
          }
        }

          // NOTE: On ne crée plus de nouvelles réservations ici car elles sont déjà créées lors du checkout
          // La réservation PENDING est créée dans /api/checkout/create-session et mise à jour ci-dessous
          // Cette section est désactivée pour éviter les doublons
          console.log('ℹ️ Réservations déjà créées lors du checkout, pas de création supplémentaire nécessaire');

          // Mettre à jour la réservation PENDING créée lors du checkout avec les bonnes données
          // IMPORTANT : On garde le statut PENDING jusqu'à ce que la caution soit autorisée
          if (reservationId) {
            try {
              // Récupérer la réservation PENDING originale
              const { data: pendingReservation, error: pendingError } = await supabaseClient
                .from('reservations')
                .select('*')
                .eq('id', reservationId)
                .single();

              if (!pendingError && pendingReservation && pendingReservation.status === 'PENDING') {
                // Récupérer les notes existantes et les heures de retrait/retour
                let existingNotes = {};
                let existingPickupTime = null;
                let existingReturnTime = null;
                try {
                  if (pendingReservation.notes) {
                    existingNotes = JSON.parse(pendingReservation.notes);
                  }
                  if (pendingReservation.pickup_time) {
                    existingPickupTime = pendingReservation.pickup_time;
                  }
                  if (pendingReservation.return_time) {
                    existingReturnTime = pendingReservation.return_time;
                  }
                } catch (e) {
                  console.error('Erreur parsing données existantes:', e);
                }

                // Mettre à jour avec les données complètes (mais garder le statut PENDING)
                // Préserver les heures de retrait et de retour si elles existent
                const updatedNotes = {
                  ...existingNotes,
                  sessionId: session.id,
                  cartItems: cartItems,
                  customerEmail,
                  customerName,
                  deliveryOption: deliveryOption || 'paris',
                  orderId: order.id,
                  mainPaymentCompleted: true,
                  mainPaymentCompletedAt: new Date().toISOString(),
                };

                await supabaseClient
                  .from('reservations')
                  .update({
                    // Garder le statut PENDING jusqu'à ce que la caution soit autorisée
                    status: 'PENDING',
                    stripe_payment_intent_id: paymentIntentId,
                    total_price: (session.amount_total || 0) / 100,
                    notes: JSON.stringify(updatedNotes),
                    pickup_time: existingPickupTime,
                    return_time: existingReturnTime,
                  })
                  .eq('id', reservationId);

                console.log(`✅ Réservation PENDING ${reservationId} mise à jour (paiement principal complété, en attente de caution)`);
              }
            } catch (e) {
              console.error('Erreur mise à jour réservation PENDING:', e);
            }
          }

          // Aussi mettre à jour les autres réservations existantes en pending si elles existent
          const { data: pendingReservations } = await supabaseClient
            .from('reservations')
            .select('id, pickup_time, return_time')
            .eq('user_id', userId)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(10);

          if (pendingReservations && pendingReservations.length > 0) {
            // Mettre à jour chaque réservation individuellement pour préserver les heures
            for (const pendingReservation of pendingReservations) {
              await supabaseClient
                .from('reservations')
                .update({
                  status: 'CONFIRMED',
                  stripe_payment_intent_id: paymentIntentId,
                  pickup_time: pendingReservation.pickup_time || null,
                  return_time: pendingReservation.return_time || null,
                })
                .eq('id', pendingReservation.id);
            }

            console.log(`✅ ${pendingReservations.length} réservations en attente mises à jour`);

            // Créer automatiquement des états des lieux pour ces réservations
            for (const pendingReservation of pendingReservations) {
              try {
                const { data: existingEtatLieux } = await supabaseClient
                  .from('etat_lieux')
                  .select('id')
                  .eq('reservation_id', pendingReservation.id)
                  .maybeSingle();

                if (!existingEtatLieux) {
                  const { error: etatLieuxError } = await supabaseClient
                    .from('etat_lieux')
                    .insert({
                      reservation_id: pendingReservation.id,
                      status: 'draft',
                      items: JSON.stringify({
                        photos_avant: [],
                        commentaire_avant: '',
                        photos_apres: [],
                        commentaire_apres: ''
                      })
                    });

                  if (etatLieuxError) {
                    console.error(`⚠️ Erreur création état des lieux pour ${pendingReservation.id}:`, etatLieuxError);
                  } else {
                    console.log(`✅ État des lieux créé automatiquement pour la réservation: ${pendingReservation.id}`);
                  }
                }
              } catch (e) {
                console.error(`⚠️ Erreur création automatique état des lieux pour ${pendingReservation.id}:`, e);
              }
            }
          }

          // Vider le panier de l'utilisateur après paiement réussi
          if (userId) {
            try {
              const { error: cartDeleteError } = await supabaseClient
                .from('carts')
                .delete()
                .eq('user_id', userId);

              if (cartDeleteError) {
                console.error('❌ Erreur suppression panier:', cartDeleteError);
              } else {
                console.log('✅ Panier vidé pour l\'utilisateur:', userId);
              }
            } catch (e) {
              console.error('❌ Erreur lors de la suppression du panier:', e);
            }
          }

          console.log('✅ Commande traitée avec succès pour la session:', session.id);
        } catch (error: any) {
          console.error('❌ Erreur lors du traitement de la commande:', error);
          // Ne pas retourner d'erreur pour éviter que Stripe réessaie indéfiniment
          // Vous pouvez logger l'erreur et la traiter manuellement
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Paiement asynchrone réussi - Session ID:', session.id);
        // Traiter le paiement asynchrone (ex: virement bancaire)
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('❌ Paiement asynchrone échoué - Session ID:', session.id);
        // Notifier le client que le paiement a échoué
        break;
      }

      case 'checkout.session.expired': {
        // HOLD v1 - Marquer le hold comme EXPIRED si la session Stripe expire
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const holdId = metadata.hold_id;
        const reservationId = metadata.reservation_id;

        if (holdId && supabaseAdmin) {
          try {
            console.log('⏰ Session Stripe expirée, expiration du hold:', holdId);
            
            // Marquer le hold comme EXPIRED (seulement si encore ACTIVE)
            const { error: expireHoldError } = await supabaseAdmin
              .from('reservation_holds')
              .update({
                status: 'EXPIRED',
                updated_at: new Date().toISOString(),
              })
              .eq('id', holdId)
              .eq('status', 'ACTIVE'); // Seulement si encore actif

            if (expireHoldError) {
              console.warn('⚠️ Erreur expiration hold (non bloquant):', expireHoldError);
            } else {
              console.log('✅ Hold marqué comme EXPIRED:', holdId);
            }

            // Optionnel : Marquer la réservation comme CANCELLED si elle est toujours AWAITING_PAYMENT
            // et plus ancienne que X heures (par exemple 12 heures)
            if (reservationId) {
              const { error: cancelReservationError } = await supabaseAdmin
                .from('client_reservations')
                .update({
                  status: 'CANCELLED',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', reservationId)
                .eq('status', 'AWAITING_PAYMENT')
                .lt('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()); // Plus de 12h

              if (cancelReservationError) {
                console.warn('⚠️ Erreur annulation réservation expirée (non bloquant):', cancelReservationError);
              } else {
                console.log('✅ Réservation expirée annulée:', reservationId);
              }
            }
          } catch (holdError) {
            console.warn('⚠️ Erreur gestion expiration hold (non bloquant):', holdError);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ PaymentIntent réussi:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ PaymentIntent échoué:', paymentIntent.id);
        break;
      }

      default:
        console.log(`⚠️ Événement non géré: ${event.type}`);
    }

    // Toujours retourner 200 pour que Stripe considère l'événement comme traité
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    // Gérer toutes les erreurs non capturées
    console.error('❌ Erreur générale dans le webhook Stripe:', {
      message: error.message,
      stack: error.stack,
      error: error,
    });
    // Toujours retourner 200 pour éviter que Stripe réessaie indéfiniment
    return NextResponse.json({ received: false, error: error.message || 'Erreur serveur' }, { status: 200 });
  }
}

