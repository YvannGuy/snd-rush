import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resend } from '@/lib/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { success: false, error: 'URL de base manquante' },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
      return NextResponse.json(
        { success: false, error: 'Configuration email manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      customerName,
      customerEmail,
      eventAddress,
      depositAmount,
      startDate,
      startTime,
      endDate,
      endTime,
      participants,
      customProducts = [],
    } = body;

    // Validation
    if (!customerName || !customerEmail || !eventAddress || !depositAmount || !startDate || !startTime || !endDate || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    const deposit = parseFloat(depositAmount);
    if (isNaN(deposit) || deposit <= 0) {
      return NextResponse.json(
        { success: false, error: 'Montant de caution invalide' },
        { status: 400 }
      );
    }

    // Calculer le total des produits
    const productsTotal = customProducts.reduce((sum: number, product: { price: number }) => sum + product.price, 0);

    let mainSessionId: string | null = null;
    let checkoutUrl: string | null = null;

    // Si il y a des produits, créer d'abord la session pour les produits
    if (customProducts.length > 0 && productsTotal > 0) {
      const lineItems = customProducts.map((product: { name: string; price: number }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.name,
            description: 'Produit personnalisé',
          },
          unit_amount: Math.round(product.price * 100), // Convertir en centimes
        },
        quantity: 1,
      }));

      // Créer la session Stripe pour les produits
      const productsSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: lineItems,
        mode: 'payment',
        metadata: {
          type: 'admin_products',
          customerName,
          customerEmail,
          eventAddress,
          depositAmount: deposit.toString(),
          startDate,
          startTime,
          endDate,
          endTime,
          participants: participants || '',
          customProducts: JSON.stringify(customProducts),
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/create-deposit-session?session_id={CHECKOUT_SESSION_ID}&deposit=${Math.round(deposit * 100)}&customerEmail=${encodeURIComponent(customerEmail)}&customerName=${encodeURIComponent(customerName)}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/paiement?cancelled=true`,
      });

      if (!productsSession.url) {
        return NextResponse.json(
          { success: false, error: 'Impossible de créer la session Stripe pour les produits' },
          { status: 500 }
        );
      }

      mainSessionId = productsSession.id;
      checkoutUrl = productsSession.url;
    } else {
      // Si pas de produits, créer directement la session caution
      const depositSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Autorisation de caution: €${deposit.toFixed(2)}`,
                description: 'Cette autorisation de caution sert à garantir votre location d\'équipement sono et vidéo.',
              },
              unit_amount: Math.round(deposit * 100), // Convertir en centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual', // Autorisation sans débit immédiat
          metadata: {
            type: 'deposit',
            customerName,
            customerEmail,
            eventAddress,
          },
        },
        custom_text: {
          submit: {
            message:
              "Cette autorisation de caution sert à garantir votre location d'équipement sono et vidéo. " +
              "Le montant n'est pas débité immédiatement, il reste simplement bloqué. " +
              "Après l'événement et la vérification du matériel, 95 % des cautions sont libérées sans frais. " +
              "En cas de dommages, une expertise sera réalisée sous 48 heures pour évaluer les réparations nécessaires. " +
              "Selon l'ampleur des dégâts, le montant correspondant sera déduit de la caution.",
          },
        },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/paiement?cancelled=true`,
        metadata: {
          type: 'deposit',
          customerName,
          customerEmail,
          eventAddress,
        },
      });

      if (!depositSession.url) {
        return NextResponse.json(
          { success: false, error: 'Impossible de créer la session Stripe' },
          { status: 500 }
        );
      }

      mainSessionId = depositSession.id;
      checkoutUrl = depositSession.url;
    }

    // Formater les dates
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      return `${hours}h${minutes}`;
    };

    // Formater le nom du client (première lettre en majuscule)
    const formatCustomerName = (name: string) => {
      return name.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    // Générer le HTML des produits personnalisés pour le nouveau template
    const productsRowsHtml = customProducts.length > 0
      ? customProducts.map((product: { name: string; price: number }) => `
                <tr class="product-row">
                  <td style="padding:10px 0;color:#111111;font-weight:700;">${product.name}</td>
                  <td align="right" style="padding:10px 0;color:#111111;font-weight:700;">${product.price.toFixed(2)}€</td>
                </tr>
              `).join('') + `
                <tr class="product-row" style="border-top:1px solid #f2f2f2;">
                  <td style="padding:10px 0;color:#111111;font-weight:700;">Total produits</td>
                  <td align="right" style="padding:10px 0;color:#e27431;font-weight:800;">${productsTotal.toFixed(2)}€</td>
                </tr>
              `
      : '';

    const productsSectionHtml = customProducts.length > 0
      ? `
                <!-- Products Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;background:#ffffff;border:1px solid #f2f2f2;border-radius:14px;">
                  <tr>
                    <td class="card-padding" style="padding:12px 12px 6px 12px;font-size:13px;color:#333333;">
                      <div style="font-weight:700;color:#111111;margin-bottom:10px;font-size:14px;">🛍️ Produits personnalisés</div>
                      <table role="presentation" class="product-table" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;border-collapse:collapse;">
                        <tr class="product-header">
                          <td style="padding:8px 0;color:#666666;border-bottom:1px solid #f2f2f2;font-weight:600;">Produit</td>
                          <td align="right" style="padding:8px 0;color:#666666;border-bottom:1px solid #f2f2f2;font-weight:600;">Prix</td>
                        </tr>
                        ${productsRowsHtml}
                      </table>
                    </td>
                  </tr>
                </table>
              `
      : '';

    const emailHtml = `<!doctype html>
