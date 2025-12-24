import { ReservationView } from '@/types/reservationView';

/**
 * Mappe une client_reservation vers ReservationView
 */
export function mapClientReservationToView(cr: any): ReservationView {
  const packNames: Record<string, string> = {
    'conference': 'Pack Conférence',
    'soiree': 'Pack Soirée',
    'mariage': 'Pack Mariage',
  };
  const packLabel = packNames[cr.pack_key] || cr.pack_key || 'Réservation';
  
  const priceTotal = cr.price_total ? parseFloat(cr.price_total.toString()) : null;
  const depositAmount = priceTotal ? Math.round(priceTotal * 0.3) : null;
  const balanceAmount = cr.balance_amount 
    ? parseFloat(cr.balance_amount.toString())
    : (priceTotal && depositAmount ? priceTotal - depositAmount : null);
  
  const depositPaid = !!cr.deposit_paid_at;
  const balancePaid = !!cr.balance_paid_at;
  const contractSigned = !!(cr.client_signature && cr.client_signature.trim() !== '');
  
  // Vérifier si balance_due_at est atteint
  const balanceDueAt = cr.balance_due_at ? new Date(cr.balance_due_at) : null;
  const isBalanceDue = balanceDueAt ? balanceDueAt <= new Date() : false;
  
  // Calculer le CTA
  const cta = computePrimaryCTA({
    depositPaid,
    balancePaid,
    contractSigned,
    isBalanceDue,
    status: cr.status,
    startAt: cr.start_at,
    reservationId: cr.id,
    source: 'client_reservation',
  });
  
  return {
    id: cr.id,
    source: 'client_reservation',
    packLabel,
    summary: cr.customer_summary || null,
    startAt: cr.start_at || cr.created_at,
    endAt: cr.end_at || null,
    address: cr.address || null,
    status: cr.status || 'UNKNOWN',
    priceTotal,
    depositAmount,
    balanceAmount,
    depositPaid,
    balancePaid,
    contractSigned,
    hasInvoices: false, // Sera mis à jour après chargement des orders
    hasEtatLieux: false, // Sera mis à jour après chargement des etat_lieux
    cta,
    raw: cr,
  };
}

/**
 * Mappe une reservation legacy vers ReservationView
 */
export function mapLegacyReservationToView(r: any): ReservationView {
  const packNames: Record<string, string> = {
    '1': 'Pack Essentiel',
    '2': 'Pack Standard',
    '3': 'Pack Premium',
    '4': 'Pack Événement',
    'pack-1': 'Pack Essentiel',
    'pack-2': 'Pack Standard',
    'pack-3': 'Pack Premium',
    'pack-4': 'Pack Événement',
  };
  const packLabel = packNames[r.pack_id] || r.pack_id || 'Réservation';
  
  const priceTotal = r.total_price ? parseFloat(r.total_price.toString()) : null;
  const depositAmount = r.deposit_amount ? parseFloat(r.deposit_amount.toString()) : null;
  const balanceAmount = priceTotal && depositAmount ? priceTotal - depositAmount : null;
  
  const depositPaid = !!r.deposit_paid_at || !!r.deposit_amount; // Fallback si pas de champ explicite
  const balancePaid = !!r.balance_paid_at || (depositAmount && priceTotal && depositAmount >= priceTotal);
  const contractSigned = !!(r.client_signature && r.client_signature.trim() !== '');
  
  // Pour les réservations legacy, on ne peut pas déterminer balance_due_at facilement
  const isBalanceDue = false; // Fallback safe
  
  // Calculer le CTA
  const cta = computePrimaryCTA({
    depositPaid,
    balancePaid,
    contractSigned,
    isBalanceDue,
    status: r.status,
    startAt: r.start_date || r.start_at || r.created_at,
    reservationId: r.id,
    source: 'reservation',
  });
  
  return {
    id: r.id,
    source: 'reservation',
    packLabel,
    summary: null, // Pas de customer_summary dans legacy
    startAt: r.start_date || r.start_at || r.created_at,
    endAt: r.end_date || r.end_at || null,
    address: r.delivery_address || r.address || null,
    status: r.status || 'UNKNOWN',
    priceTotal,
    depositAmount,
    balanceAmount,
    depositPaid,
    balancePaid,
    contractSigned,
    hasInvoices: false, // Sera mis à jour après chargement des orders
    hasEtatLieux: false, // Sera mis à jour après chargement des etat_lieux
    cta,
    raw: r,
  };
}

/**
 * Calcule le CTA principal selon les règles métier
 */
