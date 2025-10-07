import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { quoteData, pdfBase64 } = await request.json();
    
    if (!quoteData || !pdfBase64) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Générer un ID unique pour le devis
    const quoteId = `SND-${Date.now()}`;
    
    // Créer le lien de signature
    const signatureUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sndrush.com'}/sign-quote?quoteId=${quoteId}&email=${encodeURIComponent(quoteData.client.email)}`;
    
    // Template email pour le client
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Devis SND Rush</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #e27431; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .quote-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .signature-section { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .signature-btn { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            margin: 10px 0;
          }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎵 SND Rush - Devis personnalisé</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${quoteData.client.firstName} ${quoteData.client.lastName},</p>
          
          <p>Merci pour votre demande ! Nous avons préparé votre devis personnalisé pour votre événement sonore.</p>
          
          <div class="quote-info">
            <h3>📋 Résumé du devis</h3>
            <p><strong>Total TTC :</strong> ${quoteData.quote.total} €</p>
            <p><strong>Caution :</strong> ${quoteData.quote.caution} €</p>
            <p><strong>Durée :</strong> ${quoteData.quote.duration} jour(s)</p>
            <p><strong>Date :</strong> ${quoteData.quote.date || 'À définir'}</p>
          </div>
          
          <div class="signature-section">
            <h3>✍️ Signature électronique requise</h3>
            <p>Pour valider ce devis, veuillez le signer électroniquement en cliquant sur le bouton ci-dessous :</p>
            <a href="${signatureUrl}" class="signature-btn">
              ✍️ Signer le devis
            </a>
            <p style="font-size: 12px; margin-top: 10px;">
              <em>Ce lien est personnel et sécurisé. Il expire dans 7 jours.</em>
            </p>
          </div>
          
          <p>Le devis détaillé est en pièce jointe de cet email.</p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter :</p>
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
          <p>Urgence 24/7 • Livraison & Installation incluses</p>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email au client
    const clientEmail = await resend.emails.send({
      from: 'SND Rush <devis@sndrush.com>',
      to: [quoteData.client.email],
      subject: `🎵 Devis SND Rush - ${quoteData.quote.total}€ - Signature requise`,
      html: emailHtml,
      attachments: [
        {
          filename: `devis-snd-rush-${quoteData.client.lastName}.pdf`,
          content: pdfBase64.split(',')[1], // Retirer le préfixe data:application/pdf;base64,
        }
      ]
    });

    // Envoyer une notification à l'équipe SND Rush
    const teamEmail = await resend.emails.send({
      from: 'SND Rush <noreply@sndrush.com>',
      to: ['contact@sndrush.com'], // Remplacer par votre email
      subject: `📧 Nouveau devis envoyé - ${quoteData.client.firstName} ${quoteData.client.lastName}`,
      html: `
        <h2>Nouveau devis envoyé</h2>
        <p><strong>Client :</strong> ${quoteData.client.firstName} ${quoteData.client.lastName}</p>
        <p><strong>Entreprise :</strong> ${quoteData.client.company || 'Non renseignée'}</p>
        <p><strong>Email :</strong> ${quoteData.client.email}</p>
        <p><strong>Téléphone :</strong> ${quoteData.client.phone || 'Non renseigné'}</p>
        <p><strong>Total :</strong> ${quoteData.quote.total} €</p>
        <p><strong>Caution :</strong> ${quoteData.quote.caution} €</p>
        <p><strong>ID Devis :</strong> ${quoteId}</p>
        <p><strong>Lien de signature :</strong> <a href="${signatureUrl}">${signatureUrl}</a></p>
      `
    });

    return NextResponse.json({ 
      success: true, 
      quoteId,
      signatureUrl,
      message: 'Devis envoyé avec succès' 
    });

  } catch (error) {
    console.error('Erreur envoi devis:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi du devis' 
    }, { status: 500 });
  }
}