<html lang="fr">
        <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>SoundRush Paris - Récapitulatif réservation</title>
    <style type="text/css">
      /* Reset pour emails */
      body, table, td, p, a, li, blockquote {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      /* Media queries pour mobile */
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
        }
        .email-content {
          padding: 16px !important;
        }
        .header-padding {
          padding: 16px !important;
        }
        .body-padding {
          padding: 16px 16px 8px 16px !important;
        }
        .footer-padding {
          padding: 12px 16px 16px 16px !important;
        }
        .card-padding {
          padding: 12px 12px 6px 12px !important;
        }
        .title-text {
          font-size: 18px !important;
        }
        .subtitle-text {
          font-size: 13px !important;
        }
        .info-label {
          width: 100% !important;
          display: block !important;
          margin-bottom: 4px !important;
        }
        .info-value {
          width: 100% !important;
          display: block !important;
          margin-bottom: 8px !important;
        }
        .cta-button {
          padding: 12px 16px !important;
          font-size: 13px !important;
          width: 100% !important;
          display: block !important;
          text-align: center !important;
        }
        .footer-info {
          text-align: left !important;
        }
        .footer-badge {
          margin-top: 12px !important;
          text-align: left !important;
        }
        .header-title {
          font-size: 16px !important;
        }
        .header-subtitle {
          font-size: 11px !important;
        }
        .deposit-amount {
          font-size: 24px !important;
        }
        .product-table {
          width: 100% !important;
        }
        .product-row td {
          display: block !important;
          width: 100% !important;
          text-align: left !important;
          padding: 6px 0 !important;
        }
        .product-row td:first-child {
          font-weight: 600 !important;
          color: #666666 !important;
        }
        .product-row td:last-child {
          font-weight: 700 !important;
          color: #111111 !important;
          margin-bottom: 8px !important;
          padding-bottom: 8px !important;
          border-bottom: 1px solid #f2f2f2 !important;
        }
        .product-header {
          display: none !important;
        }
      }
      /* Styles pour Outlook */
      .outlook-group-fix {
        width: 100% !important;
      }
    </style>
        </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <!-- Preheader (texte caché) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;max-width:0;max-height:0;mso-hide:all;">
      Récapitulatif de votre réservation SoundRush Paris • Paiement sécurisé Stripe
              </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:12px;">
          <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border:1px solid #f2f2f2;border-radius:16px;overflow:hidden;background:#ffffff;margin:0 auto;">
            <!-- Header -->
            <tr>
              <td class="header-padding" style="background:#e27431;padding:16px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="header-title" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:18px;font-weight:700;line-height:1.2;">
                      SoundRush Paris
                    </td>
                    <td align="right" class="header-subtitle" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;line-height:1.2;">
                      Location sono express
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" class="header-subtitle" style="font-family:Arial,Helvetica,sans-serif;color:#fff3ea;font-size:12px;padding-top:6px;line-height:1.4;">
                      La location sono express à Paris en 2min
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td class="body-padding" style="padding:20px 20px 8px 20px;font-family:Arial,Helvetica,sans-serif;color:#111111;">
                <div class="title-text" style="font-size:20px;font-weight:700;line-height:1.2;margin-bottom:8px;">
                  Récapitulatif de votre réservation ✅
                </div>
                <div class="subtitle-text" style="margin-top:10px;font-size:14px;line-height:1.6;color:#333333;">
                  Merci de votre confiance. Voici le détail de votre réservation et le lien pour payer vos produits en toute sécurité.
                </div>
                <!-- Client Info Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;background:#fff7f1;border:1px solid #ffe1cf;border-radius:14px;">
                  <tr>
                    <td class="card-padding" style="padding:12px 12px 6px 12px;font-size:13px;color:#333333;">
                      <div style="font-weight:700;color:#111111;margin-bottom:10px;font-size:14px;">📋 Informations client</div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Nom</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;font-weight:700;word-break:break-word;">${formatCustomerName(customerName)}</td>
                        </tr>
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Email</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;word-break:break-word;">
                            <a href="mailto:${customerEmail}" style="color:#e27431;text-decoration:none;font-weight:700;">${customerEmail}</a>
                          </td>
                        </tr>
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Adresse</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;font-weight:700;word-break:break-word;">${eventAddress}</td>
                        </tr>
                        ${participants ? `
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Participants</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;font-weight:700;">${participants}</td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
                <!-- Dates Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;background:#ffffff;border:1px solid #f2f2f2;border-radius:14px;">
                  <tr>
                    <td class="card-padding" style="padding:12px 12px 6px 12px;font-size:13px;color:#333333;">
                      <div style="font-weight:700;color:#111111;margin-bottom:10px;font-size:14px;">📅 Dates et heures</div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Date de début</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;font-weight:700;word-break:break-word;">${formatDate(startDate)} à ${formatTime(startTime)}</td>
                        </tr>
                        <tr>
                          <td class="info-label" style="padding:6px 0;color:#666666;width:42%;vertical-align:top;">Date de fin</td>
                          <td class="info-value" style="padding:6px 0;color:#111111;font-weight:700;word-break:break-word;">${formatDate(endDate)} à ${formatTime(endTime)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ${productsSectionHtml}
                <!-- Deposit Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;background:#fff7f1;border:1px solid #ffe1cf;border-radius:14px;">
                  <tr>
                    <td class="card-padding" style="padding:12px 12px 6px 12px;font-size:13px;color:#333333;">
                      <div style="font-weight:700;color:#111111;margin-bottom:10px;font-size:14px;">💰 Caution remboursable</div>
                      <div class="deposit-amount" style="font-size:18px;font-weight:800;color:#e27431;margin-bottom:6px;line-height:1.2;">${deposit.toFixed(2)}€</div>
                      <div style="font-size:13px;line-height:1.6;color:#333333;">
                        Cette autorisation de caution sert à garantir votre location d'équipement sono et vidéo. 
                        Le montant n'est pas débité immédiatement, il reste simplement bloqué.
                      </div>
                    </td>
                  </tr>
                </table>
                <!-- CTA -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
                  <tr>
                    <td align="center" style="padding:0;">
                      <a href="${checkoutUrl}" 
                         class="cta-button"
                         style="display:inline-block;background:#e27431;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;padding:14px 18px;border-radius:12px;max-width:100%;word-break:break-word;">
                        ${customProducts.length > 0 && productsTotal > 0 ? '💳 Payer les produits maintenant' : '💳 Payer la caution maintenant'}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666666;line-height:1.6;">
                      🔒 Paiement 100% sécurisé par Stripe<br/>
                      ${customProducts.length > 0 && productsTotal > 0 ? 'ℹ️ Après le paiement des produits, vous serez redirigé vers le paiement de la caution.' : ''}
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#999999;line-height:1.5;word-break:break-all;">
                      Si le bouton ne fonctionne pas, copiez-collez ce lien :<br/>
                      <span style="color:#e27431;word-break:break-all;">${checkoutUrl}</span>
                    </td>
                  </tr>
                </table>
                <!-- Closing -->
                <div style="margin-top:18px;font-size:14px;line-height:1.6;color:#333333;">
                  Nous sommes ravis de vous accompagner dans votre événement.<br/>
                  Notre équipe reste disponible pour toute question.
                </div>
                <div style="margin-top:12px;font-size:14px;font-weight:700;color:#111111;">
                  L'équipe SoundRush Paris
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td class="footer-padding" style="padding:16px 20px 20px 20px;background:#ffffff;border-top:1px solid #f2f2f2;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="footer-info" style="font-size:12px;color:#666666;line-height:1.7;vertical-align:top;">
                      📧 Email : <a href="mailto:contact@guylocationevents.com" style="color:#e27431;text-decoration:none;font-weight:700;word-break:break-all;">contact@guylocationevents.com</a><br/>
                      📞 Téléphone : <a href="tel:+33651084994" style="color:#e27431;text-decoration:none;font-weight:700;">06 51 08 49 94</a><br/>
                      📍 Adresse : Paris, Île-de-France<br/>
                      <span style="color:#999999;">Service disponible 24h/24 - 7j/7</span>
                    </td>
                    <td align="right" class="footer-badge" style="font-size:12px;color:#999999;line-height:1.7;vertical-align:top;padding-left:12px;">
                      <span style="display:inline-block;padding:6px 10px;border:1px solid #ffe1cf;border-radius:999px;color:#e27431;font-weight:700;background:#fff7f1;">
                        Support express
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!-- tiny note -->
          <div style="max-width:600px;margin:10px auto 0 auto;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#b0b0b0;text-align:center;">
            Cet email vous a été envoyé suite à votre demande de réservation SoundRush Paris.
          </div>
        </td>
      </tr>
    </table>
        </body>
</html>`;

    // Envoyer l'email au client
    let emailSent = false;
    let emailError: string | null = null;
    
    // Vérifications préalables avant d'essayer d'envoyer
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY manquante');
      emailError = 'Configuration Resend manquante (RESEND_API_KEY)';
    } else if (!process.env.RESEND_FROM) {
      console.error('❌ RESEND_FROM manquante');
      emailError = 'Configuration Resend manquante (RESEND_FROM)';
    } else {
      try {
        const env = process.env.NODE_ENV || 'development';
        console.log('📧 ===== DÉBUT ENVOI EMAIL =====');
        console.log('📧 Environnement:', env);
        console.log('📧 Tentative d\'envoi d\'email à:', customerEmail);
        console.log('📧 From:', process.env.RESEND_FROM);
        console.log('📧 RESEND_API_KEY présent:', !!process.env.RESEND_API_KEY);
        console.log('📧 Longueur RESEND_API_KEY:', process.env.RESEND_API_KEY?.length || 0);
        console.log('📧 Premiers caractères API key:', process.env.RESEND_API_KEY?.substring(0, 7) || 'N/A');
        
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: customerEmail,
      subject: `Récapitulatif de votre réservation SoundRush - Paiement de la caution`,
      html: emailHtml,
    });

        console.log('📧 Résultat complet Resend:', JSON.stringify(emailResult, null, 2));
        console.log('📧 Email ID:', emailResult.data?.id);
        console.log('📧 Email Error:', emailResult.error);

    if (emailResult.error) {
          console.error('❌ Erreur envoi email:', emailResult.error);
          console.error('❌ Détails erreur:', JSON.stringify(emailResult.error, null, 2));
          emailError = emailResult.error.message || JSON.stringify(emailResult.error) || 'Erreur inconnue lors de l\'envoi de l\'email';
        } else if (emailResult.data?.id) {
          console.log('✅ Email envoyé avec succès');
          console.log('✅ ID email:', emailResult.data.id);
          console.log('📧 IMPORTANT: Vérifiez dans Resend Dashboard (https://resend.com/emails) si l\'email apparaît');
          console.log('📧 IMPORTANT: Vérifiez aussi les spams/indésirables du destinataire');
          emailSent = true;
        } else {
          console.warn('⚠️ Résultat Resend sans ID ni erreur:', emailResult);
          emailError = 'Résultat Resend inattendu - pas d\'ID ni d\'erreur';
        }
        console.log('📧 ===== FIN ENVOI EMAIL =====');
      } catch (emailException: any) {
        console.error('❌ Exception lors de l\'envoi de l\'email:', emailException);
        console.error('❌ Type erreur:', typeof emailException);
        console.error('❌ Message:', emailException.message);
        console.error('❌ Stack trace:', emailException.stack);
        emailError = emailException.message || JSON.stringify(emailException) || 'Exception lors de l\'envoi de l\'email';
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: mainSessionId,
      url: checkoutUrl,
      emailSent,
      emailError: emailError || undefined,
    });
  } catch (error: any) {
    console.error('Erreur création lien de paiement:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
