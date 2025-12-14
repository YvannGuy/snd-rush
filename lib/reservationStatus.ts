// Configuration des statuts de réservation avec labels et styles UI

export const reservationStatusUI = {
  PENDING: { 
    label: { fr: 'En attente', en: 'Pending' }, 
    badgeClass: 'bg-zinc-200 text-zinc-900',
    message: { fr: 'Réservation en attente de confirmation.', en: 'Reservation pending confirmation.' }
  },
  CONFIRMED: { 
    label: { fr: 'Confirmée', en: 'Confirmed' }, 
    badgeClass: 'bg-[#e27431] text-white',
    message: { fr: 'Réservation confirmée.', en: 'Reservation confirmed.' }
  },
  CONTRACT_PENDING: { 
    label: { fr: 'Signature requise', en: 'Signature required' }, 
    badgeClass: 'border border-[#e27431] text-[#e27431] bg-transparent',
    message: { fr: 'Signature nécessaire pour finaliser la réservation.', en: 'Signature required to finalize the reservation.' }
  },
  CONTRACT_SIGNED: { 
    label: { fr: 'Contrat signé', en: 'Contract signed' }, 
    badgeClass: 'bg-emerald-600 text-white',
    message: { fr: 'Contrat signé.', en: 'Contract signed.' }
  },
  IN_PROGRESS: { 
    label: { fr: 'En cours', en: 'In progress' }, 
    badgeClass: 'bg-blue-600 text-white',
    message: { fr: 'Réservation en cours.', en: 'Reservation in progress.' }
  },
  COMPLETED: { 
    label: { fr: 'Terminée', en: 'Completed' }, 
    badgeClass: 'bg-zinc-500 text-white',
    message: { fr: 'Réservation terminée.', en: 'Reservation completed.' }
  },
  CANCEL_REQUESTED: { 
    label: { fr: 'Annulation demandée', en: 'Cancellation requested' }, 
    badgeClass: 'bg-orange-500 text-white',
    message: { fr: 'Demande reçue. Nous revenons vers vous rapidement.', en: 'Request received. We will get back to you shortly.' }
  },
  CHANGE_REQUESTED: { 
    label: { fr: 'Modification demandée', en: 'Change requested' }, 
    badgeClass: 'bg-orange-600 text-white',
    message: null
  },
  CANCELLED: { 
    label: { fr: 'Annulée', en: 'Cancelled' }, 
    badgeVariant: 'destructive' as const,
    message: { fr: 'Réservation annulée.', en: 'Reservation cancelled.' }
  },
} as const;

// Fonction helper pour obtenir le statut UI
export function getReservationStatusUI(status: string, language: 'fr' | 'en' = 'fr') {
  const upperStatus = status.toUpperCase();
  
  // Mapping des statuts existants vers les nouveaux
  const statusMapping: Record<string, keyof typeof reservationStatusUI> = {
    'PENDING': 'PENDING',
    'CONFIRMED': 'CONFIRMED',
    'CONTRACT_PENDING': 'CONTRACT_PENDING',
    'CONTRACT_SIGNED': 'CONTRACT_SIGNED',
    'IN_PROGRESS': 'IN_PROGRESS',
    'COMPLETED': 'COMPLETED',
    'CANCEL_REQUESTED': 'CANCEL_REQUESTED',
    'CHANGE_REQUESTED': 'CHANGE_REQUESTED',
    'CANCELLED': 'CANCELLED',
    'CANCELED': 'CANCELLED', // Variante
  };

  const mappedStatus = statusMapping[upperStatus] || 'PENDING';
  const statusConfig = reservationStatusUI[mappedStatus];
  
  return {
    label: statusConfig.label[language],
    badgeClass: 'badgeVariant' in statusConfig ? undefined : statusConfig.badgeClass,
    badgeVariant: 'badgeVariant' in statusConfig ? statusConfig.badgeVariant : undefined,
    message: statusConfig.message ? statusConfig.message[language] : null,
  };
}

// Fonction pour calculer la politique de remboursement
export function calculateRefundPolicy(eventDate: string | Date): {
  policy: 'FULL' | 'HALF' | 'NONE';
  daysUntilEvent: number;
  refundPercentage: number;
} {
  const event = new Date(eventDate);
  const now = new Date();
  const diffTime = event.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return { policy: 'FULL', daysUntilEvent: diffDays, refundPercentage: 100 };
  } else if (diffDays >= 3 && diffDays <= 7) {
    return { policy: 'HALF', daysUntilEvent: diffDays, refundPercentage: 50 };
  } else {
    return { policy: 'NONE', daysUntilEvent: diffDays, refundPercentage: 0 };
  }
}

// Fonction pour vérifier si les boutons d'action doivent être affichés
export function shouldShowActionButtons(reservation: {
  status: string;
  start_date: string | Date;
}): boolean {
  const status = reservation.status.toUpperCase();
  const eventDate = new Date(reservation.start_date);
  const now = new Date();
  
  // Ne pas afficher si l'événement est dans le passé
  if (eventDate < now) {
    return false;
  }
  
  // Ne pas afficher si statut interdit
  const forbiddenStatuses = ['CANCELLED', 'CANCELED', 'CANCEL_REQUESTED', 'COMPLETED', 'IN_PROGRESS', 'CHANGE_REQUESTED'];
  if (forbiddenStatuses.includes(status)) {
    return false;
  }
  
  return true;
}
