import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      bookingType,
      packName,
      totalPrice,
      depositAmount,
      personalInfo,
      eventDetails,
      answers
    } = body;

    // Contenu de l'email selon le type de réservation
    let emailContent = '';
    let subject = '';

    if (bookingType === 'info') {
      subject = `Demande d'information - ${packName}`;
      emailContent = `
        <h2>Nouvelle demande d'information</h2>
        <p><strong>Pack demandé :</strong> ${packName}</p>
        <p><strong>Prix total :</strong> ${totalPrice}€</p>
        
        <h3>Informations personnelles :</h3>
        <p><strong>Nom :</strong> ${personalInfo.firstName} ${personalInfo.lastName}</p>
        <p><strong>Email :</strong> ${personalInfo.email}</p>
        <p><strong>Téléphone :</strong> ${personalInfo.phone}</p>
        
        <h3>Détails de l'événement :</h3>
        <p><strong>Date :</strong> ${eventDetails.date}</p>
        <p><strong>Horaire :</strong> ${eventDetails.time}</p>
        <p><strong>Code postal :</strong> ${eventDetails.postalCode}</p>
        ${eventDetails.address ? `<p><strong>Adresse :</strong> ${eventDetails.address}</p>` : ''}
        ${eventDetails.specialRequests ? `<p><strong>Demandes spéciales :</strong> ${eventDetails.specialRequests}</p>` : ''}
        
        <h3>Réponses du questionnaire :</h3>
        <p><strong>Type d'événement :</strong> ${answers.eventType}</p>
        <p><strong>Nombre d'invités :</strong> ${answers.guests}</p>
        <p><strong>Zone :</strong> ${answers.zone}</p>
        <p><strong>Environnement :</strong> ${answers.environment}</p>
        <p><strong>Besoins :</strong> ${answers.needs?.join(', ')}</p>
        ${answers.extras?.length > 0 ? `<p><strong>Options supplémentaires :</strong> ${answers.extras.join(', ')}</p>` : ''}
      `;
    } else {
      subject = `Réservation avec acompte - ${packName}`;
      emailContent = `
        <h2>Nouvelle réservation avec acompte</h2>
        <p><strong>Pack réservé :</strong> ${packName}</p>
        <p><strong>Prix total :</strong> ${totalPrice}€</p>
        <p><strong>Acompte (30%) :</strong> ${depositAmount}€</p>
        <p><strong>Solde restant :</strong> ${totalPrice - depositAmount}€</p>
        
        <h3>Informations personnelles :</h3>
        <p><strong>Nom :</strong> ${personalInfo.firstName} ${personalInfo.lastName}</p>
        <p><strong>Email :</strong> ${personalInfo.email}</p>
        <p><strong>Téléphone :</strong> ${personalInfo.phone}</p>
        
        <h3>Détails de l'événement :</h3>
        <p><strong>Date :</strong> ${eventDetails.date}</p>
        <p><strong>Horaire :</strong> ${eventDetails.time}</p>
        <p><strong>Code postal :</strong> ${eventDetails.postalCode}</p>
        ${eventDetails.address ? `<p><strong>Adresse :</strong> ${eventDetails.address}</p>` : ''}
        ${eventDetails.specialRequests ? `<p><strong>Demandes spéciales :</strong> ${eventDetails.specialRequests}</p>` : ''}
        
        <h3>Réponses du questionnaire :</h3>
        <p><strong>Type d'événement :</strong> ${answers.eventType}</p>
        <p><strong>Nombre d'invités :</strong> ${answers.guests}</p>
        <p><strong>Zone :</strong> ${answers.zone}</p>
        <p><strong>Environnement :</strong> ${answers.environment}</p>
        <p><strong>Besoins :</strong> ${answers.needs?.join(', ')}</p>
        ${answers.extras?.length > 0 ? `<p><strong>Options supplémentaires :</strong> ${answers.extras.join(', ')}</p>` : ''}
        
        <p><strong>⚠️ Action requise :</strong> Traiter le paiement Stripe et confirmer la réservation.</p>
      `;
    }

    // Envoyer l'email
    const { data, error } = await resend.emails.send({
      from: 'Assistant SND Rush <noreply@guylocationevents.com>',
      to: ['contact@guylocationevents.com'],
      subject: subject,
      html: emailContent,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Impossible d\'envoyer l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: bookingType === 'info' 
        ? 'Demande d\'information envoyée avec succès' 
        : 'Réservation avec acompte envoyée avec succès'
    });

  } catch (error) {
    console.error('Erreur API send-email:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
