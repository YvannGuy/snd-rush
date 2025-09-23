import nodemailer from 'nodemailer';

interface ReservationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  eventDate: string;
  eventTime: string;
  guestCount: string;
  eventType: string;
  specialRequests: string;
  selectedPack: {
    name: string;
    price: string;
    tagline?: string;
  };
}

export async function sendReservationEmails(formData: ReservationData) {
  try {
    // Configuration du transporteur Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Génération du numéro de commande
    const orderNumber = `SND${Math.floor(Math.random() * 10000)}`;

    // Email pour l'entreprise
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `Nouvelle réservation - ${formData.selectedPack?.name || 'Pack non spécifié'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F2431E; border-bottom: 2px solid #F2431E; padding-bottom: 10px;">
            Nouvelle demande de réservation
          </h2>
          <p><strong>Numéro de commande:</strong> <span style="color: #F2431E;">${orderNumber}</span></p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informations client</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Nom:</strong> ${formData.firstName} ${formData.lastName}</li>
              <li style="margin: 8px 0;"><strong>Email:</strong> ${formData.email}</li>
              <li style="margin: 8px 0;"><strong>Téléphone:</strong> ${formData.phone}</li>
              <li style="margin: 8px 0;"><strong>Adresse:</strong> ${formData.address}</li>
              <li style="margin: 8px 0;"><strong>Ville:</strong> ${formData.city} ${formData.postalCode}</li>
            </ul>
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Détails de l'événement</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Type:</strong> ${formData.eventType}</li>
              <li style="margin: 8px 0;"><strong>Date:</strong> ${formData.eventDate}</li>
              <li style="margin: 8px 0;"><strong>Heure:</strong> ${formData.eventTime}</li>
              <li style="margin: 8px 0;"><strong>Nombre d'invités:</strong> ${formData.guestCount}</li>
              <li style="margin: 8px 0;"><strong>Demandes spéciales:</strong> ${formData.specialRequests || 'Aucune'}</li>
            </ul>
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Pack sélectionné</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Pack:</strong> ${formData.selectedPack?.name || 'Non spécifié'}</li>
              <li style="margin: 8px 0;"><strong>Prix:</strong> <span style="color: #F2431E; font-weight: bold;">${formData.selectedPack?.price || 'Non spécifié'}</span></li>
            </ul>
          </div>
        </div>
      `,
    };

    // Email de confirmation pour le client
    const clientMailOptions = {
      from: process.env.EMAIL_USER,
      to: formData.email,
      subject: `Confirmation de votre demande de réservation - ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F2431E; border-bottom: 2px solid #F2431E; padding-bottom: 10px;">
            Merci pour votre demande de réservation !
          </h2>
          <p>Bonjour <strong>${formData.firstName}</strong>,</p>
          <p>Nous avons bien reçu votre demande de réservation. Nous vous contacterons dans les plus brefs délais pour confirmer votre réservation.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Récapitulatif de votre demande</h3>
            <p><strong>Numéro de commande:</strong> <span style="color: #F2431E;">${orderNumber}</span></p>
            <p><strong>Pack sélectionné:</strong> ${formData.selectedPack?.name || 'Non spécifié'}</p>
            <p><strong>Prix:</strong> <span style="color: #F2431E; font-weight: bold;">${formData.selectedPack?.price || 'Non spécifié'}</span></p>
          </div>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Détails de votre événement</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 8px 0;"><strong>Type:</strong> ${formData.eventType}</li>
              <li style="margin: 8px 0;"><strong>Date:</strong> ${formData.eventDate}</li>
              <li style="margin: 8px 0;"><strong>Heure:</strong> ${formData.eventTime}</li>
              <li style="margin: 8px 0;"><strong>Lieu:</strong> ${formData.address}, ${formData.city} ${formData.postalCode}</li>
              <li style="margin: 8px 0;"><strong>Nombre d'invités:</strong> ${formData.guestCount}</li>
            </ul>
          </div>

          <div style="background: #F2431E; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Besoin d'aide ?</strong></p>
            <p style="margin: 5px 0 0 0;">N'hésitez pas à nous contacter au <strong>06 51 08 49 94</strong></p>
          </div>
          
          <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe SONO-DRIVER</strong></p>
        </div>
      `,
    };

    // Envoi des emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(clientMailOptions);

    return { success: true, orderNumber };

  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    return { success: false, error: error };
  }
} 