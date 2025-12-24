import { supabase } from '@/lib/supabase';
import { ReservationView } from '@/types/reservationView';
import {
  mapClientReservationToView,
  mapLegacyReservationToView,
  enrichReservationViews,
} from '@/lib/reservationViewMapper';

/**
 * Charge toutes les données nécessaires pour le dashboard user
 * Retourne les ReservationView unifiées + orders + etat_lieux
 */
export async function loadDashboardData(user: { id: string; email?: string | null }) {
  const supabaseClient = supabase;
  if (!supabaseClient) {
    throw new Error('Supabase client non disponible');
  }

  // Requêtes parallèles avec gestion d'erreur robuste
  let reservationsData: any[] = [];
  let ordersData: any[] = [];
  let clientReservationsData: any[] = [];

  try {
    // Anciennes réservations
    try {
      const { data: reservations } = await supabaseClient
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'eq', 'PENDING')
        .not('status', 'eq', 'pending')
        .order('start_date', { ascending: true })
        .throwOnError();
      
      reservationsData = reservations || [];
    } catch (err: any) {
      const e: any = err;
      console.error('reservations error message:', String(e?.message ?? 'NO_MESSAGE'));
      console.error('reservations error code:', String(e?.code ?? 'NO_CODE'));
      console.error('reservations error details:', String(e?.details ?? 'NO_DETAILS'));
      console.error('reservations error hint:', String(e?.hint ?? 'NO_HINT'));
      const names = Object.getOwnPropertyNames(e);
      console.error('reservations error prop names:', names.join(', ') || 'NO_PROPS');
      const dump: Record<string, unknown> = {};
      for (const k of names) dump[k] = e[k];
      console.error('reservations error dump:', JSON.stringify(dump, null, 2));
    }
  } catch (err) {
    console.error('Exception chargement reservations (raw):', err);
    if (err instanceof Error) {
      console.error('Exception message:', err.message, 'stack:', err.stack);
    } else {
      const e: any = err;
      console.error('Exception message:', String(e?.message ?? 'NO_MESSAGE'));
      console.error('Exception code:', String(e?.code ?? 'NO_CODE'));
      const names = Object.getOwnPropertyNames(e);
      console.error('Exception prop names:', names.join(', ') || 'NO_PROPS');
      const dump: Record<string, unknown> = {};
      for (const k of names) dump[k] = e[k];
      console.error('Exception dump:', JSON.stringify(dump, null, 2));
    }
  }

  try {
    // Orders - seulement si l'utilisateur a un email
    if (user.email) {
      try {
        // Sélectionner uniquement les colonnes qui existent (sans reservation_id)
        // Utiliser client_reservation_id et metadata pour faire le lien avec les réservations
        const { data: orders } = await supabaseClient
          .from('orders')
          .select('id, customer_email, customer_name, total, status, created_at, stripe_session_id, metadata, client_reservation_id')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false })
          .limit(100)
          .throwOnError();
        
        ordersData = orders || [];
      } catch (err: any) {
        // Si erreur liée à client_reservation_id manquante, réessayer sans cette colonne
        if (err?.code === '42703' && err?.message?.includes('client_reservation_id')) {
          console.warn('Colonne client_reservation_id non trouvée, chargement sans cette colonne');
          try {
            const { data: orders } = await supabaseClient
              .from('orders')
              .select('id, customer_email, customer_name, total, status, created_at, stripe_session_id, metadata')
              .eq('customer_email', user.email)
              .order('created_at', { ascending: false })
              .limit(100)
              .throwOnError();
            ordersData = orders || [];
          } catch (retryErr: any) {
            // Log détaillé de l'erreur de retry
            const e: any = retryErr;
            console.error('orders retry error message:', String(e?.message ?? 'NO_MESSAGE'));
            console.error('orders retry error code:', String(e?.code ?? 'NO_CODE'));
            console.error('orders retry error details:', String(e?.details ?? 'NO_DETAILS'));
            console.error('orders retry error hint:', String(e?.hint ?? 'NO_HINT'));
            const names = Object.getOwnPropertyNames(e);
            console.error('orders retry error prop names:', names.join(', ') || 'NO_PROPS');
            const dump: Record<string, unknown> = {};
            for (const k of names) dump[k] = e[k];
            console.error('orders retry error dump:', JSON.stringify(dump, null, 2));
            ordersData = [];
          }
        } else {
          // Log détaillé de l'erreur principale
          const e: any = err;
          console.error('orders error message:', String(e?.message ?? 'NO_MESSAGE'));
          console.error('orders error code:', String(e?.code ?? 'NO_CODE'));
          console.error('orders error details:', String(e?.details ?? 'NO_DETAILS'));
          console.error('orders error hint:', String(e?.hint ?? 'NO_HINT'));
          const names = Object.getOwnPropertyNames(e);
          console.error('orders error prop names:', names.join(', ') || 'NO_PROPS');
          const dump: Record<string, unknown> = {};
          for (const k of names) dump[k] = e[k];
          console.error('orders error dump:', JSON.stringify(dump, null, 2));
          ordersData = [];
        }
      }
    }
  } catch (err) {
    console.error('Exception chargement orders (raw):', err);
    if (err instanceof Error) {
      console.error('Exception message:', err.message, 'stack:', err.stack);
    } else {
      const e: any = err;
      console.error('Exception message:', String(e?.message ?? 'NO_MESSAGE'));
      console.error('Exception code:', String(e?.code ?? 'NO_CODE'));
      const names = Object.getOwnPropertyNames(e);
      console.error('Exception prop names:', names.join(', ') || 'NO_PROPS');
      const dump: Record<string, unknown> = {};
      for (const k of names) dump[k] = e[k];
      console.error('Exception dump:', JSON.stringify(dump, null, 2));
    }
    // En cas d'erreur, continuer avec un tableau vide
    ordersData = [];
  }

  try {
    // Nouvelles réservations
    try {
      const { data: clientReservations } = await supabaseClient
        .from('client_reservations')
        .select('*')
        .or(`user_id.eq.${user.id},customer_email.eq.${user.email || ''}`)
        .order('created_at', { ascending: false })
        .throwOnError();
      
      clientReservationsData = clientReservations || [];
    } catch (err: any) {
      const e: any = err;
      console.error('client_reservations error message:', String(e?.message ?? 'NO_MESSAGE'));
      console.error('client_reservations error code:', String(e?.code ?? 'NO_CODE'));
      console.error('client_reservations error details:', String(e?.details ?? 'NO_DETAILS'));
      console.error('client_reservations error hint:', String(e?.hint ?? 'NO_HINT'));
      const names = Object.getOwnPropertyNames(e);
      console.error('client_reservations error prop names:', names.join(', ') || 'NO_PROPS');
      const dump: Record<string, unknown> = {};
      for (const k of names) dump[k] = e[k];
      console.error('client_reservations error dump:', JSON.stringify(dump, null, 2));
    }
  } catch (err) {
    console.error('Exception chargement client_reservations (raw):', err);
    if (err instanceof Error) {
      console.error('Exception message:', err.message, 'stack:', err.stack);
    } else {
      const e: any = err;
      console.error('Exception message:', String(e?.message ?? 'NO_MESSAGE'));
      console.error('Exception code:', String(e?.code ?? 'NO_CODE'));
      const names = Object.getOwnPropertyNames(e);
      console.error('Exception prop names:', names.join(', ') || 'NO_PROPS');
      const dump: Record<string, unknown> = {};
      for (const k of names) dump[k] = e[k];
      console.error('Exception dump:', JSON.stringify(dump, null, 2));
    }
  }

  // Mapper vers ReservationView
  const legacyViews = (reservationsData || []).map(mapLegacyReservationToView);
  const clientViews = (clientReservationsData || []).map(mapClientReservationToView);
  const allViews = [...legacyViews, ...clientViews];

  // Charger les états des lieux (seulement pour legacy reservations)
  let etatLieuxList: any[] = [];
  if (reservationsData && reservationsData.length > 0) {
    const reservationIds = reservationsData.map(r => r.id).slice(0, 50);
    const { data: etatLieuxData } = await supabaseClient
      .from('etat_lieux')
      .select('id, created_at, reservation_id')
      .in('reservation_id', reservationIds);
    etatLieuxList = etatLieuxData || [];
  }

  // Enrichir avec orders et etat_lieux
  const enrichedViews = enrichReservationViews(allViews, ordersData || [], etatLieuxList);

  return {
    reservationViews: enrichedViews,
    orders: ordersData || [],
    etatLieuxList,
  };
}