function computePrimaryCTA(params: {
  depositPaid: boolean;
  balancePaid: boolean;
  contractSigned: boolean;
  isBalanceDue: boolean;
  status: string;
  startAt: string;
  reservationId?: string;
  source?: 'client_reservation' | 'reservation';
}): ReservationView['cta'] {
  const { depositPaid, balancePaid, contractSigned, isBalanceDue, status, startAt } = params;
  
  // Règle 1: Si acompte non payé => PAY_DEPOSIT
  if (!depositPaid) {
    return {
      label: 'Payer l\'acompte (30%)',
      action: 'PAY_DEPOSIT',
    };
  }
  
  // Règle 2: Si solde non payé et date échéance atteinte => PAY_BALANCE
  if (!balancePaid && isBalanceDue) {
    return {
      label: 'Payer le solde',
      action: 'PAY_BALANCE',
    };
  }
  
  // Règle 3: Si contrat non signé et réservation confirmée => SIGN_CONTRACT
  const isConfirmed = status === 'CONFIRMED' || 
                      status === 'confirmed' || 
                      status === 'AWAITING_BALANCE' || 
                      status === 'awaiting_balance' ||
                      status === 'CONTRACT_PENDING';
  
  if (!contractSigned && isConfirmed && params.reservationId) {
    const signUrl = params.source === 'client_reservation'
      ? `/sign-contract?clientReservationId=${params.reservationId}`
      : `/sign-contract?reservationId=${params.reservationId}`;
    return {
      label: 'Signer le contrat',
      action: 'SIGN_CONTRACT',
      href: signUrl,
    };
  }
  
  // Règle 4: Si réservation à venir => CALL_SUPPORT
  const startDate = new Date(startAt);
  const now = new Date();
  const isUpcoming = startDate >= now;
  
  if (isUpcoming) {
    return {
      label: 'Appeler SoundRush',
      action: 'CALL_SUPPORT',
      href: 'tel:+33612345678', // À adapter selon votre numéro
    };
  }
  
  // Règle 5: Sinon => NONE
  return {
    label: 'Rien à faire pour le moment',
    action: 'NONE',
  };
}

/**
 * Sélectionne la prochaine réservation à venir
 */
export function pickNextReservation(views: ReservationView[]): ReservationView | null {
  const now = new Date();
  
  // Filtrer les réservations à venir (startAt >= maintenant)
  const upcoming = views.filter(view => {
    const startDate = new Date(view.startAt);
    return startDate >= now;
  });
  
  if (upcoming.length === 0) {
    return null;
  }
  
  // Trier par startAt croissant (plus proche en premier)
  upcoming.sort((a, b) => {
    const dateA = new Date(a.startAt);
    const dateB = new Date(b.startAt);
    return dateA.getTime() - dateB.getTime();
  });
  
  return upcoming[0];
}

/**
 * Vérifie si un order est lié à une réservation (client_reservation ou reservation legacy)
 * Utilise client_reservation_id, puis metadata comme fallback
 */
export function isOrderRelatedToReservation(
  order: any,
  reservationId: string,
  source: 'client_reservation' | 'reservation'
): boolean {
  if (source === 'client_reservation') {
    // Pour client_reservation: utiliser client_reservation_id ou metadata
    if (order.client_reservation_id === reservationId) {
      return true;
    }
    // Fallback: vérifier dans metadata
    if (order.metadata) {
      try {
        const metadata = typeof order.metadata === 'string' 
          ? JSON.parse(order.metadata) 
          : order.metadata;
        return metadata?.clientReservationId === reservationId || 
               metadata?.reservationId === reservationId;
      } catch (e) {
        // Ignorer les erreurs de parsing
        return false;
      }
    }
    return false;
  } else {
    // Pour reservation legacy: utiliser metadata uniquement (reservation_id n'existe plus dans orders)
    if (order.metadata) {
      try {
        const metadata = typeof order.metadata === 'string' 
          ? JSON.parse(order.metadata) 
          : order.metadata;
        return metadata?.reservationId === reservationId;
      } catch (e) {
        // Ignorer les erreurs de parsing
        return false;
      }
    }
    return false;
  }
}

/**
 * Enrichit les ReservationView avec les données des orders et etat_lieux
 */
export function enrichReservationViews(
  views: ReservationView[],
  orders: any[],
  etatLieuxList: any[]
): ReservationView[] {
  return views.map(view => {
    // Trouver les orders liés en utilisant la fonction helper
    const relatedOrders = orders.filter(order => 
      isOrderRelatedToReservation(order, view.id, view.source)
    );
    
    // Trouver l'état des lieux lié (seulement pour legacy reservations)
    const relatedEtatLieux = view.source === 'reservation'
      ? etatLieuxList.find(el => el.reservation_id === view.id)
      : null;
    
    return {
      ...view,
      hasInvoices: relatedOrders.length > 0,
      hasEtatLieux: !!relatedEtatLieux,
    };
  });
}
