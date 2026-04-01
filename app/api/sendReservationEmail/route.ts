import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkContactRateLimit, getClientIp } from '@/lib/ratelimit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { success: rateLimitOk } = await checkContactRateLimit(getClientIp(req));
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Trop de requêtes, merci de patienter.' }, { status: 429 });
  }

  // Vérifier les variables d'environnement
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY manquante dans les variables d\'environnement');
    return NextResponse.json(
      { message: "Erreur de configuration : RESEND_API_KEY manquante", error: "Configuration manquante" },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_FROM) {
    console.error('❌ RESEND_FROM manquante dans les variables d\'environnement');
    return NextResponse.json(
      { message: "Erreur de configuration : RESEND_FROM manquante", error: "Configuration manquante" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    address, 
    city, 
    postalCode, 
    eventDate, 
    eventTime, 
    guestCount, 
    eventType, 
    specialRequests, 
    reservationType, 
    deliveryType,
    selectedPack,
    notificationType = 'reservation', // 'reservation', 'deposit_intent'
    requestNumber
  } = body;

  try {
    const subject = notificationType === 'deposit_intent' 
      ? `Intention de paiement d'acompte - ${firstName} ${lastName}`
      : "Nouvelle demande de réservation SND Rush";

    const htmlContent = notificationType === 'deposit_intent' 
      ? `
        <h2>💳 Intention de paiement d'acompte - SND Rush</h2>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0;">⚠️ Client en cours de paiement d'acompte</h3>
          <p style="margin: 10px 0 0 0; color: #92400e;"><strong>Numéro de demande :</strong> ${requestNumber || 'Non généré'}</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Pack :</strong> ${selectedPack?.name}</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Montant de l'acompte :</strong> ${Math.round(parseInt(selectedPack?.price?.match(/(\d+)/)?.[1] || '0') * 0.3)}€</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Prix total :</strong> ${selectedPack?.price}</p>
        </div>
        
        <h3>📋 Informations personnelles</h3>
        <p><strong>Prénom :</strong> ${firstName}</p>
        <p><strong>Nom :</strong> ${lastName}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        
        <h3>🎉 Détails de l'événement</h3>
        <p><strong>Type d'événement :</strong> ${eventType}</p>
        <p><strong>Date :</strong> ${eventDate}</p>
        <p><strong>Heure :</strong> ${eventTime}</p>
        <p><strong>Nombre d'invités :</strong> ${guestCount}</p>
        
        <h3>📍 Adresse de l'événement</h3>
        <p><strong>Adresse :</strong> ${address}</p>
        <p><strong>Ville :</strong> ${city}</p>
        <p><strong>Code postal :</strong> ${postalCode}</p>
        
        <h3>💳 Type de réservation</h3>
        <p><strong>Type :</strong> Réservation avec acompte (30%)</p>
        
        <h3>🚚 Mode de récupération</h3>
        <p><strong>Mode :</strong> ${deliveryType === 'livraison' ? 'Livraison à l\'adresse' : 'Récupération sur place'}</p>
        
        <h3>💬 Demandes spéciales</h3>
        <p><strong>Message :</strong><br/>${specialRequests || 'Aucune demande spéciale'}</p>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #166534; margin: 0;">🎯 Action requise</h4>
          <p style="margin: 10px 0 0 0; color: #166534;">Le client est en train de procéder au paiement de l'acompte via Stripe. Surveillez votre tableau de bord Stripe pour confirmer le paiement.</p>
        </div>
      `
      : `
        <h2>Nouvelle demande de réservation SND Rush</h2>
        
        <h3>📋 Informations personnelles</h3>
        <p><strong>Prénom :</strong> ${firstName}</p>
        <p><strong>Nom :</strong> ${lastName}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        
        <h3>🎉 Détails de l'événement</h3>
        <p><strong>Type d'événement :</strong> ${eventType}</p>
        <p><strong>Date :</strong> ${eventDate}</p>
        <p><strong>Heure :</strong> ${eventTime}</p>
        <p><strong>Nombre d'invités :</strong> ${guestCount}</p>
        
        <h3>📍 Adresse de l'événement</h3>
        <p><strong>Adresse :</strong> ${address}</p>
        <p><strong>Ville :</strong> ${city}</p>
        <p><strong>Code postal :</strong> ${postalCode}</p>
        
        <h3>📦 Pack sélectionné</h3>
        <p><strong>Pack :</strong> ${selectedPack?.name || 'Non spécifié'}</p>
        <p><strong>Prix :</strong> ${selectedPack?.price || 'Non spécifié'}</p>
        
        <h3>💳 Type de réservation</h3>
        <p><strong>Type :</strong> ${reservationType === 'acompte' ? 'Réservation avec acompte (30%)' : 'Réservation simple'}</p>
        
        <h3>🚚 Mode de récupération</h3>
        <p><strong>Mode :</strong> ${deliveryType === 'livraison' ? 'Livraison à l\'adresse' : 'Récupération sur place'}</p>
        
        <h3>💬 Demandes spéciales</h3>
        <p><strong>Message :</strong><br/>${specialRequests || 'Aucune demande spéciale'}</p>
      `;

    const recipientEmail = process.env.RESEND_TO || process.env.RESEND_FROM;
    
    if (!recipientEmail) {
      throw new Error('Aucune adresse email de destination configurée');
    }

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      replyTo: email,
    });

    console.log('✅ Email de réservation envoyé avec succès:', data);
    return NextResponse.json({ message: "Message envoyé avec succès.", data }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Erreur Resend lors de l'envoi de l'email de réservation:", error);
    const errorMessage = error.message || 'Erreur inconnue lors de l\'envoi de l\'email';
    const errorDetails = error.response?.body || error;
    
    return NextResponse.json(
      { 
        message: "Erreur lors de l'envoi du message.", 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
