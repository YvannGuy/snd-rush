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
        <title>${documentType} SND Rush</title>
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
          <h1>🎵 SND Rush - ${documentType} personnalisé${isInvoice ? '' : 'e'}</h1>
        </div>
        
        <div class="content">
          <p>Bonjour ${quoteData.client.firstName} ${quoteData.client.lastName},</p>
          
          ${isInvoice 
            ? `<p>Merci pour votre confiance ! Veuillez trouver votre facture en pièce jointe.</p>
               <p>Montant total : <strong>${quoteData.quote.total} €</strong></p>
               <p>La facture est en pièce jointe.</p>` 
            : `<p>Veuillez trouver ci-joint votre devis personnalisé.</p>
               <p>Merci de nous renvoyer le devis signé pour valider votre commande.</p>
               <p>Le devis est en pièce jointe.</p>`
          }
          
          <p>Merci pour votre confiance !<br/>
          <strong>L'équipe SND Rush</strong></p>
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
    const teamEmail = await resend.emails.send({
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
