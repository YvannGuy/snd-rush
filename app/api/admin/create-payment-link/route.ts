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

    // Créer le contenu HTML de l'email avec le lien vers la première session (produits ou caution)
    const productsHtml = customProducts.length > 0
      ? `
        <div style="background-color: #ffffff !important; background: #ffffff !important; padding: 25px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #F2431E; box-shadow: 0 2px 8px rgba(242, 67, 30, 0.1);">
          <h3 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #F2431E;">🛍️ Produits personnalisés</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 0; background-color: #ffffff !important; background: #ffffff !important;">
            <thead>
              <tr>
                <th style="padding: 12px; text-align: left; border: 2px solid #F2431E; background-color: #F2431E !important; background: #F2431E !important; color: #ffffff; font-weight: bold;">Produit</th>
                <th style="padding: 12px; text-align: right; border: 2px solid #F2431E; background-color: #F2431E !important; background: #F2431E !important; color: #ffffff; font-weight: bold;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${customProducts.map((product: { name: string; price: number }) => `
                <tr style="background-color: #ffffff !important; background: #ffffff !important;">
                  <td style="padding: 12px; border: 1px solid #F2431E; color: #000000; background-color: #ffffff !important; background: #ffffff !important;">${product.name}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #F2431E; color: #000000; background-color: #ffffff !important; background: #ffffff !important;">${product.price.toFixed(2)}€</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background-color: #ffffff !important; background: #ffffff !important;">
                <td style="padding: 12px; border: 2px solid #F2431E; color: #F2431E; background-color: #ffffff !important; background: #ffffff !important;">Total produits</td>
                <td style="padding: 12px; text-align: right; border: 2px solid #F2431E; color: #F2431E; background-color: #ffffff !important; background: #ffffff !important;">${productsTotal.toFixed(2)}€</td>
              </tr>
            </tbody>
          </table>
        </div>
      `
      : '';

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
              <h2 style="color: #F2431E; margin-top: 0; margin-bottom: 30px; font-size: 26px; text-align: center; font-weight: bold;">Récapitulatif de votre réservation</h2>
              
              <!-- Informations client -->
              <div style="background-color: #ffffff !important; background: #ffffff !important; padding: 25px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #F2431E; box-shadow: 0 2px 8px rgba(242, 67, 30, 0.1);">
                <h3 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #F2431E;">📋 Informations client</h3>
                <div style="line-height: 1.8;">
                  <p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Nom :</strong> <span style="color: #000000;">${customerName}</span></p>
                  <p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Email :</strong> <a href="mailto:${customerEmail}" style="color: #0066cc; text-decoration: none;">${customerEmail}</a></p>
                  <p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Adresse de l'événement :</strong> <span style="color: #000000;">${eventAddress}</span></p>
                  ${participants ? `<p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Nombre de participants :</strong> <span style="color: #000000;">${participants}</span></p>` : ''}
                </div>
              </div>

              <!-- Dates et heures -->
              <div style="background-color: #ffffff !important; background: #ffffff !important; padding: 25px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #F2431E; box-shadow: 0 2px 8px rgba(242, 67, 30, 0.1);">
                <h3 style="color: #F2431E; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #F2431E;">📅 Dates et heures</h3>
                <div style="line-height: 1.8;">
                  <p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Date de début :</strong> <span style="color: #000000;">${formatDate(startDate)} à ${formatTime(startTime)}</span></p>
                  <p style="margin: 10px 0; color: #000000;"><strong style="color: #F2431E; display: inline-block; min-width: 180px;">Date de fin :</strong> <span style="color: #000000;">${formatDate(endDate)} à ${formatTime(endTime)}</span></p>
                </div>
              </div>

              ${productsHtml}

              <!-- Caution -->
              <div style="background-color: #fff7ed !important; background: #fff7ed !important; padding: 25px; border-radius: 10px; border: 3px solid #F2431E; margin-top: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(242, 67, 30, 0.15);">
                <h3 style="color: #F2431E; margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: bold; padding-bottom: 10px; border-bottom: 2px solid #F2431E;">💰 Caution remboursable</h3>
                <div style="text-align: center; margin: 20px 0;">
                  <p style="font-size: 36px; font-weight: bold; margin: 0; color: #F2431E; letter-spacing: 1px;">${deposit.toFixed(2)}€</p>
                </div>
                <p style="margin-top: 15px; font-size: 14px; color: #000000; line-height: 1.7; text-align: center; background-color: #ffffff; padding: 15px; border-radius: 6px;">
                  Cette autorisation de caution sert à garantir votre location d'équipement sono et vidéo. 
                  Le montant n'est pas débité immédiatement, il reste simplement bloqué.
                </p>
                <div style="text-align: center; margin-top: 15px;">
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    🔒 Paiement 100% sécurisé par Stripe
                  </p>
                </div>
              </div>

              <!-- Bouton CTA -->
              <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
                <a href="${checkoutUrl}" 
                   style="display: inline-block; background-color: #F2431E; color: #ffffff; padding: 20px 50px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px rgba(242, 67, 30, 0.4); transition: all 0.3s ease;">
                  ${customProducts.length > 0 && productsTotal > 0 ? '💳 Payer les produits maintenant' : '💳 Payer la caution maintenant'}
                </a>
                <div style="margin-top: 15px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    🔒 Paiement sécurisé
                  </p>
                </div>
              </div>
              ${customProducts.length > 0 && productsTotal > 0 ? '<p style="text-align: center; color: #F2431E; font-size: 15px; margin-top: 20px; font-weight: 600; padding: 15px; background-color: #fff7ed; border-radius: 8px; border-left: 4px solid #F2431E;">ℹ️ Après le paiement des produits, vous serez redirigé vers le paiement de la caution.</p>' : ''}

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
                      <a href="tel:+33651084994" style="color: #0066cc; text-decoration: none;">06 51 08 49 94</a>
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
