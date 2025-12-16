import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { quoteData, pdfBase64 } = await request.json();
    
    if (!quoteData || !pdfBase64) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const isInvoice = quoteData.documentType === 'facture';
    const documentType = isInvoice ? 'Facture' : 'Devis';
    const documentTypeLC = isInvoice ? 'facture' : 'devis';

    // Générer un ID unique pour le document
    const quoteId = `SND-${Date.now()}`;
    
    // Créer le lien de signature (uniquement pour les devis)
    const signatureUrl = !isInvoice 
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sndrush.com'}/sign-quote?quoteId=${quoteId}&email=${encodeURIComponent(quoteData.client.email)}`
      : '';
    
    // Template email pour le client (adapté selon le type de document)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentType} SND Rush</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #e27431 0%, #f2431e 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            position: relative;
          }
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .logo {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 24px;
            color: #e27431;
            font-weight: bold;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .tagline {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 5px;
          }
          .content { 
            padding: 40px 30px; 
            background-color: #ffffff;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 25px;
            color: #2c3e50;
          }
          .document-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 4px solid #e27431;
          }
          .amount-highlight {
            background: #e27431;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
          }
          .action-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            text-align: center;
            border: 2px solid #e9ecef;
          }
          .action-title {
            color: #e27431;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .signature-note {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            border: 1px solid #c3e6c3;
          }
          .signature-note strong {
            color: #2d5a2d;
          }
          .footer { 
            background: #2c3e50; 
            color: white;
            padding: 30px 20px; 
            text-align: center; 
            font-size: 14px;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #e27431;
          }
          .contact-info {
            margin: 15px 0;
            line-height: 1.8;
          }
          .contact-info a {
            color: #e27431;
            text-decoration: none;
          }
          .social-links {
            margin-top: 20px;
          }
          .social-links a {
            color: #e27431;
            text-decoration: none;
            margin: 0 10px;
            font-weight: bold;
          }
          .urgency-badge {
            background: #ff6b6b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
          }
          @media (max-width: 600px) {
            .email-container { margin: 0; }
            .content { padding: 20px 15px; }
            .header { padding: 20px 15px; }
            .company-name { font-size: 24px; }
            .amount-highlight { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-section">
              <div class="logo">🎵</div>
              <div>
                <h1 class="company-name">SND Rush</h1>
                <div class="tagline">Votre solution sonore de dernière minute</div>
              </div>
            </div>
            ${quoteData.urgent ? '<div class="urgency-badge">⚡ URGENCE</div>' : ''}
          </div>
          
          <div class="content">
            <div class="greeting">
              Bonjour <strong>${quoteData.client.firstName} ${quoteData.client.lastName}</strong>,
            </div>
            
            <div class="document-info">
              <h2 style="color: #e27431; margin-bottom: 15px; font-size: 22px;">
                ${isInvoice ? '📄 Votre facture est prête' : '📋 Votre devis personnalisé'}
              </h2>
              
              ${isInvoice 
                ? `<p style="margin-bottom: 15px;">Merci pour votre confiance ! Votre facture est en pièce jointe.</p>
                   <div class="amount-highlight">${quoteData.quote.total} €</div>
                   <p style="text-align: center; color: #666; font-size: 14px;">Montant total de la facture</p>` 
                : `<p style="margin-bottom: 15px;">Veuillez trouver ci-joint votre devis personnalisé pour votre événement.</p>
                   <div class="amount-highlight">${quoteData.quote.total} €</div>
                   <p style="text-align: center; color: #666; font-size: 14px;">Montant total du devis</p>`
              }
            </div>
            
            ${!isInvoice ? `
            <div class="signature-note">
              <div class="action-title">📝 Action requise</div>
              <p><strong>Merci de nous renvoyer le devis signé</strong> pour valider votre commande.</p>
              <p style="margin-top: 10px; font-size: 14px; color: #666;">
                Vous pouvez imprimer le PDF, le signer, puis nous le renvoyer par email.
              </p>
            </div>
            ` : `
            <div class="action-section">
              <div class="action-title">💳 Paiement</div>
              <p><strong>Échéance :</strong> 7 jours à compter de la date d'émission</p>
              <p style="margin-top: 10px; font-size: 14px; color: #666;">
                En cas de retard, des pénalités pourront s'appliquer.
              </p>
            </div>
            `}
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
              <p style="margin-bottom: 10px; font-size: 16px; color: #2c3e50;">
                <strong>Merci pour votre confiance !</strong>
              </p>
              <p style="color: #666; font-size: 14px;">
                L'équipe SND Rush<br/>
                <em>Votre partenaire sonore de confiance</em>
              </p>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">🎵 SND Rush</div>
            <div class="contact-info">
              <strong>Location Sono & Événementiel Paris</strong><br/>
              📧 <a href="mailto:contact@guylocationevents.com">contact@guylocationevents.com</a><br/>
              📞 <a href="tel:0651084994">06 51 08 49 94</a><br/>
              🌐 <a href="https://www.sndrush.com">www.sndrush.com</a>
            </div>
            <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
              <strong>🚀 Service Express 24/7</strong><br/>
              <span style="font-size: 13px; opacity: 0.9;">Livraison incluse, installation disponible • Urgence garantie</span>
            </div>
            <div class="social-links">
              <a href="https://www.sndrush.com">Site Web</a> • 
              <a href="mailto:contact@guylocationevents.com">Contact</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email au client
    await resend.emails.send({
      from: 'SND Rush <devisclients@guylocationevents.com>',
      to: [quoteData.client.email],
      subject: isInvoice 
        ? `🎵 Facture SND Rush - ${quoteData.quote.total}€`
        : `🎵 Devis SND Rush - ${quoteData.quote.total}€ - Signature requise`,
      html: emailHtml,
      attachments: [
        {
          filename: `${documentTypeLC}-snd-rush-${quoteData.client.lastName}.pdf`,
          content: pdfBase64.split(',')[1], // Retirer le préfixe data:application/pdf;base64,
        }
      ]
    });

    // Envoyer une notification à l'équipe SND Rush
    await resend.emails.send({
      from: 'SND Rush <noreply@sndrush.com>',
      to: ['contact@guylocationevents.com'],
      subject: `📧 Nouvea${isInvoice ? 'lle' : 'u'} ${documentTypeLC} envoyé${isInvoice ? 'e' : ''} - ${quoteData.client.firstName} ${quoteData.client.lastName}`,
      html: `
        <h2>Nouvea${isInvoice ? 'lle' : 'u'} ${documentTypeLC} envoyé${isInvoice ? 'e' : ''}</h2>
        <p><strong>Client :</strong> ${quoteData.client.firstName} ${quoteData.client.lastName}</p>
        <p><strong>Entreprise :</strong> ${quoteData.client.company || 'Non renseignée'}</p>
        <p><strong>Email :</strong> ${quoteData.client.email}</p>
        <p><strong>Téléphone :</strong> ${quoteData.client.phone || 'Non renseigné'}</p>
        <p><strong>Total :</strong> ${quoteData.quote.total} €</p>
        ${!isInvoice ? `<p><strong>Caution :</strong> ${quoteData.quote.caution} €</p>` : ''}
        <p><strong>ID ${documentType} :</strong> ${quoteId}</p>
        ${!isInvoice ? `<p><em>Le client doit renvoyer le devis signé pour validation</em></p>` : ''}
      `
    });

    return NextResponse.json({ 
      success: true, 
      quoteId,
      signatureUrl: signatureUrl || undefined,
      message: `${documentType} envoyé${isInvoice ? 'e' : ''} avec succès` 
    });

  } catch (error) {
    console.error('Erreur envoi document:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi du document' 
    }, { status: 500 });
  }
}
