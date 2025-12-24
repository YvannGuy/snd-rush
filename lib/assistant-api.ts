// Services API pour l'assistant SoundRush Paris

import { ReservationPayload } from '@/types/assistant';

/**
 * Envoie une demande d'information (sans acompte)
 */
export async function sendInfoRequest(payload: ReservationPayload): Promise<void> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'info_request',
        ...payload,
        message: generateInfoMessage(payload),
      }),
    });

    if (!response.ok) {
      console.error('Erreur Resend:', response.status, response.statusText);
      throw new Error('Impossible d\'envoyer votre demande');
    }
  } catch (error) {
    console.error('Erreur sendInfoRequest:', error);
    throw error;
  }
}

/**
 * Crée une session de paiement Stripe pour l'acompte
 */
export async function createStripeSession(payload: ReservationPayload): Promise<string> {
  try {
    const response = await fetch('/api/create-stripe-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: payload.depositAmount,
        packName: payload.packName,
        customerEmail: payload.personalInfo.email,
        customerName: `${payload.personalInfo.firstName} ${payload.personalInfo.lastName}`,
      }),
    });

    if (!response.ok) {
      console.error('Erreur Stripe:', response.status, response.statusText);
      throw new Error('Paiement indisponible pour le moment');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Erreur createStripeSession:', error);
    throw error;
  }
}

/**
 * Traite une réservation complète (info + paiement si nécessaire)
 */
export async function processReservation(payload: ReservationPayload): Promise<void> {
  try {
    if (payload.bookingType === 'info') {
      // Demande d'information - envoi email uniquement
      await sendInfoRequest(payload);
    } else if (payload.bookingType === 'deposit') {
      // Réservation avec acompte - email + Stripe
      
      // 1. Notifier en interne
      const mailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'reservation_notification',
          ...payload,
          message: generateReservationMessage(payload),
        }),
      });

      if (!mailResponse.ok) {
        console.error('Erreur notification interne:', mailResponse.status);
        throw new Error('Impossible d\'envoyer la notification');
      }

      // 2. Créer session Stripe
      const stripeUrl = await createStripeSession(payload);
      window.location.href = stripeUrl;
    }
  } catch (error) {
    console.error('Erreur processReservation:', error);
    throw error;
  }
}

/**
 * Génère le message pour une demande d'information
 */
function generateInfoMessage(payload: ReservationPayload): string {
  const { personalInfo, eventDetails, packName, totalPrice } = payload;
  
  return `
Nouvelle demande d'information - Assistant SoundRush Paris

Informations client :
- Nom : ${personalInfo.firstName} ${personalInfo.lastName}
- Email : ${personalInfo.email}
- Téléphone : ${personalInfo.phone}

Détails de l'événement :
- Date de début : ${eventDetails.startDate}
- Date de fin : ${eventDetails.endDate}
- Horaire de début : ${eventDetails.startTime}
- Horaire de fin : ${eventDetails.endTime}
- Code postal : ${eventDetails.postalCode}
- Adresse : ${eventDetails.address || 'Non renseignée'}
- Demandes spéciales : ${eventDetails.specialRequests || 'Aucune'}

Pack recommandé : ${packName}
Prix total : ${totalPrice} €

Type : Demande d'information (sans acompte)
Le client souhaite être rappelé sous 24h.
  `.trim();
}

/**
 * Génère le message pour une réservation avec acompte
 */
function generateReservationMessage(payload: ReservationPayload): string {
  const { personalInfo, eventDetails, packName, totalPrice, depositAmount } = payload;
  
  return `
Nouvelle réservation - Assistant SoundRush Paris

Informations client :
- Nom : ${personalInfo.firstName} ${personalInfo.lastName}
- Email : ${personalInfo.email}
- Téléphone : ${personalInfo.phone}

Détails de l'événement :
- Date de début : ${eventDetails.startDate}
- Date de fin : ${eventDetails.endDate}
- Horaire de début : ${eventDetails.startTime}
- Horaire de fin : ${eventDetails.endTime}
- Code postal : ${eventDetails.postalCode}
- Adresse : ${eventDetails.address || 'Non renseignée'}
- Demandes spéciales : ${eventDetails.specialRequests || 'Aucune'}

Pack recommandé : ${packName}
Prix total : ${totalPrice} €
Acompte (30%) : ${depositAmount} €

Type : Réservation clé en main (acompte 30%)
Le client sera redirigé vers Stripe pour le paiement.
  `.trim();
}

/**
 * Affiche une notification de succès
 */
export function showSuccessNotification(message: string): void {
  // Créer un toast de succès
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}

/**
 * Affiche une notification d'erreur
 */
export function showErrorNotification(message: string): void {
  // Créer un toast d'erreur
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 300px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}

/**
 * Teste l'API Resend (dev uniquement)
 */
export async function testResendAPI(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test',
        message: 'Test API Resend depuis l\'assistant',
        email: 'test@sndrush.com',
      }),
    });
    
    if (response.ok) {
      showSuccessNotification('✅ API Resend fonctionne');
    } else {
      showErrorNotification('❌ API Resend en erreur');
    }
  } catch (error) {
    showErrorNotification('❌ Erreur réseau Resend');
  }
}

/**
 * Teste l'API Stripe (dev uniquement)
 */
export async function testStripeAPI(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  
  try {
    const response = await fetch('/api/create-stripe-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        packName: 'Test Pack',
        customerEmail: 'test@sndrush.com',
        customerName: 'Test User',
      }),
    });
    
    if (response.ok) {
      showSuccessNotification('✅ API Stripe fonctionne');
    } else {
      showErrorNotification('❌ API Stripe en erreur');
    }
  } catch (error) {
    showErrorNotification('❌ Erreur réseau Stripe');
  }
}
