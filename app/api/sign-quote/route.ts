import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkContactRateLimit, getClientIp } from '@/lib/ratelimit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request as unknown as Request);
  const { success } = await checkContactRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, { status: 429 });
  }

  try {
    const { quoteId, email, signature, signedAt } = await request.json();
    
    if (!quoteId || !email || !signature) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Envoyer email de confirmation au client
    const clientConfirmation = await resend.emails.send({
      from: 'SND Rush <confirmation@sndrush.com>',
      to: [email],
      subject: '✅ Devis signé - Confirmation SND Rush',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Devis signé - SND Rush</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .signature-info { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0; }
            .next-steps { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Devis signé avec succès !</h1>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Nous avons bien reçu votre signature pour le devis <strong>${quoteId}</strong>.</p>
            
            <div class="signature-info">
              <h3>📝 Détails de la signature</h3>
              <p><strong>Signé par :</strong> ${signature}</p>
              <p><strong>Date de signature :</strong> ${new Date(signedAt).toLocaleString('fr-FR')}</p>
              <p><strong>ID du devis :</strong> ${quoteId}</p>
            </div>
            
            <div class="next-steps">
              <h3>🚀 Prochaines étapes</h3>
              <ol>
                <li>Notre équipe va examiner votre devis signé</li>
                <li>Nous vous contacterons dans les 24h pour finaliser la réservation</li>
                <li>Un acompte pourra être demandé pour confirmer la réservation</li>
                <li>Nous organiserons la livraison et l'installation</li>
              </ol>
            </div>
            
            <p><strong>Contact :</strong></p>
            <ul>
              <li>📞 Téléphone : 01 23 45 67 89</li>
              <li>📧 Email : contact@sndrush.com</li>
              <li>🌐 Site : www.sndrush.com</li>
            </ul>
            
            <p>Merci pour votre confiance !</p>
            <p><strong>L'équipe SND Rush</strong></p>
          </div>
          
          <div class="footer">
            <p>SND Rush - Location Sono & Événementiel Paris</p>
            <p>Urgence 24/7 • Livraison incluse, installation disponible</p>
          </div>
        </body>
        </html>
      `
    });

    // Envoyer notification à l'équipe SND Rush
    const teamNotification = await resend.emails.send({
      from: 'SND Rush <noreply@sndrush.com>',
      to: ['contact@sndrush.com'], // Remplacer par votre email
      subject: `✅ Devis signé - ${quoteId} - Action requise`,
      html: `
        <h2>🎉 Nouveau devis signé !</h2>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>📋 Informations du devis</h3>
          <p><strong>ID Devis :</strong> ${quoteId}</p>
          <p><strong>Client :</strong> ${email}</p>
          <p><strong>Signature :</strong> ${signature}</p>
          <p><strong>Date de signature :</strong> ${new Date(signedAt).toLocaleString('fr-FR')}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>🚨 Action requise</h3>
          <p>Le client a signé le devis. Vous devez maintenant :</p>
          <ol>
            <li>Contacter le client dans les 24h</li>
            <li>Finaliser la réservation</li>
            <li>Demander l'acompte si nécessaire</li>
            <li>Planifier la livraison et l'installation</li>
          </ol>
        </div>
        
        <p><strong>Contact client :</strong> ${email}</p>
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Devis signé avec succès',
      quoteId,
      signedAt
    });

  } catch (error) {
    console.error('Erreur signature devis:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la signature' 
    }, { status: 500 });
  }
}

