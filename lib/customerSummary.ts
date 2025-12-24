// Génération du résumé client pour les réservations

import { ClientReservation, FinalItem } from '@/types/db';
import { getBasePack } from './packs/basePacks';

/**
 * Génère un résumé client clair et concis (4-6 lignes max)
 * Format: Pack + date + lieu + inclus + extras + paiement
 */
export function buildCustomerSummary(
  reservation: ClientReservation,
  finalItems: FinalItem[]
): string {
  const pack = getBasePack(reservation.pack_key);
  if (!pack) {
    return 'Réservation en cours de préparation.';
  }
  
  const lines: string[] = [];
  
  // Ligne 1: Pack + date
  const startDate = reservation.start_at 
    ? new Date(reservation.start_at).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date à confirmer';
  
  const startTime = reservation.start_at
    ? new Date(reservation.start_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';
  
  const endTime = reservation.end_at
    ? new Date(reservation.end_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';
  
  const timeRange = startTime && endTime ? ` de ${startTime} à ${endTime}` : '';
  lines.push(`${pack.title} le ${startDate}${timeRange}.`);
  
  // Ligne 2: Lieu
  if (reservation.address) {
    lines.push(`Lieu : ${reservation.address}.`);
  }
  
  // Ligne 3: Inclus dans le pack
  const baseItems = finalItems.filter(item => !item.isExtra);
  if (baseItems.length > 0) {
    const itemsText = baseItems
      .map(item => {
        if (item.qty === 1) {
          return item.label.toLowerCase();
        }
        return `${item.qty} ${item.label.toLowerCase()}s`;
      })
      .join(', ');
    lines.push(`Inclus : ${itemsText}.`);
  }
  
  // Ligne 4: Extras (si présents)
  const extras = finalItems.filter(item => item.isExtra);
  if (extras.length > 0) {
    const extrasText = extras
      .map(item => {
        if (item.qty === 1) {
          return item.label.toLowerCase();
        }
        return `${item.qty} ${item.label.toLowerCase()}s`;
      })
      .join(', ');
    lines.push(`Extras : ${extrasText}.`);
  }
  
  // Ligne 5: Paiement (format simplifié)
  const paymentStatus: string[] = [];
  
  if (reservation.deposit_paid_at) {
    paymentStatus.push('Acompte 30% payé');
  } else {
    paymentStatus.push('Acompte 30% à payer');
  }
  
  if (reservation.balance_paid_at) {
    paymentStatus.push('solde payé');
  } else {
    paymentStatus.push('solde J-5');
  }
  
  // Caution J-2 (si présente)
  if (reservation.deposit_amount && parseFloat(reservation.deposit_amount.toString()) > 0) {
    paymentStatus.push('caution J-2');
  }
  
  lines.push(`Paiement : ${paymentStatus.join(', ')}.`);
  
  // Ligne 6: Total (optionnel, seulement si pas trop long)
  const totalText = `Total : ${reservation.price_total}€`;
  if (lines.join(' ').length + totalText.length < 200) {
    lines.push(totalText);
  }
  
  return lines.join(' ');
}
