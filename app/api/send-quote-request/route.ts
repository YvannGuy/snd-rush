import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  // Vérifier les variables d'environnement
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante dans les variables d\'environnement');
    return NextResponse.json(
      { error: 'Erreur de configuration : RESEND_API_KEY manquante' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.json();
    
    if (!formData || !formData.contactInfo || !formData.contactInfo.email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Formatage des données pour l'email
    const urgencyText = formData.urgency === 'yes' ? 'Oui (24h)' : 'Non';
    const venueTypeText = formData.venueType === 'indoor' ? 'Intérieur' : 'Extérieur';
    const additionalEquipmentText = formData.additionalEquipment && formData.additionalEquipment.length > 0
      ? formData.additionalEquipment.join(', ')
      : 'Aucun';

    // Template email pour l'équipe
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle demande de devis - SND Rush</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #e27431 0%, #f2431e 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .urgency-badge {
            background: #ff6b6b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
          }
          .content { 
            padding: 40px 30px; 
            background-color: #ffffff;
          }
          .section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #e27431;
          }
          .section-title {
            color: #e27431;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .info-row {
            display: flex;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            color: #495057;
            width: 200px;
            flex-shrink: 0;
          }
          .info-value {
            color: #212529;
            flex: 1;
          }
          .contact-section {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 2px solid #c3e6c3;
          }
          .contact-section h3 {
            color: #2d5a2d;
            margin-bottom: 15px;
          }
          .footer { 
            background: #2c3e50; 
            color: white;
            padding: 20px; 
            text-align: center; 
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .email-container { margin: 0; }
            .content { padding: 20px 15px; }
            .info-row { flex-direction: column; }
            .info-label { width: 100%; margin-bottom: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎵 Nouvelle demande de devis</h1>
            ${formData.urgency === 'yes' ? '<div class="urgency-badge">⚡ URGENCE - 24H</div>' : ''}
          </div>
          
          <div class="content">
            <!-- Informations sur l'événement -->
            <div class="section">
              <div class="section-title">
                📅 Informations sur l'événement
              </div>
              <div class="info-row">
                <div class="info-label">Type d'événement :</div>
                <div class="info-value">${formData.eventType || 'Non renseigné'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Date :</div>
                <div class="info-value">${formData.date || 'Non renseignée'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Horaire :</div>
                <div class="info-value">${formData.time || 'Non renseigné'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Lieu :</div>
                <div class="info-value">${formData.location || 'Non renseigné'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Nombre de personnes :</div>
                <div class="info-value">${formData.numberOfPeople || 'Non renseigné'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Type de lieu :</div>
                <div class="info-value">${venueTypeText}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Urgence :</div>
                <div class="info-value">${urgencyText}</div>
              </div>
            </div>

            <!-- Pack et équipements -->
            <div class="section">
              <div class="section-title">
                🎧 Pack et équipements
              </div>
              <div class="info-row">
                <div class="info-label">Pack préféré :</div>
                <div class="info-value">${formData.packPreference || 'Non spécifié'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Équipements supplémentaires :</div>
                <div class="info-value">${additionalEquipmentText}</div>
              </div>
              ${formData.specialRequirements ? `
              <div class="info-row">
                <div class="info-label">Besoins spécifiques :</div>
                <div class="info-value">${formData.specialRequirements}</div>
              </div>
              ` : ''}
            </div>

            <!-- Coordonnées du client -->
            <div class="contact-section">
              <h3>👤 Coordonnées du client</h3>
              <div class="info-row">
                <div class="info-label">Nom complet :</div>
                <div class="info-value">${formData.contactInfo.firstName} ${formData.contactInfo.lastName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email :</div>
                <div class="info-value">
                  <a href="mailto:${formData.contactInfo.email}" style="color: #e27431; text-decoration: none;">
                    ${formData.contactInfo.email}
                  </a>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Téléphone :</div>
                <div class="info-value">
                  <a href="tel:${formData.contactInfo.phone}" style="color: #e27431; text-decoration: none;">
                    ${formData.contactInfo.phone}
                  </a>
                </div>
              </div>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; text-align: center; border: 2px solid #ffc107;">
              <p style="color: #856404; font-weight: bold; margin: 0;">
                ⚠️ Action requise : Veuillez répondre au client dans les plus brefs délais
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>SND Rush</strong> - Location Sono & Événementiel Paris</p>
            <p style="margin-top: 10px; opacity: 0.9;">
              📧 contact@guylocationevents.com | 📞 06 51 08 49 94
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email à l'équipe (AVANT l'email client pour détecter les erreurs)
    // Utiliser devisclients@guylocationevents.com qui est déjà vérifié et fonctionne pour les emails clients
    let teamEmailSent = false;
    try {
      const teamEmailResult = await resend.emails.send({
        from: 'SND Rush <devisclients@guylocationevents.com>',
        to: ['contact@guylocationevents.com'],
        replyTo: formData.contactInfo.email,
        subject: `🎵 Nouvelle demande de devis${formData.urgency === 'yes' ? ' - URGENCE' : ''} - ${formData.contactInfo.firstName} ${formData.contactInfo.lastName}`,
        html: teamEmailHtml
      });
      console.log('✅ Email équipe envoyé avec succès:', JSON.stringify(teamEmailResult, null, 2));
      teamEmailSent = true;
    } catch (teamError: any) {
      console.error('❌ ERREUR envoi email équipe:', teamError);
      console.error('Type erreur:', typeof teamError);
      console.error('Message erreur:', teamError?.message);
      console.error('Code erreur:', teamError?.code);
      console.error('Détails complets:', JSON.stringify(teamError, Object.getOwnPropertyNames(teamError), 2));
      // Ne pas bloquer l'envoi de la confirmation au client
      // mais loguer l'erreur pour diagnostic
      teamEmailSent = false;
    }

    // Email de confirmation au client
    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande de devis reçue - SND Rush</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #e27431 0%, #f2431e 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 40px 30px; 
            background-color: #ffffff;
          }
          .success-message {
            background: #d4edda;
            border: 2px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .next-steps {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { 
            background: #2c3e50; 
            color: white;
            padding: 20px; 
            text-align: center; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎵 Demande de devis reçue !</h1>
          </div>
          
          <div class="content">
            <div class="success-message">
              <h2 style="margin: 0 0 10px 0;">✅ Merci pour votre demande !</h2>
              <p style="margin: 0;">Nous avons bien reçu votre demande de devis personnalisé.</p>
            </div>

            <p>Bonjour <strong>${formData.contactInfo.firstName}</strong>,</p>
            
            <p>Nous avons bien reçu votre demande de devis pour votre événement prévu le <strong>${formData.date}</strong> à <strong>${formData.time}</strong>.</p>

            <div class="next-steps">
              <h3 style="color: #856404; margin-top: 0;">📋 Prochaines étapes</h3>
              <p style="color: #856404; margin-bottom: 10px;">
                Notre équipe va examiner votre demande et vous enverra un devis personnalisé dans les plus brefs délais.
              </p>
              ${formData.urgency === 'yes' ? `
              <p style="color: #856404; margin: 0; font-weight: bold;">
                ⚡ Votre demande est marquée comme urgente. Nous vous répondrons en priorité !
              </p>
              ` : `
              <p style="color: #856404; margin: 0;">
                <strong>Délai de réponse :</strong> En moins de 30 minutes (Île-de-France)
              </p>
              `}
            </div>

            <p style="margin-top: 30px;">
              En cas de question urgente, n'hésitez pas à nous appeler directement au 
              <a href="tel:+33651084994" style="color: #e27431; text-decoration: none; font-weight: bold;">
                06 51 08 49 94
              </a>
            </p>

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Cordialement,<br/>
              <strong>L'équipe SND Rush</strong><br/>
              <em>Votre partenaire sonore de confiance</em>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>SND Rush</strong> - Location Sono & Événementiel Paris</p>
            <p style="margin-top: 10px; opacity: 0.9;">
              📧 contact@guylocationevents.com | 📞 06 51 08 49 94<br/>
              🌐 www.sndrush.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email de confirmation au client
    let clientEmailSent = false;
    try {
      const clientEmailResult = await resend.emails.send({
        from: 'SND Rush <devisclients@guylocationevents.com>',
        to: [formData.contactInfo.email],
        subject: '🎵 Demande de devis reçue - SND Rush',
        html: clientEmailHtml
      });
      console.log('✅ Email client envoyé:', clientEmailResult);
      clientEmailSent = true;
    } catch (clientError: any) {
      console.error('❌ Erreur envoi email client:', clientError);
      // Ne pas bloquer la réponse si l'email client échoue
      // L'utilisateur sera informé via le warning
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis envoyée avec succès',
      teamEmailSent: teamEmailSent,
      clientEmailSent: clientEmailSent,
      ...(teamEmailSent && clientEmailSent ? {} : { 
        warning: !teamEmailSent && !clientEmailSent
          ? 'Les emails n\'ont pas pu être envoyés, mais votre demande a été enregistrée'
          : !teamEmailSent
          ? 'L\'email à l\'équipe n\'a pas pu être envoyé, mais la confirmation client a été envoyée'
          : 'L\'email de confirmation client n\'a pas pu être envoyé, mais votre demande a été transmise à l\'équipe'
      })
    });

  } catch (error: any) {
    console.error('❌ Erreur envoi demande de devis:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de la demande de devis',
      message: error.message || 'Erreur inconnue',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

